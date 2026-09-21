import * as vscode from 'vscode'
import childProcess from 'node:child_process'
import { text } from 'node:stream/consumers'
import { getPythonInterpreter } from '../../data/python/interpreter.mts'
import { getGoExecutable } from '../../data/go/executable.mts'
import pythonImportFinder from '../../data/python/import-finder.py'
import { generateNativeGoImportBinary } from '../../data/go/import-finder.mts'
import { hydrateJSONRefs, simpurl } from './parse-externals.mts'
import type { ExternalPurlRangeManager } from './parse-externals.mts'

export function parseGoImportsFromSource(
  src: string,
  results: ExternalPurlRangeManager,
): void {
  const goImportRE =
    /(?<=(?:^|\n)\s*?)(import\s*(?:\s[^\s("`]+\s*)?)("|`)([^\s"`]+)("|`)(?=\s*?(?:$|\n))/g // socket-hook: allow regex-alternation-order
  const goImportBlockStartRE = /(?<=(?:^|\n)\s*?)import\s*\(/g // socket-hook: allow regex-alternation-order
  const goImportBlockRE =
    /(;|\(|\n)(\s*(?:\s[^\s("`]+\s*)?)("|`)([^\s"`]+)("|`)\s*?(?:;|\)|\n)/y
  let charInd = 0
  const lineChars = src.split(/\r?\n/).map(line => (charInd += line.length + 1))
  let match: RegExpExecArray | null = null
  function parseStaticImports(): void {
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
        match.index - (nl && (lineChars[nl - 1] ?? 0)) + (match[1] || '').length
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
  }
  function parseAdditionalImports(): void {
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
          imMatch.index + (imMatch[1] || '').length + (imMatch[2] || '').length
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
  parseStaticImports()
  parseAdditionalImports()
}
export async function parseGoSourceExternals(
  src: string,
  results: ExternalPurlRangeManager,
): Promise<boolean> {
  const goExecutable = await getGoExecutable()
  if (goExecutable) {
    const importFinderBin = await generateNativeGoImportBinary(
      goExecutable.execPath,
    )
    // oxlint-disable-next-line socket/prefer-async-spawn -- stream input.
    const proc = childProcess.spawn(importFinderBin)
    // oxlint-disable-next-line socket/no-bare-spawn-childproc-access -- `proc` is node:child_process.spawn (not the fleet wrapper), so it's a real ChildProcess with .stdin/.stdout.
    proc.stdin.end(src)
    // oxlint-disable-next-line socket/no-bare-spawn-childproc-access -- real ChildProcess .stdout is accessed for piping to text consumer.
    const output = await text(proc.stdout)
    if (!output) {
      return false
    }
    const refs = hydrateJSONRefs(output)
    for (let i = 0, { length } = refs; i < length; i += 1) {
      const ref = refs[i]!
      results.add(simpurl('golang', ref.name), ref.range)
    }
  } else {
    parseGoImportsFromSource(src, results)
  }
  return true
}

export function parsePythonImportsFromSource(
  src: string,
  results: ExternalPurlRangeManager,
): void {
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
  const lineChars = src.split(/\r?\n/).map(line => (charInd += line.length + 1))
  let match: RegExpExecArray | null = null
  function parseStaticImports(): void {
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
  }
  function parseAdditionalImports(): void {
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
  parseStaticImports()
  parseAdditionalImports()
}

export async function parsePythonSourceExternals(
  doc: vscode.TextDocument,
  src: string,
  results: ExternalPurlRangeManager,
): Promise<boolean> {
  const pythonInterpreter = await getPythonInterpreter(doc)
  if (pythonInterpreter) {
    // oxlint-disable-next-line socket/prefer-async-spawn -- stream input.
    const proc = childProcess.spawn(pythonInterpreter.execPath, [
      '-c',
      pythonImportFinder,
    ])
    // oxlint-disable-next-line socket/no-bare-spawn-childproc-access -- `proc` is node:child_process.spawn (not the fleet wrapper), so it's a real ChildProcess with .stdin/.stdout.
    proc.stdin.end(src)
    // oxlint-disable-next-line socket/no-bare-spawn-childproc-access -- real ChildProcess .stdout is accessed for piping to text consumer.
    const output = await text(proc.stdout)
    if (!output) {
      return false
    }
    const refs = hydrateJSONRefs(output)
    for (let i = 0, { length } = refs; i < length; i += 1) {
      const ref = refs[i]!
      results.add(simpurl('pypi', ref.name), ref.range)
    }
  } else {
    parsePythonImportsFromSource(src, results)
  }
  return true
}
