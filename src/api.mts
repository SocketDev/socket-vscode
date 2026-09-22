import type { Readable } from 'node:stream'

import { ResponseError, SocketSdk } from '@socketsecurity/sdk'
import type { SocketSdkErrorResult } from '@socketsecurity/sdk'
import { isObject } from '@socketsecurity/lib/objects/predicates'
import { httpRequest } from '@socketsecurity/lib/http-request'
import type { HttpResponse } from '@socketsecurity/lib/http-request'

import type { SimPURL } from './ui/externals/parse-externals.mts'

export type OrgInfo = {
  id: string
  name: string
  image: string | undefined
  // The Socket API returns an open-ended plan string (opensource, team,
  // enterprise, …); keep it wide rather than narrowing to a fixed union.
  plan: string
}

export type OrganizationsRecord = {
  organizations: Map<string, OrgInfo>
}

export type PackageRequestOptions = {
  signal?: AbortSignal | undefined
  timeout?: number | undefined
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

export function createPackageRequestError(
  result: SocketSdkErrorResult<'batchPackageFetch'>,
) {
  const status =
    Number.isInteger(result.status) &&
    result.status >= 100 &&
    result.status <= 599
      ? result.status
      : 0
  const message = status
    ? `Socket API package lookup failed: received HTTP ${status}; expected HTTP 200. Check API access and retry.`
    : 'Socket API package lookup failed before an HTTP response. Check your network connection and retry.'
  return Object.assign(new Error(message), {
    code: 'SOCKET_API_REQUEST_FAILED',
    status,
  })
}

export function createPackageResponseError() {
  return Object.assign(
    new Error(
      'Socket API package lookup returned invalid display data. Retry the lookup.',
    ),
    { code: 'SOCKET_API_INVALID_PACKAGE_DATA' },
  )
}

export function createSocketSdk(
  apiKey: string,
  options?: PackageRequestOptions | undefined,
): SocketSdk {
  const { signal, timeout } = {
    __proto__: null,
    ...options,
  } as PackageRequestOptions
  return new SocketSdk(apiKey, {
    signal,
    timeout: timeout === undefined ? undefined : Math.min(timeout, 300_000),
  })
}

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
    const organizations: Map<string, OrgInfo> = new Map()
    const orgList = Object.values(res.data.organizations)
    for (let i = 0, { length } = orgList; i < length; i += 1) {
      const org = orgList[i]!
      organizations.set(org.id, {
        id: org.id,
        name: org.name ?? '',
        image: org.image ?? undefined,
        plan: org.plan,
      })
    }
    return { organizations }
  } catch {
    return undefined
  }
}

export function isPackageAlertPropsRenderable(props: unknown): boolean {
  if (props === undefined || props === null) {
    return true
  }
  return (
    isObject(props) &&
    (props['alternatePackage'] === undefined ||
      typeof props['alternatePackage'] === 'string') &&
    (props['note'] === undefined || typeof props['note'] === 'string') &&
    (props['lastPublish'] === undefined ||
      typeof props['lastPublish'] === 'string' ||
      (typeof props['lastPublish'] === 'number' &&
        Number.isFinite(props['lastPublish'])))
  )
}

export function isPackageAlertRenderable(data: unknown): boolean {
  if (!isObject(data) || typeof data['type'] !== 'string') {
    return false
  }
  const { action, props, severity } = data
  return (
    typeof action === 'string' &&
    ['error', 'warn', 'monitor', 'ignore'].includes(action) &&
    (severity === undefined ||
      (typeof severity === 'string' &&
        ['critical', 'high', 'medium', 'low'].includes(severity))) &&
    isPackageAlertPropsRenderable(props)
  )
}

export function isPackageDisplayDataRenderable(data: unknown): boolean {
  return (
    isObject(data) &&
    typeof data['name'] === 'string' &&
    typeof data['type'] === 'string' &&
    (data['namespace'] === undefined ||
      typeof data['namespace'] === 'string') &&
    (data['version'] === undefined || typeof data['version'] === 'string') &&
    Array.isArray(data['alerts']) &&
    data['alerts'].every(isPackageAlertRenderable)
  )
}

export async function readPublicPackageResponse(
  response: Pick<HttpResponse, 'headers' | 'status'> & {
    rawResponse?: Readable | undefined
  },
  maxBytes = 16 * 1024 * 1024,
): Promise<string> {
  const { rawResponse } = response
  try {
    if (response.status !== 200) {
      throw createPackageRequestError({
        error: '',
        status: response.status,
        success: false,
      })
    }
    const encoding = response.headers['content-encoding']
    if (!rawResponse || (encoding !== undefined && encoding !== 'identity')) {
      throw createPackageRequestError({ error: '', status: 0, success: false })
    }
    const chunks: Buffer[] = []
    let totalBytes = 0
    for await (const chunk of rawResponse) {
      if (!Buffer.isBuffer(chunk)) {
        throw createPackageRequestError({
          error: '',
          status: 0,
          success: false,
        })
      }
      totalBytes += chunk.byteLength
      if (totalBytes > maxBytes) {
        throw createPackageRequestError({
          error: '',
          status: 0,
          success: false,
        })
      }
      chunks.push(chunk)
    }
    return Buffer.concat(chunks, totalBytes).toString('utf8')
  } finally {
    rawResponse?.destroy()
  }
}

export function sanitizePackageRequestError(error: unknown) {
  if (isObject(error) && error['code'] === 'SOCKET_API_INVALID_PACKAGE_DATA') {
    return createPackageResponseError()
  }
  const reason =
    error instanceof Error && error.cause instanceof Error ? error.cause : error
  const status =
    reason instanceof ResponseError
      ? reason.response.status
      : isObject(reason) && typeof reason['status'] === 'number'
        ? reason['status']
        : 0
  return createPackageRequestError({ error: '', status, success: false })
}

export async function* streamAuthenticatedPackageData(
  apiKey: string,
  purls: SimPURL[],
  options?: PackageRequestOptions | undefined,
): AsyncGenerator {
  const sdk = createSocketSdk(apiKey, options)
  const batchSize = 1024
  for (let index = 0, { length } = purls; index < length; index += batchSize) {
    const components = purls
      .slice(index, index + batchSize)
      .map(purl => ({ __proto__: null, purl }))
    const result = await sdk.batchPackageFetch(
      { components },
      { alerts: true, compact: false },
    )
    if (!result.success) {
      throw createPackageRequestError(result)
    }
    yield* result.data
  }
}

export async function* streamPackageScores(
  apiKey: string | undefined,
  purls: SimPURL[],
  options?: PackageRequestOptions | undefined,
): AsyncGenerator<PackageScoreAndAlerts> {
  try {
    const stream = apiKey
      ? streamAuthenticatedPackageData(apiKey, purls, options)
      : streamPublicPackageData(purls, options)
    for await (const data of stream) {
      if (
        isObject(data) &&
        typeof data['inputPurl'] === 'string' &&
        isObject(data['score']) &&
        typeof data['score']['overall'] === 'number' &&
        Number.isFinite(data['score']['overall'])
      ) {
        if (!isPackageDisplayDataRenderable(data)) {
          throw createPackageResponseError()
        }
        yield data as unknown as PackageScoreAndAlerts
      }
    }
  } catch (error) {
    throw sanitizePackageRequestError(error)
  }
}

export async function* streamPublicPackageData(
  purls: SimPURL[],
  options?: PackageRequestOptions | undefined,
): AsyncGenerator {
  const { signal, timeout } = {
    __proto__: null,
    ...options,
  } as PackageRequestOptions
  const batchSize = 100
  for (let index = 0, { length } = purls; index < length; index += batchSize) {
    const components = purls
      .slice(index, index + batchSize)
      .map(purl => ({ __proto__: null, purl }))
    const response = await httpRequest(
      'https://purl-api.socket.dev/batch?alerts=true&compact=false&purlErrors=false',
      {
        body: JSON.stringify({ components }),
        followRedirects: false,
        headers: {
          'Accept-Encoding': 'identity',
          'Content-Type': 'application/json',
          'User-Agent': 'socket-vscode',
        },
        method: 'POST',
        retries: 0,
        signal,
        stream: true,
        timeout,
      },
    )
    const lines = (await readPublicPackageResponse(response)).split(/\r?\n/)
    for (
      let lineIndex = 0, { length: lineCount } = lines;
      lineIndex < lineCount;
      lineIndex += 1
    ) {
      const line = lines[lineIndex]!.trim()
      if (!line) {
        continue
      }
      const data: unknown = JSON.parse(line)
      yield data
    }
  }
}
