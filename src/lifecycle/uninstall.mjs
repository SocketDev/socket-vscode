import { rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
const cacheDir = path.resolve(os.homedir(), '.socket', 'vscode')
try {
  // The standalone VSIX uninstall script has no package dependencies.
  // oxlint-disable-next-line socket/prefer-safe-delete -- dep-0 entry
  rmSync(cacheDir, { recursive: true, force: true })
} catch {}
