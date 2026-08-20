import type * as vscode from 'vscode'
import { logger } from '../infra/log.mts'

import { activate as activateDecorations } from './decorations.mts'
export function activate(context: vscode.ExtensionContext) {
  logger.debug('Socket Security extension started decorating files')
  void activateDecorations(context)
}
