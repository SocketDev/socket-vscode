// Specs for scripts/repo/install-claude-plugins.mts.
//
// We test the pure helpers (extractInstalledSha, findForeignInstall,
// findOrphanMarketplaces). The Claude CLI shell-outs are integration
// surface — they mutate ~/.claude/ and aren't covered here. The pure
// helpers carry the actual reconciliation logic; if they're correct,
// the orchestration in reconcilePlugin / main is straightforward to
// audit by reading.

import { expect, test } from 'vitest'

import {
  extractInstalledSha,
  findForeignInstall,
  findOrphanMarketplaces,
  lookupInstalledSha,
  parsePatchFileName,
  patchSidecarDir,
  stripPatchHeader,
} from '../../scripts/repo/install-claude-plugins.mts'
import type {
  MarketplaceListEntry,
  PluginListEntry,
} from '../../scripts/repo/install-claude-plugins.mts'

const OUR = 'socket-wheelhouse'

test('extractInstalledSha returns 12-char prefix for SHA-pinned cache path', () => {
  const got = extractInstalledSha(
    '/Users/x/.claude/plugins/cache/socket-wheelhouse/codex/9cb4fe409919-deadbeef',
  )
  expect(got).toBe('9cb4fe409919')
})

test('extractInstalledSha handles content-hash of various lengths', () => {
  const got = extractInstalledSha('/x/cache/m/p/abcdef012345-fedcba98')
  expect(got).toBe('abcdef012345')
})

test('extractInstalledSha returns undefined for directory-source install (version-tagged)', () => {
  const got = extractInstalledSha('/Users/x/projects/codex-plugin-cc')
  expect(got).toBe(undefined)
})

test('extractInstalledSha returns undefined for version-tagged install', () => {
  const got = extractInstalledSha(
    '/Users/x/.claude/plugins/cache/openai-codex/codex/1.0.1',
  )
  expect(got).toBe(undefined)
})

test('extractInstalledSha returns undefined for undefined input', () => {
  expect(extractInstalledSha(undefined)).toBe(undefined)
})

test('extractInstalledSha returns undefined for empty string', () => {
  expect(extractInstalledSha('')).toBe(undefined)
})

test('extractInstalledSha rejects shapes that almost-match but are not 12 + 8+', () => {
  // 11 chars instead of 12.
  expect(extractInstalledSha('/x/cache/m/p/9cb4fe40991-deadbeef')).toBe(
    undefined,
  )
  // No content-hash suffix.
  expect(extractInstalledSha('/x/cache/m/p/9cb4fe409919')).toBe(undefined)
  // Non-hex chars.
  expect(extractInstalledSha('/x/cache/m/p/zzzzzzzzzzzz-deadbeef')).toBe(
    undefined,
  )
})

const fakePlugin = (
  id: string,
  installPath?: string | undefined,
): PluginListEntry => ({
  id,
  scope: 'user',
  enabled: true,
  ...(installPath !== undefined ? { installPath } : {}),
})

test('findForeignInstall finds plugin under non-canonical marketplace', () => {
  const plugins = [
    fakePlugin('codex@openai-codex', '/Users/x/projects/codex-plugin-cc'),
    fakePlugin('clangd-lsp@claude-plugins-official'),
  ]
  const got = findForeignInstall('codex', plugins, OUR)
  expect(got?.id).toBe('codex@openai-codex')
})

test('findForeignInstall returns undefined when plugin is under our marketplace', () => {
  const plugins = [
    fakePlugin(
      'codex@socket-wheelhouse',
      '/x/cache/socket-wheelhouse/codex/9cb4fe409919-aa',
    ),
  ]
  const got = findForeignInstall('codex', plugins, OUR)
  expect(got).toBe(undefined)
})

test('findForeignInstall returns undefined when plugin is not installed at all', () => {
  const plugins = [fakePlugin('clangd-lsp@claude-plugins-official')]
  const got = findForeignInstall('codex', plugins, OUR)
  expect(got).toBe(undefined)
})

test('findForeignInstall ignores other plugins with similar prefixes', () => {
  // "codex-helper" should not match "codex" — we match on the exact
  // name before the @ separator.
  const plugins = [fakePlugin('codex-helper@some-mkt')]
  const got = findForeignInstall('codex', plugins, OUR)
  expect(got).toBe(undefined)
})

test('findOrphanMarketplaces flags marketplace serving only-our plugins', () => {
  const marketplaces: MarketplaceListEntry[] = [
    { name: OUR, source: 'github' },
    { name: 'openai-codex', source: 'directory' },
  ]
  const plugins = [
    fakePlugin('codex@openai-codex'),
    fakePlugin('codex@socket-wheelhouse'),
  ]
  const got = findOrphanMarketplaces(
    marketplaces,
    OUR,
    new Set(['codex']),
    plugins,
  )
  expect(got).toEqual(['openai-codex'])
})

test('findOrphanMarketplaces does NOT flag empty marketplace (no installs from it)', () => {
  // User added a marketplace but installed nothing from it. Leave alone.
  const marketplaces: MarketplaceListEntry[] = [
    { name: OUR, source: 'github' },
    { name: 'experimental', source: 'directory' },
  ]
  const plugins = [fakePlugin('codex@socket-wheelhouse')]
  const got = findOrphanMarketplaces(
    marketplaces,
    OUR,
    new Set(['codex']),
    plugins,
  )
  expect(got).toEqual([])
})

test('findOrphanMarketplaces does NOT flag marketplace serving non-overlapping plugins', () => {
  // openai-codex serves codex (ours) AND some-other-plugin (NOT ours).
  // We shouldn't suggest removing it — user might want some-other-plugin.
  const marketplaces: MarketplaceListEntry[] = [
    { name: OUR, source: 'github' },
    { name: 'openai-codex', source: 'directory' },
  ]
  const plugins = [
    fakePlugin('codex@openai-codex'),
    fakePlugin('some-other-plugin@openai-codex'),
  ]
  const got = findOrphanMarketplaces(
    marketplaces,
    OUR,
    new Set(['codex']),
    plugins,
  )
  expect(got).toEqual([])
})

test('findOrphanMarketplaces never flags our own marketplace', () => {
  const marketplaces: MarketplaceListEntry[] = [{ name: OUR, source: 'github' }]
  const plugins = [fakePlugin('codex@socket-wheelhouse')]
  const got = findOrphanMarketplaces(
    marketplaces,
    OUR,
    new Set(['codex']),
    plugins,
  )
  expect(got).toEqual([])
})

const FULL_SHA = '9cb4fe4099195b2587c402117a3efce6ab5aac78'

test('lookupInstalledSha extracts gitCommitSha from installed_plugins.json shape', () => {
  const state = {
    version: 2,
    plugins: {
      'codex@socket-wheelhouse': [
        {
          scope: 'user',
          installPath: '/x/y/z',
          version: '1.0.1',
          gitCommitSha: FULL_SHA,
        },
      ],
    },
  }
  expect(lookupInstalledSha(state, 'codex@socket-wheelhouse')).toBe(FULL_SHA)
})

test('lookupInstalledSha returns undefined when plugin id is absent', () => {
  const state = { version: 2, plugins: {} }
  expect(lookupInstalledSha(state, 'codex@socket-wheelhouse')).toBe(undefined)
})

test('lookupInstalledSha returns undefined when entry has no gitCommitSha', () => {
  const state = {
    version: 2,
    plugins: {
      'codex@socket-wheelhouse': [
        { scope: 'user', installPath: '/x/y/z', version: '1.0.1' },
      ],
    },
  }
  expect(lookupInstalledSha(state, 'codex@socket-wheelhouse')).toBe(undefined)
})

test('lookupInstalledSha rejects malformed gitCommitSha values', () => {
  const state = {
    version: 2,
    plugins: {
      'codex@socket-wheelhouse': [{ gitCommitSha: 'not-a-sha' }],
    },
  }
  expect(lookupInstalledSha(state, 'codex@socket-wheelhouse')).toBe(undefined)
})

test('lookupInstalledSha handles null / non-object input', () => {
  expect(lookupInstalledSha(undefined, 'codex@socket-wheelhouse')).toBe(
    undefined,
  )
  expect(lookupInstalledSha('not-an-object', 'codex@socket-wheelhouse')).toBe(
    undefined,
  )
  expect(lookupInstalledSha({}, 'codex@socket-wheelhouse')).toBe(undefined)
  expect(
    lookupInstalledSha({ plugins: undefined }, 'codex@socket-wheelhouse'),
  ).toBe(undefined)
})

test('lookupInstalledSha walks multiple scope entries to find a valid SHA', () => {
  // installed_plugins.json arrays can have multiple entries (one per
  // scope). Take the first valid gitCommitSha.
  const state = {
    plugins: {
      'codex@socket-wheelhouse': [
        { scope: 'local' /* no sha */ },
        { scope: 'user', gitCommitSha: FULL_SHA },
      ],
    },
  }
  expect(lookupInstalledSha(state, 'codex@socket-wheelhouse')).toBe(FULL_SHA)
})

test('parsePatchFileName parses <plugin>-<version>-<slug>.patch', () => {
  expect(parsePatchFileName('codex-1.0.1-stdin-eagain.patch')).toEqual({
    plugin: 'codex',
    version: '1.0.1',
  })
})

test('parsePatchFileName keeps a hyphenated plugin name (version anchor disambiguates)', () => {
  // The greedy plugin capture stops at the dotted-semver anchor, so a
  // hyphenated plugin name survives.
  expect(parsePatchFileName('socket-foo-2.3.4-fix-crash.patch')).toEqual({
    plugin: 'socket-foo',
    version: '2.3.4',
  })
})

test('parsePatchFileName returns undefined without a dotted-semver version', () => {
  expect(parsePatchFileName('codex-latest-fix.patch')).toBe(undefined)
  expect(parsePatchFileName('codex-1.0-fix.patch')).toBe(undefined)
})

test('parsePatchFileName returns undefined without a slug after the version', () => {
  expect(parsePatchFileName('codex-1.0.1.patch')).toBe(undefined)
})

test('parsePatchFileName returns undefined for a non-.patch file', () => {
  expect(parsePatchFileName('codex-1.0.1-fix.diff')).toBe(undefined)
  expect(parsePatchFileName('README.md')).toBe(undefined)
})

test('parsePatchFileName rejects uppercase (file naming is lowercase-kebab)', () => {
  expect(parsePatchFileName('Codex-1.0.1-Fix.patch')).toBe(undefined)
})

test('stripPatchHeader drops the # provenance header, keeps the diff body', () => {
  const patch = [
    '# @plugin: codex',
    '# @description: fix something',
    '#',
    '--- a/scripts/lib/fs.mjs',
    '+++ b/scripts/lib/fs.mjs',
    '@@ -1,1 +1,1 @@',
    '-old',
    '+new',
    '',
  ].join('\n')
  const body = stripPatchHeader(patch)
  expect(body.startsWith('--- a/scripts/lib/fs.mjs')).toBeTruthy()
  expect(!body.includes('@plugin')).toBeTruthy()
})

test('stripPatchHeader returns the whole body when there is no header', () => {
  const body = '--- a/x\n+++ b/x\n@@ -1 +1 @@\n-a\n+b\n'
  expect(stripPatchHeader(body)).toBe(body)
})

test('stripPatchHeader returns empty string when no diff body is present', () => {
  expect(stripPatchHeader('# @plugin: codex\n# just a comment\n')).toBe('')
})

test('stripPatchHeader only matches --- at line start (not mid-line)', () => {
  // A `---` inside a comment line must not be mistaken for the diff start.
  const patch =
    '# note: see --- somewhere\n--- a/real\n+++ b/real\n@@ -1 +1 @@\n-x\n+y\n'
  const body = stripPatchHeader(patch)
  expect(body.startsWith('--- a/real')).toBeTruthy()
})

test('patchSidecarDir maps <x>.patch → <x>.files', () => {
  expect(patchSidecarDir('/a/b/codex-1.0.1-stdin-eagain.patch')).toBe(
    '/a/b/codex-1.0.1-stdin-eagain.files',
  )
})

test('patchSidecarDir only rewrites a trailing .patch extension', () => {
  // A `.patch` mid-path must not be rewritten — only the final extension.
  expect(patchSidecarDir('/a/.patch-stuff/codex-1.0.1-x.patch')).toBe(
    '/a/.patch-stuff/codex-1.0.1-x.files',
  )
})
