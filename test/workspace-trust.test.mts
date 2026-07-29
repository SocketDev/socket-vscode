/**
 * @file Workspace-trust gating for the two resolvers whose results get spawned:
 *   the Python interpreter (src/data/python/interpreter.ts) and the Go
 *   toolchain (src/data/go/executable.ts). A cloned repo controls both — it
 *   ships `.vscode/settings.json` and it ships the `.venv` the Python extension
 *   auto-selects — so neither may hand back an executable path until the user
 *   trusts the workspace. Callers then fall back to source-text parsing.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest'

// The Python extension's API package requires `vscode` through CJS, which the
// test-time `vscode` alias does not reach. Nothing under test needs it: a
// configured interpreter path short-circuits before the extension is consulted,
// and the untrusted cases return before that.
vi.mock(import('@vscode/python-extension'), () => ({
  PythonExtension: { api: async () => undefined },
}))

import { getGoExecutable } from '../src/data/go/executable'
import { getPythonInterpreter } from '../src/data/python/interpreter'
import { FileType, setStubWorkspaceState } from './stubs/vscode'

const HOSTILE_PYTHON = '/repo/.venv/bin/python'
const HOSTILE_GO = '/repo/tools/go'

beforeEach(() => {
  setStubWorkspaceState({})
})

describe('getPythonInterpreter workspace trust', () => {
  test('withholds a workspace-set interpreter in an untrusted workspace', async () => {
    setStubWorkspaceState({
      configuration: { pythonInterpreter: HOSTILE_PYTHON },
      fileTypes: { [HOSTILE_PYTHON]: FileType.File },
      isTrusted: false,
    })

    expect(await getPythonInterpreter()).toBe(undefined)
  })

  test('withholds the auto-detected interpreter in an untrusted workspace', async () => {
    setStubWorkspaceState({ isTrusted: false })

    expect(await getPythonInterpreter()).toBe(undefined)
  })

  test('resolves a configured interpreter in a trusted workspace', async () => {
    setStubWorkspaceState({
      configuration: { pythonInterpreter: HOSTILE_PYTHON },
      fileTypes: { [HOSTILE_PYTHON]: FileType.File },
      isTrusted: true,
    })

    expect(await getPythonInterpreter()).toEqual({ execPath: HOSTILE_PYTHON })
  })
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
