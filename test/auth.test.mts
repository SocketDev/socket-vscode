/**
 * @file Token storage for the Socket authentication provider (src/auth.ts).
 *   Covers the one-time move of an existing token out of the legacy settings
 *   file into SecretStorage — nobody may be signed out by upgrading — and the
 *   session identifiers, which must not carry the token: `session.id` and
 *   `account.id` are readable far more widely than `accessToken`.
 */

import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import {
  activate,
  API_TOKEN_SECRET_KEY,
  getLegacySettingsPath,
  migrateApiTokenToSecretStorage,
  readLegacySettings,
  sessionFromAPIKey,
} from '../src/auth'
import { EXTENSION_PREFIX } from '../src/util'
import {
  getSessionCalls,
  registeredCommands,
  resetStubAuthState,
  setStubGetSessionResult,
  setStubWorkspaceState,
} from './stubs/vscode'

import type { OrgInfo } from '../src/api'
import { safeDelete } from '@socketsecurity/lib-stable/fs/safe'

const TOKEN = 'sktsec_migrated_token'

class StubSecretStorage {
  #values: Map<string, string> = new Map()
  onDidChange = () => ({ dispose() {} })
  async get(key: string): Promise<string | undefined> {
    return this.#values.get(key)
  }
  async store(key: string, value: string): Promise<void> {
    this.#values.set(key, value)
  }
  async delete(key: string): Promise<void> {
    this.#values.delete(key)
  }
}

let tempHome: string
let settingsPath: string
// getLegacySettingsPath reads LOCALAPPDATA on Windows and XDG_DATA_HOME on
// every other platform, so both have to point at the temp dir for the suite to
// resolve the same path the code under test does.
const DATA_HOME_VARS = ['LOCALAPPDATA', 'XDG_DATA_HOME'] as const
const originalDataHome = new Map(
  DATA_HOME_VARS.map(name => [name, process.env[name]]),
)

function encodeSettings(settings: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(
    Buffer.from(JSON.stringify(settings)).toString('base64'),
  )
}

beforeEach(async () => {
  setStubWorkspaceState({})
  tempHome = await fs.mkdtemp(path.join(os.tmpdir(), 'socket-auth-'))
  for (const name of DATA_HOME_VARS) {
    process.env[name] = tempHome
  }
  settingsPath = path.join(tempHome, 'socket', 'settings')
  await fs.mkdir(path.dirname(settingsPath), { recursive: true })
})

afterEach(async () => {
  for (const name of DATA_HOME_VARS) {
    const original = originalDataHome.get(name)
    if (original === undefined) {
      delete process.env[name]
    } else {
      process.env[name] = original
    }
  }
  await safeDelete(tempHome)
})

describe('legacy token migration', () => {
  test('moves an existing token into SecretStorage and clears the file', async () => {
    await fs.writeFile(settingsPath, encodeSettings({ apiKey: TOKEN }))
    const secrets = new StubSecretStorage()

    await migrateApiTokenToSecretStorage(secrets as never)

    expect(await secrets.get(API_TOKEN_SECRET_KEY)).toBe(TOKEN)
    // No remaining keys, so the whole file goes.
    expect(existsSync(settingsPath)).toBe(false)
  })

  test('preserves sibling settings other Socket tools wrote', async () => {
    await fs.writeFile(
      settingsPath,
      encodeSettings({ apiBaseUrl: 'https://api.socket.dev', apiKey: TOKEN }),
    )
    const secrets = new StubSecretStorage()

    await migrateApiTokenToSecretStorage(secrets as never)

    expect(await secrets.get(API_TOKEN_SECRET_KEY)).toBe(TOKEN)
    const remaining = await readLegacySettings(settingsPath)
    expect(remaining).toEqual({ apiBaseUrl: 'https://api.socket.dev' })
    expect(Object.hasOwn(remaining, 'apiKey')).toBe(false)
  })

  test('is idempotent once the file is gone', async () => {
    await fs.writeFile(settingsPath, encodeSettings({ apiKey: TOKEN }))
    const secrets = new StubSecretStorage()

    await migrateApiTokenToSecretStorage(secrets as never)
    await migrateApiTokenToSecretStorage(secrets as never)

    expect(await secrets.get(API_TOKEN_SECRET_KEY)).toBe(TOKEN)
  })

  test('does not overwrite a token already in SecretStorage', async () => {
    await fs.writeFile(settingsPath, encodeSettings({ apiKey: 'sktsec_stale' }))
    const secrets = new StubSecretStorage()
    await secrets.store(API_TOKEN_SECRET_KEY, TOKEN)

    await migrateApiTokenToSecretStorage(secrets as never)

    expect(await secrets.get(API_TOKEN_SECRET_KEY)).toBe(TOKEN)
  })

  test('leaves a directory at the legacy path alone', async () => {
    await fs.mkdir(settingsPath, { recursive: true })
    await fs.writeFile(path.join(settingsPath, 'config.json'), '{}')
    const secrets = new StubSecretStorage()

    await migrateApiTokenToSecretStorage(secrets as never)

    expect(await secrets.get(API_TOKEN_SECRET_KEY)).toBe(undefined)
    expect(existsSync(path.join(settingsPath, 'config.json'))).toBe(true)
  })

  test('no-ops when no legacy file exists', async () => {
    const secrets = new StubSecretStorage()

    await migrateApiTokenToSecretStorage(secrets as never)

    expect(await secrets.get(API_TOKEN_SECRET_KEY)).toBe(undefined)
  })

  test('resolves the legacy path under the data home', () => {
    expect(getLegacySettingsPath()).toBe(settingsPath)
  })
})

describe('session identifiers', () => {
  const org: OrgInfo = {
    id: 'org-1',
    image: undefined,
    name: 'Acme',
    plan: 'enterprise',
  }

  test('keep the token out of session.id and account.id', () => {
    const session = sessionFromAPIKey(TOKEN, org)

    expect(session.accessToken).toBe(TOKEN)
    expect(session.id).not.toContain(TOKEN)
    expect(session.account.id).not.toContain(TOKEN)
    expect(session.account.id).toBe('org-1')
    expect(session.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.session$/,
    )
  })

  test('are fresh per session so login and logout keep working', () => {
    const first = sessionFromAPIKey(TOKEN, org)
    const second = sessionFromAPIKey(TOKEN, org)

    expect(first.id).not.toBe(second.id)
  })
})

describe('the Login command', () => {
  // Activate, then hand back the registered login handler. Activation calls
  // getSession itself, so the recorded calls are cleared before the handler
  // runs and the assertions can only see the command's own call.
  async function activateAndGetLoginHandler(): Promise<
    (...args: unknown[]) => unknown
  > {
    resetStubAuthState()
    await activate(
      {
        secrets: new StubSecretStorage(),
        subscriptions: [],
      } as unknown as Parameters<typeof activate>[0],
      [],
    )
    const handler = registeredCommands.get(`${EXTENSION_PREFIX}.login`)
    if (typeof handler !== 'function') {
      throw new Error('activate did not register the login command')
    }
    getSessionCalls.length = 0
    return handler
  }

  test('forces a new session so an existing one cannot suppress the prompt', async () => {
    const login = await activateAndGetLoginHandler()

    await login()

    // createIfNone only prompts when NO session exists, which is what made the
    // command a silent no-op for a customer who already had a stale one
    // (SURF-414). Asserting its absence is the point of the test.
    expect(getSessionCalls).toEqual([{ forceNewSession: true }])
  })

  test('stays silent when the user dismisses the token prompt', async () => {
    const login = await activateAndGetLoginHandler()
    setStubGetSessionResult(() =>
      Promise.reject(new Error('User did not consent to login.')),
    )

    await expect(login()).resolves.toBeUndefined()
  })
})
