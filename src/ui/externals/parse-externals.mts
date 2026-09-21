import * as vscode from 'vscode'
import * as path from 'node:path'
import type { Span as JsonSpan, Value as JsonValue } from 'local-json-wasm'
import { getGlobPatterns } from '../../data/glob-patterns.mts'
import {
  parseGoModExternals,
  parsePackageJsonExternals,
  parsePipfileExternals,
  parsePyprojectExternals,
  parseRequirementsExternals,
} from './manifest-file-externals.mts'
import { parseJsExternalsFromSource } from './js-source-externals.mts'
import {
  parseGoSourceExternals,
  parsePythonSourceExternals,
} from './native-source-externals.mts'
import {
  isSupportedLSPLanguageId,
  SUPPORTED_LSP_LANGUAGE_IDS_TO_PARSER,
} from '../languages.mts'
import type { PURL_Type } from '../languages.mts'

export type ExternalRef = {
  name: string
  range: vscode.Range
}

export type SimPURL = `pkg:${PURL_Type}/${string}`
export class ExternalPurlRangeManager {
  externals = new Map<SimPURL, { builtin: boolean; ranges: vscode.Range[] }>()
  add(purl: SimPURL, range: vscode.Range, builtin: boolean = false): void {
    let group = this.externals.get(purl)
    if (!group) {
      group = { builtin, ranges: [] }
      this.externals.set(purl, group)
    }
    group.ranges.push(range)
  }
}

// json-wasm emits byte-range spans rather than (line, column). Build
// a sorted line-start table once per document so converting any span
// to a vscode.Range is O(log n) per lookup, at O(n) construction
// cost — much cheaper than re-walking the source per node.
export function buildLineTable(src: string): number[] {
  const lines: number[] = [0]
  for (let i = 0, n = src.length; i < n; i++) {
    if (src.charCodeAt(i) === 10 /* \n */) {
      lines.push(i + 1)
    }
  }
  return lines
}

export function getJSPackageNameFromSpecifier(name: string): string {
  return (name.startsWith('@') ? name.split('/', 2) : name.split('/', 1)).join(
    '/',
  )
}
export function getJSPackageNameFromVersionRange(name: string): string {
  return (name.startsWith('@') ? name.split('@', 3) : name.split('@', 2)).join(
    '@',
  )
}
export function hydrateJSONRefs(src: string): ExternalRef[] {
  return JSON.parse(src, (key, value) => {
    if (key === 'range') {
      return new vscode.Range(
        new vscode.Position(value.start.line, value.start.character),
        new vscode.Position(value.end.line, value.end.character),
      )
    }
    return value
  })
}

export function offsetToPosition(
  offset: number,
  lineTable: number[],
): vscode.Position {
  // Binary search for the largest line-start <= offset.
  let lo = 0
  let hi = lineTable.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1
    if (lineTable[mid]! <= offset) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }
  return new vscode.Position(lo, offset - lineTable[lo]!)
}

export async function parseExternals(
  doc: vscode.TextDocument,
): Promise<
  Map<SimPURL, { builtin: boolean; ranges: vscode.Range[] }> | undefined
> {
  const languageId = doc.languageId
  const src = doc.getText()
  const results = new ExternalPurlRangeManager()
  const basename = path.basename(doc.fileName)
  const globPatterns = await getGlobPatterns()
  // Helper: lookup an eco/file glob pattern, returning an empty string
  // if either bucket is missing (matchesGlob('', '') is safely false).
  const globPattern = (eco: string, file: string): string =>
    globPatterns.get(eco)?.get(file)?.pattern ?? ''
  if (path.matchesGlob(basename, globPattern('npm', 'packagejson'))) {
    if (!parsePackageJsonExternals(src, results)) {
      return undefined
    }
  } else if (path.matchesGlob(basename, globPattern('pypi', 'pyproject'))) {
    if (!parsePyprojectExternals(src, results)) {
      return undefined
    }
  } else if (path.matchesGlob(basename, globPattern('pypi', 'pipfile'))) {
    parsePipfileExternals(src, results)
  } else if (path.matchesGlob(basename, globPattern('pypi', 'requirements'))) {
    parseRequirementsExternals(src, results)
  } else if (path.matchesGlob(basename, globPattern('golang', 'gomod'))) {
    if (!(await parseGoModExternals(src, results))) {
      return undefined
    }
  } else if (isSupportedLSPLanguageId(languageId)) {
    if (
      !(await parseLanguageExternals(
        SUPPORTED_LSP_LANGUAGE_IDS_TO_PARSER[languageId],
        doc,
        src,
        results,
      ))
    ) {
      return undefined
    }
  } else {
    return undefined
  }
  return results.externals
}

export async function parseLanguageExternals(
  parser: string,
  doc: vscode.TextDocument,
  src: string,
  results: ExternalPurlRangeManager,
): Promise<boolean> {
  switch (parser) {
    case 'npm':
      return parseJsExternalsFromSource(src, results)
    case 'pypi':
      return parsePythonSourceExternals(doc, src, results)
    case 'golang':
      return parseGoSourceExternals(src, results)
    default:
      return true
  }
}
export function parsePkgOverrideExternals(
  node: Extract<JsonValue, { type: 'object' }>,
  lineTable: number[],
  results: ExternalPurlRangeManager,
  contextualName?: string | undefined,
): void {
  const members = node.members
  for (let i = 0, { length } = members; i < length; i += 1) {
    const child = members[i]!
    let pkgName: string | undefined
    if (child.key.value === '.') {
      if (contextualName) {
        pkgName = contextualName
      }
    } else {
      pkgName = getJSPackageNameFromVersionRange(child.key.value)
    }
    if (pkgName) {
      // Highlight the whole `key: value` pair when the value is a
      // scalar; just the key when it's a nested object (the inner
      // object's children get their own ranges via recursion).
      const span: JsonSpan =
        child.value.type === 'string' ? child.span : child.key.span
      results.add(simpurl('npm', pkgName), spanToRange(span, lineTable))
    }
    const { value } = child
    if (value.type === 'object') {
      parsePkgOverrideExternals(
        value,
        lineTable,
        results,
        pkgName ?? contextualName,
      )
    } else if (value.type === 'string') {
      if (value.value.startsWith('$')) {
        results.add(
          simpurl('npm', value.value.slice(1)),
          spanToRange(value.span, lineTable),
        )
      }
    }
  }
}

export function simpurl(eco: PURL_Type, name: string): SimPURL {
  if (eco === 'pypi') {
    name = name.replaceAll('-', '_')
  }
  return `pkg:${eco}/${name}`
}

export function spanToRange(span: JsonSpan, lineTable: number[]): vscode.Range {
  return new vscode.Range(
    offsetToPosition(span.start, lineTable),
    offsetToPosition(span.end, lineTable),
  )
}
