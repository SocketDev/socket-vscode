/**
 * @file Workspace-trust gating for the Python interpreter resolver
 *   (src/data/python/interpreter.ts), whose result gets spawned. A cloned repo
 *   controls both halves of the answer — it ships `.vscode/settings.json` and
 *   it ships the `.venv` the Python extension auto-selects — so the resolver
 *   may not hand back an executable path until the user trusts the workspace.
 *   Callers then fall back to source-text parsing.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest'

// The Python extension's API package requires `vscode` through CJS, which the
// test-time `vscode` alias does not reach. Nothing under test needs it: a
// configured interpreter path short-circuits before the extension is consulted,
// and the untrusted cases return before that.
vi.mock(import('@vscode/python-extension'), () => ({
  PythonExtension: { api: async () => undefined },
}))

import { getPythonInterpreter } from '../src/data/python/interpreter'
import { FileType, setStubWorkspaceState } from './stubs/vscode'

const HOSTILE_PYTHON = '/repo/.venv/bin/python'

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
