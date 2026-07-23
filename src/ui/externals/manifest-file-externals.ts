/**
 * @file Dependency-manifest external extraction (package.json, pyproject.toml,
 *   Pipfile, requirements.txt, go.mod), split out of `parse-externals.ts` to
 *   keep the dispatcher under the file-size cap.
 */

import * as vscode from 'vscode'
import { parse as parseJson } from 'json-wasm'
import { parse as parseToml, traverseTomlKeys } from 'toml-wasm'

import { parseGoMod } from '../../data/go/mod-parser'

import {
  buildLineTable,
  parsePkgOverrideExternals,
  simpurl,
  spanToRange,
} from './parse-externals'

import type { Value as JsonValue } from 'json-wasm'
import type { ParsedToml } from 'toml-wasm'
import type { ExternalPurlRangeManager } from './parse-externals'

// PEP 508 dependency-specifier package name: letters/digits (optionally
// hyphen/dot/underscore-separated), stopping before a version/extras/marker
// delimiter.
const pep508RE =
  /(?<=^\s*)([A-Z0-9]|[A-Z0-9][A-Z0-9._-]*[A-Z0-9])(?=<|!|>|~|=|@|\(|\[|;|\s|$)/i

/**
 * Extract `require` / `replace` entries (minus `exclude`d modules) from a
 * `go.mod`. Returns `false` when `go.mod` can't be parsed.
 */
export async function parseGoModExternals(
  src: string,
  results: ExternalPurlRangeManager,
): Promise<boolean> {
  const parsed = await parseGoMod(src)
  if (!parsed) {
    return false
  }

  const exclusions: Set<string> = new Set()
  const excludes = parsed.Exclude ?? []
  for (let i = 0, { length } = excludes; i < length; i += 1) {
    const exclude = excludes[i]!
    exclusions.add(exclude.Mod.Path)
  }

  const requires = parsed.Require ?? []
  for (let i = 0, { length } = requires; i < length; i += 1) {
    const req = requires[i]!
    if (exclusions.has(req.Mod.Path)) {
      continue
    }
    results.add(
      simpurl('golang', req.Mod.Path),
      new vscode.Range(
        new vscode.Position(
          req.Syntax.Start.Line - 1,
          req.Syntax.Start.LineRune - 1,
        ),
        new vscode.Position(
          req.Syntax.End.Line - 1,
          req.Syntax.End.LineRune - 1,
        ),
      ),
    )
  }

  const replaces = parsed.Replace ?? []
  for (let i = 0, { length } = replaces; i < length; i += 1) {
    const repl = replaces[i]!
    if (exclusions.has(repl.New.Path)) {
      continue
    }
    results.add(
      simpurl('golang', repl.New.Path),
      new vscode.Range(
        new vscode.Position(
          repl.Syntax.Start.Line - 1,
          repl.Syntax.Start.LineRune - 1,
        ),
        new vscode.Position(
          repl.Syntax.End.Line - 1,
          repl.Syntax.End.LineRune - 1,
        ),
      ),
    )
  }
  return true
}

/**
 * Extract `dependencies` / `devDependencies` / `optionalDependencies` /
 * `peerDependencies` / `bundledDependencies` / `overrides` from a
 * `package.json`. Returns `false` on a parse failure (caller bails with an
 * undefined result).
 */
export function parsePackageJsonExternals(
  src: string,
  results: ExternalPurlRangeManager,
): boolean {
  let pkg: JsonValue
  try {
    pkg = parseJson(src).root
  } catch {
    return false
  }
  if (pkg.type !== 'object') {
    return false
  }
  const lineTable = buildLineTable(src)

  const pkgMembers = pkg.members
  for (let i = 0, { length } = pkgMembers; i < length; i += 1) {
    const pkgField = pkgMembers[i]!
    if (
      pkgField.key.value === 'dependencies' ||
      pkgField.key.value === 'devDependencies' ||
      pkgField.key.value === 'optionalDependencies' ||
      pkgField.key.value === 'peerDependencies'
    ) {
      if (pkgField.value.type === 'object') {
        const depMembers = pkgField.value.members
        for (
          let j = 0, { length: depLength } = depMembers;
          j < depLength;
          j += 1
        ) {
          const v = depMembers[j]!
          results.add(
            simpurl('npm', v.key.value),
            spanToRange(v.span, lineTable),
          )
        }
      }
    }
    if (pkgField.key.value === 'bundledDependencies') {
      if (pkgField.value.type === 'array') {
        const items = pkgField.value.items
        for (
          let j = 0, { length: itemsLength } = items;
          j < itemsLength;
          j += 1
        ) {
          const node = items[j]!
          if (node.type === 'string') {
            results.add(
              simpurl('npm', node.value),
              spanToRange(node.span, lineTable),
            )
          }
        }
      }
    }
    if (pkgField.key.value === 'overrides') {
      if (pkgField.value.type === 'object') {
        parsePkgOverrideExternals(pkgField.value, lineTable, results)
      }
    }
  }
  return true
}

/**
 * Extract `[packages]` / `[dev-packages]` from a `Pipfile`. Returns `false` on
 * a parse failure.
 */
export function parsePipfileExternals(
  src: string,
  results: ExternalPurlRangeManager,
): boolean {
  let parsed: ParsedToml
  try {
    parsed = parseToml(src)
  } catch {
    return false
  }
  const lineTable = buildLineTable(src)
  traverseTomlKeys(parsed, ({ path: keyPath, entrySpan }) => {
    if (
      keyPath.length === 2 &&
      ['packages', 'dev-packages'].includes(keyPath[0] as string) &&
      typeof keyPath[1] === 'string'
    ) {
      results.add(
        simpurl('pypi', keyPath[1]),
        spanToRange(entrySpan, lineTable),
      )
    }
  })
  return true
}

/**
 * Extract `[project].dependencies` / `[project.optional-dependencies].*` /
 * Poetry `[tool.poetry.(dev-)dependencies]` /
 * `[tool.poetry.group.*.dependencies]` from a `pyproject.toml`. Returns `false`
 * on a parse failure.
 */
export function parsePyprojectExternals(
  src: string,
  results: ExternalPurlRangeManager,
): boolean {
  let parsed: ParsedToml
  try {
    parsed = parseToml(src)
  } catch {
    return false
  }
  const lineTable = buildLineTable(src)
  traverseTomlKeys(parsed, ({ path: keyPath, entrySpan, value }) => {
    const isDepsArray =
      keyPath.length === 2 &&
      keyPath[0] === 'project' &&
      keyPath[1] === 'dependencies'
    const isOptionalDepsArray =
      keyPath.length === 3 &&
      keyPath[0] === 'project' &&
      keyPath[1] === 'optional-dependencies' &&
      typeof keyPath[2] === 'string'
    const inPoetry =
      keyPath.length > 2 && keyPath[0] === 'tool' && keyPath[1] === 'poetry'
    const isOldPoetryDep =
      inPoetry &&
      keyPath.length === 4 &&
      ['dependencies', 'dev-dependencies'].includes(keyPath[2] as string)
    const isGroupPoetryDep =
      inPoetry &&
      keyPath.length === 6 &&
      keyPath[2] === 'group' &&
      keyPath[4] === 'dependencies'
    if (
      (isOldPoetryDep || isGroupPoetryDep) &&
      typeof keyPath[keyPath.length - 1] === 'string'
    ) {
      results.add(
        simpurl('pypi', keyPath[keyPath.length - 1] as string),
        spanToRange(entrySpan, lineTable),
      )
    } else if ((isDepsArray || isOptionalDepsArray) && value.type === 'array') {
      const items = value.items
      for (let i = 0, { length } = items; i < length; i += 1) {
        const depNode = items[i]!
        if (depNode.type !== 'string') {
          continue
        }
        const match = pep508RE.exec(depNode.value)
        if (!match) {
          continue
        }
        results.add(
          simpurl('pypi', match[1]!),
          spanToRange(depNode.span, lineTable),
        )
      }
    }
  })
  return true
}

/**
 * Extract PEP 508 dependency specifiers from a `requirements.txt`.
 */
export function parseRequirementsExternals(
  src: string,
  results: ExternalPurlRangeManager,
): void {
  const commentRE = /(\s|^)#.*/
  const lines = src.split('\n').map(line => line.replace(commentRE, ''))
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i]!
    const match = pep508RE.exec(line)
    if (match) {
      results.add(
        simpurl('pypi', match[1]!),
        new vscode.Range(
          new vscode.Position(i, match.index),
          new vscode.Position(i, match.index + line.length),
        ),
      )
    }
  }
}
