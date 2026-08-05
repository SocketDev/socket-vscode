#!/usr/bin/env node
/*
 * @file Configure npm Trusted Publishers through `npm trust` — the registry
 *   API, not the website. The web UI sits behind bot management that
 *   challenges an automated session per page (see
 *   docs/agents.md/fleet/npm-anti-bot-rhythm.md); the registry endpoint
 *   `POST /-/package/<pkg>/trust` that `npm trust` drives has no such
 *   challenge, so a whole workspace configures in one pass.
 *   Three details this wrapper exists to own, so no operator hand-runs npm:
 *
 *   1. The npm that runs is the one bundled with the repo's PINNED Node
 *      (pinned-npm.mts), never a stray Homebrew npm — these writes are
 *      2FA-gated and irreversible.
 *   2. Every npm spawn runs from a NEUTRAL cwd. A fleet repo's package.json
 *      declares `devEngines.packageManager: pnpm`, which makes npm refuse to
 *      run at all (EBADDEVENGINES), so the package name travels as an argument
 *      instead of the cwd.
 *   3. The first write prompts for 2FA web-auth, which needs a TTY. The spawn goes
 *      through the fleet PTY seam (shared.mts) so the prompt works from a
 *      non-TTY session. npm then grants a ~5-minute skip-2FA window, so
 *      packages are written SEQUENTIALLY with a short sleep — npm's own
 *      rate-limit guidance. The desired shape per package comes from
 *      trusted-publisher-plan.mts, so the two-workflow rule holds here exactly
 *      as it does in the browser driver: a plain package publishes from
 *      `npm-publish.yml`, a napi `<base>-<platform>` package from
 *      `npm-publish-napi.yml`. Dry-run is the default: it prints the plan and
 *      writes nothing. `--apply` performs the writes, verifies each by
 *      re-reading, and reports a summary. A package whose re-read does not
 *      match never aborts the rest. Usage: node
 *      scripts/fleet/publish-infra/npm/trust.mts [<pkg>…] [--repo <owner/name>]
 *      [--apply]
 */

import { existsSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

import { errorMessage } from '@socketsecurity/lib-stable/errors/message'
import { httpRequest } from '@socketsecurity/lib-stable/http-request'
import { getDefaultLogger } from '@socketsecurity/lib-stable/logger/default'
import { normalizePath } from '@socketsecurity/lib-stable/paths/normalize'

import { isMainModule } from '../../_shared/is-main-module.mts'
import { REPO_ROOT } from '../../paths.mts'
import { runCapture, runInheritTty } from '../shared.mts'
import { resolvePinnedNpm } from './pinned-npm.mts'
import { desiredTrustedPublisher } from './trusted-publisher-plan.mts'
import type { TrustedPublisherDesired } from './trusted-publisher-plan.mts'
import { resolveNpmWorkspaceLayout } from './workspace.mts'

const logger = getDefaultLogger()

/**
 * `npm trust` landed in npm 11.10.0. An older npm has no subcommand to call,
 * so the run stops with the pinned-Node fix rather than a cryptic usage error.
 */
export const MIN_NPM_VERSION = '11.10.0'

/**
 * Pause between sequential writes. npm's trusted-publishing guidance pairs the
 * skip-2FA window with a short sleep so a batch does not trip rate limiting.
 */
export const WRITE_SPACING_MS = 2000

/**
 * A package's planned configuration, and whether the registry already carries
 * it. `matches` short-circuits the write: this flow is a reconciler, so an
 * already-correct row is a skip, not a rewrite.
 */
export interface TrustPlan {
  readonly desired: TrustedPublisherDesired
  readonly matches: boolean
  readonly pkg: string
}

export interface TrustFlags {
  readonly apply: boolean
  readonly packages: readonly string[]
  readonly repo: string | undefined
}

export function parseTrustArgs(argv: readonly string[]): TrustFlags {
  const packages: string[] = []
  let apply = false
  let repo: string | undefined
  for (let i = 0, { length } = argv; i < length; i += 1) {
    const arg = argv[i]!
    if (arg === '--apply') {
      apply = true
    } else if (arg === '--repo') {
      repo = argv[i + 1]
      i += 1
    } else if (arg.startsWith('--repo=')) {
      repo = arg.slice('--repo='.length)
    } else if (!arg.startsWith('-')) {
      packages.push(arg)
    }
  }
  return { apply, packages, repo }
}

/**
 * Semver-ish "is `version` at least `minimum`" over the numeric prefix of each
 * part, which is all a floor check needs. Pure so the guard is unit-testable.
 */
export function meetsMinimumVersion(version: string, minimum: string): boolean {
  const parse = (v: string): number[] =>
    v
      .replace(/^v/, '')
      .split('.')
      .map(part => Number.parseInt(part, 10) || 0)
  const have = parse(version)
  const want = parse(minimum)
  for (let i = 0; i < 3; i += 1) {
    const a = have[i] ?? 0
    const b = want[i] ?? 0
    if (a !== b) {
      return a > b
    }
  }
  return true
}

/**
 * The napi platform tokens declared by the repo at `repoRoot`, or an empty
 * list. Drives the two-workflow rule: a package named `<base>-<platform>` for
 * one of these publishes from the napi workflow.
 *
 * The platforms belong to the repo the packages BELONG to, which is not always
 * the cwd — `--repo owner/name` configures another member's packages, and
 * reading the cwd's config there would plan every platform package onto the
 * plain workflow.
 */
export function readNapiPlatforms(repoRoot: string): string[] {
  const file = path.join(repoRoot, '.config', 'repo', 'socket-wheelhouse.json')
  if (!existsSync(file)) {
    return []
  }
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as {
      napi?: { platforms?: unknown | undefined } | undefined
    }
    const platforms = parsed?.napi?.platforms
    return Array.isArray(platforms)
      ? platforms.filter((p): p is string => typeof p === 'string')
      : []
  } catch {
    return []
  }
}

/**
 * The checkout whose config declares the target packages' platforms. Without
 * `--repo` that is this repo; with it, the sibling checkout beside this one,
 * matching the layout every fleet member shares (`~/projects/<name>`). Falls
 * back to this repo when the sibling is not checked out, which yields the
 * plain workflow for every package — correct for a repo with no napi packages,
 * and visible in the printed plan when it is not.
 */
export function resolveTargetRepoRoot(repo: string | undefined): string {
  if (!repo) {
    return REPO_ROOT
  }
  const slash = repo.indexOf('/')
  const name = slash >= 0 ? repo.slice(slash + 1) : repo
  if (!name || name === path.basename(REPO_ROOT)) {
    return REPO_ROOT
  }
  const sibling = path.join(path.dirname(REPO_ROOT), name)
  return existsSync(sibling) ? sibling : REPO_ROOT
}

/**
 * Every package name a repo publishes: its workspace packages, including the
 * generated napi platform packages, or the single package a non-workspace repo
 * ships. This is what makes the bare `pnpm run trust --apply` complete — an
 * operator naming nine packages by hand is nine chances to miss one, and a
 * missed platform package fails its publish at release time, not here.
 */
export function enumerateRepoPackages(repoRoot: string): string[] {
  const layout = resolveNpmWorkspaceLayout(repoRoot)
  const names = new Set<string>()
  if (layout.subject?.name) {
    names.add(layout.subject.name)
  }
  const { packages } = layout
  for (let i = 0, { length } = packages; i < length; i += 1) {
    const pkg = packages[i]!
    if (pkg.name) {
      names.add(pkg.name)
    }
  }
  return [...names].toSorted()
}

/**
 * The `npm trust github` argv for one package. The package name is an
 * ARGUMENT, never the cwd, because npm refuses to run inside a repo whose
 * devEngines names pnpm.
 */
export function buildTrustWriteArgs(
  pkg: string,
  desired: TrustedPublisherDesired,
): string[] {
  return [
    'trust',
    'github',
    pkg,
    '--file',
    desired.workflowFilename,
    '--repository',
    `${desired.repositoryOwner}/${desired.repositoryName}`,
    '--environment',
    desired.environmentName,
    '--allow-publish',
    '--allow-stage-publish',
    '--yes',
  ]
}

/**
 * Whether `listOutput` from `npm trust list <pkg>` already describes
 * `desired`. The output is human-formatted, so this looks for each field's
 * value rather than parsing a shape npm may restyle: a row that names the
 * right repo, workflow, and environment is the row we would write.
 */
export function listOutputMatches(
  listOutput: string,
  desired: TrustedPublisherDesired,
): boolean {
  const haystack = listOutput.toLowerCase()
  const slug =
    `${desired.repositoryOwner}/${desired.repositoryName}`.toLowerCase()
  return (
    haystack.includes(slug) &&
    haystack.includes(desired.workflowFilename.toLowerCase()) &&
    haystack.includes(desired.environmentName.toLowerCase())
  )
}

/**
 * The four-ingredient block for a write whose re-read did not come back as
 * planned. Named per field so the operator can finish the row by hand if npm
 * partially accepted it.
 */
export function formatVerifyFailure(
  pkg: string,
  desired: TrustedPublisherDesired,
  listOutput: string,
): string {
  return [
    `the trusted publisher for ${pkg} did not verify after the write.`,
    `  Where: https://www.npmjs.com/package/${pkg}/access`,
    `  Saw:   ${listOutput.trim() || '(no configuration)'}`,
    `  Wanted: repo ${desired.repositoryOwner}/${desired.repositoryName}, ` +
      `workflow ${desired.workflowFilename}, environment ${desired.environmentName}.`,
    `  Fix:   re-run this command for ${pkg} alone; if it fails again, the ` +
      'registry rejected the claim — check the workflow filename exists on the default branch.',
  ].join('\n')
}

/**
 * The human gate for the first write. npm challenges the first
 * account-changing call with 2FA web-auth and then grants a short window, so
 * one approval covers the batch.
 */
export function formatAuthGate(count: number): string {
  return [
    '🖐  HUMAN GATE — npm 2FA for the trusted-publisher batch [1/1]',
    `  Need: npm gates account changes behind 2FA, so the first of ${count} ` +
      'write(s) prompts for browser approval.',
    '  Mind: this is the registry API, not the website — no bot-management ' +
      'challenge; 2FA-bypass tokens are refused here by design.',
    '  A) You: approve the npmjs.com URL npm prints below in your browser.',
    '  B) Me: I drive every write once approval lands — npm grants a ' +
      '~5-minute window, so one approval covers the whole batch.',
    '  Then: each package is written, re-read, and reported in the summary.',
  ].join('\n')
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Whether `output` is npm refusing an account operation for want of a
 * one-time password. Every `npm trust` call — the reads included — is an
 * account operation, so a session that has not authenticated sees this on the
 * FIRST read rather than at the first write.
 */
export function isOtpRequired(output: string): boolean {
  return /\bEOTP\b|requires a one-time password/i.test(output)
}

/**
 * Npm's browser-approval URL and the endpoint that reports the approval, as
 * printed in an EOTP refusal. `npm trust` does NOT poll for the approval the
 * way `npm login` does — it refuses, names both URLs, and expects the next
 * call to find an elevated session. This flow closes that loop itself.
 */
export interface OtpChallenge {
  readonly authUrl: string
  readonly doneUrl: string
}

export function parseOtpChallenge(output: string): OtpChallenge | undefined {
  // URLs, not filesystem paths: the separators are part of the URL grammar, so
  // the text is matched as npm printed it.
  const text = normalizePath(output)
  const authUrl = /https:\/\/\S*npmjs\.com\/auth\/cli\/\S+/.exec(text)?.[0]
  const doneUrl = /https:\/\/\S*\/-\/v1\/done\?authId=\S+/.exec(text)?.[0]
  return authUrl && doneUrl ? { authUrl, doneUrl } : undefined
}

/**
 * How long to wait for the operator's browser approval, and how often to ask
 * the done endpoint. A person is opening a page and clicking, so the budget is
 * generous and the poll is slow.
 */
export const OTP_APPROVAL_BUDGET_MS = 5 * 60_000
export const OTP_POLL_MS = 3000

/**
 * Whether npm's done endpoint reports the approval as complete. It answers 202
 * while the operator has not finished and 200 with the token once they have.
 */
export async function isApprovalComplete(doneUrl: string): Promise<boolean> {
  try {
    const response = await httpRequest(doneUrl, {
      headers: { 'npm-auth-type': 'web' },
    })
    return response.status === 200
  } catch {
    return false
  }
}

/**
 * Authenticate once before any read or write, so nine account operations cost
 * one approval — npm elevates the session for about five minutes.
 *
 * The probe is a read (`npm trust list`) because a read is idempotent: the
 * priming step must never be the thing that writes a row. On refusal this
 * OPENS the approval page in the operator's browser and polls npm's own done
 * endpoint until it reports success, so the URL never has to be copied out of
 * a log — which is what makes the flow work from a non-interactive session.
 */
export async function primeOtpSession(
  npmPath: string,
  probePkg: string,
  neutralCwd: string,
): Promise<boolean> {
  const probe = await runCapture(
    npmPath,
    ['trust', 'list', probePkg],
    neutralCwd,
  )
  const combined = probe.stdout
  if (!isOtpRequired(combined)) {
    return true
  }
  // The refusal names the URLs on stderr, which runCapture leaves on the
  // parent's stderr — re-run captured so this flow can read them.
  const refusal = await runCapture(
    npmPath,
    ['trust', 'list', probePkg, '--json'],
    neutralCwd,
  )
  const challenge =
    parseOtpChallenge(combined) ?? parseOtpChallenge(refusal.stdout)
  if (!challenge) {
    return false
  }
  logger.log(
    'npm requires one browser approval before it will change trusted ' +
      'publishers. Opening the approval page now — approve it and this run ' +
      'continues on its own.',
  )
  // Open the page for the operator rather than printing a URL they would have
  // to copy: a redirected or piped run makes a printed URL unreachable.
  await runCapture('open', [challenge.authUrl], neutralCwd).catch(
    () => undefined,
  )
  const deadline = Date.now() + OTP_APPROVAL_BUDGET_MS
  while (Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop -- serial: one operator, one approval.
    if (await isApprovalComplete(challenge.doneUrl)) {
      logger.success('approval received — continuing.')
      return true
    }
    // eslint-disable-next-line no-await-in-loop -- paced poll, not a retry ladder.
    await sleep(OTP_POLL_MS)
  }
  return false
}

async function main(): Promise<void> {
  const flags = parseTrustArgs(process.argv.slice(2))
  // The target checkout owns both the package list and the platform tokens, so
  // it is resolved once and both reads follow it.
  const targetRepoRoot = resolveTargetRepoRoot(flags.repo)
  // No names given: configure everything the target repo publishes. Naming
  // packages stays supported for a one-off repair.
  const packages = flags.packages.length
    ? [...flags.packages]
    : enumerateRepoPackages(targetRepoRoot)
  if (!packages.length) {
    logger.fail(
      'no publishable packages found.\n' +
        '  What:  this flow configures a trusted publisher per published package.\n' +
        `  Where: ${targetRepoRoot}\n` +
        '  Saw:   no package arguments and no publishable manifest in the repo.\n' +
        '  Fix:   name the packages explicitly, or run from a repo that publishes — ' +
        'pnpm run trust [@scope/pkg…] [--repo owner/name] [--apply]',
    )
    process.exitCode = 1
    return
  }
  const resolution = resolvePinnedNpm({
    home: os.homedir(),
    repoRoot: REPO_ROOT,
  })
  if (!resolution.npmPath) {
    logger.fail(`cannot resolve the pinned npm: ${resolution.refusal ?? ''}`)
    process.exitCode = 1
    return
  }
  const npmPath = resolution.npmPath
  // Neutral cwd: npm refuses to run inside a repo whose devEngines names pnpm.
  const neutralCwd = os.tmpdir()
  const versionRun = await runCapture(npmPath, ['--version'], neutralCwd)
  const npmVersion = versionRun.stdout.trim()
  if (!meetsMinimumVersion(npmVersion, MIN_NPM_VERSION)) {
    logger.fail(
      `the pinned npm is too old for \`npm trust\`.\n` +
        `  What:  trusted-publisher configuration needs npm ${MIN_NPM_VERSION} or newer.\n` +
        `  Where: ${npmPath}\n` +
        `  Saw:   npm ${npmVersion || '(unknown)'}; wanted >= ${MIN_NPM_VERSION}.\n` +
        `  Fix:   raise the .node-version pin to a Node whose bundled npm is ${MIN_NPM_VERSION}+.`,
    )
    process.exitCode = 1
    return
  }
  // `--repo owner/name` targets a SIBLING member's packages, so its platform
  // tokens come from that checkout — the cwd's config describes a different
  // repo and would plan every platform package onto the plain workflow.
  // Authenticate before the first read. Skipped for a dry run, which only
  // needs the plan — a plan built from unreadable current state still prints
  // every package as "would configure", which is the safe direction.
  if (
    flags.apply &&
    !(await primeOtpSession(npmPath, packages[0]!, neutralCwd))
  ) {
    logger.fail(
      'npm did not accept a one-time password, so nothing was changed.\n' +
        '  What:  every `npm trust` call is an account operation and needs 2FA.\n' +
        `  Where: ${npmPath}\n` +
        '  Saw:   the authentication prompt did not complete.\n' +
        '  Fix:   run this command from an ATTACHED terminal — npm prints a URL ' +
        'and waits for the browser approval, which a detached/background run ' +
        'can never receive.',
    )
    process.exitCode = 1
    return
  }
  const napiPlatforms = readNapiPlatforms(targetRepoRoot)
  const plans: TrustPlan[] = []
  for (let p = 0, { length } = packages; p < length; p += 1) {
    const pkg = packages[p]!
    const desired = desiredTrustedPublisher({
      napiPlatforms,
      pkg,
      repoOverride: flags.repo,
    })
    if (!desired) {
      logger.fail(
        `cannot derive a repository for ${pkg}.\n` +
          '  What:  a trusted publisher names the GitHub repo that may publish.\n' +
          `  Where: ${pkg}\n` +
          '  Saw:   no --repo and no repo derivable from the package name.\n' +
          '  Fix:   pass --repo <owner/name>.',
      )
      process.exitCode = 1
      continue
    }
    // eslint-disable-next-line no-await-in-loop -- sequential by design: npm rate-limits account reads.
    const listRun = await runCapture(
      npmPath,
      ['trust', 'list', pkg],
      neutralCwd,
    )
    plans.push({
      desired,
      matches: listOutputMatches(listRun.stdout, desired),
      pkg,
    })
  }
  const pending = plans.filter(plan => !plan.matches)
  logger.log(
    `npm trusted publishers — ${plans.length} package(s), ` +
      `${pending.length} to configure${flags.apply ? '' : ' [dry-run]'}`,
  )
  for (let i = 0, { length } = plans; i < length; i += 1) {
    const plan = plans[i]!
    const label = plan.matches ? 'conforms' : 'would configure'
    logger.log(
      `  ${plan.pkg}: ${label} — ${plan.desired.repositoryOwner}/` +
        `${plan.desired.repositoryName} ${plan.desired.workflowFilename} ` +
        `env ${plan.desired.environmentName}`,
    )
  }
  if (!flags.apply) {
    logger.log('Re-run with --apply to write these configurations.')
    return
  }
  if (!pending.length) {
    logger.success('every named package already conforms — nothing to write.')
    return
  }
  logger.log(formatAuthGate(pending.length))
  let configured = 0
  const failures: string[] = []
  for (let i = 0, { length } = pending; i < length; i += 1) {
    const plan = pending[i]!
    if (i > 0) {
      // eslint-disable-next-line no-await-in-loop -- sequential: one 2FA window, npm's own rate-limit guidance.
      await sleep(WRITE_SPACING_MS)
    }
    // The PTY seam carries npm's 2FA prompt through a non-TTY session.
    // eslint-disable-next-line no-await-in-loop -- sequential writes share one 2FA window.
    const code = await runInheritTty(
      npmPath,
      buildTrustWriteArgs(plan.pkg, plan.desired),
      neutralCwd,
    )
    // eslint-disable-next-line no-await-in-loop -- the verify belongs to this package's turn.
    const verify = await runCapture(
      npmPath,
      ['trust', 'list', plan.pkg],
      neutralCwd,
    )
    if (code === 0 && listOutputMatches(verify.stdout, plan.desired)) {
      configured += 1
      logger.success(`${plan.pkg}: configured and verified.`)
      continue
    }
    failures.push(plan.pkg)
    logger.fail(formatVerifyFailure(plan.pkg, plan.desired, verify.stdout))
  }
  const skipped = plans.length - pending.length
  logger.log(
    `Trusted-publisher summary: ${configured} configured, ${skipped} already ` +
      `conforming, ${failures.length} failed.`,
  )
  if (failures.length) {
    process.exitCode = 1
  }
}

if (isMainModule(import.meta.url)) {
  main().catch((e: unknown) => {
    logger.fail(errorMessage(e))
    process.exitCode = 1
  })
}
