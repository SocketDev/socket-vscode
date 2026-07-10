/**
 * @file `DecorationManagerForDocument` — tracks the parsed externals for one
 *   open document and drives its hover + gutter/inline decorations. Split out
 *   of `decorations.ts` to keep it under the file-size cap.
 */

import * as vscode from 'vscode'

import { parseExternals } from './externals/parse-externals'
import { logger } from '../infra/log'

import type { SimPURL } from './externals/parse-externals'
import type {
  DecorationManagerForPURLCache,
  DecorationTypes,
  TextDocumentURIString,
} from './decorations'

export class DecorationManagerForDocument {
  externalRefs: Map<SimPURL, { ranges: vscode.Range[] }> = new Map()
  currentDocUpdate: AbortController = new AbortController()
  isDirty: boolean = false
  docURI: TextDocumentURIString
  // parameterized, shared across all instances
  decorationTypes: DecorationTypes
  // parameterized, shared across all instances
  purlManagers: DecorationManagerForPURLCache
  async provideHover(
    _document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.Hover | undefined> {
    // oxlint-disable-next-line socket/prefer-cached-for-loop -- iterating a Map.
    for (const [purl, { ranges }] of this.externalRefs) {
      for (let i = 0, { length } = ranges; i < length; i += 1) {
        const range = ranges[i]!
        const intersects = range.contains(position)
        // logger.warn(document.getText(range), 'hovering over range', range, 'for purl', purl, 'intersects:', intersects, 'at position', position);
        if (intersects) {
          const purlManager = this.purlManagers.for(purl)
          const hoverMessage = await purlManager.generateHoverMarkdown()
          if (!hoverMessage) {
            // logger.warn(`No hover message for PURL ${purl}, skipping hover`);
            return undefined
          }
          return new vscode.Hover(hoverMessage, range)
        }
      }
    }
  }
  constructor(
    docURI: TextDocumentURIString,
    decorationTypes: DecorationTypes,
    purlManagers: DecorationManagerForPURLCache,
  ) {
    this.docURI = docURI
    this.decorationTypes = decorationTypes
    this.purlManagers = purlManagers
  }
  async update(doc: vscode.TextDocument) {
    const docURI = doc.uri.toString() as TextDocumentURIString
    if (this.docURI !== docURI) {
      return
    }
    // We cannot skip updates if the editor isn't visible since there are some goofy cases
    // like when the editor is previewing another or preloading
    this.currentDocUpdate.abort()
    this.currentDocUpdate = new AbortController()
    const thisDocUpdateSignal = this.currentDocUpdate.signal
    let externals
    try {
      externals = await parseExternals(doc)
    } catch {}
    if (!externals) {
      return
    }
    logger.debug(
      `Parsed externals for ${docURI}:`,
      externals.size,
      'externals found, aborted:',
      thisDocUpdateSignal.aborted,
    )
    logger.debug([...externals.keys()].join(', '))
    if (thisDocUpdateSignal.aborted) {
      logger.info(
        `Decoration update for ${docURI} was aborted (parsing externals took longer than next update), skipping.`,
      )
      return
    }
    let isDirty = this.externalRefs.size !== externals.size
    if (!isDirty) {
      // oxlint-disable-next-line socket/prefer-cached-for-loop -- iterating a Map.
      check_each_purl_is_same_ranges: for (const [
        purl,
        { ranges },
      ] of externals) {
        const existing = this.externalRefs.get(purl)
        if (!existing) {
          isDirty = true
          break
        }
        if (existing.ranges.length !== ranges.length) {
          isDirty = true
          break
        }
        for (let i = 0, { length } = existing.ranges; i < length; i += 1) {
          if (!ranges[i]!.isEqual(existing.ranges[i]!)) {
            isDirty = true
            break check_each_purl_is_same_ranges
          }
        }
      }
    }
    this.externalRefs = externals
    this.isDirty = isDirty
    // oxlint-disable-next-line socket/prefer-cached-for-loop -- iterating a Map's keys iterator.
    for (const purl of this.externalRefs.keys()) {
      this.purlManagers.for(purl).subscribe(this)
    }
    // this should hold true due to no await above, defensive check here
    if (!thisDocUpdateSignal.aborted) {
      if (this.isDirty) {
        this.markDirty(thisDocUpdateSignal)
      }
    }
  }
  async markDirty(thisDocUpdateSignal: AbortSignal) {
    this.isDirty = true
    await this.#decorateEverything(thisDocUpdateSignal)
  }
  decorations: Map<vscode.TextEditorDecorationType, vscode.Range[]> = new Map()
  createDecorations() {
    const newDecorations: (typeof this)['decorations'] = new Map()
    // oxlint-disable-next-line socket/prefer-cached-for-loop -- iterating a Map.
    for (const [purl, { ranges }] of this.externalRefs) {
      const purlManager = this.purlManagers.for(purl)
      if (!purlManager.decorationType) {
        logger.warn(
          `No decoration type for PURL ${purl}, skipping decoration creation`,
        )
        continue
      }
      let pool = newDecorations.get(purlManager.decorationType)
      if (!pool) {
        pool = [...ranges]
        newDecorations.set(purlManager.decorationType, pool)
      } else {
        pool.push(...ranges)
      }
    }
    this.decorations = newDecorations
  }
  /**
   * This will START decorating the document, but since scores / alerts are
   * fetched asynchronously This needs to do checks to see if the decoration
   * request is still valid. This also needs to be able to handle streaming
   * updates to the decorations and failures Each PURL will fetch its own
   * score/alerts from cache in parallel and then update the decorations.
   */
  async #decorateEverything(
    thisDecorationUpdateSignal = this.currentDocUpdate.signal,
  ) {
    if (!this.isDirty) {
      return
    }
    const pending = []
    logger.debug(
      `Updating decorations for ${this.docURI} with externals:`,
      this.externalRefs.size,
      'externals found',
    )
    const visibleEditors = vscode.window.visibleTextEditors
    for (let i = 0, { length } = visibleEditors; i < length; i += 1) {
      const editor = visibleEditors[i]!
      const editorURI = editor.document.uri.toString() as TextDocumentURIString
      if (editorURI === this.docURI) {
        logger.debug(`Matching editor ${editorURI} for decoration update`)
        pending.push(editor)
      }
    }
    if (pending.length === 0) {
      logger.debug(
        `No editors found for ${this.docURI}, skipping decoration update`,
      )
      return
    }
    this.createDecorations()
    await Promise.all(
      pending.map(editor =>
        this.decorateEditor(editor, thisDecorationUpdateSignal),
      ),
    )
    if (thisDecorationUpdateSignal.aborted) {
      return
    }
    this.isDirty = false
  }
  async decorateEditor(
    editor: vscode.TextEditor,
    thisDecorationUpdate: AbortSignal = this.currentDocUpdate.signal,
  ) {
    if (thisDecorationUpdate.aborted) {
      return
    }
    const decorationTypeValues = Object.values(this.decorationTypes)
    for (let i = 0, { length } = decorationTypeValues; i < length; i += 1) {
      const decorationType = decorationTypeValues[i]
      editor.setDecorations(
        decorationType,
        this.decorations.get(decorationType) ?? [],
      )
    }
  }
}
