/**
 * @file Property/fuzz tests for the case-desensitizing glob rewriters in
 *   src/data/glob-patterns.ts — Tier-1 fast-check.
 *
 *   - `replaceCasedChars(s)` rewrites every ASCII letter `c` to the character
 *     class `[<lower><upper>]`, leaving everything else untouched.
 *   - `caseDesensitize(pattern)` applies that rewrite to the text OUTSIDE any
 *     `[...]` character group, preserving existing groups verbatim. These build
 *     the file-name matcher that decides whether e.g. `PACKAGE.JSON` matches
 *     the `package.json` manifest glob, so the load-bearing contract is that
 *     the rewritten pattern matches any-case variants of the original. That
 *     contract is checked with the platform `node:path` matcher as the oracle.
 */

import path from 'node:path'

import fc from 'fast-check'
import { describe, expect, test, vi } from 'vitest'

// glob-patterns.ts transitively imports src/util.ts, which does
// `import * as vscode from 'vscode'` at module scope. Stub it — none of the
// functions under test touch a vscode API.
vi.mock(import('vscode'), () => ({}))

// eslint-disable-next-line import-x/first -- must follow the vscode mock.
import { caseDesensitize, replaceCasedChars } from '../src/data/glob-patterns'

const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
// Characters with no ASCII letter and no glob-class meaning we rely on.
const NON_LETTER_CHARS = '0123456789 .-_/!@#%={}(),'

const nonLetterString = fc
  .array(fc.constantFrom(...NON_LETTER_CHARS.split('')), { maxLength: 30 })
  .map(cs => cs.join(''))

// A lowercase-letter/digit/`.-_` filename word (a manifest-name shape). No glob
// metacharacters, so caseDesensitize produces only `[xX]` classes + literals.
const FILE_CHARS = `${LOWER}0123456789.-_`
const fileWord = fc
  .array(fc.constantFrom(...FILE_CHARS.split('')), {
    minLength: 1,
    maxLength: 16,
  })
  .map(cs => cs.join(''))

// Flip the case of each ASCII letter according to a boolean mask, leaving
// non-letters alone — yields an arbitrary-case variant of the same word.
function applyCaseMask(word: string, mask: boolean[]): string {
  let out = ''
  for (let i = 0; i < word.length; i += 1) {
    const ch = word[i]!
    out += mask[i] ? ch.toUpperCase() : ch.toLowerCase()
  }
  return out
}

describe('data/glob-patterns replaceCasedChars (fuzz)', () => {
  // INVARIANT + NEVER-THROWS: any string maps to a string without throwing.
  test('never throws and returns a string for any input', () => {
    fc.assert(
      fc.property(fc.string(), s => {
        expect(typeof replaceCasedChars(s)).toBe('string')
      }),
    )
  })

  // RESTRICTED-INPUT: a string with no ASCII letters is unchanged.
  test('is the identity on letter-free strings', () => {
    fc.assert(
      fc.property(nonLetterString, s => {
        expect(replaceCasedChars(s)).toBe(s)
      }),
    )
  })

  // ORACLE (single char, answer known up front): one ASCII letter becomes its
  // `[lowerUpper]` class. `expected` is derived from the generated char, never
  // from the SUT.
  test('rewrites a single ASCII letter to its case class', () => {
    fc.assert(
      fc.property(fc.constantFrom(...LETTERS.split('')), c => {
        const expected = `[${c.toLowerCase()}${c.toUpperCase()}]`
        expect(replaceCasedChars(c)).toBe(expected)
      }),
    )
  })

  // DERIVED-FROM-INPUT: each letter grows from 1 char to 4 (`[xX]`), everything
  // else is length-preserving. Letter count is measured on the INPUT.
  test('output length grows by 3 per ASCII letter', () => {
    fc.assert(
      fc.property(fc.string(), s => {
        const letterCount = (s.match(/[a-zA-Z]/g) ?? []).length
        expect(replaceCasedChars(s).length).toBe(s.length + 3 * letterCount)
      }),
    )
  })

  // ORACLE (matcher): the rewritten word matches any-case variant of itself.
  test('rewritten word matches any-case variants (path.matchesGlob)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...LOWER.split('')), {
          minLength: 1,
          maxLength: 12,
        }),
        fc.array(fc.boolean(), { maxLength: 12 }),
        (chars, mask) => {
          const word = chars.join('')
          const pattern = replaceCasedChars(word)
          const variant = applyCaseMask(word, mask)
          expect(path.matchesGlob(variant, pattern)).toBe(true)
        },
      ),
    )
  })
})

describe('data/glob-patterns caseDesensitize (fuzz)', () => {
  // INVARIANT + NEVER-THROWS.
  test('never throws and returns a string for any input', () => {
    fc.assert(
      fc.property(fc.string(), s => {
        expect(typeof caseDesensitize(s)).toBe('string')
      }),
    )
  })

  // RESTRICTED-INPUT: a single existing `[...]` character group is preserved
  // verbatim (its contents are not rewritten).
  test('preserves an existing character group verbatim', () => {
    const groupInner = fc
      .array(
        fc.constantFrom(
          ...LETTERS.split(''),
          ...NON_LETTER_CHARS.replace(']', '').split(''),
        ),
        {
          minLength: 1,
          maxLength: 10,
        },
      )
      .map(cs => cs.join(''))
    fc.assert(
      fc.property(groupInner, inner => {
        const group = `[${inner}]`
        expect(caseDesensitize(group)).toBe(group)
      }),
    )
  })

  // CONSISTENCY: with no `[` there is no group, so caseDesensitize degrades to
  // replaceCasedChars over the whole string. The self-comparison value is
  // computed in a var, not built from the SUT inside expect().
  test('equals replaceCasedChars when there is no character group', () => {
    const noBracket = fc
      .array(
        fc.constantFrom(...LETTERS.split(''), ...NON_LETTER_CHARS.split('')),
        {
          maxLength: 30,
        },
      )
      .map(cs => cs.join(''))
    fc.assert(
      fc.property(noBracket, s => {
        const viaReplace = replaceCasedChars(s)
        expect(caseDesensitize(s)).toBe(viaReplace)
      }),
    )
  })

  // ORACLE (matcher): a desensitized manifest-name pattern matches any-case
  // variant of the file name.
  test('desensitized file name matches any-case variants (path.matchesGlob)', () => {
    fc.assert(
      fc.property(
        fileWord,
        fc.array(fc.boolean(), { maxLength: 16 }),
        (word, mask) => {
          const pattern = caseDesensitize(word)
          const variant = applyCaseMask(word, mask)
          expect(path.matchesGlob(variant, pattern)).toBe(true)
        },
      ),
    )
  })
})
