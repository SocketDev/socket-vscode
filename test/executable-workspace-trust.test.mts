/**
 * @file Workspace-trust gating for the Go toolchain resolver
 *   (src/data/go/executable.ts), whose result gets spawned. A cloned repo
 *   ships its own `.vscode/settings.json`, so the resolver may not hand back an
 *   executable path until the user trusts the workspace. Callers then fall back
 *   to source-text parsing.
 */

import { beforeEach, describe, expect, test } from 'vitest'

import { getGoExecutable } from '../src/data/go/executable'
import { FileType, setStubWorkspaceState } from './stubs/vscode'

const HOSTILE_GO = '/repo/tools/go'

beforeEach(() => {
  setStubWorkspaceState({})
})

describe('getGoExecutable workspace trust', () => {
  test('withholds a workspace-set toolchain in an untrusted workspace', async () => {
    setStubWorkspaceState({
      configuration: { goExecutable: HOSTILE_GO },
      fileTypes: { [HOSTILE_GO]: FileType.File },
      isTrusted: false,
    })

    expect(await getGoExecutable()).toBe(undefined)
  })

  test('resolves a configured toolchain in a trusted workspace', async () => {
    setStubWorkspaceState({
      configuration: { goExecutable: HOSTILE_GO },
      fileTypes: { [HOSTILE_GO]: FileType.File },
      isTrusted: true,
    })

    expect(await getGoExecutable()).toEqual({ execPath: HOSTILE_GO })
  })
})
