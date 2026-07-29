/**
 * @file `escapeMarkdownHtml` / `encodeMarkdownLinkUrl` (src/util.ts) — the two
 *   helpers that make Socket API text and workspace-derived package names safe
 *   to interpolate into the hover's `MarkdownString`, which renders with
 *   `supportHtml` on. Anything that can open an HTML tag, a markdown link, or a
 *   new table column has to come out inert.
 */

import { describe, expect, test } from 'vitest'

import { encodeMarkdownLinkUrl, escapeMarkdownHtml } from '../src/util'

describe('escapeMarkdownHtml', () => {
  test('turns the five html specials into entities', () => {
    expect(escapeMarkdownHtml(`<&>"'`)).toBe('&lt;&amp;&gt;&quot;&#39;')
  })

  test('defangs an html injection payload', () => {
    const escaped = escapeMarkdownHtml('<img src=x onerror="alert(1)">')

    expect(escaped).not.toContain('<')
    expect(escaped).not.toContain('>')
    expect(escaped).toBe('&lt;img src=x onerror=&quot;alert\\(1\\)&quot;&gt;')
  })

  test('defangs a markdown link so a command uri cannot form', () => {
    const escaped = escapeMarkdownHtml(
      '[click](command:workbench.action.terminal.new)',
    )

    expect(escaped).not.toContain('](')
    expect(escaped).toBe(
      '\\[click\\]\\(command:workbench.action.terminal.new\\)',
    )
  })

  test('defangs emphasis, code spans, and table columns', () => {
    expect(escapeMarkdownHtml('a*b_c`d|e')).toBe('a\\*b\\_c\\`d\\|e')
  })

  test('escapes a backslash so an escape cannot be smuggled in', () => {
    expect(escapeMarkdownHtml('a\\<b')).toBe('a\\\\&lt;b')
  })

  test('never double-escapes its own output entities', () => {
    expect(escapeMarkdownHtml('&lt;')).toBe('&amp;lt;')
  })

  test('leaves ordinary package names readable', () => {
    expect(escapeMarkdownHtml('@babel/core')).toBe('@babel/core')
    expect(escapeMarkdownHtml('pkg:npm/left-pad')).toBe('pkg:npm/left-pad')
  })

  test('leaves newlines alone for the caller to turn into breaks', () => {
    expect(escapeMarkdownHtml('a\nb')).toBe('a\nb')
  })
})

describe('encodeMarkdownLinkUrl', () => {
  test('percent-encodes the parenthesis that would end a link destination', () => {
    expect(encodeMarkdownLinkUrl('evil)x(')).toBe('evil%29x%28')
  })

  test('percent-encodes a grafted query or fragment', () => {
    expect(encodeMarkdownLinkUrl('pkg?a=1#frag')).toBe('pkg%3Fa=1%23frag')
  })

  test('keeps a scoped package path readable', () => {
    expect(encodeMarkdownLinkUrl('@scope/name')).toBe('@scope/name')
  })

  test('encodes whitespace and angle brackets', () => {
    expect(encodeMarkdownLinkUrl('a b<c>')).toBe('a%20b%3Cc%3E')
  })
})
