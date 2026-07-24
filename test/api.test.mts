/**
 * @file Unit tests for the Socket API layer (src/api.ts), which wraps
 *   `@socketsecurity/sdk`. Every request is exercised against a nock-mocked
 *   api.socket.dev — no real network (the fleet setup fails net-connect
 *   closed), and no owned-infrastructure mocking. We assert both the request
 *   the SDK sends (path, query, body) and how api.ts reshapes the response.
 */

import nock from 'nock'
import { afterEach, describe, expect, test } from 'vitest'

import { getOrganizations, streamPackageScores } from '../src/api'
import type { PackageScoreAndAlerts } from '../src/api'
import type { SimPURL } from '../src/ui/externals/parse-externals'

const API_ORIGIN = 'https://api.socket.dev'
const TOKEN = 'sktsec_test_token'

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

afterEach(() => {
  nock.cleanAll()
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
      organizations: {
        'org-1': {
          id: 'org-1',
          name: 'Acme',
          image: 'https://img/acme.png',
          plan: 'enterprise',
        },
      },
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

    expect(result?.organizations['org-2']).toEqual({
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
      value: { notFound: 0, resolved: 1, malformed: 0 },
    })
    nock(API_ORIGIN)
      .post('/v0/purl')
      .query({ alerts: 'true', compact: 'false' })
      .reply(200, `${artifactLine(purl, 77)}\n${summaryLine}\n`)

    const seen: PackageScoreAndAlerts[] = []
    for await (const item of streamPackageScores(TOKEN, [purl])) {
      seen.push(item)
    }

    expect(seen).toHaveLength(1)
    expect(seen[0]?.inputPurl).toBe(purl)
  })
})
