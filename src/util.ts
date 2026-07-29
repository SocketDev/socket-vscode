import * as vscode from 'vscode'

export const DIAGNOSTIC_SOURCE_STR = 'SocketSecurity'
export const EXTENSION_PREFIX = 'socket-security'

export function addDisposablesTo(
  all?: vscode.Disposable[] | undefined,
  ...disposables: vscode.Disposable[]
): void {
  if (all) {
    all.push(...disposables)
  }
}

// Characters that let a value change the structure of what it is embedded in:
// the five HTML entities, plus the markdown punctuation that can open a link,
// an image, emphasis, code, or a new table column.
const MARKDOWN_HTML_SPECIAL_RE = /[&<>"'\\`*_[\]()|]/g
const HTML_ENTITIES: Record<string, string> = {
  __proto__: null as never,
  "'": '&#39;',
  '"': '&quot;',
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
}

// Percent-encode the destination of a markdown link. `encodeURI` leaves the
// path structure (`/`, `@`, `:`) readable but does not touch the parentheses
// that terminate a `[text](url)` destination, nor the `?`/`#` that would graft
// a query or fragment onto the Socket URL being built.
const URL_STRUCTURAL_RE = /[()#?]/g

/**
 * Encode an untrusted value for use inside a markdown link destination.
 */
export function encodeMarkdownLinkUrl(value: string): string {
  return encodeURI(value).replace(
    URL_STRUCTURAL_RE,
    char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

/**
 * Render an untrusted value as literal text inside a `vscode.MarkdownString`.
 * Two layers, one pass: HTML entities keep the value out of the HTML parser
 * that `supportHtml` turns on, and backslash escapes keep it from opening a
 * markdown link, image, or table column. Substitutions never collide — an
 * emitted entity contains no markdown punctuation and an emitted backslash is
 * not an HTML special — so a single pass cannot double-escape.
 */
export function escapeMarkdownHtml(value: string): string {
  return value.replace(
    MARKDOWN_HTML_SPECIAL_RE,
    char => HTML_ENTITIES[char] ?? `\\${char}`,
  )
}

export function flattenGlob(glob: string) {
  type Item = Alternation | Concatenation | string
  // Cap total brace-expansion so a crafted pattern (nested/repeated `{a,b}`
  // groups expand as a cartesian product) can't blow the joined result past
  // V8's max string length and throw. flattenGlob must be total — it runs on
  // untrusted scanned-manifest globs via caseDesensitize(flattenGlob(...)).
  const MAX_EXPANSION = 10_000
  class ExpansionLimitError extends Error {}
  class Alternation {
    alternates: Item[]
    constructor(items: Alternation['alternates'] = []) {
      this.alternates = items
    }
    push(item: Item) {
      this.alternates.push(item)
    }
    explode(): string[] {
      const options: string[] = []
      const alternates = this.alternates
      for (let i = 0, { length } = alternates; i < length; i += 1) {
        const alternate = alternates[i]
        if (typeof alternate === 'string') {
          options.push(alternate)
        } else if (alternate instanceof Concatenation) {
          options.push(...alternate.explode())
        } else if (alternate instanceof Alternation) {
          options.push(...alternate.explode())
        }
        if (options.length > MAX_EXPANSION) {
          throw new ExpansionLimitError()
        }
      }
      return options
    }
  }

  class Concatenation {
    segments: Item[]
    constructor(items: Concatenation['segments'] = []) {
      this.segments = items
    }
    push(item: Item) {
      this.segments.push(item)
    }
    explode(): string[] {
      let prefixed = ['']
      const segments = this.segments
      for (let i = 0, { length } = segments; i < length; i += 1) {
        const segment = segments[i]
        let suffixes: string[]
        if (typeof segment === 'string') {
          suffixes = [segment]
        } else if (segment instanceof Concatenation) {
          suffixes = segment.explode()
        } else if (segment instanceof Alternation) {
          suffixes = segment.explode()
        } else {
          throw new Error('unreachable')
        }
        if (suffixes.length > 0) {
          if (prefixed.length * suffixes.length > MAX_EXPANSION) {
            throw new ExpansionLimitError()
          }
          prefixed = prefixed.flatMap(prefix => {
            return suffixes.map(suffix => `${prefix}${suffix}`)
          })
        }
      }
      return prefixed
    }
  }

  function explode(str: string) {
    // A backslash-escaped char, or a brace-expansion delimiter (`{`, `}`, `,`).
    const finder = /\\[\s\S]|[{},]/g
    const root = new Concatenation()
    const stack: Array<Alternation | Concatenation> = [root]
    let right = 0
    let match = finder.exec(str)
    while (match) {
      try {
        const c = match[0]
        if (c[0] === '\\') {
          const prefix = str.slice(right, match.index) + c
          const current = stack.at(-1)!
          current.push(prefix)
          continue
        } else if (c === '{') {
          const prefix = str.slice(right, match.index)
          const a = new Alternation()
          const conc = new Concatenation()
          const current = stack.at(-1)!
          current.push(prefix)
          current.push(a)
          a.push(conc)
          stack.push(a)
          stack.push(conc)
        } else if (c === '}') {
          const current = stack.at(-1)!
          if (stack.length <= 1) {
            current.push(c)
            continue
          }
          const tail = str.slice(right, match.index)
          const concat = stack.pop()!
          // Pop the matching Alternation off the stack so subsequent
          // segments resume in the parent context. The popped value
          // itself isn't needed — the side effect on `stack` is.
          stack.pop()
          concat.push(tail)
        } else if (c === ',') {
          const current = stack.at(-1)!
          if (stack.length <= 1) {
            current.push(c)
            continue
          }
          const tail = str.slice(right, match.index)
          const concat = stack.pop()!
          concat.push(tail)
          const next = new Concatenation()
          stack.at(-1)!.push(next)
          stack.push(next)
        }
      } finally {
        right = finder.lastIndex
        match = finder.exec(str)
      }
    }
    const tail = str.slice(right)
    stack.at(-1)!.push(tail)
    return root.explode()
  }

  let parts: string[]
  try {
    parts = explode(glob)
  } catch (e) {
    // Too many brace combinations to flatten safely — return the pattern
    // unexpanded rather than throw. The pattern is still a valid glob.
    if (e instanceof ExpansionLimitError) {
      return glob
    }
    throw e
  }
  return parts.length > 1 ? `{${parts.join(',')}}` : (parts[0] ?? '')
}

export function getWorkspaceFolderURI(from: vscode.Uri) {
  return vscode.workspace.getWorkspaceFolder(from)?.uri
}
