/**
 * @file Unit tests for the Socket API layer (src/api.mts), which wraps
 *   `@socketsecurity/sdk`. Every request is exercised against a nock-mocked
 *   api.socket.dev — no real network (the fleet setup fails net-connect
 *   closed), and no owned-infrastructure mocking. We assert both the request
 *   the SDK sends (path, query, body) and how api.ts reshapes the response.
 */

import nock from 'nock'
import { ResponseError, SocketSdk } from '@socketsecurity/sdk'
import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  createPackageRequestError,
  getOrganizations,
  streamPackageScores,
} from '../../../src/api.mts'
import type { PackageScoreAndAlerts } from '../../../src/api.mts'
import type { SimPURL } from '../../../src/ui/externals/parse-externals.mts'

const API_ORIGIN = 'https://api.socket.dev'
const TOKEN = 'sktsec_test_token'
const nullPayloadValue: unknown = JSON.parse('null')

// Build a full artifact line as the /v0/purl NDJSON stream emits it.
function artifactLine(purl: SimPURL, overall: number): string {
  const artifact: PackageScoreAndAlerts = {
    alerts: [],
    inputPurl: purl,
    score: {
      license: 1,
      maintenance: 1,
      overall,
      quality: 1,
      supplyChain: 1,
      vulnerability: 1,
    },
    type: 'npm',
    name: purl.split('/').pop()!,
  }
  return JSON.stringify(artifact)
}

async function collectPackageScores(
  stream: AsyncIterable<PackageScoreAndAlerts>,
) {
  const artifacts: PackageScoreAndAlerts[] = []
  for await (const artifact of stream) {
    artifacts.push(artifact)
  }
  return artifacts
}

afterEach(() => {
  nock.cleanAll()
  vi.restoreAllMocks()
})

describe('api getOrganizations', () => {
  test('returns organizations keyed by id on success', async () => {
    const scope = nock(API_ORIGIN)
      .get('/v0/organizations')
      .reply(200, {
        organizations: {
          'org-1': {
            id: 'org-1',
            name: 'Acme',
            image: 'https://img/acme.png',
            plan: 'enterprise',
            slug: 'acme',
          },
        },
      })

    const result = await getOrganizations(TOKEN)

    expect(result).toEqual({
      organizations: new Map([
        [
          'org-1',
          {
            id: 'org-1',
            name: 'Acme',
            image: 'https://img/acme.png',
            plan: 'enterprise',
          },
        ],
      ]),
    })
    expect(scope.isDone()).toBe(true)
  })

  test('normalizes null name/image and keeps an open-ended plan string', async () => {
    // Reply with a raw JSON string so the wire-level `null`s (which the real
    // endpoint sends for name/image) stay in the fixture, not in TS source.
    nock(API_ORIGIN)
      .get('/v0/organizations')
      .reply(
        200,
        '{"organizations":{"org-2":{"id":"org-2","name":null,"image":null,"plan":"some-future-plan","slug":"nully"}}}',
      )

    const result = await getOrganizations(TOKEN)

    expect(result?.organizations.get('org-2')).toEqual({
      id: 'org-2',
      name: '',
      image: undefined,
      plan: 'some-future-plan',
    })
  })

  test('returns undefined on an auth failure', async () => {
    nock(API_ORIGIN)
      .get('/v0/organizations')
      .reply(401, { error: { message: 'Unauthorized' } })

    expect(await getOrganizations(TOKEN)).toBeUndefined()
  })

  test('returns undefined for an empty token without hitting the network', async () => {
    // SocketSdk throws on an empty token; getOrganizations swallows it. No nock
    // interceptor is registered, so a request would fail net-connect closed.
    expect(await getOrganizations('')).toBeUndefined()
  })
})

describe('api streamPackageScores', () => {
  test('accepts the cache timeout within the SDK transport limit', async () => {
    const purl = 'pkg:npm/example-cache-timeout' as SimPURL
    const scope = nock(API_ORIGIN)
      .post('/v0/purl')
      .query({ alerts: 'true', compact: 'false' })
      .reply(200, `${artifactLine(purl, 0.5)}\n`)

    const seen = await collectPackageScores(
      streamPackageScores(TOKEN, [purl], { timeout: 10 * 60 * 1000 }),
    )

    expect(seen).toHaveLength(1)
    expect(scope.isDone()).toBe(true)
  })

  test('sanitizes a thrown SDK server failure and its nested response', async () => {
    const response = {
      status: 503,
      statusText: TOKEN,
      headers: { authorization: TOKEN },
      body: Buffer.from(TOKEN),
      ok: false,
      arrayBuffer: () => new ArrayBuffer(0),
      json: () => {
        throw new Error('Fixture response body must not be read')
      },
      text: () => TOKEN,
    }
    vi.spyOn(SocketSdk.prototype, 'batchPackageFetch').mockRejectedValueOnce(
      new Error(TOKEN, {
        cause: new ResponseError(
          response,
          TOKEN,
          `${API_ORIGIN}/?token=${TOKEN}`,
        ),
      }),
    )

    const result = collectPackageScores(
      streamPackageScores(TOKEN, ['pkg:npm/example-server-failure']),
    )

    await expect(result).rejects.toMatchObject({
      code: 'SOCKET_API_REQUEST_FAILED',
      status: 503,
    })
    await expect(result).rejects.toSatisfy(
      (error: Error) =>
        !error.message.includes(TOKEN) && error.cause === undefined,
    )
  })

  test('sanitizes a thrown SDK transport failure', async () => {
    vi.spyOn(SocketSdk.prototype, 'batchPackageFetch').mockRejectedValueOnce(
      new Error(TOKEN, {
        cause: Object.assign(new Error(TOKEN), { code: 'ECONNRESET' }),
      }),
    )

    const result = collectPackageScores(
      streamPackageScores(TOKEN, ['pkg:npm/example-transport-failure']),
    )

    await expect(result).rejects.toMatchObject({
      code: 'SOCKET_API_REQUEST_FAILED',
      status: 0,
    })
    await expect(result).rejects.toSatisfy(
      (error: Error) =>
        !error.message.includes(TOKEN) && error.cause === undefined,
    )
  })

  test('rejects malformed display fields without removing individual alerts', async () => {
    const purl = 'pkg:npm/example-malformed-display' as SimPURL
    const valid = JSON.parse(artifactLine(purl, 0.5))
    const alert = { action: 'warn', type: 'malware', severity: 'high' }
    const malformed = [
      { alerts: nullPayloadValue },
      { alerts: {} },
      { alerts: [nullPayloadValue] },
      { alerts: [{ ...alert, action: {} }] },
      { alerts: [{ ...alert, type: nullPayloadValue }] },
      { alerts: [{ ...alert, severity: {} }] },
      { alerts: [{ ...alert, props: { note: {} } }] },
      { alerts: [{ ...alert, props: { alternatePackage: 42 } }] },
      { alerts: [{ ...alert, props: { lastPublish: {} } }] },
      { namespace: {} },
      { version: 42 },
    ]
    for (let index = 0, { length } = malformed; index < length; index += 1) {
      const scope = nock(API_ORIGIN)
        .post('/v0/purl')
        .query({ alerts: 'true', compact: 'false' })
        .reply(
          200,
          `${JSON.stringify({ ...valid, ...malformed[index] })}\n${artifactLine(purl, 0.9)}\n`,
        )

      const result = collectPackageScores(streamPackageScores(TOKEN, [purl]))

      await expect(result).rejects.toMatchObject({
        code: 'SOCKET_API_INVALID_PACKAGE_DATA',
      })
      expect(scope.isDone()).toBe(true)
    }
  })

  test.each([{ name: 42 }, { type: nullPayloadValue }])(
    'rejects malformed SDK artifact identity %j before accepting a clean sibling',
    async identity => {
      const purl = 'pkg:npm/example-invalid-identity' as SimPURL
      const invalid = { ...JSON.parse(artifactLine(purl, 0.1)), ...identity }
      const scope = nock(API_ORIGIN)
        .post('/v0/purl')
        .query({ alerts: 'true', compact: 'false' })
        .reply(200, `${JSON.stringify(invalid)}\n${artifactLine(purl, 0.9)}\n`)

      const result = collectPackageScores(streamPackageScores(TOKEN, [purl]))

      await expect(result).rejects.toMatchObject({
        code: 'SOCKET_API_REQUEST_FAILED',
        status: 0,
      })
      await expect(result).rejects.toSatisfy(
        (error: Error) =>
          !error.message.includes(purl) && error.cause === undefined,
      )
      expect(scope.isDone()).toBe(true)
    },
  )

  test('retains valid alerts with optional display properties', async () => {
    const purl = 'pkg:npm/example-valid-alerts' as SimPURL
    const alert = { action: 'warn', type: 'malware', severity: 'high' }
    const artifact = {
      ...JSON.parse(artifactLine(purl, 0.5)),
      alerts: [
        alert,
        { ...alert, props: nullPayloadValue },
        {
          ...alert,
          props: {
            alternatePackage: 'example-safe',
            note: 'Fixture note',
            lastPublish: '2026-01-01',
          },
        },
      ],
    }
    const scope = nock(API_ORIGIN)
      .post('/v0/purl')
      .query({ alerts: 'true', compact: 'false' })
      .reply(200, `${JSON.stringify(artifact)}\n`)

    expect(
      await collectPackageScores(streamPackageScores(TOKEN, [purl])),
    ).toEqual([artifact])
    expect(scope.isDone()).toBe(true)
  })

  test.each([0, Number.NaN, 999])(
    'sanitizes transport failure status %s',
    status => {
      const error = createPackageRequestError({
        success: false,
        status,
        error: TOKEN,
        cause: `Authorization: Bearer ${TOKEN}`,
        url: `${API_ORIGIN}/v0/purl?token=${TOKEN}`,
      })

      expect(error).toMatchObject({
        code: 'SOCKET_API_REQUEST_FAILED',
        status: 0,
      })
      expect(error.message.includes(TOKEN)).toBe(false)
      expect(error.cause).toBeUndefined()
    },
  )

  test.each([401, 403])(
    'rejects an SDK HTTP %i failure without response details',
    async status => {
      const purl = 'pkg:npm/example-denied@1.0.0' as SimPURL
      const scope = nock(API_ORIGIN)
        .post('/v0/purl')
        .query({ alerts: 'true', compact: 'false' })
        .reply(status, { error: { message: `Authorization: Bearer ${TOKEN}` } })

      const result = collectPackageScores(streamPackageScores(TOKEN, [purl]))
      await expect(result).rejects.toMatchObject({
        code: 'SOCKET_API_REQUEST_FAILED',
        status,
      })
      await expect(result).rejects.toSatisfy(
        (error: Error) => !error.message.includes(TOKEN),
      )
      expect(scope.isDone()).toBe(true)
    },
  )

  test.each(['pendingScan', 'notFound'])(
    'skips scoreless %s artifacts',
    async type => {
      const purl = 'pkg:npm/example-unresolved@1.0.0' as SimPURL
      const unresolvedLine = JSON.stringify({
        id: `synthetic:${type}:example-unresolved`,
        inputPurl: purl,
        name: 'example-unresolved',
        type: 'npm',
        alerts: [{ action: 'warn', type, severity: 'medium' }],
      })
      const scope = nock(API_ORIGIN)
        .post('/v0/purl')
        .query({ alerts: 'true', compact: 'false' })
        .reply(
          200,
          `${unresolvedLine}\n${artifactLine(purl, 0.4)}\n${artifactLine(purl, 0.9)}\n`,
        )

      const seen = await collectPackageScores(
        streamPackageScores(TOKEN, [purl]),
      )

      expect(seen.map(artifact => artifact.score.overall)).toEqual([0.4, 0.9])
      expect(seen).toHaveLength(2)
      expect(scope.isDone()).toBe(true)
    },
  )

  test('skips missing, nonnumeric, and nonfinite overall scores', async () => {
    const purl = 'pkg:npm/example-invalid-score@1.0.0' as SimPURL
    const lines = [
      'null',
      '{}',
      '{"overall":null}',
      '{"overall":"0.9"}',
      '{"overall":1e400}',
    ]
      .map(
        score =>
          `{"inputPurl":"${purl}","name":"example-invalid-score","type":"npm","alerts":[],"score":${score}}`,
      )
      .join('\n')
    const scope = nock(API_ORIGIN)
      .post('/v0/purl')
      .query({ alerts: 'true', compact: 'false' })
      .reply(200, `${lines}\n${artifactLine(purl, 0)}\n`)

    const seen = await collectPackageScores(streamPackageScores(TOKEN, [purl]))

    expect(seen).toHaveLength(1)
    expect(seen[0]?.score.overall).toBe(0)
    expect(scope.isDone()).toBe(true)
  })

  test('yields one score+alerts object per artifact line', async () => {
    const purlA = 'pkg:npm/left-pad@1.0.0' as SimPURL
    const purlB = 'pkg:npm/right-pad@2.0.0' as SimPURL
    nock(API_ORIGIN)
      .post('/v0/purl')
      .query({ alerts: 'true', compact: 'false' })
      .reply(200, `${artifactLine(purlA, 42)}\n${artifactLine(purlB, 99)}\n`)

    const seen: PackageScoreAndAlerts[] = []
    for await (const item of streamPackageScores(TOKEN, [purlA, purlB])) {
      seen.push(item)
    }

    expect(seen.map(s => s.inputPurl)).toEqual([purlA, purlB])
    expect(seen.map(s => s.score.overall)).toEqual([42, 99])
  })

  test('requests /v0/purl with the pending purls in the body', async () => {
    const purl = 'pkg:npm/express@4.0.0' as SimPURL
    let sentBody: unknown
    nock(API_ORIGIN)
      .post('/v0/purl', body => {
        sentBody = body
        return true
      })
      .query({ alerts: 'true', compact: 'false' })
      .reply(200, `${artifactLine(purl, 10)}\n`)

    const seen: PackageScoreAndAlerts[] = []
    for await (const item of streamPackageScores(TOKEN, [purl])) {
      seen.push(item)
    }

    expect(seen).toHaveLength(1)
    expect(sentBody).toEqual({ components: [{ purl }] })
  })

  test('skips non-artifact lines (summary / purlError) that lack inputPurl', async () => {
    const purl = 'pkg:npm/lodash@4.17.21' as SimPURL
    const summaryLine = JSON.stringify({
      _type: 'summary',
      value: {
        purl_input: 1,
        resolved: 1,
        errors: {
          package_not_found: 0,
          purl_ecosystem_not_enabled: 0,
          purl_malformed: 0,
        },
      },
    })
    const errorLine = JSON.stringify({
      _type: 'purlError',
      value: { error: 'Package not found', inputPurl: purl },
    })
    nock(API_ORIGIN)
      .post('/v0/purl')
      .query({ alerts: 'true', compact: 'false' })
      .reply(200, `${artifactLine(purl, 77)}\n${summaryLine}\n${errorLine}\n`)

    const seen: PackageScoreAndAlerts[] = []
    for await (const item of streamPackageScores(TOKEN, [purl])) {
      seen.push(item)
    }

    expect(seen).toHaveLength(1)
    expect(seen[0]?.inputPurl).toBe(purl)
  })
})
