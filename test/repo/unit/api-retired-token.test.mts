import { describe, expect, test } from 'vitest'

import {
  createSocketSdk,
  getOrganizations,
  sanitizePackageRequestError,
  streamAuthenticatedPackageData,
} from '../../../src/api.mts'
import {
  createRetiredApiTokenError,
  RETIRED_API_TOKEN_ERROR_CODE,
  RETIRED_API_TOKEN_ERROR_MESSAGE,
} from '../../../src/retired-api-token.mts'
import { retiredSocketApiTokenFixture } from '../fixtures/retired-api-token.mts'

describe('retired API token errors', () => {
  test('preserves the static retirement error during sanitization', () => {
    const error = createRetiredApiTokenError()

    const sanitized = sanitizePackageRequestError(error)
    expect(sanitized).not.toBe(error)
    expect(sanitized.message).toBe(RETIRED_API_TOKEN_ERROR_MESSAGE)
  })

  test('discards credential-bearing text on a tagged error', () => {
    const error = Object.assign(new Error(retiredSocketApiTokenFixture), {
      code: RETIRED_API_TOKEN_ERROR_CODE,
    })
    expect(sanitizePackageRequestError(error).message).toBe(
      RETIRED_API_TOKEN_ERROR_MESSAGE,
    )
  })

  test('rejects authenticated entry points before requests', async () => {
    expect(() => createSocketSdk(retiredSocketApiTokenFixture)).toThrow(
      expect.objectContaining({ code: RETIRED_API_TOKEN_ERROR_CODE }),
    )
    await expect(
      getOrganizations(retiredSocketApiTokenFixture),
    ).rejects.toHaveProperty('code', RETIRED_API_TOKEN_ERROR_CODE)
    await expect(
      streamAuthenticatedPackageData(retiredSocketApiTokenFixture, []).next(),
    ).rejects.toHaveProperty('code', RETIRED_API_TOKEN_ERROR_CODE)
  })
})
