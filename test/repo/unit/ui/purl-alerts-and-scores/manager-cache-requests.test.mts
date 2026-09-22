import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import type { PackageScoreAndAlerts } from '../../../../../src/api.mts'
import type { logger as realLogger } from '../../../../../src/infra/log.mts'
import type { SimPURL } from '../../../../../src/ui/externals/parse-externals.mts'
import { PURLDataCache } from '../../../../../src/ui/purl-alerts-and-scores/manager.mts'

const { getAPIKey, streamPackageScores } = vi.hoisted(() => ({
  getAPIKey: vi.fn(),
  streamPackageScores: vi.fn(),
}))

vi.mock(import('node:fs'), async importOriginal => ({
  ...(await importOriginal()),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(() => {
    throw Object.assign(new Error('Missing cache fixture'), { code: 'ENOENT' })
  }),
  statSync: vi.fn(),
  writeFileSync: vi.fn(),
}))
vi.mock(import('../../../../../src/api.mts'), () => ({ streamPackageScores }))
vi.mock(import('../../../../../src/auth.mts'), () => ({ getAPIKey }))
vi.mock(import('../../../../../src/infra/log.mts'), () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  } as unknown as typeof realLogger,
}))

const cache = PURLDataCache.singleton
const ttl = 10 * 60 * 1000

function packageScore(inputPurl: SimPURL, overall = 90): PackageScoreAndAlerts {
  return {
    alerts: [],
    inputPurl,
    name: 'example-dependency',
    score: {
      license: 90,
      maintenance: 90,
      overall,
      quality: 90,
      supplyChain: 90,
      vulnerability: 90,
    },
    type: 'npm',
    version: '1.0.0',
  }
}

async function flushRequests() {
  await vi.advanceTimersByTimeAsync(0)
}

describe('PURLDataCache request lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    getAPIKey.mockReset().mockResolvedValue('test-placeholder-token')
    streamPackageScores.mockReset().mockImplementation(async function* (
      ...request: [string, SimPURL[]]
    ) {
      const [, purls] = request
      for (const purl of purls) {
        yield packageScore(purl)
      }
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  test('batches twenty dependencies watched in the same turn', async () => {
    const purls: SimPURL[] = []
    for (let index = 0; index < 20; index += 1) {
      purls.push(`pkg:npm/example-burst-${index}@1.0.0`)
    }
    const entries = purls.map(purl => cache.watch(purl))
    await flushRequests()

    expect(streamPackageScores).toHaveBeenCalledTimes(1)
    expect(streamPackageScores.mock.calls[0]?.[1]).toEqual(purls)
    expect(entries.every(entry => entry.pkgData !== undefined)).toBe(true)
    expect(vi.getTimerCount()).toBe(0)

    for (let index = 0, { length } = purls; index < length; index += 1) {
      cache.watch(purls[index]!)
    }
    await flushRequests()
    expect(streamPackageScores).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(ttl + 1)
    for (let index = 0, { length } = purls; index < length; index += 1) {
      cache.watch(purls[index]!)
    }
    await flushRequests()
    expect(streamPackageScores).toHaveBeenCalledTimes(2)
    expect(streamPackageScores.mock.calls[1]?.[1]).toEqual(purls)
    expect(entries.every(entry => entry.mtime === Date.now())).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  test('retains fresh results and refreshes successful entries after expiry', async () => {
    const purl = 'pkg:npm/example-expiring@1.0.0'
    const entry = cache.watch(purl)
    await flushRequests()

    expect.soft(entry.mtime).toBe(Date.now())
    expect.soft(entry.isStale()).toBe(false)
    cache.watch(purl)
    await flushRequests()
    expect.soft(streamPackageScores).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(ttl + 1)
    cache.watch(purl)
    await flushRequests()

    expect(streamPackageScores).toHaveBeenCalledTimes(2)
    expect(entry.mtime).toBe(Date.now())
    expect(entry.isStale()).toBe(false)
  })

  test('deduplicates watches while the request is pending', async () => {
    const auth = Promise.withResolvers<string>()
    getAPIKey.mockReturnValue(auth.promise)
    const purl = 'pkg:npm/example-pending@1.0.0'
    const entry = cache.watch(purl)
    await flushRequests()
    expect(cache.watch(purl)).toBe(entry)
    await flushRequests()
    auth.resolve('test-placeholder-token')
    await flushRequests()

    expect(getAPIKey).toHaveBeenCalledTimes(1)
    expect(streamPackageScores).toHaveBeenCalledTimes(1)
    expect(entry.pkgData).toEqual(packageScore(purl))
  })

  test('uses anonymous lookup without a token and clears the timer', async () => {
    getAPIKey.mockResolvedValueOnce(undefined)
    const purl = 'pkg:npm/example-no-token@1.0.0'
    const entry = cache.watch(purl)
    const watcher = vi.fn()
    entry.subscribe(watcher)
    await flushRequests()

    expect(vi.getTimerCount()).toBe(0)
    expect(streamPackageScores).toHaveBeenCalledWith(undefined, [purl], {
      signal: expect.any(AbortSignal),
      timeout: cache.timeout,
    })
    expect(entry.pkgData).toEqual(packageScore(purl))
    expect(entry.error).toBeUndefined()
    expect(watcher).toHaveBeenCalledTimes(1)

    cache.watch(purl)
    await flushRequests()
    expect(streamPackageScores).toHaveBeenCalledTimes(1)
    expect(entry.pkgData).toEqual(packageScore(purl))
    expect(entry.error).toBeUndefined()
    expect(watcher).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  test('permits retry after a failed request', async () => {
    streamPackageScores.mockImplementationOnce(() => {
      throw Object.assign(new Error('Fixture connection failed'), {
        code: 'ECONNREFUSED',
      })
    })
    const purl = 'pkg:npm/example-retry@1.0.0'
    const entry = cache.watch(purl)
    await flushRequests()
    expect(entry.error).toBeDefined()
    expect(vi.getTimerCount()).toBe(0)

    cache.watch(purl)
    await flushRequests()
    expect(streamPackageScores).toHaveBeenCalledTimes(2)
    expect(entry.pkgData).toEqual(packageScore(purl))
    expect(entry.error).toBeUndefined()
  })

  test('keeps the worst artifact and allows omitted packages to retry', async () => {
    const scoredPurl = 'pkg:npm/example-artifacts@1.0.0'
    const missingPurl = 'pkg:npm/example-missing@1.0.0'
    const worst = packageScore(scoredPurl, 10)
    streamPackageScores.mockImplementationOnce(async function* () {
      yield worst
      yield packageScore(scoredPurl, 99)
    })
    const scored = cache.watch(scoredPurl)
    const missing = cache.watch(missingPurl)
    await flushRequests()

    expect(scored.pkgData).toBe(worst)
    expect(missing.pkgData).toBeUndefined()
    expect(missing.error).toBeDefined()
    expect(vi.getTimerCount()).toBe(0)

    cache.watch(missingPurl)
    await flushRequests()
    expect(missing.pkgData).toEqual(packageScore(missingPurl))
    expect(missing.error).toBeUndefined()
  })

  test('ignores a timed-out stream after a retry succeeds', async () => {
    const response = Promise.withResolvers<PackageScoreAndAlerts>()
    streamPackageScores.mockImplementationOnce(async function* () {
      yield await response.promise
    })
    const purl = 'pkg:npm/example-timeout@1.0.0'
    const entry = cache.watch(purl)
    await flushRequests()
    await vi.advanceTimersByTimeAsync(ttl)

    expect(entry.error).toBeDefined()
    expect(entry.pkgData).toBeUndefined()
    cache.watch(purl)
    await flushRequests()
    expect(entry.pkgData).toEqual(packageScore(purl))

    response.resolve(packageScore(purl, 10))
    await flushRequests()
    expect(streamPackageScores).toHaveBeenCalledTimes(2)
    expect(entry.pkgData).toEqual(packageScore(purl))
    expect(entry.error).toBeUndefined()
    expect(vi.getTimerCount()).toBe(0)
  })

  test('cancels the transport when the cache deadline expires', async () => {
    const stopped = Promise.withResolvers<void>()
    let transportClosed = false
    streamPackageScores.mockImplementationOnce(async function* (
      ...request: [string, SimPURL[], { signal?: AbortSignal }]
    ) {
      const [, , options] = request
      options.signal?.addEventListener('abort', () => stopped.resolve(), {
        once: true,
      })
      try {
        await stopped.promise
      } finally {
        transportClosed = true
      }
    })
    const purl = 'pkg:npm/example-cancelled-transport@1.0.0'
    const entry = cache.watch(purl)
    await flushRequests()

    await vi.advanceTimersByTimeAsync(ttl)

    expect(transportClosed).toBe(true)
    expect(entry.pkgData).toBeUndefined()
    expect(entry.error).toBeDefined()
    expect(vi.getTimerCount()).toBe(0)
    cache.watch(purl)
    await flushRequests()
    expect(entry.pkgData).toEqual(packageScore(purl))
  })
})
