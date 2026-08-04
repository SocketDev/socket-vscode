// The inline error a user sees when a Socket API request fails must name the
// CAUSE, not the mechanism.
//
// A bare `catch { abort() }` in PURLDataCache.queueUpdate routed every failure
// through the abort listener, so an expired token, a proxy refusal and a DNS
// failure all surfaced as "Unable to load data from Socket API: the operation
// has been aborted" — and nothing reached the log. A report of that message
// could not be diagnosed from the message alone.

import assert from 'node:assert/strict'

import { afterEach, beforeEach, describe, test, vi } from 'vitest'

// `vi.hoisted` because vitest lifts every `vi.mock` call above the module's
// imports; a plain `const` here would still be in its temporal dead zone when
// the factory runs.
const { getAPIKey, loggerError, streamPackageScores } = vi.hoisted(() => ({
  getAPIKey: vi.fn(),
  loggerError: vi.fn(),
  streamPackageScores: vi.fn(),
}))

vi.mock(import('../src/api'), () => ({
  streamPackageScores,
}))
vi.mock(import('../src/auth'), () => ({
  getAPIKey,
}))
vi.mock(import('../src/infra/log'), () => ({
  logger: {
    debug: vi.fn(),
    error: loggerError,
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

// Imported statically: vitest hoists the mocks above, so a static import
// still sees them, and a top-level await would not survive the CJS bundle
// target this package builds for.
import { PURLDataCache } from '../src/ui/purl-alerts-and-scores/manager'

// The cache is a singleton with a private constructor, so each case uses a
// DISTINCT purl — a shared instance would otherwise carry one case's entry
// into the next.
const cache = PURLDataCache.singleton

// Let the queued async bus run to completion.
async function drain(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('PURLDataCache error surface', () => {
  beforeEach(() => {
    getAPIKey.mockReset().mockResolvedValue('a-token')
    streamPackageScores.mockReset()
    loggerError.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('surfaces the real failure, not a generic abort', async () => {
    streamPackageScores.mockImplementation(() => {
      throw new Error('401 Unauthorized')
    })
    const entry = cache.watch('pkg:npm/surf549-a@1.0.0')
    await drain()
    const rendered = entry.error ?? ''
    assert.match(rendered, /401 Unauthorized/)
    // The regression: the mechanism must not replace the cause.
    assert.ok(!/aborted/i.test(rendered), rendered)
  })

  test('logs the failure so a support report has something to read', async () => {
    streamPackageScores.mockImplementation(() => {
      throw new Error('ECONNREFUSED through corporate proxy')
    })
    cache.watch('pkg:npm/surf549-b@1.0.0')
    await drain()
    assert.equal(loggerError.mock.calls.length, 1)
    const [message, reason] = loggerError.mock.calls[0]!
    assert.match(message, /Socket API request failed/)
    assert.match(String((reason as Error).message), /ECONNREFUSED/)
  })

  test('a non-Error throw still yields a readable cause', async () => {
    streamPackageScores.mockImplementation(() => {
      // eslint-disable-next-line no-throw-literal
      throw 'plain string rejection'
    })
    const entry = cache.watch('pkg:npm/surf549-c@1.0.0')
    await drain()
    const rendered = entry.error ?? ''
    assert.match(rendered, /plain string rejection/)
  })
})
