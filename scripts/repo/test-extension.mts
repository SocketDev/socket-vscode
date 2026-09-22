import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'

import { whichSync } from '@socketsecurity/lib-stable/exe/path/which'
import { spawn } from '@socketsecurity/lib-stable/process/spawn/child'

import { REPO_ROOT } from '../fleet/paths.mts'
import { isMainModule } from '../fleet/process/is-main-module.mts'
import { runMain } from '../fleet/process/run-main.mts'
import {
  getScriptArgs,
  getScriptLogger,
  scriptStdio,
} from '../fleet/process/script-output.mts'

import type { ScriptMeta } from '../fleet/process/run-main.mts'

export function extensionHostPaths(directory: string) {
  return {
    __proto__: null,
    artifact: path.join(directory, 'artifact'),
    extensions: path.join(directory, 'extensions'),
    legacyData: path.join(directory, 'legacy-data'),
    receipt: path.join(directory, 'receipt.json'),
    sharedData: path.join(directory, 'shared-data'),
    userData: path.join(directory, 'user-data'),
    workspace: path.join(directory, 'workspace'),
  }
}

export function extensionHostLaunch(
  directory: string,
  environment: NodeJS.ProcessEnv,
) {
  const paths = extensionHostPaths(directory)
  const env = {
    __proto__: null,
    ...environment,
    LOCALAPPDATA: paths.legacyData,
    SOCKET_VSCODE_SMOKE_RESULT: paths.receipt,
    XDG_DATA_HOME: paths.legacyData,
  } as unknown as NodeJS.ProcessEnv
  delete env['ELECTRON_RUN_AS_NODE']
  delete env['VSCODE_APPDATA']
  delete env['VSCODE_IPC_HOOK_CLI']
  delete env['VSCODE_PORTABLE']
  return {
    __proto__: null,
    args: [
      '--new-window',
      '--wait',
      '--user-data-dir',
      paths.userData,
      '--extensions-dir',
      paths.extensions,
      '--shared-data-dir',
      paths.sharedData,
      '--extensionDevelopmentPath',
      path.join(paths.artifact, 'extension'),
      '--extensionTestsPath',
      path.join(REPO_ROOT, 'test', 'repo', 'extension-host', 'smoke.cjs'),
      '--disable-telemetry',
      '--telemetry-level',
      'off',
      '--disable-crash-reporter',
      '--disable-updates',
      '--use-inmemory-secretstorage',
      '--skip-welcome',
      '--skip-release-notes',
      '--sync',
      'off',
      paths.workspace,
    ],
    env,
  }
}

export function assertExtensionHostReceipt(value: unknown): void {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('activated' in value) ||
    value.activated !== true ||
    !('loggedOut' in value) ||
    value.loggedOut !== true ||
    !('language' in value) ||
    value.language !== 'javascript'
  ) {
    throw new Error(
      'Extension Host smoke did not complete its assertions. Expected an activation receipt. Inspect the isolated profile logs and retry.',
    )
  }
}

export async function runExtensionHostSmoke() {
  const { values } = parseArgs({
    args: getScriptArgs(),
    options: { code: { type: 'string' }, vsix: { type: 'string' } },
    strict: true,
  })
  if (!values.vsix) {
    throw new Error(
      'Extension Host smoke needs a packaged extension. Expected --vsix <path>. Run pnpm run package-for-vscode --out <path>, then retry.',
    )
  }
  const code = values.code ?? whichSync('code', { nothrow: true })
  if (typeof code !== 'string') {
    throw new Error(
      'Extension Host smoke cannot find VS Code. Expected code on PATH. Supply --code <executable> and retry.',
    )
  }
  const scratchRoot = path.join(REPO_ROOT, '.cache', 'repo', 'extension-host')
  await mkdir(scratchRoot, { recursive: true })
  const directory = await mkdtemp(path.join(scratchRoot, 'run-'))
  const paths = extensionHostPaths(directory)
  const settingsDirectory = path.join(paths.userData, 'User')
  await mkdir(paths.workspace, { recursive: true })
  await mkdir(paths.extensions, { recursive: true })
  await mkdir(paths.legacyData, { recursive: true })
  await mkdir(settingsDirectory, { recursive: true })
  await writeFile(
    path.join(settingsDirectory, 'settings.json'),
    JSON.stringify({
      'extensions.autoCheckUpdates': false,
      'extensions.autoUpdate': false,
      'extensions.ignoreRecommendations': true,
      'security.workspace.trust.startupPrompt': 'never',
      'telemetry.telemetryLevel': 'off',
      'update.mode': 'none',
      'workbench.enableExperiments': false,
      'workbench.startupEditor': 'none',
    }),
  )
  await writeFile(
    path.join(paths.workspace, 'example.js'),
    'export const greeting = "example"\n',
  )
  const logger = getScriptLogger()
  logger.log(`Extension Host smoke profile: ${directory}`)
  await spawn(
    'unzip',
    ['-q', path.resolve(values.vsix), '-d', paths.artifact],
    {
      cwd: REPO_ROOT,
      stdio: scriptStdio('inherit'),
      timeout: 30_000,
    },
  )
  const launch = extensionHostLaunch(directory, process.env)
  await spawn(code, launch.args, {
    cwd: REPO_ROOT,
    env: launch.env,
    killTreeOnTimeout: true,
    stdio: scriptStdio('inherit'),
    timeout: 120_000,
  })
  const receipt: unknown = JSON.parse(await readFile(paths.receipt, 'utf8'))
  assertExtensionHostReceipt(receipt)
  return { __proto__: null, exitCode: 0, data: { directory, receipt } }
}

const SCRIPT_META: ScriptMeta = {
  describe: 'test the packaged extension in an isolated VS Code Extension Host',
  heavyJob: 'test',
  help: 'Usage: pnpm run test:extension --vsix <path> [--code <executable>] [--json]',
  json: 'result',
}

if (isMainModule(import.meta.url)) {
  runMain(runExtensionHostSmoke, SCRIPT_META)
}
