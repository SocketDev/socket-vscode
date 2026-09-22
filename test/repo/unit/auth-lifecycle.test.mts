import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import * as vscode from 'vscode'

import { getOrganizations } from '../../../src/api.mts'
import { activate, API_TOKEN_SECRET_KEY } from '../../../src/auth.mts'
import { resetStubAuthState } from '../../stubs/vscode.mts'

import type { OrganizationsRecord } from '../../../src/api.mts'

vi.mock('../../../src/api.mts', () => ({ getOrganizations: vi.fn() }))
vi.mock('vscode', async importOriginal => {
  const actual = await importOriginal<typeof vscode>()
  return {
    ...actual,
    window: { ...actual.window, showInputBox: vi.fn() },
  }
})

const EXAMPLE_TOKEN = 'sktsec_example_existing_token'
const exampleOrganizations: OrganizationsRecord = {
  organizations: new Map([
    [
      'example-org',
      {
        id: 'example-org',
        image: undefined,
        name: 'Example Organization',
        plan: 'enterprise',
      },
    ],
  ]),
}

class LifecycleSecretStorage {
  token: string | undefined = EXAMPLE_TOKEN
  readonly changes = new vscode.EventEmitter<vscode.SecretStorageChangeEvent>()
  readonly onDidChange = this.changes.event
  readonly get = vi.fn(async () => this.token)
  readonly store = vi.fn(async (key: string, value: string) => {
    this.token = value
    this.changes.fire({ key })
  })
  readonly delete = vi.fn(async (key: string) => {
    this.token = undefined
    this.changes.fire({ key })
  })
}

beforeEach(() => {
  resetStubAuthState()
  vi.mocked(getOrganizations)
    .mockReset()
    .mockResolvedValue(exampleOrganizations)
  vi.mocked(vscode.window.showInputBox).mockReset()
  vi.spyOn(vscode.workspace.fs, 'stat').mockRejectedValue(
    Object.assign(new Error('Missing example settings'), { code: 'ENOENT' }),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  resetStubAuthState()
})

async function activateProvider(secrets: LifecycleSecretStorage) {
  let provider: vscode.AuthenticationProvider | undefined
  vi.spyOn(
    vscode.authentication,
    'registerAuthenticationProvider',
  ).mockImplementation((...[, , registered]) => {
    provider = registered
    return new vscode.Disposable(() => {})
  })
  await activate(
    { secrets, subscriptions: [] } as unknown as vscode.ExtensionContext,
    [],
  )
  if (!provider) {
    throw new Error('Authentication provider did not register')
  }
  return provider
}

describe('authentication lifecycle', () => {
  test('reports updated organization details without replacing the session ID', async () => {
    const secrets = new LifecycleSecretStorage()
    const provider = await activateProvider(secrets)
    const [session] = await provider.getSessions(undefined, {})
    const changes = vi.fn()
    provider.onDidChangeSessions(changes)
    const lookup = Promise.withResolvers<OrganizationsRecord | undefined>()
    const started = Promise.withResolvers<void>()
    vi.mocked(getOrganizations).mockImplementationOnce(() => {
      started.resolve()
      return lookup.promise
    })

    secrets.changes.fire({ key: API_TOKEN_SECRET_KEY })
    await started.promise
    lookup.resolve({
      organizations: new Map([
        [
          'example-updated-org',
          {
            id: 'example-updated-org',
            image: undefined,
            name: 'Updated Example Organization',
            plan: 'free',
          },
        ],
      ]),
    })
    await lookup.promise

    const [updated] = await provider.getSessions(undefined, {})
    expect(updated?.id).toBe(session?.id)
    expect(updated?.account).toEqual({
      id: 'example-updated-org',
      label: 'Updated Example Organization (free)',
    })
    expect(changes).toHaveBeenCalledExactlyOnceWith({
      added: [],
      changed: [updated],
      removed: [],
    })
  })

  test('keeps an unchanged session identity during secret synchronization', async () => {
    const secrets = new LifecycleSecretStorage()
    const provider = await activateProvider(secrets)
    const [session] = await provider.getSessions(undefined, {})
    const changes = vi.fn()
    provider.onDidChangeSessions(changes)
    const lookup = Promise.withResolvers<OrganizationsRecord | undefined>()
    const started = Promise.withResolvers<void>()
    vi.mocked(getOrganizations).mockImplementationOnce(() => {
      started.resolve()
      return lookup.promise
    })

    secrets.changes.fire({ key: API_TOKEN_SECRET_KEY })
    await started.promise
    lookup.resolve(exampleOrganizations)
    await lookup.promise

    expect((await provider.getSessions(undefined, {}))[0]).toBe(session)
    expect(changes).not.toHaveBeenCalled()
  })

  test('keeps the current session when a stale session is removed', async () => {
    const secrets = new LifecycleSecretStorage()
    const provider = await activateProvider(secrets)
    const sessions = await provider.getSessions(undefined, {})
    const changes = vi.fn()
    provider.onDidChangeSessions(changes)

    await provider.removeSession('example-stale-session')

    expect(secrets.delete).not.toHaveBeenCalled()
    expect(await provider.getSessions(undefined, {})).toEqual(sessions)
    expect(changes).not.toHaveBeenCalled()
  })

  test('preserves the session and reports a failed token deletion', async () => {
    const secrets = new LifecycleSecretStorage()
    const provider = await activateProvider(secrets)
    const sessions = await provider.getSessions(undefined, {})
    const changes = vi.fn()
    provider.onDidChangeSessions(changes)
    secrets.delete.mockRejectedValueOnce(new Error('Example storage failure'))

    await expect(
      provider.removeSession(sessions[0]!.id),
    ).rejects.toBeInstanceOf(Error)

    expect(secrets.token).toBe(EXAMPLE_TOKEN)
    expect(await provider.getSessions(undefined, {})).toEqual(sessions)
    expect(changes).not.toHaveBeenCalled()
  })

  test('validates the submitted token independently of input validation', async () => {
    const secrets = new LifecycleSecretStorage()
    const provider = await activateProvider(secrets)
    const sessions = await provider.getSessions(undefined, {})
    vi.mocked(getOrganizations).mockImplementation(async token =>
      token === EXAMPLE_TOKEN ? exampleOrganizations : undefined,
    )
    vi.mocked(vscode.window.showInputBox).mockImplementation(async options => {
      await options?.validateInput?.(EXAMPLE_TOKEN)
      return 'sktsec_example_submitted_token'
    })

    await expect(provider.createSession([], {})).rejects.toBeInstanceOf(Error)

    expect(secrets.store).not.toHaveBeenCalled()
    expect(await provider.getSessions(undefined, {})).toEqual(sessions)
  })

  test('removes a session when its token has no organizations', async () => {
    const secrets = new LifecycleSecretStorage()
    const provider = await activateProvider(secrets)
    const lookup = Promise.withResolvers<OrganizationsRecord | undefined>()
    const started = Promise.withResolvers<void>()
    vi.mocked(getOrganizations).mockImplementationOnce(() => {
      started.resolve()
      return lookup.promise
    })

    secrets.changes.fire({ key: API_TOKEN_SECRET_KEY })
    await started.promise
    lookup.resolve(undefined)
    await lookup.promise

    expect(await provider.getSessions(undefined, {})).toEqual([])
  })

  test('keeps a completed logout when an older lookup finishes', async () => {
    const secrets = new LifecycleSecretStorage()
    const provider = await activateProvider(secrets)
    const [session] = await provider.getSessions(undefined, {})
    const lookup = Promise.withResolvers<OrganizationsRecord | undefined>()
    const started = Promise.withResolvers<void>()
    vi.mocked(getOrganizations).mockImplementationOnce(() => {
      started.resolve()
      return lookup.promise
    })

    secrets.changes.fire({ key: API_TOKEN_SECRET_KEY })
    await started.promise
    await provider.removeSession(session!.id)
    lookup.resolve(exampleOrganizations)
    await lookup.promise

    expect(secrets.token).toBeUndefined()
    expect(await provider.getSessions(undefined, {})).toEqual([])
  })
})
