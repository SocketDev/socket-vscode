import * as vscode from 'vscode'
import type { SimPURL } from './externals/parse-externals'
import { PURLDataCache } from './purl-alerts-and-scores/manager'
import type { PackageScoreAndAlerts } from './purl-alerts-and-scores/manager'
import { isGoBuiltin } from '../data/go/builtins'
import type { PURLPackageData } from './purl-alerts-and-scores/manager'
import { SUPPORTED_LSP_LANGUAGE_IDS_TO_PARSER } from './languages'
import { isPythonBuiltin } from '../data/python/interpreter'
import * as Module from 'node:module'
import { getGlobPatterns } from '../data/glob-patterns'
import { DecorationManagerForDocument } from './decoration-manager-for-document'

export async function activate(context: vscode.ExtensionContext) {
  const decoManager = new DecorationManager(context)
  const langs = Object.keys(SUPPORTED_LSP_LANGUAGE_IDS_TO_PARSER)
  for (let i = 0, { length } = langs; i < length; i += 1) {
    const lang = langs[i]!
    vscode.languages.registerHoverProvider(
      {
        language: lang,
      },
      {
        provideHover(document, position) {
          return decoManager.docManagers
            .get(document.uri.toString() as TextDocumentURIString)
            ?.provideHover(document, position)
        },
      },
    )
  }
  const patterns = await getGlobPatterns()
  const groupEntries = Object.entries(patterns)
  for (let i = 0, { length } = groupEntries; i < length; i += 1) {
    const patternsForGroup = groupEntries[i]![1]
    const groupEntryRows = Object.entries(patternsForGroup)
    for (
      let j = 0, { length: rowLength } = groupEntryRows;
      j < rowLength;
      j += 1
    ) {
      const { pattern } = groupEntryRows[j]![1]
      vscode.languages.registerHoverProvider(
        {
          // language: 'json',
          pattern,
        },
        {
          provideHover(document, position) {
            return decoManager.docManagers
              .get(document.uri.toString() as TextDocumentURIString)
              ?.provideHover(document, position)
          },
        },
      )
    }
  }
}
export class DecorationTypes {
  informativeDecoration: vscode.TextEditorDecorationType
  warningDecoration: vscode.TextEditorDecorationType
  errorDecoration: vscode.TextEditorDecorationType
  constructor(context: vscode.ExtensionContext) {
    this.errorDecoration = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      after: {
        margin: '0 0 0 2rem',
        contentIconPath: vscode.Uri.file(
          context.asAbsolutePath('logo-red.svg'),
        ),
        width: '12px',
        height: '12px',
      },
    })
    // logger.debug('Created error decoration', this.errorDecoration.key);
    this.warningDecoration = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      after: {
        margin: '0 0 0 2rem',
        contentIconPath: vscode.Uri.file(
          context.asAbsolutePath('logo-yellow.svg'),
        ),
        width: '12px',
        height: '12px',
      },
    })
    // logger.debug('Created warning decoration', this.warningDecoration.key);
    this.informativeDecoration = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
    })
    // logger.debug('Created informative decoration', this.informativeDecoration.key);
  }
}

export class DecorationManager {
  docManagers: Map<TextDocumentURIString, DecorationManagerForDocument> =
    new Map()
  docChangeWatchers: vscode.Disposable
  docCloseWatchers: vscode.Disposable
  docOpenWatchers: vscode.Disposable
  editorChangeWatchers: vscode.Disposable
  purlManagers: DecorationManagerForPURLCache

  constructor(context: vscode.ExtensionContext) {
    const decorationTypes = new DecorationTypes(context)
    this.purlManagers = new DecorationManagerForPURLCache(decorationTypes)
    function updateDoc(doc: vscode.TextDocument) {
      const docURI = doc.uri.toString() as TextDocumentURIString
      if (docURI.startsWith('output:')) {
        return // ignore output documents
      }
      const manager = managerForDoc(docURI)
      void manager.update(doc)
    }
    const managerForDoc = (docURI: TextDocumentURIString) => {
      let manager = this.docManagers.get(docURI)
      if (!manager) {
        manager = new DecorationManagerForDocument(
          docURI,
          decorationTypes,
          this.purlManagers,
        )
        this.docManagers.set(docURI, manager)
      }
      return manager
    }
    const visibleEditors = vscode.window.visibleTextEditors
    for (let i = 0, { length } = visibleEditors; i < length; i += 1) {
      const editor = visibleEditors[i]!
      const docURI = editor.document.uri.toString() as TextDocumentURIString
      const manager = managerForDoc(docURI)
      void manager.update(editor.document)
    }
    this.docChangeWatchers = vscode.workspace.onDidChangeTextDocument(doc => {
      let hasMeaningfulChange = false
      if (!hasMeaningfulChange) {
        const { contentChanges } = doc
        for (let i = 0, { length } = contentChanges; i < length; i += 1) {
          const docChange = contentChanges[i]!
          if (docChange.rangeLength !== 0) {
            hasMeaningfulChange = true
            break
          }
          if (docChange.text && docChange.text !== '') {
            hasMeaningfulChange = true
            break
          }
        }
      }
      if (!hasMeaningfulChange) {
        return // no meaningful change, skip
      }
      updateDoc(doc.document)
    })
    this.docCloseWatchers = vscode.workspace.onDidCloseTextDocument(doc => {
      const docURI = doc.uri.toString() as TextDocumentURIString
      this.docManagers.get(docURI)?.currentDocUpdate.abort()
      this.docManagers.delete(docURI)
    })
    this.docOpenWatchers = vscode.workspace.onDidOpenTextDocument(doc => {
      updateDoc(doc)
    })
    this.editorChangeWatchers = vscode.window.onDidChangeVisibleTextEditors(
      editors => {
        for (let i = 0, { length } = editors; i < length; i += 1) {
          const editor = editors[i]!
          const docURI = editor.document.uri.toString() as TextDocumentURIString
          const manager = managerForDoc(docURI)
          void manager.decorateEditor(editor)
        }
      },
    )
  }

  dispose() {
    // oxlint-disable-next-line socket/prefer-cached-for-loop -- iterating a Map's values iterator.
    for (const manager of this.docManagers.values()) {
      manager.currentDocUpdate.abort()
    }
  }
}
export class DecorationManagerForPURLCache {
  purlManagers: Map<SimPURL, DecorationManagerForPURL> = new Map()
  decorationTypes: DecorationTypes
  constructor(decorationTypes: DecorationTypes) {
    this.decorationTypes = decorationTypes
  }
  for(purl: SimPURL) {
    let manager = this.purlManagers.get(purl)
    if (!manager) {
      manager = new DecorationManagerForPURL(purl, this.decorationTypes)
      this.purlManagers.set(purl, manager)
    }
    return manager
  }
}

const isNodeBuiltin: (name: string) => boolean = Module.isBuiltin

export function getPURLParts(purl: SimPURL): { eco: string; name: string } {
  const groups = /^pkg:(?<eco>[^\/]+)\/(?<name>.*)$/v.exec(purl)?.groups
  return (
    (groups as {
      eco: string
      name: string
    }) ?? { eco: 'unknown', name: 'unknown' }
  )
}

export function isBuiltin(name: string, eco: string): boolean {
  if (eco === 'npm') {
    return isNodeBuiltin(name)
  }
  if (eco === 'pypi') {
    return isPythonBuiltin(name)
  }
  if (eco === 'go') {
    return isGoBuiltin(name)
  }
  return false
}

export function isLocalPackage(name: string, eco: string): boolean {
  if (eco === 'npm') {
    return name.startsWith('.') || name.startsWith('/') || name.startsWith('#')
  }
  if (eco === 'pypi') {
    return name.startsWith('.')
  }
  if (eco === 'go') {
    const parts = name.split('/')
    const first = parts[0]
    if (!first) {
      return false
    }
    return (
      parts.some(p => p.startsWith('.')) ||
      !first.includes('.') ||
      !/[a-z0-9][a-z0-9.-]*/.test(first)
    )
  }
  return false
}
export class DecorationManagerForPURL {
  documentManagersForDocumentsWithThisPURL: Set<DecorationManagerForDocument> =
    new Set()
  subscribe(manager: DecorationManagerForDocument): void {
    this.documentManagersForDocumentsWithThisPURL.add(manager)
  }
  unsubscribe(manager: DecorationManagerForDocument): void {
    this.documentManagersForDocumentsWithThisPURL.delete(manager)
  }
  purl: SimPURL
  packageData: PURLPackageData | undefined = undefined
  decorationType: vscode.TextEditorDecorationType
  decorationTypes: DecorationTypes
  isBuiltin: boolean
  isLocalPackage: boolean
  subscriptionCallback?: ((data: PURLPackageData) => void) | undefined
  constructor(purl: SimPURL, decorationTypes: DecorationTypes) {
    this.purl = purl
    this.decorationTypes = decorationTypes
    this.decorationType = this.decorationTypes.informativeDecoration
    const { eco, name } = getPURLParts(purl)
    // we don't need to watch for builtin or local packages
    this.isBuiltin = isBuiltin(name, eco)
    this.isLocalPackage = isLocalPackage(name, eco)
    if (this.isBuiltin || this.isLocalPackage) {
      return
    }
    this.subscriptionCallback = data => {
      this.packageData = data
      this.#eagerDecoration()
      // oxlint-disable-next-line socket/prefer-cached-for-loop -- iterating a Set.
      for (const manager of this.documentManagersForDocumentsWithThisPURL) {
        void manager.markDirty(manager.currentDocUpdate.signal)
      }
    }
    const watcher = PURLDataCache.singleton.watch(this.purl)
    this.subscriptionCallback(watcher)
    watcher.subscribe(this.subscriptionCallback)
  }
  linkForPURL(data: PURLPackageData): string {
    const pkgData = data?.pkgData
    if (!pkgData) {
      return `[${this.purl} $(link-external)](https://socket.dev/${this.purl})`
    }
    let type = pkgData.type
    let version = `/overview/${pkgData.version}`
    if (type === 'golang') {
      type = 'go'
      version = `?section=overview&version=${pkgData.version}`
    }
    return `[${pkgData.name} $(link-external)](https://socket.dev/${type}/package/${pkgData.namespace ? pkgData.namespace + '/' : ''}${pkgData.name}${version})`
  }
  dispose() {
    if (this.subscriptionCallback) {
      PURLDataCache.singleton
        .watch(this.purl)
        .unsubscribe(this.subscriptionCallback)
    }
  }
  async generateHoverMarkdown(): Promise<vscode.MarkdownString> {
    if (this.isBuiltin) {
      return new vscode.MarkdownString(
        `Socket Security for ${this.purl} : Builtin package`,
        true,
      )
    } else if (this.isLocalPackage) {
      return new vscode.MarkdownString(
        `Socket Security for ${this.purl} : Local package (likely installed as an alias)`,
        true,
      )
    }
    const data = this.packageData
    if (!data) {
      return new vscode.MarkdownString(
        `&hellip; fetching Socket Security for ${this.purl} &hellip;`,
        true,
      )
    }
    const pkgData = data?.pkgData
    if (!pkgData) {
      if (data.error) {
        return new vscode.MarkdownString(
          `Socket Security for ${this.linkForPURL(data)}: ${data.error}`,
          true,
        )
      } else {
        return new vscode.MarkdownString(
          `&hellip; fetching Socket Security for ${this.linkForPURL(data)} &hellip;`,
          true,
        )
      }
    }
    const {
      score: { overall: depscore },
    } = pkgData
    const { eco } = getPURLParts(this.purl)
    const depscoreStr = (depscore * 100).toFixed(0)
    const groupedAlerts = Object.groupBy(pkgData.alerts, alert => alert.action)

    function rowsForGrouping(
      actionGroupedAlertSet: PackageScoreAndAlerts['alerts'] | undefined,
    ): string {
      if (!actionGroupedAlertSet) {
        return ''
      }
      const ret: string[] = []
      const color = (hex: string, text: string) =>
        `<span style="color:${hex};">${text}</span>`
      // grouping is intentionally lossy — fewer dedup buckets keeps the hover readable when many alerts share a type.
      const typesListed = new Set<string>()
      for (let i = 0, { length } = actionGroupedAlertSet; i < length; i += 1) {
        const alert = actionGroupedAlertSet[i]!
        // vscode markdown wants some kind of text for the table layout
        const extra = []
        const alternatePackage = alert.props?.alternatePackage
        const lastPublish = alert.props?.lastPublish
        const note = alert.props?.note
        if (alternatePackage) {
          extra.push(
            `Possible intent: [${alternatePackage} $(link-external)](https://socket.dev/${eco}/package/${alternatePackage})`,
          )
        }
        if (lastPublish) {
          const lastPublishStr = new Date(lastPublish).toLocaleDateString()
          extra.push(`Last published on: ${lastPublishStr}`)
        }
        if (note) {
          extra.push(note)
        }
        if (typesListed.has(alert.type)) {
          continue
        }
        if (extra.length === 0) {
          extra.push(color('#888888', '&nbsp;'))
        }
        typesListed.add(alert.type)
        const rowColor = {
          error: '#ff8800',
          warn: '#cc8800',
          monitor: '#aaaa00',
          ignore: '#888888',
        }[alert.action]
        ret.push(
          [
            alert.action,
            alert.type,
            extra.join('<br>').replaceAll(/\r?\n/g, '<br>'),
          ]
            .map(
              str => color(rowColor, str), // color the action column
            )
            .join(' | '),
        )
      }
      return ret.join('\n')
    }
    const hoverMessage = new vscode.MarkdownString(
      `
Socket Security for ${this.linkForPURL(data)} (package score: ${depscoreStr})

----

action | type | extra
------ | ---- | -----
${(['error', 'warn', 'monitor', 'ignore'] as const)
  .flatMap(action => {
    const alertsForAction = groupedAlerts[action]
    if (!alertsForAction || alertsForAction.length === 0) {
      return ''
    }
    return rowsForGrouping(alertsForAction) + '\n'
  })
  .join('')}
`,
      true,
    )
    // logger.error(`Generated hover message for ${this.purl}`, hoverMessage.value);
    hoverMessage.supportHtml = true
    hoverMessage.isTrusted = true
    return hoverMessage
  }
  /**
   * These must be eager so that they give squigglies etc.
   *
   * @returns /
   */
  #eagerDecoration() {
    const data = this.packageData
    const decorationTypes = this.decorationTypes
    const pkgData = data?.pkgData
    if (!pkgData) {
      if (data?.error) {
        // this can happen if the package is private etc. don't be too noisy
        this.decorationType = decorationTypes.informativeDecoration
      } else {
        this.decorationType = decorationTypes.informativeDecoration
      }
      return
    }
    const { alerts } = pkgData
    this.decorationType = decorationTypes.informativeDecoration
    for (let i = 0, { length } = alerts; i < length; i += 1) {
      const { action } = alerts[i]!
      if (action === 'error') {
        this.decorationType = decorationTypes.errorDecoration
        break
      } else if (action === 'warn') {
        this.decorationType = decorationTypes.warningDecoration
      }
    }
  }
}
/**
 * VSCode makes strong guarantee about 1<->1 text document URI to TextDocument
 * mapping.
 */
export type TextDocumentURIString = string & { __textDocumentURI: never }
