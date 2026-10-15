import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'

import { getEnvValue } from '@socketsecurity/lib-stable/env/rewire'
import { whichSync } from '@socketsecurity/lib-stable/exe/path/which'
import { isPlainObject } from '@socketsecurity/lib-stable/objects/predicates'
import { spawn } from '@socketsecurity/lib-stable/process/spawn/child'
import { rolldown } from 'rolldown'

import { REPO_ROOT } from '../fleet/paths.mts'
import { isMainModule } from '../fleet/process/is-main-module.mts'
import { runMain } from '../fleet/process/main/run.mts'
import {
  getScriptArgs,
  getScriptLogger,
  scriptStdio,
} from '../fleet/process/script-output.mts'

import type { ScriptMeta } from '../fleet/process/main/run.mts'

export function authHostPaths(directory: string) {
  return {
    __proto__: null,
    extension: path.join(directory, 'extension'),
    extensions: path.join(directory, 'extensions'),
    legacyData: path.join(directory, 'legacy-data'),
    receipt: path.join(directory, 'receipt.json'),
    sharedData: path.join(directory, 'shared-data'),
    userData: path.join(directory, 'user-data'),
    workspace: path.join(directory, 'workspace'),
  }
}

export function authHostLaunch(
  directory: string,
  code: string,
  scenario: 'stored' | 'legacy' | 'empty',
  environment: NodeJS.ProcessEnv,
) {
  const paths = authHostPaths(directory)
  const env: NodeJS.ProcessEnv = {
    ...environment,
    HOME: paths.legacyData,
    LOCALAPPDATA: paths.legacyData,
    SOCKET_VSCODE_AUTH_RESULT: paths.receipt,
    SOCKET_VSCODE_AUTH_SCENARIO: scenario,
    XDG_DATA_HOME: paths.legacyData,
    USERPROFILE: paths.legacyData,
  }
  env['ELECTRON_RUN_AS_NODE'] = undefined
  env['VSCODE_APPDATA'] = undefined
  env['VSCODE_IPC_HOOK_CLI'] = undefined
  env['VSCODE_PORTABLE'] = undefined
  env['NODE_OPTIONS'] = undefined
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
      paths.extension,
      '--extensionTestsPath',
      path.join(REPO_ROOT, 'test', 'repo', 'extension-host', 'auth-test.cjs'),
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
    code,
    env,
  }
}

function assertAuthReceipt(
  value: unknown,
  scenario: 'stored' | 'legacy' | 'empty',
) {
  const expected = {
    initializationBlocked: true,
    anonymousAllowed: scenario === 'empty',
    retiredBlocked: scenario !== 'empty',
    silentSessionAbsent: true,
    secretPreserved: true,
    secretAbsent: scenario === 'empty' || scenario === 'legacy',
    legacyPreserved: scenario === 'legacy',
    legacyAbsent: scenario === 'empty',
    scenario,
  }
  if (
    !isPlainObject(value) ||
    !Object.entries(expected).every(
      ([key, expectedValue]) => value[key] === expectedValue,
    )
  ) {
    throw new Error(
      `VS Code auth regression host did not complete ${scenario} assertions. Inspect the isolated profile logs and retry.`,
    )
  }
}

async function bundleAuthFixture(extensionDirectory: string) {
  await mkdir(extensionDirectory, { recursive: true })
  const bundle = await rolldown({
    experimental: { attachDebugInfo: 'none' },
    external: ['vscode'],
    input: path.join(
      REPO_ROOT,
      'test',
      'repo',
      'extension-host',
      'auth-fixture.mts',
    ),
    platform: 'node',
    resolve: { extensions: ['.mts', '.ts', '.mjs', '.js', '.json'] },
  })
  await bundle.write({
    dir: extensionDirectory,
    entryFileNames: 'main.cjs',
    format: 'cjs',
  })
  await bundle.close()
  await writeFile(
    path.join(extensionDirectory, 'package.json'),
    JSON.stringify({
      activationEvents: [],
      contributes: {
        authentication: [{ id: 'socket-security', label: 'Socket Security' }],
      },
      engines: { vscode: '^1.134.0' },
      main: './main.cjs',
      name: 'auth-regression',
      publisher: 'socket',
      version: '1.0.0',
    }),
  )
}

export async function runExtensionHostAuthRegression() {
  const { values } = parseArgs({
    args: getScriptArgs(),
    options: { code: { type: 'string' } },
    strict: true,
  })
  const code =
    values.code ?? getEnvValue('VSCODE_EXECUTABLE') ?? whichSync('code')
  if (typeof code !== 'string') {
    throw new Error(
      'VS Code auth regression cannot find VS Code. Supply --code <executable> and retry.',
    )
  }
  const logger = getScriptLogger()
  for (const scenario of ['stored', 'legacy', 'empty'] as const) {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'vsa-'))
    const paths = authHostPaths(directory)
    const directories = await Promise.allSettled([
      mkdir(paths.workspace, { recursive: true }),
      mkdir(paths.extensions, { recursive: true }),
      mkdir(paths.legacyData, { recursive: true }),
      mkdir(paths.userData, { recursive: true }),
      mkdir(paths.sharedData, { recursive: true }),
    ])
    for (const result of directories) {
      if (result.status === 'rejected') {
        throw result.reason
      }
    }
    await bundleAuthFixture(paths.extension)
    await mkdir(path.join(paths.userData, 'User'), { recursive: true })
    await writeFile(
      path.join(paths.userData, 'User', 'settings.json'),
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
    logger.log(`VS Code auth ${scenario} profile: ${directory}`)
    const launch = authHostLaunch(directory, code, scenario, process.env)
    await spawn(launch.code, launch.args, {
      cwd: REPO_ROOT,
      env: launch.env,
      killTreeOnTimeout: true,
      stdio: scriptStdio('inherit'),
      timeout: 120_000,
    })
    const receipt: unknown = JSON.parse(await readFile(paths.receipt, 'utf8'))
    assertAuthReceipt(receipt, scenario)
  }
  return { __proto__: null, exitCode: 0, data: { scenarios: 3 } }
}

const SCRIPT_META: ScriptMeta = {
  describe: 'verify retired credentials in real VS Code Extension Hosts',
  heavyJob: 'test',
  help: 'Usage: pnpm run test:extension-auth [--code <executable>] [--json]',
  json: 'result',
}

if (isMainModule(import.meta.url)) {
  runMain(runExtensionHostAuthRegression, SCRIPT_META)
}
