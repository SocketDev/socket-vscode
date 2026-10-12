import { describe, expect, test } from 'vitest'

import {
  createRetiredApiTokenError,
  isRetiredApiToken,
  RETIRED_API_TOKEN_ERROR_CODE,
  RETIRED_API_TOKEN_ERROR_MESSAGE,
  throwIfRetiredApiToken,
} from '../../../src/retired-api-token.mts'
import { retiredSocketApiTokenFixture } from '../fixtures/retired-api-token.mts'

describe('retired API token recognition', () => {
  test('accepts only a nonblank matching credential', () => {
    expect(isRetiredApiToken(undefined)).toBe(false)
    expect(isRetiredApiToken('')).toBe(false)
    expect(isRetiredApiToken('   ')).toBe(false)
    expect(isRetiredApiToken('sktsec_legitimate_token')).toBe(false)
  })

  test('creates a static error without credential material', () => {
    const error = createRetiredApiTokenError()

    expect(error.code).toBe(RETIRED_API_TOKEN_ERROR_CODE)
    expect(error.message).toBe(RETIRED_API_TOKEN_ERROR_MESSAGE)
    expect(JSON.stringify(error)).not.toContain('sktsec_')
  })

  test('rejects the retired credential and surrounding whitespace', () => {
    for (const token of [
      retiredSocketApiTokenFixture,
      ` \n${retiredSocketApiTokenFixture}\t`,
    ]) {
      expect(isRetiredApiToken(token)).toBe(true)
      let caught: unknown
      try {
        throwIfRetiredApiToken(token)
      } catch (error) {
        caught = error
      }
      expect(caught).toBeInstanceOf(Error)
      if (caught instanceof Error) {
        expect('code' in caught && caught.code).toBe(
          RETIRED_API_TOKEN_ERROR_CODE,
        )
        expect(caught.message.includes(token)).toBe(false)
        expect(
          caught.message.includes(Buffer.from(token).toString('base64')),
        ).toBe(false)
      }
    }
  })

  test('preserves neighboring and non-string input behavior', () => {
    expect(isRetiredApiToken(`${retiredSocketApiTokenFixture}x`)).toBe(false)
    expect(() => throwIfRetiredApiToken(undefined)).not.toThrow()
    expect(() => throwIfRetiredApiToken({})).not.toThrow()
    expect(() => throwIfRetiredApiToken('legitimate')).not.toThrow()
  })
})
