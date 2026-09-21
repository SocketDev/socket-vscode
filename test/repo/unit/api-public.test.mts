import { PassThrough } from 'node:stream'
import { brotliCompressSync, gzipSync } from 'node:zlib'

import nock from 'nock'
import { afterEach, describe, expect, test } from 'vitest'

import {
  readPublicPackageResponse,
  streamPackageScores,
} from '../../../src/api.mts'
import type { PackageScoreAndAlerts } from '../../../src/api.mts'
import type { SimPURL } from '../../../src/ui/externals/parse-externals.mts'

const proxyOrigin = 'https://purl-api.socket.dev'
const proxyQuery = { alerts: 'true', compact: 'false', purlErrors: 'false' }

function publicArtifact(purl: SimPURL, overall = 0.5) {
  return {
    alerts: [],
    inputPurl: purl,
    name: 'example-public',
    score: { overall },
    type: 'npm',
  }
}

async function publicScores(purls: SimPURL[]) {
  const artifacts: PackageScoreAndAlerts[] = []
  for await (const artifact of streamPackageScores(undefined, purls)) {
    artifacts.push(artifact)
  }
  return artifacts
}

afterEach(() => nock.cleanAll())

describe('anonymous package lookup', () => {
  test('uses the public proxy without credentials and preserves scored artifacts', async () => {
    const purl = 'pkg:npm/example-public' as SimPURL
    const artifacts = [publicArtifact(purl, 0.1), publicArtifact(purl, 0.9)]
    const scope = nock(proxyOrigin)
      .matchHeader('accept-encoding', 'identity')
      .matchHeader('authorization', value => value === undefined)
      .matchHeader(
        'user-agent',
        value => typeof value === 'string' && value.includes('socket-vscode'),
      )
      .post('/batch', { components: [{ purl }] })
      .query(proxyQuery)
      .reply(
        200,
        [
          ...artifacts,
          { inputPurl: purl, name: 'example-pending', type: 'npm', alerts: [] },
          { _type: 'summary', value: {} },
          {
            _type: 'purlError',
            value: { inputPurl: purl, error: 'Fixture unresolved' },
          },
        ]
          .map(artifact => JSON.stringify(artifact))
          .join('\n'),
      )

    expect(await publicScores([purl])).toEqual(artifacts)
    expect(scope.isDone()).toBe(true)
  })

  test('splits public requests into bounded batches', async () => {
    const purls: SimPURL[] = []
    for (let index = 0; index < 101; index += 1) {
      purls.push(`pkg:npm/example-public-${index}`)
    }
    const first = nock(proxyOrigin)
      .post('/batch', {
        components: purls.slice(0, 100).map(purl => ({ purl })),
      })
      .query(proxyQuery)
      .reply(
        200,
        purls
          .slice(0, 100)
          .map(purl => JSON.stringify(publicArtifact(purl)))
          .join('\n'),
      )
    const second = nock(proxyOrigin)
      .post('/batch', { components: [{ purl: purls[100] }] })
      .query(proxyQuery)
      .reply(200, JSON.stringify(publicArtifact(purls[100]!)))

    expect(await publicScores(purls)).toHaveLength(101)
    expect(first.isDone()).toBe(true)
    expect(second.isDone()).toBe(true)
  })

  test.each(['gzip', 'br'])(
    'rejects unexpected %s response encoding',
    async encoding => {
      const purl = 'pkg:npm/example-compressed-public' as SimPURL
      const body = Buffer.from(JSON.stringify(publicArtifact(purl)))
      const compressed =
        encoding === 'gzip' ? gzipSync(body) : brotliCompressSync(body)
      const scope = nock(proxyOrigin)
        .post('/batch')
        .query(proxyQuery)
        .reply(200, compressed, { 'content-encoding': encoding })

      await expect(publicScores([purl])).rejects.toMatchObject({
        code: 'SOCKET_API_REQUEST_FAILED',
        status: 0,
      })
      expect(scope.isDone()).toBe(true)
    },
  )

  test.each([302, 400, 503])(
    'sanitizes proxy HTTP %i failures without following redirects',
    async status => {
      const scope = nock(proxyOrigin)
        .post('/batch')
        .query(proxyQuery)
        .reply(status, 'test-placeholder-sensitive-response', {
          location: 'https://example.invalid/redirect-target',
        })

      const result = publicScores(['pkg:npm/example-proxy-failure'])

      await expect(result).rejects.toMatchObject({
        code: 'SOCKET_API_REQUEST_FAILED',
        status,
      })
      await expect(result).rejects.toSatisfy(
        (error: Error) =>
          !error.message.includes('test-placeholder-sensitive-response') &&
          error.cause === undefined,
      )
      expect(scope.isDone()).toBe(true)
    },
  )

  test('rejects malformed proxy artifacts through the shared validator', async () => {
    const purl = 'pkg:npm/example-invalid-public' as SimPURL
    const scope = nock(proxyOrigin)
      .post('/batch')
      .query(proxyQuery)
      .reply(200, JSON.stringify({ ...publicArtifact(purl), alerts: {} }))

    await expect(publicScores([purl])).rejects.toMatchObject({
      code: 'SOCKET_API_INVALID_PACKAGE_DATA',
    })
    expect(scope.isDone()).toBe(true)
  })

  test('sanitizes malformed NDJSON without exposing response text', async () => {
    const scope = nock(proxyOrigin)
      .post('/batch')
      .query(proxyQuery)
      .reply(200, '{"test-placeholder-sensitive-response":')

    const result = publicScores(['pkg:npm/example-invalid-json'])

    await expect(result).rejects.toMatchObject({
      code: 'SOCKET_API_REQUEST_FAILED',
      status: 0,
    })
    await expect(result).rejects.toSatisfy(
      (error: Error) =>
        !error.message.includes('test-placeholder-sensitive-response') &&
        error.cause === undefined,
    )
    expect(scope.isDone()).toBe(true)
  })
})

describe('public package response bounds', () => {
  test('reads an identity response exactly at the byte limit and closes it', async () => {
    const rawResponse = new PassThrough()
    rawResponse.end(Buffer.from('café'))

    await expect(
      readPublicPackageResponse(
        {
          headers: { 'content-encoding': 'identity' },
          rawResponse,
          status: 200,
        },
        5,
      ),
    ).resolves.toBe('café')
    expect(rawResponse.destroyed).toBe(true)
  })

  test('rejects and closes the response when its byte limit is exceeded', async () => {
    const rawResponse = new PassThrough()
    rawResponse.write(Buffer.from('café'))

    await expect(
      readPublicPackageResponse({ headers: {}, rawResponse, status: 200 }, 4),
    ).rejects.toMatchObject({ code: 'SOCKET_API_REQUEST_FAILED', status: 0 })
    expect(rawResponse.destroyed).toBe(true)
  })

  test('rejects unsupported encoding and closes the response without reading it', async () => {
    const rawResponse = new PassThrough()

    await expect(
      readPublicPackageResponse({
        headers: { 'content-encoding': 'gzip' },
        rawResponse,
        status: 200,
      }),
    ).rejects.toMatchObject({ code: 'SOCKET_API_REQUEST_FAILED', status: 0 })
    expect(rawResponse.destroyed).toBe(true)
    expect(rawResponse.readableDidRead).toBe(false)
  })

  test('rejects HTTP errors and closes the response without reading it', async () => {
    const rawResponse = new PassThrough()

    await expect(
      readPublicPackageResponse({ headers: {}, rawResponse, status: 503 }),
    ).rejects.toMatchObject({ code: 'SOCKET_API_REQUEST_FAILED', status: 503 })
    expect(rawResponse.destroyed).toBe(true)
    expect(rawResponse.readableDidRead).toBe(false)
  })
})
