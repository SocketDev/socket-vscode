/**
 * @file Vitiate coverage-guided fuzz target (Tier 2) for `flattenGlob`
 *   (src/util.ts) — the untrusted-input brace-expansion glob parser that feeds
 *   the manifest-filename matcher (`caseDesensitize(flattenGlob(pattern))` in
 *   src/data/glob-patterns.ts). Complements the fast-check property tests in
 *   util.fuzz.test.mts: fast-check checks correctness against a constructed
 *   brace-AST oracle; vitiate feeds SWC-coverage-guided mutated BYTES to reach
 *   deep parser paths (unbalanced braces, stray commas, trailing escapes, deep
 *   nesting) a spec-based generator never hits, with the prototypePollution
 *   detector watching the parser's intermediate objects. flattenGlob's contract
 *   is TOTAL: it must NEVER throw on any string. Run via `pnpm run test:fuzz`.
 */

import { fuzz } from '@vitiate/core'
import { vi } from 'vitest'

// src/util.ts does `import * as vscode from 'vscode'` at module scope for
// helpers unrelated to flattenGlob; the module isn't resolvable outside the
// VS Code host, so stub it. flattenGlob itself touches no vscode API.
vi.mock(import('vscode'), () => ({}))

// eslint-disable-next-line import-x/first -- must follow the vscode mock.
import { flattenGlob } from '../src/util'

// flattenGlob promises to NEVER throw for ANY input — any thrown error on
// arbitrary bytes (unbalanced braces, stray `,`, trailing `\`, deep nesting) is
// a crash the coverage-guided mutator is trying to surface.
fuzz('flattenGlob never throws on arbitrary bytes', data => {
  flattenGlob(data.toString('utf8'))
})
