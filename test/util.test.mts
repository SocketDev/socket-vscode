/**
 * @file Property/fuzz tests for `flattenGlob` (src/util.ts) — Tier-1
 *   fast-check. `flattenGlob` is an untrusted-input brace-expansion parser: it
 *   turns a glob with `{a,b}` alternations (arbitrarily nested) into a single
 *   flat `{expansion1,expansion2,...}` form, honoring backslash escapes. It
 *   feeds the manifest-filename matcher
 *   (`caseDesensitize(flattenGlob(pattern))`), so it must never throw on any
 *   string. The oracle is CONSTRUCTED, not reimplemented: each case is built
 *   from a generated brace AST from which we derive BOTH the input string
 *   (`glob`) and the known expansion set (`expand`). The SUT's job is to PARSE
 *   the flat string back into that same set — the parsing is what's under test,
 *   and the expected value never comes from the SUT.
 */

import fc from 'fast-check'
import { describe, expect, test, vi } from 'vitest'

// src/util.ts does `import * as vscode from 'vscode'` at module scope for
// helpers unrelated to flattenGlob; the module isn't resolvable outside the
// VS Code host, so stub it. flattenGlob itself touches no vscode API.
vi.mock(import('vscode'), () => ({}))

// eslint-disable-next-line import-x/first -- must follow the vscode mock.
import { flattenGlob } from '../src/util'

// Literal characters with NO special meaning to flattenGlob (it only reacts to
// `{`, `}`, `,`, and `\`). `*` and `.` are intentionally included to prove they
// pass through verbatim.
const LITERAL_CHARS = 'abcABZ012.-_*/'

type Brace = { glob: string; expand: string[] }

// Build a brace AST and derive (input string, expected expansion set) together.
// A literal expands to itself; a concatenation is the ordered cartesian product
// of its parts; an alternation is the ordered concatenation of its branches.
const braceArb: fc.Arbitrary<Brace> = fc.letrec<{ node: Brace }>(tie => ({
  node: fc.oneof(
    { maxDepth: 3, depthSize: 'small' },
    // Literal (possibly empty).
    fc
      .array(fc.constantFrom(...LITERAL_CHARS.split('')), { maxLength: 5 })
      .map(cs => {
        const s = cs.join('')
        return { glob: s, expand: [s] }
      }),
    // Concatenation: ordered cartesian product of parts.
    fc.array(tie('node'), { maxLength: 4 }).map(parts => ({
      glob: parts.map(p => p.glob).join(''),
      expand: parts.reduce<string[]>(
        (acc, p) => acc.flatMap(a => p.expand.map(s => a + s)),
        [''],
      ),
    })),
    // Alternation `{b1,b2,...}`: ordered concatenation of branch expansions.
    fc.array(tie('node'), { minLength: 1, maxLength: 4 }).map(branches => ({
      glob: `{${branches.map(b => b.glob).join(',')}}`,
      expand: branches.flatMap(b => b.expand),
    })),
  ),
})).node

// A string containing none of flattenGlob's structural metacharacters, so it
// must pass through unchanged.
const inertString = fc
  .array(
    fc.constantFrom(
      ...LITERAL_CHARS.split(''),
      '[',
      ']',
      '(',
      ')',
      '!',
      '@',
      '=',
    ),
    {
      maxLength: 30,
    },
  )
  .map(cs => cs.join(''))

// A soup of the characters flattenGlob treats specially, to stress the parser
// with unbalanced braces / trailing escapes.
const braceSoup = fc
  .array(fc.constantFrom('{', '}', ',', '\\', 'a', 'b', ' '), { maxLength: 40 })
  .map(cs => cs.join(''))

describe('util/flattenGlob (fuzz)', () => {
  // ORACLE (constructed): flattening the rendered glob yields the known
  // expansion set — a single element passes through bare, otherwise it is
  // re-wrapped as `{e1,e2,...}` in expansion order.
  test('flattens a constructed brace AST to its known expansion set', () => {
    fc.assert(
      fc.property(braceArb, ({ glob, expand }) => {
        const expected =
          expand.length === 1 ? expand[0]! : `{${expand.join(',')}}`
        expect(flattenGlob(glob)).toBe(expected)
      }),
    )
  })

  // IDEMPOTENCE: the flattened form is a fixed point — flattening it again is a
  // no-op. Self-comparison is computed in a var (never build expected in-place
  // from the SUT inside expect()).
  test('is idempotent on constructed brace globs', () => {
    fc.assert(
      fc.property(braceArb, ({ glob }) => {
        const once = flattenGlob(glob)
        expect(flattenGlob(once)).toBe(once)
      }),
    )
  })

  // RESTRICTED-INPUT: a string free of `{`, `}`, `,`, `\` has nothing to expand
  // and is returned verbatim.
  test('is the identity on metacharacter-free strings', () => {
    fc.assert(
      fc.property(inertString, s => {
        expect(flattenGlob(s)).toBe(s)
      }),
    )
  })

  // INVARIANT + NEVER-THROWS: for ANY input (including unbalanced braces and
  // trailing escapes) it returns a string and does not throw.
  test('never throws and always returns a string for any input', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), braceSoup), s => {
        expect(typeof flattenGlob(s)).toBe('string')
      }),
    )
  })

  // REGRESSION (found by the vitiate coverage-guided lane): a brace bomb —
  // many alternation groups whose cartesian product overflows V8's max string
  // length — once made explode()'s `parts.join(',')` throw RangeError: Invalid
  // string length, a DoS on the scanned-manifest glob path
  // (caseDesensitize(flattenGlob(pattern))). flattenGlob now caps expansion and
  // returns the pattern UNEXPANDED (verbatim) instead of throwing. Asserting
  // the verbatim return (not merely "no throw") proves the cap path ran: a real
  // expansion of 2**30 combinations would be an astronomically different string
  // (and would OOM/throw without the cap).
  test('caps a brace bomb and returns it unexpanded (DoS regression)', () => {
    const bomb = '{a,b}'.repeat(30)
    expect(flattenGlob(bomb)).toBe(bomb)
  })
})
