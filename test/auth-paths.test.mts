/**
 * @file Unit tests for src/auth-paths.ts — the SURF-111 fix. Before the fix,
 *   the extension pointed a file watcher at the settings directory, which does
 *   not exist until first login, so VSCode logged that it was "searching for a
 *   non-existent folder". ensureDirectoryExists now creates that directory
 *   first, and resolveDataHome computes which directory that is per platform.
 */

import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { safeDelete } from '@socketsecurity/lib-stable/fs/safe'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { ensureDirectoryExists, resolveDataHome } from '../src/auth-paths'

describe('ensureDirectoryExists', () => {
  let tmpRoot: string

  beforeEach(() => {
    tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'socket-auth-paths-'))
  })

  afterEach(async () => {
    await safeDelete(tmpRoot)
  })

  test('creates the directory (and missing parents) when absent', () => {
    // The real SURF-111 shape: <dataHome>/socket where neither exists yet.
    const dir = path.join(tmpRoot, 'dataHome', 'socket')
    expect(existsSync(dir)).toBe(false)
    ensureDirectoryExists(dir)
    expect(existsSync(dir)).toBe(true)
  })

  test('is a no-op and does not throw when the directory already exists', () => {
    const dir = path.join(tmpRoot, 'already-here')
    ensureDirectoryExists(dir)
    // Put a file inside, then call again: the directory and its contents must
    // survive (recursive mkdir does not clear an existing directory).
    const marker = path.join(dir, 'marker.txt')
    writeFileSync(marker, 'keep me')
    expect(() => ensureDirectoryExists(dir)).not.toThrow()
    expect(existsSync(dir)).toBe(true)
    expect(existsSync(marker)).toBe(true)
  })

  test('does not throw when creation fails (path under a file)', () => {
    // Using a regular file as a parent makes mkdir fail (ENOTDIR); the helper
    // must swallow it so activation can never be broken by the filesystem.
    const filePath = path.join(tmpRoot, 'a-file')
    writeFileSync(filePath, 'not a directory')
    const doomed = path.join(filePath, 'child')
    expect(() => ensureDirectoryExists(doomed)).not.toThrow()
    expect(existsSync(doomed)).toBe(false)
  })
})

describe('resolveDataHome', () => {
  const HOME = '/home/tester'

  test('uses %LOCALAPPDATA% on Windows', () => {
    expect(
      resolveDataHome(
        'win32',
        { LOCALAPPDATA: 'C:\\Users\\t\\AppData\\Local' },
        HOME,
      ),
    ).toBe('C:\\Users\\t\\AppData\\Local')
  })

  test('throws on Windows when %LOCALAPPDATA% is missing', () => {
    expect(() => resolveDataHome('win32', {}, HOME)).toThrow('%LOCALAPPDATA%')
  })

  test('uses $XDG_DATA_HOME when set on non-Windows', () => {
    expect(
      resolveDataHome('linux', { XDG_DATA_HOME: '/custom/xdg' }, HOME),
    ).toBe('/custom/xdg')
  })

  test('falls back to ~/Library/Application Support on macOS', () => {
    expect(resolveDataHome('darwin', {}, HOME)).toBe(
      path.join(HOME, 'Library', 'Application Support'),
    )
  })

  test('falls back to ~/.local/share on other platforms', () => {
    expect(resolveDataHome('linux', {}, HOME)).toBe(
      path.join(HOME, '.local', 'share'),
    )
  })

  test('ignores XDG_DATA_HOME on Windows (reads LOCALAPPDATA)', () => {
    expect(
      resolveDataHome(
        'win32',
        { LOCALAPPDATA: 'C:\\local', XDG_DATA_HOME: '/ignored' },
        HOME,
      ),
    ).toBe('C:\\local')
  })
})
