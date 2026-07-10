/**
 * @file JS/TS external-dependency extraction via acorn-wasm, split out of
 *   `parse-externals.ts` to keep the dispatcher under the file-size cap.
 *   Handles static `import`, dynamic `import()`, and `require()` — including
 *   compile-time-constant specifiers built from template literals / binary
 *   expressions (`require(`@babel/${'traverse'}`)`).
 */

import { parse as acornParse, simple as acornSimple } from 'acorn-wasm'
import * as vscode from 'vscode'

import {
  getJSPackageNameFromSpecifier,
  offsetToPosition,
  simpurl,
} from './parse-externals'

import type { ExternalPurlRangeManager } from './parse-externals'

// ESTree-shape AST node from acorn-wasm. Untyped because the wasm bindings
// hand back plain JS objects; we discriminate via node.type literals, the
// same way ESTree consumers do.
export type AcornNode = {
  type: string
  start: number
  end: number
  // type-specific extras tagged at use sites:
  [k: string]: unknown
}

/**
 * Parse `src` as JS/TS and add every `import` / dynamic `import()` /
 * `require()` specifier to `results`. Returns `false` on a syntax error (the
 * caller treats that as "bail with an undefined result", matching the prior
 * babel-based behavior).
 */
export function parseJsExternalsFromSource(
  src: string,
  results: ExternalPurlRangeManager,
): boolean {
  // acorn-wasm doesn't surface line/column locations on AST nodes; we get
  // byte offsets only. Build a one-time newline index over the source so
  // offset→{line, column} is O(log n) per lookup.
  const newlineOffsets: number[] = [0]
  for (let i = 0; i < src.length; i += 1) {
    if (src.charCodeAt(i) === 10 /* \n */) {
      newlineOffsets.push(i + 1)
    }
  }
  function addResult(node: AcornNode, specifier: string) {
    if (/^[./]/u.test(specifier)) {
      return
    }
    const pkgName = getJSPackageNameFromSpecifier(specifier)
    const range = new vscode.Range(
      offsetToPosition(node.start, newlineOffsets),
      offsetToPosition(node.end, newlineOffsets),
    )
    results.add(simpurl('npm', pkgName), range)
  }
  // Quick-parse upfront so a syntax error produces a null result (matches
  // the previous behavior of bailing on parser.parse throw). acorn-wasm's
  // `simple` parses internally too, but doesn't bubble a typed error in a
  // way the visitor pattern can handle cleanly.
  try {
    acornParse(src, { sourceType: 'module', ecmaVersion: 'latest' })
  } catch {
    return false
  }
  const kDYNAMIC_VALUE: unique symbol = Symbol('dynamic_value')
  type DYNAMIC_VALUE = typeof kDYNAMIC_VALUE
  type PRIMITIVE = bigint | boolean | null | number | string | undefined
  /**
   * Lazy evaluator for finding out if something is constant at compile time.
   * Used to recover string specifiers from things like
   * `require(`@babel/${'traverse'}`)` (constant template + BinaryExpression
   * concat etc.).
   *
   * Does not support compile-time symbols, regexp results, array literals, or
   * object literals — anything that returns a fresh object is treated as
   * DYNAMIC.
   *
   * @returns A function to compute the value (may be non-trivial cost)
   */
  function constFor(node: AcornNode): DYNAMIC_VALUE | (() => PRIMITIVE) {
    if (node.type === 'TemplateLiteral') {
      const quasis = node['quasis'] as Array<{
        value: { cooked?: string | undefined; raw: string }
      }>
      const expressions = node['expressions'] as AcornNode[]
      if (quasis.length === 1) {
        return () => quasis[0]!.value.cooked ?? quasis[0]!.value.raw
      }
      const constExps: Array<
        Exclude<ReturnType<typeof constFor>, DYNAMIC_VALUE>
      > = []
      for (let i = 0, { length } = expressions; i < length; i += 1) {
        const exp = expressions[i]!
        const constExp = constFor(exp)
        if (constExp === kDYNAMIC_VALUE) {
          return kDYNAMIC_VALUE
        }
        constExps.push(constExp)
      }
      return () => {
        let result = ''
        let i
        for (i = 0; i < quasis.length - 1; i += 1) {
          const cooked = quasis[i]!.value.cooked ?? quasis[i]!.value.raw
          result += `${cooked}${constExps[i]!()}`
        }
        const lastCooked = quasis[i]!.value.cooked ?? quasis[i]!.value.raw
        return `${result}${lastCooked}`
      }
    } else if (node.type === 'Literal') {
      // ESTree's `Literal` covers string, number, boolean, null,
      // bigint, regexp. acorn-wasm exposes:
      //   - regexp:   node.regex = { pattern, flags }, value = null/RegExp
      //   - bigint:   node.bigint = "<digits>", value = bigint
      //   - null:     value = null, raw = "null"
      //   - the rest: value = the literal value
      if ('regex' in node) {
        // RegExp literal — produces an object, treated as dynamic.
        return kDYNAMIC_VALUE
      }
      if ('bigint' in node) {
        const bigintStr = node['bigint'] as string
        return () => BigInt(bigintStr)
      }
      const value = node['value'] as PRIMITIVE
      return () => value
    } else if (node.type === 'BinaryExpression') {
      const left = constFor(node['left'] as AcornNode)
      if (left === kDYNAMIC_VALUE) {
        return kDYNAMIC_VALUE
      }
      const right = constFor(node['right'] as AcornNode)
      if (right === kDYNAMIC_VALUE) {
        return kDYNAMIC_VALUE
      }
      const operator = node['operator'] as string
      if (operator === 'in' || operator === 'instanceof') {
        return kDYNAMIC_VALUE
      }
      if (operator === '|>') {
        return kDYNAMIC_VALUE
      }
      // lots of TS unhappy with odd but valid coercions
      return (
        {
          '==': () => left() == right(),
          '!=': () => left() != right(),
          '===': () => left() === right(),
          '!==': () => left() !== right(),
          // @ts-expect-error
          '<': () => left() < right(),
          // @ts-expect-error
          '<=': () => left() <= right(),
          // @ts-expect-error
          '>': () => left() > right(),
          // @ts-expect-error
          '>=': () => left() >= right(),
          // @ts-expect-error
          '<<': () => left() << right(),
          // @ts-expect-error
          '>>': () => left() >> right(),
          // @ts-expect-error
          '>>>': () => left() >>> right(),
          // @ts-expect-error
          '+': () => left() + right(),
          // @ts-expect-error
          '-': () => left() - right(),
          // @ts-expect-error
          '*': () => left() * right(),
          // @ts-expect-error
          '/': () => left() / right(),
          // @ts-expect-error
          '%': () => left() % right(),
          // @ts-expect-error
          '&': () => left() & right(),
          // @ts-expect-error
          '|': () => left() | right(),
          // @ts-expect-error
          '^': () => left() ^ right(),
          // @ts-expect-error
          '**': () => left() ** right(),
        }[operator] ?? kDYNAMIC_VALUE
      )
    } else if (node.type === 'UnaryExpression') {
      const arg = constFor(node['argument'] as AcornNode)
      if (arg === kDYNAMIC_VALUE) {
        return kDYNAMIC_VALUE
      }
      const operator = node['operator'] as string
      if (operator === 'delete') {
        return kDYNAMIC_VALUE
      }
      if (operator === 'void') {
        return () => undefined
      }
      if (operator === 'throw') {
        return kDYNAMIC_VALUE
      }
      return (
        {
          // @ts-expect-error
          '-': () => -arg(),
          // @ts-expect-error
          '+': () => +arg(),
          '!': () => !arg(),
          // @ts-expect-error
          '~': () => ~arg(),
          typeof: () => typeof arg(),
        }[operator] ?? kDYNAMIC_VALUE
      )
    } else if (node.type === 'ParenthesizedExpression') {
      // ESTree doesn't always emit ParenthesizedExpression — most
      // parsers strip parens. Acorn does the same by default;
      // present here defensively in case of a future preserve-paren
      // option.
      return constFor(node['expression'] as AcornNode)
    } else if (node.type === 'AwaitExpression') {
      const argument = node['argument'] as AcornNode | undefined
      if (!argument) {
        return kDYNAMIC_VALUE
      }
      const arg = constFor(argument)
      if (arg === kDYNAMIC_VALUE) {
        return kDYNAMIC_VALUE
      }
      return arg
    }
    return kDYNAMIC_VALUE
  }
  // acorn-walk's `simple` walker passes the AST node directly (no path
  // wrapper). It doesn't expose path.skip() — but we don't need it:
  // ImportDeclaration's `source` is a Literal that the walker would visit
  // anyway, and we end up adding the same result twice if we don't dedup.
  // Deduping happens upstream in ExternalPurlRangeManager.add() via the
  // Range list (no Set semantics, so duplicates DO leak — preserves prior
  // behavior because babel had `path.skip()` only on ImportDeclaration).
  acornSimple(
    src,
    {
      ImportDeclaration(node: AcornNode) {
        const source = node['source'] as AcornNode & { value: string }
        addResult(source, `${source.value}`)
      },
      ImportExpression(node: AcornNode) {
        const constantArg = constFor(node['source'] as AcornNode)
        if (constantArg !== kDYNAMIC_VALUE) {
          addResult(node, `${constantArg()}`)
        }
      },
      CallExpression(node: AcornNode) {
        const callee = node['callee'] as AcornNode & {
          name?: string | undefined
        }
        const args = node['arguments'] as AcornNode[]
        if (args.length === 0) {
          return
        }
        const isRequire =
          callee.type === 'Identifier' && callee.name === 'require'
        // In ESTree, dynamic `import(x)` is normally an ImportExpression
        // node (handled above), but acorn-wasm emits some shapes as
        // CallExpression with callee.type === 'Import'. Defensive: handle
        // both surface shapes.
        const isDynamicImport = callee.type === 'Import'
        if (isRequire || isDynamicImport) {
          const firstArg = args[0]!
          const constantArg = constFor(firstArg)
          if (constantArg !== kDYNAMIC_VALUE) {
            addResult(node, `${constantArg()}`)
          }
        }
      },
    },
    { sourceType: 'module', ecmaVersion: 'latest' },
  )
  return true
}
