const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const vscode = require('vscode')

async function run() {
  const scenario = process.env['SOCKET_VSCODE_AUTH_SCENARIO']
  assert.ok(
    scenario === 'stored' || scenario === 'legacy' || scenario === 'empty',
  )
  const extension = vscode.extensions.getExtension('socket.auth-regression')
  assert.ok(extension)
  const fixture = await extension.activate()
  assert.equal(extension.isActive, true)
  const retiredSocketApiTokenFixture = fixture.retiredSocketApiTokenFixture
  let legacySettingsPath
  let expectedSettingsBytes
  if (scenario === 'stored') {
    await fixture.context.secrets.store(
      'apiToken',
      retiredSocketApiTokenFixture,
    )
  } else if (scenario === 'legacy') {
    const settingsPath = path.join(
      process.env['XDG_DATA_HOME'],
      'socket',
      'settings',
    )
    await fs.mkdir(path.dirname(settingsPath), { recursive: true })
    const settingsBytes = Buffer.from(
      JSON.stringify({ apiKey: retiredSocketApiTokenFixture }),
    ).toString('base64')
    await fs.writeFile(settingsPath, settingsBytes)
    legacySettingsPath = settingsPath
    expectedSettingsBytes = settingsBytes
  }
  await assert.rejects(fixture.getAPIKey(), error => {
    assert.match(error.message, /credential storage is unavailable/)
    return true
  })
  await fixture.activateAuth()
  const anonymousAllowed = scenario === 'empty'
  if (anonymousAllowed) {
    assert.equal(await fixture.getAPIKey(), undefined)
  } else {
    await assert.rejects(fixture.getAPIKey(), error => {
      assert.equal(error.code, 'SOCKET_RETIRED_API_TOKEN')
      return true
    })
  }
  const session = await vscode.authentication.getSession(
    'socket-security',
    [],
    { silent: true },
  )
  assert.equal(session, undefined)
  let legacyPreserved = false
  let legacyAbsent = false
  const secretPreserved =
    (await fixture.context.secrets.get('apiToken')) ===
    (scenario === 'stored' ? retiredSocketApiTokenFixture : undefined)
  const secretAbsent =
    (await fixture.context.secrets.get('apiToken')) === undefined
  if (scenario === 'legacy') {
    legacyPreserved =
      (await fs.readFile(legacySettingsPath, 'utf8')) === expectedSettingsBytes
    assert.equal(legacyPreserved, true)
  } else if (scenario === 'empty') {
    await assert.rejects(
      fs.stat(path.join(process.env['XDG_DATA_HOME'], 'socket', 'settings')),
      { code: 'ENOENT' },
    )
    legacyAbsent = true
  }
  await fs.writeFile(
    process.env['SOCKET_VSCODE_AUTH_RESULT'],
    JSON.stringify({
      anonymousAllowed,
      initializationBlocked: true,
      legacyPreserved,
      legacyAbsent,
      retiredBlocked: !anonymousAllowed,
      secretPreserved,
      secretAbsent,
      scenario,
      silentSessionAbsent: true,
    }),
  )
}

module.exports = { run }
