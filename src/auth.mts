import * as vscode from 'vscode'
import os from 'node:os'
import path from 'node:path'
import { DIAGNOSTIC_SOURCE_STR, EXTENSION_PREFIX } from './util.mts'
import crypto from 'node:crypto'
import { getOrganizations } from './api.mts'
import type { OrgInfo } from './api.mts'
import { selectOrganization } from './organization-selection.mts'
import {
  beginAuthContextSync,
  finishAuthContextSync,
  getAuthContextState,
} from './auth-context-state.mts'

export type APIConfig = {
  apiKey: string
}

export type AuthenticatedContext = {
  accessToken: string
  organization: OrgInfo
}

export type SettingsFile = {
  apiKey?: string | undefined
  [key: string]: unknown
}

// The token lives in vscode.SecretStorage, which is backed by the OS keychain.
export const API_TOKEN_SECRET_KEY = 'apiToken'

export async function activate(
  context: vscode.ExtensionContext,
  disposables: vscode.Disposable[],
) {
  const { secrets } = context
  const pleaseLoginStatusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  )
  pleaseLoginStatusBar.hide()
  pleaseLoginStatusBar.text = `$(warning) Socket Security: Login`
  pleaseLoginStatusBar.tooltip =
    'Socket Security needs to login for full functionality'
  pleaseLoginStatusBar.command = `${EXTENSION_PREFIX}.login`

  beginAuthContextSync()
  try {
    await migrateApiTokenToSecretStorage(secrets)
  } catch {}
  //#region session sync
  // responsible for keeping SecretStorage and mem in sync
  let liveSessions: Map<
    vscode.AuthenticationSession['accessToken'],
    vscode.AuthenticationSession
  > = new Map()
  let sessionRevision = 0
  let latestSessionSync: Promise<void> | undefined
  const storedSessionsChanges =
    new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>()

  // SecretStorage is shared across windows of the same profile, so another
  // window logging in or out shows up here.
  disposables?.push(
    secrets.onDidChange(e => {
      if (e.key === API_TOKEN_SECRET_KEY) {
        void requestSessionSync()
      }
    }),
  )
  async function syncLiveSessionFromSecretStorage() {
    const revision = ++sessionRevision
    const contextRevision = beginAuthContextSync()
    let apiKey: string | undefined
    try {
      apiKey = await secrets.get(API_TOKEN_SECRET_KEY)
    } catch {}
    const storedSessions: typeof liveSessions = new Map<
      vscode.AuthenticationSession['accessToken'],
      vscode.AuthenticationSession
    >()
    if (typeof apiKey === 'string' && apiKey.length > 0) {
      const organizations = await getOrganizations(apiKey)
      const selection = selectOrganization(
        vscode.workspace.getConfiguration().get('socket-security.orgSlug'),
        organizations?.organizations,
      )
      if (selection.status === 'selected') {
        storedSessions.set(
          apiKey,
          sessionFromAPIKey(
            apiKey,
            selection.organization,
            liveSessions.get(apiKey),
          ),
        )
      } else if (organizations) {
        storedSessions.set(
          apiKey,
          sessionFromAPIKey(
            apiKey,
            {
              id: 'socket-token',
              slug: '',
              name: 'Socket API token',
              image: undefined,
              plan: '',
            },
            liveSessions.get(apiKey),
          ),
        )
      }
    }
    if (revision !== sessionRevision) {
      const latestSync = latestSessionSync
      if (latestSync) {
        await latestSync
      }
      return
    }
    const added: vscode.AuthenticationSession[] = []
    const changed: vscode.AuthenticationSession[] = []
    const removed: vscode.AuthenticationSession[] = []
    // oxlint-disable-next-line socket/prefer-cached-for-loop -- iterating a Map's values iterator.
    for (const storedSession of storedSessions.values()) {
      // already have this access token in mem session
      // remove from live sessions that haven't been sorted
      if (liveSessions.has(storedSession.accessToken)) {
        if (liveSessions.get(storedSession.accessToken) !== storedSession) {
          changed.push(storedSession)
        }
        liveSessions.delete(storedSession.accessToken)
      } else {
        added.push(storedSession)
      }
    }
    // oxlint-disable-next-line socket/prefer-cached-for-loop -- iterating a Map's values iterator.
    for (const liveSessionWithoutStoredSession of liveSessions.values()) {
      removed.push(liveSessionWithoutStoredSession)
    }
    liveSessions = storedSessions
    if (added.length + changed.length + removed.length > 0) {
      storedSessionsChanges.fire({
        added,
        changed,
        removed,
      })
    }
    finishAuthContextSync(contextRevision)
  }
  function requestSessionSync(): Promise<void> {
    const sync = syncLiveSessionFromSecretStorage()
    latestSessionSync = sync
    return sync
  }
  //#endregion
  //#region service glue
  const service = vscode.authentication.registerAuthenticationProvider(
    EXTENSION_PREFIX,
    DIAGNOSTIC_SOURCE_STR,
    {
      onDidChangeSessions(fn) {
        return storedSessionsChanges.event(fn)
      },
      async getSessions(
        _scopes: readonly string[] | undefined,
        _options: vscode.AuthenticationProviderSessionOptions,
      ): Promise<vscode.AuthenticationSession[]> {
        return Array.from(liveSessions.values())
      },
      async createSession(
        _scopes: readonly string[],
        _options: vscode.AuthenticationProviderSessionOptions,
      ): Promise<vscode.AuthenticationSession> {
        const apiKey: string =
          (await vscode.window.showInputBox({
            title: 'Socket Security API Token',
            placeHolder: 'Leave this blank to stay logged out',
            ignoreFocusOut: true,
            password: true,
            prompt: 'Enter your API token from https://socket.dev/',
            async validateInput(value) {
              if (!value) {
                return undefined
              }
              const organizations = await getOrganizations(value)
              if (!organizations) {
                return 'Invalid API key'
              }
              return undefined
            },
          })) ?? ''
        if (!apiKey) {
          throw new Error('User did not want to provide an API key')
        }
        const organizations = await getOrganizations(apiKey)
        if (!organizations) {
          throw new Error('Invalid API key')
        }
        beginAuthContextSync()
        try {
          await secrets.store(API_TOKEN_SECRET_KEY, apiKey)
        } catch (error) {
          await requestSessionSync()
          throw error
        }
        await requestSessionSync()
        const session = liveSessions.get(apiKey)
        if (!session) {
          throw new Error('The API token changed while logging in')
        }
        pleaseLoginStatusBar.hide()
        return session
      },
      async removeSession(sessionId: string): Promise<void> {
        const session = Array.from(liveSessions.values()).find(
          candidate => candidate.id === sessionId,
        )
        if (!session) {
          return
        }
        beginAuthContextSync()
        try {
          await secrets.delete(API_TOKEN_SECRET_KEY)
        } catch (error) {
          await requestSessionSync()
          throw error
        }
        await requestSessionSync()
        try {
          pleaseLoginStatusBar.show()
        } catch {}
      },
    },
  )
  context.subscriptions.push(service)
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('socket-security.orgSlug')) {
        void requestSessionSync()
      }
    }),
  )
  vscode.commands.registerCommand(`${EXTENSION_PREFIX}.login`, async () => {
    // An explicit Login must always let the user re-enter a token, even when a
    // stale or cached session already exists. `createIfNone` only prompts when
    // NO session is present, so a leftover session made the command a silent
    // no-op and left the user with no way in at all (SURF-414).
    // `forceNewSession` always runs the token flow. The returned session is
    // unused; the catch swallows the rejection VSCode raises when the user
    // dismisses the prompt, which is a cancel and not a command failure.
    try {
      await vscode.authentication.getSession(EXTENSION_PREFIX, [], {
        forceNewSession: true,
      })
    } catch {}
  })
  try {
    await requestSessionSync()
  } catch {}
  let session
  try {
    session = await vscode.authentication.getSession(EXTENSION_PREFIX, [], {
      createIfNone: false,
    })
  } catch {}
  if (!session) {
    pleaseLoginStatusBar.show()
  }
  //#endregion
  return {}
}

export async function getAPIKey() {
  const start = getAuthContextState()
  if (!start.ready) {
    return undefined
  }
  const session = await vscode.authentication.getSession(EXTENSION_PREFIX, [], {
    createIfNone: false,
  })
  const end = getAuthContextState()
  return start.revision === end.revision && end.ready
    ? session?.accessToken
    : undefined
}

export async function getAuthenticatedContext(): Promise<
  AuthenticatedContext | undefined
> {
  const start = getAuthContextState()
  if (!start.ready) {
    return undefined
  }
  const session = await vscode.authentication.getSession(EXTENSION_PREFIX, [], {
    createIfNone: false,
  })
  if (!session) {
    return undefined
  }
  if (start.revision !== getAuthContextState().revision) {
    return undefined
  }
  const configuredSlug = vscode.workspace
    .getConfiguration()
    .get('socket-security.orgSlug')
  const organizations = await getOrganizations(session.accessToken)
  const currentSession = await vscode.authentication.getSession(
    EXTENSION_PREFIX,
    [],
    { createIfNone: false },
  )
  if (
    start.revision !== getAuthContextState().revision ||
    currentSession?.accessToken !== session.accessToken
  ) {
    return undefined
  }
  const selection = selectOrganization(
    configuredSlug,
    organizations?.organizations,
  )
  return selection.status === 'selected'
    ? { accessToken: session.accessToken, organization: selection.organization }
    : undefined
}

/**
 * Path of the settings file earlier versions kept the token in. Only ever read
 * for the one-time migration into SecretStorage. Returns undefined when the
 * platform gives no data directory to look in.
 */
export function getLegacySettingsPath(): string | undefined {
  let dataHome =
    process.platform === 'win32'
      ? process.env['LOCALAPPDATA']
      : process.env['XDG_DATA_HOME']
  if (!dataHome) {
    if (process.platform === 'win32') {
      return undefined
    }
    dataHome = path.join(
      os.homedir(),
      ...(process.platform === 'darwin'
        ? ['Library', 'Application Support']
        : ['.local', 'share']),
    )
  }
  return path.join(dataHome, 'socket', 'settings')
}

/**
 * Move a token out of the legacy settings file and into SecretStorage, then
 * take it out of the file. Runs on every activation and no-ops once the file is
 * gone, so an install that has already migrated pays one failed stat.
 *
 * Other Socket tools keep their own state next to this path — on some machines
 * a directory sits where this file would be — so nothing is written or removed
 * unless the path is a regular file this extension wrote, and sibling keys are
 * preserved.
 */
export async function migrateApiTokenToSecretStorage(
  secrets: vscode.SecretStorage,
): Promise<void> {
  const settingsPath = getLegacySettingsPath()
  if (!settingsPath) {
    return
  }
  const settingsUri = vscode.Uri.file(settingsPath)
  try {
    // Need FileType metadata for file vs. directory detection on remote.
    // oxlint-disable-next-line socket/prefer-exists-sync -- metadata
    const stat = await vscode.workspace.fs.stat(settingsUri)
    if (!(stat.type & vscode.FileType.File)) {
      return
    }
  } catch {
    return
  }
  const settings = await readLegacySettings(settingsPath)
  if (!Object.hasOwn(settings, 'apiKey')) {
    return
  }
  const { apiKey } = settings
  if (
    typeof apiKey === 'string' &&
    apiKey.length > 0 &&
    // A token already in SecretStorage is the newer one; the file is stale.
    !(await secrets.get(API_TOKEN_SECRET_KEY))
  ) {
    await secrets.store(API_TOKEN_SECRET_KEY, apiKey)
  }
  delete settings['apiKey']
  try {
    if (Object.keys(settings).length > 0) {
      await vscode.workspace.fs.writeFile(
        settingsUri,
        new TextEncoder().encode(
          Buffer.from(JSON.stringify(settings)).toString('base64'),
        ),
      )
    } else {
      await vscode.workspace.fs.delete(settingsUri)
    }
  } catch {
    // Leaving the file in place costs a repeated migration attempt, which is
    // harmless; failing activation over it is not.
  }
}

export async function readLegacySettings(
  settingsPath: string,
): Promise<SettingsFile> {
  try {
    const existingContent = await vscode.workspace.fs.readFile(
      vscode.Uri.file(settingsPath),
    )
    const decoded = Buffer.from(
      new TextDecoder().decode(existingContent),
      'base64',
    ).toString('utf8')
    const parsed = JSON.parse(decoded)
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
    ) {
      return parsed
    }
  } catch {
    // File doesn't exist or is invalid
  }
  return {}
}

export function sessionFromAPIKey(
  apiKey: string,
  org: OrgInfo,
  previousSession?: vscode.AuthenticationSession | undefined,
) {
  const account = {
    id: org.id,
    label: org.plan ? `${org.name} (${org.plan})` : org.name,
  }
  if (
    previousSession?.account.id === account.id &&
    previousSession.account.label === account.label
  ) {
    return previousSession
  }
  // The id is a bare UUID: `session.id` and `account.id` are readable by far
  // more of the editor than `accessToken` is, so neither may carry the token.
  return {
    __proto__: null,
    accessToken: apiKey,
    id: previousSession?.id ?? `${crypto.randomUUID()}.session`,
    account,
    scopes: [],
  }
}
