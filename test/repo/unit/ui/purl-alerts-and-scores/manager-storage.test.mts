import * as fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import type { PackageScoreAndAlerts } from '../../../../../src/api.mts'
import type { logger as realLogger } from '../../../../../src/infra/log.mts'
import type { SimPURL } from '../../../../../src/ui/externals/parse-externals.mts'

vi.mock(import('node:fs'), async importOriginal => {
  const original = await importOriginal()
  return {
    ...original,
    mkdirSync: vi.fn(original.mkdirSync) as typeof original.mkdirSync,
    readFileSync: vi.fn(original.readFileSync) as typeof original.readFileSync,
    statSync: vi.fn(original.statSync) as typeof original.statSync,
    writeFileSync: vi.fn(
      original.writeFileSync,
    ) as typeof original.writeFileSync,
  }
})
vi.mock(import('../../../../../src/auth.mts'), () => ({
  getAPIKey: vi.fn(),
}))
vi.mock(import('../../../../../src/infra/log.mts'), () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  } as unknown as typeof realLogger,
}))

const purl = 'pkg:npm/example-dependency@1.0.0'
let storageRoot: string
let manager: typeof import('../../../../../src/ui/purl-alerts-and-scores/manager.mts')

function packageScore(inputPurl: SimPURL = purl): PackageScoreAndAlerts {
  return {
    alerts: [],
    inputPurl,
    name: 'example-dependency',
    score: {
      license: 90,
      maintenance: 90,
      overall: 90,
      quality: 90,
      supplyChain: 90,
      vulnerability: 90,
    },
    type: 'npm',
    version: '1.0.0',
  }
}

describe('PURL package storage', () => {
  beforeEach(async () => {
    vi.resetModules()
    storageRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'socket-profile-cache-'),
    )
    manager =
      await import('../../../../../src/ui/purl-alerts-and-scores/manager.mts')
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    fs.rmSync(storageRoot, { force: true, recursive: true })
  })

  test('keeps entries in memory before storage initialization', () => {
    const entry = new manager.PURLPackageData(purl)
    const data = packageScore()
    const watcher = vi.fn()
    entry.subscribe(watcher)
    entry.update(data)
    manager.clearCache()

    expect(entry.filepath()).toBeUndefined()
    expect(entry.pkgData).toEqual(data)
    expect(entry.isStale()).toBe(false)
    expect(watcher).toHaveBeenCalledWith(entry)
    expect(fs.readFileSync).not.toHaveBeenCalled()
    expect(fs.statSync).not.toHaveBeenCalled()
    expect(fs.mkdirSync).not.toHaveBeenCalled()
    expect(fs.writeFileSync).not.toHaveBeenCalled()

    manager.initializeCacheStorage(storageRoot)
    entry.update(data)
    expect(entry.filepath()).toBeUndefined()
    expect(fs.writeFileSync).not.toHaveBeenCalled()
  })

  test('isolates cached reads and later writes between storage profiles', () => {
    const firstProfile = path.join(storageRoot, 'first-profile')
    const secondProfile = path.join(storageRoot, 'second-profile')
    manager.initializeCacheStorage(firstProfile)
    const firstEntry = new manager.PURLPackageData(purl)
    firstEntry.update(packageScore())

    manager.initializeCacheStorage(secondProfile)
    const secondEntry = new manager.PURLPackageData(purl)
    expect(secondEntry.pkgData).toBeUndefined()
    expect(secondEntry.isStale()).toBe(true)
    const secondData = packageScore()
    secondData.score.overall = 10
    secondEntry.update(secondData)

    firstEntry.update(packageScore())
    expect(new manager.PURLPackageData(purl).pkgData).toEqual(secondData)
    manager.initializeCacheStorage(firstProfile)
    expect(new manager.PURLPackageData(purl).pkgData).toEqual(packageScore())
  })

  test('stores Unicode PURLs under one separator-free filename', () => {
    manager.initializeCacheStorage(storageRoot)
    const unicodePurl: SimPURL =
      'pkg:npm/@example/依存-😀@1.0.0?path=../nested\\file'
    const entry = new manager.PURLPackageData(unicodePurl)
    entry.update(packageScore(unicodePurl))
    const filePath = entry.filepath()!
    const filename = path.basename(filePath)

    expect(path.dirname(filePath)).toBe(path.join(storageRoot, 'package-data'))
    expect(filename).toMatch(/^[\w-]+\.json$/)
    expect(Buffer.from(filename.slice(0, -5), 'base64url').toString()).toBe(
      unicodePurl,
    )
    expect(new manager.PURLPackageData(unicodePurl).pkgData).toEqual(
      packageScore(unicodePurl),
    )
  })

  test('reloads valid data with the disk timestamp for cache expiry', () => {
    manager.initializeCacheStorage(storageRoot)
    const entry = new manager.PURLPackageData(purl)
    entry.update(packageScore())
    const timestamp = new Date('2026-01-01T00:00:00Z')
    fs.utimesSync(entry.filepath()!, timestamp, timestamp)
    vi.useFakeTimers()
    vi.setSystemTime(timestamp.getTime() + 10 * 60 * 1000)
    const reloaded = new manager.PURLPackageData(purl)

    expect(reloaded.pkgData).toEqual(packageScore())
    expect(reloaded.mtime).toBe(timestamp.getTime())
    expect(reloaded.isStale()).toBe(false)
    vi.setSystemTime(Date.now() + 1)
    expect(reloaded.isStale()).toBe(true)
  })

  test.each([
    ['malformed JSON', '{'],
    ['null record', 'null'],
    [
      'mismatched PURL',
      JSON.stringify(packageScore('pkg:npm/other-dependency@1.0.0')),
    ],
    ['invalid display data', JSON.stringify({ ...packageScore(), name: {} })],
    [
      'invalid alerts',
      JSON.stringify({
        ...packageScore(),
        alerts: [{ type: 'installScripts', action: 'unexpected' }],
      }),
    ],
    [
      'invalid scores',
      JSON.stringify({
        ...packageScore(),
        score: { ...packageScore().score, overall: null },
      }),
    ],
  ])('ignores %s on disk', (description, contents) => {
    manager.initializeCacheStorage(storageRoot)
    const entry = new manager.PURLPackageData(purl)
    entry.update(packageScore())
    fs.writeFileSync(entry.filepath()!, contents)
    const reloaded = new manager.PURLPackageData(purl)

    expect(reloaded.pkgData, description).toBeUndefined()
    expect(reloaded.mtime).toBe(-Infinity)
    expect(reloaded.isStale()).toBe(true)
  })

  test('clears only the current profile cache', () => {
    const firstProfile = path.join(storageRoot, 'first-profile')
    const secondProfile = path.join(storageRoot, 'second-profile')
    manager.initializeCacheStorage(firstProfile)
    const firstEntry = new manager.PURLPackageData(purl)
    firstEntry.update(packageScore())
    manager.initializeCacheStorage(secondProfile)
    const secondEntry = new manager.PURLPackageData(purl)
    secondEntry.update(packageScore())
    const unrelatedFile = path.join(secondProfile, 'settings.json')
    fs.writeFileSync(unrelatedFile, '{}')

    manager.clearCache()

    expect(fs.existsSync(firstEntry.filepath()!)).toBe(true)
    expect(fs.existsSync(secondEntry.filepath()!)).toBe(false)
    expect(fs.existsSync(unrelatedFile)).toBe(true)
  })

  test('keeps memory updates when storage is unavailable', () => {
    const blockedDirectory = path.join(storageRoot, 'unavailable-directory')
    fs.writeFileSync(blockedDirectory, '')
    manager.initializeCacheStorage(blockedDirectory)
    const entry = new manager.PURLPackageData(purl)
    const data = packageScore()
    entry.update(data)

    expect(entry.pkgData).toEqual(data)
    expect(entry.isStale()).toBe(false)
    expect(new manager.PURLPackageData(purl).pkgData).toBeUndefined()
  })
})
