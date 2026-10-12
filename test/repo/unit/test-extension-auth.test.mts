import path from 'node:path'
import { describe, expect, test } from 'vitest'

import {
  authHostLaunch,
  authHostPaths,
} from '../../../scripts/repo/test-extension-auth.mts'

describe('VS Code auth Extension Host isolation', () => {
  test('separates each profile and legacy-data location', () => {
    const storedPaths = authHostPaths(path.resolve('stored-profile'))
    const legacyPaths = authHostPaths(path.resolve('legacy-profile'))

    expect(storedPaths.userData).not.toBe(legacyPaths.userData)
    expect(storedPaths.extensions).not.toBe(legacyPaths.extensions)
    expect(storedPaths.legacyData).not.toBe(legacyPaths.legacyData)
    expect(storedPaths.receipt).not.toBe(legacyPaths.receipt)
  })

  test('isolates legacy directories and strips inherited VS Code sessions', () => {
    const inherited = {
      ELECTRON_RUN_AS_NODE: '1',
      VSCODE_APPDATA: 'personal-appdata',
      VSCODE_IPC_HOOK_CLI: 'personal-session',
      VSCODE_PORTABLE: 'personal-portable',
    }
    const launch = authHostLaunch(
      path.resolve('auth-profile'),
      '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
      'legacy',
      inherited,
    )
    const paths = authHostPaths(path.resolve('auth-profile'))

    expect(launch.args).toContain('--use-inmemory-secretstorage')
    expect(launch.args).toContain(paths.userData)
    expect(launch.args).toContain(paths.extensions)
    expect(launch.args).toContain(paths.extension)
    expect(launch.env['HOME']).toBe(paths.legacyData)
    expect(launch.env['XDG_DATA_HOME']).toBe(paths.legacyData)
    expect(launch.env['LOCALAPPDATA']).toBe(paths.legacyData)
    expect(launch.env['USERPROFILE']).toBe(paths.legacyData)
    expect(Object.hasOwn(launch.env, 'VSCODE_IPC_HOOK_CLI')).toBe(true)
    expect(Object.hasOwn(launch.env, 'VSCODE_APPDATA')).toBe(true)
    expect(Object.hasOwn(launch.env, 'VSCODE_PORTABLE')).toBe(true)
    expect(Object.hasOwn(launch.env, 'ELECTRON_RUN_AS_NODE')).toBe(true)
    expect(launch.env['VSCODE_IPC_HOOK_CLI']).toBeUndefined()
    expect(launch.env['VSCODE_APPDATA']).toBeUndefined()
    expect(launch.env['VSCODE_PORTABLE']).toBeUndefined()
    expect(launch.env['ELECTRON_RUN_AS_NODE']).toBeUndefined()
    expect(inherited.VSCODE_IPC_HOOK_CLI).toBe('personal-session')
  })
})
