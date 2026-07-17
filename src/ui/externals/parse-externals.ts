import * as vscode from 'vscode'
import childProcess from 'node:child_process'
import * as path from 'node:path'
import { text } from 'node:stream/consumers'
import type { Span as JsonSpan, Value as JsonValue } from 'json-wasm'
import { getPythonInterpreter } from '../../data/python/interpreter'
import { getGlobPatterns } from '../../data/glob-patterns'
import { getGoExecutable } from '../../data/go/executable'
import pythonImportFinder from '../../data/python/import-finder.py'
import { generateNativeGoImportBinary } from '../../data/go/import-finder'
import {
  parseGoModExternals,
  parsePackageJsonExternals,
  parsePipfileExternals,
  parsePyprojectExternals,
  parseRequirementsExternals,
} from './manifest-file-externals'
import { parseJsExternalsFromSource } from './js-source-externals'
import {
  isSupportedLSPLanguageId,
  SUPPORTED_LSP_LANGUAGE_IDS_TO_PARSER,
} from '../languages'
import type { PURL_Type } from '../languages'

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
    globPatterns[eco]?.[file]?.pattern ?? ''
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
    if (SUPPORTED_LSP_LANGUAGE_IDS_TO_PARSER[languageId] === 'npm') {
      if (!parseJsExternalsFromSource(src, results)) {
        return undefined
      }
    } else if (SUPPORTED_LSP_LANGUAGE_IDS_TO_PARSER[languageId] === 'pypi') {
      const pythonInterpreter = await getPythonInterpreter(doc)
      if (pythonInterpreter) {
        // oxlint-disable-next-line socket/prefer-async-spawn -- need direct access to proc.stdin/stdout streams for piping source via stdin to the Python interpreter; @socketsecurity/lib/spawn buffers output.
        const proc = childProcess.spawn(pythonInterpreter.execPath, [
          '-c',
          pythonImportFinder,
        ])
        // socket-lint: allow bare-spawn-access -- `proc` is node:child_process.spawn (not the fleet wrapper), so it's a real ChildProcess with .stdin/.stdout.
        proc.stdin.end(src)
        // socket-lint: allow bare-spawn-access -- same: real ChildProcess, not the fleet spawn wrapper.
        const output = await text(proc.stdout)
        if (!output) {
          return undefined
        }
        const refs = hydrateJSONRefs(output)
        for (let i = 0, { length } = refs; i < length; i += 1) {
          const ref = refs[i]!
          results.add(simpurl('pypi', ref.name), ref.range)
        }
      } else {
        // fallback for web/whenever Python interpreter not available
        // Alternation is sorted (`from...` before `import...`); group numbering
        // follows — group 1 is the `from <mod> import ...` module name, group 2
        // is the `import <a>, <b>` comma-separated name list. See the `match[1]`
        // / `match[2]` usage below.
        const pyImportRE =
          /(?<=(?:^|\n)\s*)(?:from\s+(.+?)\s+import.+?|import\s+(.+?))(?=\s*(?:$|\n))/g
        const pyDynamicImportRE =
          /(?:__import__|import_module)\((?:"""(.+?)"""|'''(.+?)'''|"(.+?)"|'(.+?)'|)\)/g // socket-hook: allow regex-alternation-order
        let charInd = 0
        const lineChars = src
          .split('\n')
          .map(line => (charInd += line.length + 1))
        let match: RegExpExecArray | null = null
        for (let nl = 0; (match = pyImportRE.exec(src));) {
          while ((lineChars[nl] ?? Infinity) <= match.index) {
            ++nl
          }
          const names = match[2]
            ? match[2].split(',').map(v => v.trim())
            : [match[1]!]
          const startLine = nl,
            startCol = match.index - (nl && (lineChars[nl - 1] ?? 0))
          while ((lineChars[nl] ?? Infinity) <= match.index + match[0].length) {
            ++nl
          }
          const endLine = nl,
            endCol = match.index - (nl && (lineChars[nl - 1] ?? 0))
          const range = new vscode.Range(startLine, startCol, endLine, endCol)
          for (let i = 0, { length } = names; i < length; i += 1) {
            const name = names[i]!
            results.add(simpurl('pypi', name.split('.')[0]!), range)
          }
        }
        for (let nl = 0; (match = pyDynamicImportRE.exec(src));) {
          while ((lineChars[nl] ?? Infinity) <= match.index) {
            ++nl
          }
          const name = match[1] || match[2] || match[3] || match[4]
          if (!name) {
            continue
          }
          const startLine = nl,
            startCol = match.index - (nl && (lineChars[nl - 1] ?? 0))
          while ((lineChars[nl] ?? Infinity) <= match.index + match[0].length) {
            ++nl
          }
          const endLine = nl,
            endCol = match.index - (nl && (lineChars[nl - 1] ?? 0))
          const range = new vscode.Range(startLine, startCol, endLine, endCol)
          results.add(simpurl('pypi', name.split('.')[0]!), range)
        }
      }
    } else if (SUPPORTED_LSP_LANGUAGE_IDS_TO_PARSER[languageId] === 'golang') {
      const goExecutable = await getGoExecutable()
      if (goExecutable) {
        const importFinderBin = await generateNativeGoImportBinary(
          goExecutable.execPath,
        )
        // oxlint-disable-next-line socket/prefer-async-spawn -- need direct access to proc.stdin/stdout streams for piping source via stdin to the Go import-finder binary; @socketsecurity/lib/spawn buffers output.
        const proc = childProcess.spawn(importFinderBin)
        // socket-lint: allow bare-spawn-access -- `proc` is node:child_process.spawn (not the fleet wrapper), so it's a real ChildProcess with .stdin/.stdout.
        proc.stdin.end(src)
        // socket-lint: allow bare-spawn-access -- same: real ChildProcess, not the fleet spawn wrapper.
        const output = await text(proc.stdout)
        if (!output) {
          return undefined
        }
        const refs = hydrateJSONRefs(output)
        for (let i = 0, { length } = refs; i < length; i += 1) {
          const ref = refs[i]!
          results.add(simpurl('golang', ref.name), ref.range)
        }
      } else {
        const goImportRE =
          /(?<=(?:^|\n)\s*?)(import\s*(?:\s[^\s("`]+\s*)?)("|`)([^\s"`]+)("|`)(?=\s*?(?:$|\n))/g // socket-hook: allow regex-alternation-order
        const goImportBlockStartRE = /(?<=(?:^|\n)\s*?)import\s*\(/g // socket-hook: allow regex-alternation-order
        const goImportBlockRE =
          /(;|\(|\n)(\s*(?:\s[^\s("`]+\s*)?)("|`)([^\s"`]+)("|`)\s*?(?:;|\)|\n)/y
        let charInd = 0
        const lineChars = src
          .split('\n')
          .map(line => (charInd += line.length + 1))
        let match: RegExpExecArray | null = null
        for (let nl = 0; (match = goImportRE.exec(src));) {
          while ((lineChars[nl] ?? Infinity) <= match.index) {
            ++nl
          }
          const name = match[3]
          if (!name) {
            continue
          }
          const line = nl
          const startCol =
            match.index -
            (nl && (lineChars[nl - 1] ?? 0)) +
            (match[1] || '').length
          const endCol = startCol + name.length + 2

          const range = new vscode.Range(line, startCol, line, endCol)
          let realName = name
          if (match[2] === '"' && match[4] === '"') {
            try {
              realName = JSON.parse(`"${realName}"`)
            } catch {
              // just use original
            }
          }
          results.add(simpurl('golang', realName), range)
        }
        for (let nl = 0; (match = goImportBlockStartRE.exec(src));) {
          goImportBlockRE.lastIndex = match.index + match[0].length - 1
          for (
            let imMatch: RegExpExecArray | null = null;
            (imMatch = goImportBlockRE.exec(src));
          ) {
            const name = imMatch[4]
            if (!name) {
              continue
            }
            const imInd =
              imMatch.index +
              (imMatch[1] || '').length +
              (imMatch[2] || '').length
            while ((lineChars[nl] ?? Infinity) <= imInd) {
              ++nl
            }
            const startCol = imInd - (nl && (lineChars[nl - 1] ?? 0))
            const line = nl
            const endCol = startCol + name.length + 2
            const range = new vscode.Range(line, startCol, line, endCol)
            let realName = name

            if (imMatch[3] === '"' && imMatch[5] === '"') {
              try {
                realName = JSON.parse(`"${realName}"`)
              } catch {
                // just use original
              }
            }

            results.add(simpurl('golang', realName), range)
            goImportBlockRE.lastIndex = goImportBlockStartRE.lastIndex =
              imMatch.index + imMatch[0].length - 1
          }
          goImportBlockStartRE.lastIndex += 1
        }
      }
    }
  } else {
    return undefined
  }
  return results.externals
}
export function parsePkgOverrideExternals(
  node: Extract<JsonValue, { type: 'object' }>,
  lineTable: number[],
  results: ExternalPurlRangeManager,
  contextualName?: string,
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
