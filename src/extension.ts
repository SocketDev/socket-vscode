// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode'

import { activate as activateAuth } from './auth'
import { activate as activateEditorConfig } from './data/editor-config'
import { activate as activateFiles } from './ui/file'

// `process.env['INLINED_EXTENSION_VERSION']` is replaced at build time with
// the package.json version by the rolldown build (rolldown.config.mts →
// defineGuardedPlugin). The fleet-canonical `INLINED_*` env-var convention
// (see socket-cli) marks build-inlined values clearly. Quoted (bracket)
// property access is required: `process.env` is an index-signature type, so
// TypeScript (TS4111) rejects dot access; `defineGuarded` normalizes the
// bracket form to the dotted define key when matching.

export async function activate(context: vscode.ExtensionContext) {
  activateEditorConfig(context)
  void activateAuth(context, context.subscriptions)
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
