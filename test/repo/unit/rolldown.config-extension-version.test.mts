import { describe, expect, test } from 'vitest'

import { defineExtensionVersionPlugin } from '../../../.config/repo/rolldown.config.mts'

export function rewriteInlinedExtensionVersion(
  code: string,
  version = '2.0.3',
): string {
  const plugin = defineExtensionVersionPlugin(version)
  const transform = plugin.transform
  if (typeof transform !== 'function') {
    throw new TypeError(
      'Extension version define requires a transform function.',
    )
  }
  const result: unknown = Reflect.apply(transform, {}, [
    code,
    'src/example.mts',
  ])
  if (typeof result !== 'string') {
    throw new TypeError('Extension version define returned no code.')
  }
  return result
}

describe('defineExtensionVersionPlugin', () => {
  test('rewrites single-quote bracket access', () => {
    expect(
      rewriteInlinedExtensionVersion(
        "const version = process.env['INLINED_EXTENSION_VERSION']",
      ),
    ).toBe('const version = "2.0.3"')
  })

  test('rewrites double-quote bracket access', () => {
    expect(
      rewriteInlinedExtensionVersion(
        'const version = process.env["INLINED_EXTENSION_VERSION"]',
      ),
    ).toBe('const version = "2.0.3"')
  })

  test('rewrites bracket access inside TypeScript', () => {
    const source =
      'export function readVersion(ctx: vscode.ExtensionContext): string {\n' +
      "  return process.env['INLINED_EXTENSION_VERSION']\n" +
      '}\n'
    expect(rewriteInlinedExtensionVersion(source)).toBe(
      'export function readVersion(ctx: vscode.ExtensionContext): string {\n' +
        '  return "2.0.3"\n' +
        '}\n',
    )
  })

  test('rewrites bracket access inside tsx text', () => {
    expect(
      rewriteInlinedExtensionVersion(
        'const element = <div>{process.env["INLINED_EXTENSION_VERSION"]}</div>',
      ),
    ).toBe('const element = <div>{"2.0.3"}</div>')
  })

  test('leaves dot access untouched', () => {
    const source = 'const version = process.env.INLINED_EXTENSION_VERSION'
    expect(rewriteInlinedExtensionVersion(source)).toBe(source)
  })

  test('leaves dynamic computed access untouched', () => {
    const source =
      'const key = "INLINED_EXTENSION_VERSION"\nconst version = process.env[key]'
    expect(rewriteInlinedExtensionVersion(source)).toBe(source)
  })

  test('does not rewrite an unrelated env var', () => {
    const source = "const value = process.env['SOMETHING_ELSE']"
    expect(rewriteInlinedExtensionVersion(source)).toBe(source)
  })
})
