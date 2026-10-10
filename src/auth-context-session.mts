import crypto from 'node:crypto'
import type * as vscode from 'vscode'

import { getOrganizations } from './api.mts'
import type { OrgInfo } from './api.mts'
import type { AuthContextIdentity } from './auth-context-state.mts'
import { selectOrganization } from './organization-selection.mts'

export type SessionContextResult = {
  identity: AuthContextIdentity
  session: vscode.AuthenticationSession | undefined
}

export async function resolveSessionContext(
  apiKey: string,
  configuredSlug: unknown,
  previousSession: vscode.AuthenticationSession | undefined,
): Promise<SessionContextResult> {
  const identity: AuthContextIdentity = {
    credential: apiKey,
    configuredSlug:
      typeof configuredSlug === 'string' ? configuredSlug : undefined,
    status: 'lookup-failed',
    organizationId: undefined,
    organizationSlug: undefined,
  }
  try {
    const organizations = await getOrganizations(apiKey)
    if (!organizations) {
      return {
        identity: { ...identity, status: 'invalid-token' },
        session: undefined,
      }
    }
    const selection = selectOrganization(
      configuredSlug,
      organizations.organizations,
    )
    const organization =
      selection.status === 'selected'
        ? selection.organization
        : {
            id: 'socket-token',
            slug: '',
            name: 'Socket API token',
            image: undefined,
            plan: '',
          }
    return {
      identity: {
        ...identity,
        status: selection.status,
        ...(selection.status === 'selected'
          ? {
              organizationId: selection.organization.id,
              organizationSlug: selection.organization.slug,
            }
          : {}),
      },
      session: sessionFromAPIKey(apiKey, organization, previousSession),
    }
  } catch {
    return { identity, session: previousSession }
  }
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
  return {
    __proto__: null,
    accessToken: apiKey,
    id: previousSession?.id ?? `${crypto.randomUUID()}.session`,
    account,
    scopes: [],
  }
}
