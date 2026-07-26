import { SocketSdk } from '@socketsecurity/sdk'

import type { SimPURL } from './ui/externals/parse-externals'

/////////
// DESIGN NOTES
/////////
//
// This is the extension's Socket API layer. Every call to api.socket.dev goes
// through `@socketsecurity/sdk` (the SocketSdk class) so auth headers, base
// URL, retries and timeouts are handled in one place instead of hand-rolled
// `node:https` / `httpRequest` calls scattered across the codebase.
//
// We pass apiKeys rather than shared state to avoid certain races, so if a
// workflow starts with 1 API key it is inconvenient to grab an implicitly
// new api key in the middle of the workflow.
//

export type OrgInfo = {
  id: string
  name: string
  image: string | undefined
  // The Socket API returns an open-ended plan string (opensource, team,
  // enterprise, …); keep it wide rather than narrowing to a fixed union.
  plan: string
}

export type OrganizationsRecord = {
  organizations: Record<string, OrgInfo>
}

export type PackageScoreAndAlerts = {
  alerts: Array<{
    action: 'error' | 'warn' | 'monitor' | 'ignore'
    type: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    props: {
      alternatePackage?: string | undefined
      lastPublish?: string | number | undefined
      note?: string | undefined
      [key: string]: unknown
    }
  }>
  inputPurl: SimPURL
  score: {
    license: number
    maintenance: number
    overall: number
    quality: number
    supplyChain: number
    vulnerability: number
  }
  type: string
  namespace?: string | undefined
  name: string
  version?: string | undefined
  qualifiers?: string | undefined
  subpath?: string | undefined
}

export function createSocketSdk(
  apiKey: string,
  options?: { timeout?: number | undefined } | undefined,
): SocketSdk {
  const { timeout } = { __proto__: null, ...options } as {
    timeout?: number | undefined
  }
  return new SocketSdk(apiKey, { timeout })
}

// Fetches the organizations available to the given API key. Returns `undefined`
// when the key is invalid or the request fails so callers can treat that as a
// logged-out state (mirrors the previous non-200 => undefined behavior).
export async function getOrganizations(
  apiKey: string,
): Promise<OrganizationsRecord | undefined> {
  try {
    const res = await createSocketSdk(apiKey).listOrganizations()
    if (!res.success) {
      return undefined
    }
    // The /v0/organizations endpoint returns `organizations` as a MAP keyed by
    // id (see the OpenAPI schema), even though the SDK's strict result type
    // declares it an array. `Object.values` reads correctly under both shapes.
    const organizations: Record<string, OrgInfo> = {}
    const orgList = Object.values(res.data.organizations)
    for (let i = 0, { length } = orgList; i < length; i += 1) {
      const org = orgList[i]!
      organizations[org.id] = {
        id: org.id,
        name: org.name ?? '',
        image: org.image ?? undefined,
        plan: org.plan,
      }
    }
    return { organizations }
  } catch {
    // Invalid token (SocketSdk throws on empty/oversized) or network failure.
    return undefined
  }
}

// Streams Socket score + alert data for the given PURLs via the batch PURL
// endpoint. Each yielded item is one package's score and alerts, delivered as
// the underlying API results arrive. Errors are surfaced to the caller so it
// can bail the pending cache entries.
export async function* streamPackageScores(
  apiKey: string,
  purls: SimPURL[],
  options?: { timeout?: number | undefined } | undefined,
): AsyncGenerator<PackageScoreAndAlerts> {
  const sdk = createSocketSdk(apiKey, options)
  const stream = sdk.batchPackageStream(
    { components: purls.map(purl => ({ purl })) },
    { queryParams: { alerts: 'true', compact: 'false' } },
  )
  for await (const result of stream) {
    // The stream also yields purlError / summary lines (no inputPurl) and, on
    // request failure, error results. Keep only full artifact lines, matching
    // the previous hand-rolled `JSON.parse(line) as PackageScoreAndAlerts`
    // narrowing at this boundary.
    if (
      result.success &&
      result.data &&
      typeof result.data === 'object' &&
      'inputPurl' in result.data
    ) {
      yield result.data as unknown as PackageScoreAndAlerts
    }
  }
}
