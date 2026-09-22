import path from 'node:path'
import { describe, expect, test } from 'vitest'

import {
  assertExtensionHostReceipt,
  extensionHostLaunch,
  extensionHostPaths,
} from '../../../scripts/repo/test-extension.mts'

describe('Extension Host smoke isolation', () => {
  test('isolates profile, extensions, and legacy settings without inheriting an IPC session', () => {
    const directory = path.resolve('test-profile')
    const inherited = {
      ELECTRON_RUN_AS_NODE: '1',
      VSCODE_APPDATA: 'personal-appdata',
      VSCODE_IPC_HOOK_CLI: 'personal-session',
      VSCODE_PORTABLE: 'personal-portable',
    }
    const { args, env } = extensionHostLaunch(directory, inherited)
    const paths = extensionHostPaths(directory)

    expect(args).toContain(paths.userData)
    expect(args).toContain(paths.extensions)
    expect(args).toContain(paths.sharedData)
    expect(env['XDG_DATA_HOME']).toBe(paths.legacyData)
    expect(env['LOCALAPPDATA']).toBe(paths.legacyData)
    expect(env['VSCODE_IPC_HOOK_CLI']).toBeUndefined()
    expect(env['VSCODE_APPDATA']).toBeUndefined()
    expect(env['VSCODE_PORTABLE']).toBeUndefined()
    expect(env['ELECTRON_RUN_AS_NODE']).toBeUndefined()
    expect(inherited.VSCODE_IPC_HOOK_CLI).toBe('personal-session')
  })

  test('requires completed assertions even when the VS Code CLI exits successfully', () => {
    expect(() => assertExtensionHostReceipt({ activated: true })).toThrow()
    expect(() =>
      assertExtensionHostReceipt({
        activated: true,
        language: 'javascript',
        loggedOut: false,
      }),
    ).toThrow()
    expect(() =>
      assertExtensionHostReceipt({
        activated: true,
        language: 'javascript',
        loggedOut: true,
      }),
    ).not.toThrow()
  })
})
