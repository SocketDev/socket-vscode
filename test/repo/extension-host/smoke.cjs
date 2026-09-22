const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const { setTimeout } = require('node:timers/promises')
const vscode = require('vscode')

async function waitForLoginCommand() {
  const deadline = Date.now() + 5000
  while (Date.now() < deadline) {
    const commands = await vscode.commands.getCommands(true)
    if (commands.includes('socket-security.login')) {
      return
    }
    await setTimeout(10)
  }
  assert.fail('Socket Login command did not register in the Extension Host')
}

async function run() {
  const extension = vscode.extensions.getExtension(
    'SocketSecurity.vscode-socket-security',
  )
  assert.ok(extension)
  await extension.activate()
  assert.equal(extension.isActive, true)
  assert.equal(extension.packageJSON.main, './out/main.cjs')
  assert.ok(
    extension.packageJSON.contributes.authentication.some(
      provider => provider.id === 'socket-security',
    ),
  )
  await waitForLoginCommand()
  const session = await vscode.authentication.getSession(
    'socket-security',
    [],
    { silent: true },
  )
  assert.equal(session, undefined)
  const folder = vscode.workspace.workspaceFolders[0]
  const document = await vscode.workspace.openTextDocument(
    vscode.Uri.joinPath(folder.uri, 'example.js'),
  )
  await vscode.window.showTextDocument(document)
  await vscode.commands.executeCommand(
    'vscode.executeHoverProvider',
    document.uri,
    new vscode.Position(0, 13),
  )
  assert.equal(document.languageId, 'javascript')
  await fs.writeFile(
    process.env['SOCKET_VSCODE_SMOKE_RESULT'],
    JSON.stringify({
      activated: true,
      language: document.languageId,
      loggedOut: true,
      version: vscode.version,
    }),
  )
}

module.exports = { run }
