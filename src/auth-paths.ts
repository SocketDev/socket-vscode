/**
 * @file Pure path derivation for the auth settings file, split out of `auth.ts`
 *   so it can be unit-tested without pulling in the VSCode runtime (`auth.ts`
 *   imports `vscode`, which only resolves inside the extension host). This file
 *   imports only `node:path`.
 */

import { mkdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Ensure `dirPath` exists, creating it (and any missing parents) if needed.
 *
 * This is the SURF-111 fix: the settings directory does not exist until the
 * user first logs in, and pointing a VSCode file-system watcher at a missing
 * directory makes VSCode repeatedly log that it is watching a non-existent
 * folder. Creating it first keeps the watcher's base present.
 *
 * `mkdirSync` with `recursive: true` is idempotent — it is a no-op when the
 * directory already exists. Any error (for example a read-only filesystem) is
 * swallowed so this can never break extension activation. Uses `node:fs`
 * directly (like the cache directory in the scores manager) so the behavior is
 * unit-testable against a real temporary directory; for the local data-home
 * path this is equivalent to `vscode.workspace.fs.createDirectory`.
 */
export function ensureDirectoryExists(dirPath: string): void {
  try {
    mkdirSync(dirPath, { recursive: true })
  } catch {}
}

/**
 * Resolve the per-user data directory Socket stores its settings file under.
 * This is the base whose `socket` subdirectory the extension both writes to (on
 * login) and watches — the directory that was missing on a fresh install and
 * produced the "searching for non-existent folder" watcher error (SURF-111).
 *
 * On Windows the value comes from `%LOCALAPPDATA%`, and its absence is fatal
 * (there is no sensible fallback). Elsewhere it comes from `$XDG_DATA_HOME`,
 * falling back to `~/Library/Application Support` on macOS and `~/.local/share`
 * on other platforms.
 *
 * Pure: takes the platform, environment, and home directory as arguments so the
 * cross-platform path derivation can be unit-tested without touching the real
 * process.
 */
export function resolveDataHome(
  platform: NodeJS.Platform,
  env: NodeJS.ProcessEnv,
  homedir: string,
): string {
  const dataHome =
    platform === 'win32' ? env['LOCALAPPDATA'] : env['XDG_DATA_HOME']
  if (dataHome) {
    return dataHome
  }
  if (platform === 'win32') {
    throw new Error('missing %LOCALAPPDATA%')
  }
  return path.join(
    homedir,
    ...(platform === 'darwin'
      ? ['Library', 'Application Support']
      : ['.local', 'share']),
  )
}
