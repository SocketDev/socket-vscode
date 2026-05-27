/**
 * @file Tests for the guarded compile-time define plugin
 *   (.config/rolldown/define-guarded.mts). Locks in that a single dotted define
 *   key matches dot, single-quote, and double-quote member access alike (TS
 *   forces quoted bracket access on `process.env`), that TS source is parsed
 *   (not rejected as JS), and that write / dynamic positions are left
 *   untouched.
 */

import { describe, expect, test } from 'vitest'

import { defineGuardedPlugin } from '../.config/rolldown/define-guarded.mts'

// Exported `function` declaration: satisfies both fleet rules —
// socket/prefer-function-declaration (no module-scope arrow) and
// socket/export-top-level-functions (top-level functions must be exported).
export function run(code: string, id = 'src/x.ts'): string | undefined {
  const plugin = defineGuardedPlugin({
    'process.env.INLINED_EXTENSION_VERSION': JSON.stringify('2.0.3'),
  })
  // rolldown's transform hook signature is (code, id); call it directly.
  const transform = plugin.transform as (
    this: unknown,
    code: string,
    id: string,
  ) => { code: string } | undefined
  const result = transform.call({}, code, id)
  return result?.code
}

describe('defineGuardedPlugin', () => {
  test('rewrites dot access', () => {
    const out = run('const a = process.env.INLINED_EXTENSION_VERSION')
    expect(out).toContain('"2.0.3"')
    expect(out).not.toContain('INLINED_EXTENSION_VERSION')
  })

  test('rewrites single-quote bracket access', () => {
    const out = run("const b = process.env['INLINED_EXTENSION_VERSION']")
    expect(out).toContain('"2.0.3"')
    expect(out).not.toContain('INLINED_EXTENSION_VERSION')
  })

  test('rewrites double-quote bracket access', () => {
    const out = run('const c = process.env["INLINED_EXTENSION_VERSION"]')
    expect(out).toContain('"2.0.3"')
    expect(out).not.toContain('INLINED_EXTENSION_VERSION')
  })

  test('parses TypeScript source (type annotations do not abort the rewrite)', () => {
    const out = run(
      'export function f(ctx: vscode.ExtensionContext): string {\n' +
        "  return process.env['INLINED_EXTENSION_VERSION']\n" +
        '}\n',
    )
    expect(out).toContain('"2.0.3"')
  })

  test('parses .tsx source', () => {
    const out = run(
      'const e = <div>{process.env["INLINED_EXTENSION_VERSION"]}</div>',
      'src/x.tsx',
    )
    expect(out).toContain('"2.0.3"')
  })

  test('leaves an assignment target untouched', () => {
    const code = "process.env['INLINED_EXTENSION_VERSION'] = 'x'"
    expect(run(code)).toBeUndefined()
  })

  test('leaves dynamic computed access untouched', () => {
    const code =
      'const k = "INLINED_EXTENSION_VERSION"\nconst d = process.env[k]'
    expect(run(code)).toBeUndefined()
  })

  test('does not rewrite an unrelated env var', () => {
    const code = "const u = process.env['SOMETHING_ELSE']"
    expect(run(code)).toBeUndefined()
  })
})
