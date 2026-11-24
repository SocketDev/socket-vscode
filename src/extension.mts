// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode'

import { activate as activateAuth } from './auth.mts'
import { activate as activateEditorConfig } from './data/editor-config.mts'
import { activate as activateFiles } from './ui/file.mts'
import { initializeCacheStorage } from './ui/purl-alerts-and-scores/manager.mts'

export async function activate(context: vscode.ExtensionContext) {
  initializeCacheStorage(context.globalStorageUri.fsPath)
  activateEditorConfig(context)
  await activateAuth(context, context.subscriptions)
  activateFiles(context)
  if (vscode.lm?.registerMcpServerDefinitionProvider) {
    const definition: vscode.McpHttpServerDefinition =
      new vscode.McpHttpServerDefinition(
        '[Extension] Socket Security',
        vscode.Uri.parse('https://mcp.socket.dev/'),
        {
          'user-agent': `Socket Security VSCode Extension/${process.env['INLINED_EXTENSION_VERSION']}`,
        },
      )
    const provider: vscode.McpServerDefinitionProvider<vscode.McpHttpServerDefinition> =
      {
        provideMcpServerDefinitions(_token) {
          return [definition]
        },
        resolveMcpServerDefinition(def, _token) {
          return def
        },
      }
    vscode.lm.registerMcpServerDefinitionProvider(
      'socket-security.mcp-server',
      provider,
    )
  }
}
