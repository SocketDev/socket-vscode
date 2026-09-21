import { expect, test, vi } from 'vitest'
import type * as vscode from 'vscode'

import {
  ExternalPurlRangeManager,
  parseExternals,
} from '../../../../../src/ui/externals/parse-externals.mts'
import { parseJsExternalsFromSource } from '../../../../../src/ui/externals/js-source-externals.mts'
import {
  parsePackageJsonExternals,
  parsePyprojectExternals,
} from '../../../../../src/ui/externals/manifest-file-externals.mts'

vi.mock('../../../../../src/data/python/interpreter.mts', () => ({
  getPythonInterpreter: async () => undefined,
}))
vi.mock('../../../../../src/data/go/executable.mts', () => ({
  getGoExecutable: async () => undefined,
}))
vi.mock('../../../../../src/data/go/import-finder.mts', () => ({
  generateNativeGoImportBinary: vi.fn(),
}))
vi.mock('../../../../../src/data/go/mod-parser.mts', () => ({
  parseGoMod: vi.fn(),
}))
vi.mock('../../../../../src/data/python/import-finder.py', () => ({
  default: '',
}))
vi.mock('../../../../../src/data/glob-patterns.mts', () => ({
  getGlobPatterns: async () => new Map(),
}))

test.each([
  ["import value from 'example-package/subpath'", 'pkg:npm/example-package'],
  ["require('example-' + 'package')", 'pkg:npm/example-package'],
  ["require(`@example/${'package'}`)", 'pkg:npm/@example/package'],
  ["import('example-package-' + -1)", 'pkg:npm/example-package--1'],
  ["require('example-package-' + (1 + 2))", 'pkg:npm/example-package-3'],
])('extracts constant package references from %s', (source, expected) => {
  const results = new ExternalPurlRangeManager()
  expect(parseJsExternalsFromSource(source, results)).toBe(true)
  expect([...results.externals.keys()]).toEqual([expected])
})

test('ignores dynamic and relative JavaScript specifiers', () => {
  const results = new ExternalPurlRangeManager()
  expect(
    parseJsExternalsFromSource(
      "require(packageName); require(`example-${packageName}`); import('./local.mjs')",
      results,
    ),
  ).toBe(true)
  expect(results.externals.size).toBe(0)
  expect(parseJsExternalsFromSource('import {', results)).toBe(false)
})

test('extracts dependency fields and bundled package names', () => {
  const results = new ExternalPurlRangeManager()
  expect(
    parsePackageJsonExternals(
      JSON.stringify({
        bundledDependencies: ['example-bundled'],
        dependencies: { 'example-runtime': '1.0.0' },
        devDependencies: { 'example-development': '1.0.0' },
        optionalDependencies: { 'example-optional': '1.0.0' },
        peerDependencies: { 'example-peer': '1.0.0' },
        scripts: { build: 'example-tool' },
      }),
      results,
    ),
  ).toBe(true)
  expect([...results.externals.keys()].sort()).toEqual([
    'pkg:npm/example-bundled',
    'pkg:npm/example-development',
    'pkg:npm/example-optional',
    'pkg:npm/example-peer',
    'pkg:npm/example-runtime',
  ])
})

test('extracts project, optional, and Poetry dependency groups', () => {
  const results = new ExternalPurlRangeManager()
  expect(
    parsePyprojectExternals(
      '[project]\ndependencies = ["example-runtime>=1", 7]\n' +
        '[project.optional-dependencies]\nweb = ["example-web[http]"]\n' +
        '[tool.poetry.dependencies]\nexample-poetry = "^1"\n' +
        '[tool.poetry.dev-dependencies]\nexample-development = "^1"\n' +
        '[tool.poetry.group.test.dependencies]\nexample-test = "^1"\n',
      results,
    ),
  ).toBe(true)
  expect([...results.externals.keys()].sort()).toEqual([
    'pkg:pypi/example_development',
    'pkg:pypi/example_poetry',
    'pkg:pypi/example_runtime',
    'pkg:pypi/example_test',
    'pkg:pypi/example_web',
  ])
})

test('falls back to Python source imports without an interpreter', async () => {
  const doc = {
    fileName: 'example.py',
    getText: () =>
      'import example_package, example_other\nfrom example_module.child import name\n' +
      'loaded = __import__("example_dynamic")\n',
    languageId: 'python',
  } as vscode.TextDocument
  const results = await parseExternals(doc)
  expect([...results!.keys()].sort()).toEqual([
    'pkg:pypi/example_dynamic',
    'pkg:pypi/example_module',
    'pkg:pypi/example_other',
    'pkg:pypi/example_package',
  ])
  expect(results!.get('pkg:pypi/example_dynamic')!.ranges[0]!.start.line).toBe(
    2,
  )
})

test('falls back to Go source imports and preserves quoted ranges', async () => {
  const doc = {
    fileName: 'example.go',
    getText: () =>
      'import "example.com/direct"\nimport (\n alias "example.com/aliased"\n `example.com/raw`\n)\n',
    languageId: 'go',
  } as vscode.TextDocument
  const results = await parseExternals(doc)
  expect([...results!.keys()].sort()).toEqual([
    'pkg:golang/example.com/aliased',
    'pkg:golang/example.com/direct',
    'pkg:golang/example.com/raw',
  ])
  expect(
    results!.get('pkg:golang/example.com/direct')!.ranges[0],
  ).toMatchObject({
    end: { character: 27, line: 0 },
    start: { character: 7, line: 0 },
  })
})
