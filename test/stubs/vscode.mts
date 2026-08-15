/**
 * @file Stub for the `vscode` module, which only exists inside the extension
 *   host. Wired in as a resolve alias under `vitest.alias` in
 *   .config/repo/socket-wheelhouse.json so unit tests can import extension
 *   sources directly. Only the surface the tests under test/ actually touch is
 *   modelled; `setStubWorkspaceState` resets it between cases.
 */

import nodeFs from 'node:fs/promises'

export type StubWorkspaceState = {
  configuration: Record<string, unknown>
  fileTypes: Record<string, number>
  isTrusted: boolean
  workspaceFolders:
    | Array<{ uri: { scheme: string; fsPath: string } }>
    | undefined
}

export const errorMessages: string[] = []

const state: StubWorkspaceState = {
  configuration: {},
  fileTypes: {},
  isTrusted: true,
  workspaceFolders: undefined,
}

export function setStubWorkspaceState(next: Partial<StubWorkspaceState>): void {
  state.configuration = next.configuration ?? {}
  state.fileTypes = next.fileTypes ?? {}
  state.isTrusted = next.isTrusted ?? true
  state.workspaceFolders = next.workspaceFolders
  errorMessages.length = 0
}

export const FileType = {
  Unknown: 0,
  File: 1,
  Directory: 2,
  SymbolicLink: 64,
} as const

export class Position {
  line: number
  character: number
  constructor(line: number, character: number) {
    this.line = line
    this.character = character
  }
}

export class Range {
  start: Position
  end: Position
  constructor(
    startLine: number | Position,
    startCharacter: number | Position,
    endLine?: number | undefined,
    endCharacter?: number | undefined,
  ) {
    if (startLine instanceof Position && startCharacter instanceof Position) {
      this.start = startLine
      this.end = startCharacter
    } else {
      this.start = new Position(startLine as number, startCharacter as number)
      this.end = new Position(endLine as number, endCharacter as number)
    }
  }
  contains(position: Position): boolean {
    return (
      position.line >= this.start.line &&
      position.line <= this.end.line &&
      position.character >= this.start.character &&
      position.character <= this.end.character
    )
  }
}

export class Uri {
  scheme: string
  fsPath: string
  path: string
  constructor(scheme: string, fsPath: string) {
    this.scheme = scheme
    this.fsPath = fsPath
    this.path = fsPath
  }
  static file(fsPath: string): Uri {
    return new Uri('file', fsPath)
  }
  static parse(value: string): Uri {
    return new Uri(value.split(':')[0] ?? 'file', value)
  }
  toString(): string {
    return `${this.scheme}://${this.fsPath}`
  }
}

export class MarkdownString {
  value: string
  supportThemeIcons: boolean
  supportHtml: boolean | undefined = undefined
  isTrusted: boolean | undefined = undefined
  // Mirrors the host signature `MarkdownString(value?, supportThemeIcons?)`.
  // The second parameter is typed `unknown` so this stub does not declare a
  // boolean positional of its own, then narrowed on read.
  constructor(value: string = '', supportThemeIcons: unknown = false) {
    this.value = value
    this.supportThemeIcons = supportThemeIcons === true
  }
}

export class Hover {
  contents: MarkdownString
  range: Range | undefined
  constructor(contents: MarkdownString, range?: Range | undefined) {
    this.contents = contents
    this.range = range
  }
}

export class Disposable {
  #onDispose: () => void
  constructor(onDispose: () => void) {
    this.#onDispose = onDispose
  }
  dispose(): void {
    this.#onDispose()
  }
}

export class EventEmitter<T> {
  #listeners: Set<(value: T) => void> = new Set()
  event = (listener: (value: T) => void): Disposable => {
    this.#listeners.add(listener)
    return new Disposable(() => {
      this.#listeners.delete(listener)
    })
  }
  fire(value: T): void {
    // oxlint-disable-next-line socket/prefer-cached-for-loop -- iterating a Set.
    for (const listener of this.#listeners) {
      listener(value)
    }
  }
  dispose(): void {
    this.#listeners.clear()
  }
}

export const ConfigurationTarget = {
  Global: 1,
  Workspace: 2,
  WorkspaceFolder: 3,
} as const

export const workspace = {
  // Backed by the real filesystem so migration tests exercise real reads and
  // writes; `fileTypes` overrides stat for synthetic paths that never exist on
  // disk.
  fs: {
    async delete(uri: Uri): Promise<void> {
      await nodeFs.rm(uri.fsPath, { recursive: false })
    },
    async readFile(uri: Uri): Promise<Uint8Array> {
      return await nodeFs.readFile(uri.fsPath)
    },
    async stat(uri: Uri): Promise<{ type: number }> {
      const override = state.fileTypes[uri.fsPath]
      if (override !== undefined) {
        return { type: override }
      }
      // Stub must provide FileType metadata for file/dir distinction.
      // oxlint-disable-next-line socket/prefer-exists-sync -- stub
      const stats = await nodeFs.stat(uri.fsPath)
      return {
        type: stats.isDirectory()
          ? FileType.Directory
          : stats.isFile()
            ? FileType.File
            : FileType.Unknown,
      }
    },
    async writeFile(uri: Uri, content: Uint8Array): Promise<void> {
      await nodeFs.writeFile(uri.fsPath, content)
    },
  },
  getConfiguration(_section?: string | undefined) {
    return {
      get(key: string, fallback?: unknown | undefined) {
        return Object.hasOwn(state.configuration, key)
          ? state.configuration[key]
          : fallback
      },
      async update(
        _key: string,
        _value: unknown,
        _target?: unknown | undefined,
      ) {},
    }
  },
  get isTrusted(): boolean {
    return state.isTrusted
  },
  onDidGrantWorkspaceTrust(_listener: () => void): Disposable {
    return new Disposable(() => {})
  },
  get workspaceFolders() {
    return state.workspaceFolders
  },
}

export const window = {
  createStatusBarItem(
    _alignment?: number | undefined,
    _priority?: number | undefined,
  ) {
    return {
      command: '',
      dispose() {},
      hide() {},
      show() {},
      text: '',
      tooltip: '',
    }
  },
  createTextEditorDecorationType(options: unknown) {
    return { key: JSON.stringify(options), dispose() {} }
  },
  showErrorMessage(message: string, ..._items: string[]) {
    errorMessages.push(message)
    return Promise.resolve(undefined)
  },
}

export const extensions = {
  getExtension(_id: string): undefined {
    return undefined
  },
}

export const StatusBarAlignment = {
  Left: 1,
  Right: 2,
} as const

/**
 * Options every `authentication.getSession` call was made with, in order.
 */
export const getSessionCalls: Array<Record<string, unknown>> = []

/**
 * Command id to handler, as registered via `commands.registerCommand`.
 */
export const registeredCommands: Map<string, (...args: unknown[]) => unknown> =
  new Map()

let getSessionResult: () => Promise<unknown> = () => Promise.resolve(undefined)

/**
 * Set what the next `authentication.getSession` calls do. Pass a rejecting
 * thunk to model the user dismissing the token prompt, which VSCode surfaces
 * as a rejection rather than an `undefined` session.
 */
export function setStubGetSessionResult(next: () => Promise<unknown>): void {
  getSessionResult = next
}

export function resetStubAuthState(): void {
  getSessionCalls.length = 0
  registeredCommands.clear()
  getSessionResult = () => Promise.resolve(undefined)
}

export const authentication = {
  getSession(
    _providerId: string,
    _scopes: string[],
    options: Record<string, unknown>,
  ): Promise<unknown> {
    getSessionCalls.push(options)
    return getSessionResult()
  },
  registerAuthenticationProvider(
    _id: string,
    _label: string,
    _provider: unknown,
  ): Disposable {
    return new Disposable(() => {})
  },
}

export const commands = {
  registerCommand(
    command: string,
    callback: (...args: unknown[]) => unknown,
  ): Disposable {
    registeredCommands.set(command, callback)
    return new Disposable(() => {})
  },
}
