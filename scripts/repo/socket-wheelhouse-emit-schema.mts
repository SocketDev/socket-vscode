/**
 * @file Emit `socket-wheelhouse-schema.json` from the TypeBox source. Run via
 *   `pnpm run socket-wheelhouse:emit-schema` from a fleet repo (the worktree
 *   where TypeBox is installed). Mirrors the lockstep emit pattern.
 */

import { writeFileSync } from 'node:fs'
import path from 'node:path'

import { getDefaultLogger } from '@socketsecurity/lib-stable/logger/default'
import { spawn } from '@socketsecurity/lib-stable/process/spawn/child'

import { SocketWheelhouseConfigSchema } from './socket-wheelhouse-schema.mts'
import { pickConfig } from '../fleet/_shared/format-scope.mts'
import { isMainModule } from '../fleet/_shared/is-main-module.mts'
import { runMain } from '../fleet/_shared/run-main.mts'
import { REPO_ROOT, segregatedConfigPath } from '../fleet/paths.mts'

import type { ScriptMeta } from '../fleet/_shared/run-main.mts'

const logger = getDefaultLogger()

// Schema lives next to the per-repo `socket-wheelhouse.json` it describes —
// the marker's `$schema` ref is `./socket-wheelhouse-schema.json`. The
// segregated location is owned by paths.mts (1 path, 1 reference).
const outPath = segregatedConfigPath(REPO_ROOT, 'socket-wheelhouse-schema.json')

async function main(): Promise<void> {
  const enriched = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://github.com/SocketDev/socket-wheelhouse-schema.json',
    title: 'socket-wheelhouse per-repo config',
    ...SocketWheelhouseConfigSchema,
  }

  writeFileSync(outPath, JSON.stringify(enriched, null, 2) + '\n', 'utf8')

  // Run oxfmt on the output so the file matches what oxfmt would
  // produce. Without this, `pnpm run check --all` (which runs oxfmt
  // over the tree) would flag the emitted schema as drifted on every
  // repo that re-emits it. The schema is in IDENTICAL_FILES, so the
  // formatted form is the byte-canonical form fleet-wide.
  await spawn(
    'pnpm',
    [
      'exec',
      'oxfmt',
      '-c',
      pickConfig('oxfmtrc.json', { cwd: REPO_ROOT }),
      outPath,
    ],
    {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    },
  )

  logger.success(`wrote ${path.relative(REPO_ROOT, outPath)}`)
}

const SCRIPT_META: ScriptMeta = {
  describe:
    'emits the socket-wheelhouse per-repo config schema JSON from the TypeBox source',
  help: 'Usage: node scripts/repo/socket-wheelhouse-emit-schema.mts',
}

if (isMainModule(import.meta.url)) {
  runMain(main, SCRIPT_META)
}
