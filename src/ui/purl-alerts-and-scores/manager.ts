import type { SimPURL } from '../externals/parse-externals'
import { logger } from '../../infra/log'
import os from 'node:os'
import path from 'node:path'
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { getAPIKey } from '../../auth'
import { streamPackageScores } from '../../api'
import type { PackageScoreAndAlerts } from '../../api'
import { safeDeleteSync } from '@socketsecurity/lib/fs/safe'
import { worstArtifactsByPurl } from './select-artifacts'
// if this is updated update lifecycle scripts
const cacheDir = path.resolve(os.homedir(), '.socket', 'vscode')

export function clearCache() {
  safeDeleteSync(cacheDir)
}

export type { PackageScoreAndAlerts } from '../../api'

export class PURLPackageData {
  purl: SimPURL
  watchers: Set<(pkgData: PURLPackageData) => void> = new Set()
  pkgData: PackageScoreAndAlerts | undefined = undefined
  mtime: number = -Infinity
  error: string | undefined = undefined
  setError(reason: string) {
    this.error = reason
    if (!this.pkgData) {
      this.#notifyWatchers()
    }
  }
  constructor(purl: SimPURL) {
    this.purl = purl
    this.readPkgDataFromDisk()
  }
  filepath() {
    return path.join(cacheDir, `${btoa(this.purl)}.json`)
  }
  writePkgDataToDisk() {
    const filePath = this.filepath()
    try {
      mkdirSync(cacheDir, { recursive: true })
      writeFileSync(filePath, JSON.stringify(this.pkgData, null, 2))
      logger.debug(`Wrote PURL data to disk for ${this.purl} at ${filePath}`)
    } catch (e) {
      logger.debug(`Failed to write PURL data to disk for ${this.purl}`, e)
    }
  }
  readPkgDataFromDisk() {
    const filePath = this.filepath()
    try {
      const data = readFileSync(filePath, 'utf-8')
      this.pkgData = JSON.parse(data)
      // Need mtimeMs metadata for stale-cache detection.
      // oxlint-disable-next-line socket/prefer-exists-sync -- mtime
      this.mtime = statSync(filePath).mtimeMs
    } catch (e) {
      logger.debug(`Failed to read PURL data from disk for ${this.purl}`, e)
    }
  }
  isStale() {
    return this.mtime + 10 * 60 * 1000 < Date.now() // 10 minutes
  }
  subscribe(cb: (pkgData: PURLPackageData) => void) {
    this.watchers.add(cb)
  }
  unsubscribe(cb: (pkgData: PURLPackageData) => void) {
    this.watchers.delete(cb)
  }
  update(data: PackageScoreAndAlerts) {
    this.pkgData = data
    this.error = undefined
    this.writePkgDataToDisk()
    this.#notifyWatchers()
  }
  #notifyWatchers() {
    // oxlint-disable-next-line socket/prefer-cached-for-loop -- iterating a Set.
    for (const watcher of this.watchers) {
      watcher(this)
    }
  }
}
export class PURLDataCache {
  static singleton: PURLDataCache = new PURLDataCache()
  timeout: number = 10 * 60 * 1000 // 10 minutes
  #pkgData: Map<SimPURL, PURLPackageData> = new Map()
  // PURLs just waiting for bus to be sent
  #pkgsNeedingUpdate: Set<SimPURL> = new Set()
  // in-flight PURLs
  #currentPendingUpdates: Set<SimPURL> = new Set()
  private constructor() {}
  watch(purl: SimPURL): PURLPackageData {
    let pkgDataForPURL = this.#pkgData.get(purl)
    if (!pkgDataForPURL) {
      const newPkgData = new PURLPackageData(purl)
      this.#pkgData.set(purl, newPkgData)
      pkgDataForPURL = newPkgData
    }
    if (pkgDataForPURL.isStale()) {
      this.queueUpdate(purl)
    }
    return pkgDataForPURL
  }
  queueUpdate(purl: SimPURL) {
    // already on a bus
    if (this.#currentPendingUpdates.has(purl)) {
      return
    }
    const thisIsTheBusForTheseUpdates = this.#pkgsNeedingUpdate.size === 0
    this.#pkgsNeedingUpdate.add(purl)
    // logger.info(`is bus`, thisIsTheBusForTheseUpdates, `for`, purl, `pending updates:`, this.#currentPendingUpdates.size, `queued updates:`, this.#pkgsNeedingUpdate.size);
    if (!thisIsTheBusForTheseUpdates) {
      return // already scheduled a bus trip
    }

    const controller = new AbortController()
    const abort = controller.abort.bind(controller)
    const timer = setTimeout(abort, this.timeout)
    void (async () => {
      const thesePendingUpdates = new Set(Array.from(this.#pkgsNeedingUpdate))
      this.#pkgsNeedingUpdate.clear()
      // oxlint-disable-next-line socket/prefer-cached-for-loop -- iterating a Set.
      for (const pendingPurl of thesePendingUpdates) {
        this.#currentPendingUpdates.add(pendingPurl)
      }
      const bailPendingCacheEntries = (reason?: Error | undefined) => {
        // oxlint-disable-next-line socket/prefer-cached-for-loop -- iterating a Set.
        for (const pendingPurl of thesePendingUpdates) {
          logger.debug(
            `Bailing pending cache entry for PURL: ${pendingPurl}`,
            reason?.message,
          )
          this.#currentPendingUpdates.delete(pendingPurl)
          this.#pkgData
            .get(pendingPurl)
            ?.setError(
              'Unable to load data from Socket API' +
                (reason ? `: ${reason.message}` : ''),
            )
        }
      }
      controller.signal.addEventListener('abort', () => {
        clearTimeout(timer)
        bailPendingCacheEntries(
          controller.signal.reason || new Error('Aborted'),
        )
      })
      try {
        const apiKey = await getAPIKey()
        if (!apiKey) {
          bailPendingCacheEntries()
          return
        }
        // logger.info(`Requesting Socket API for PURLs: ${[...thesePendingUpdates].join(', ')}`)
        // Bound the SDK request with the same ceiling the AbortController timer
        // uses so a hung connection can't leave entries pending forever.
        const scores = streamPackageScores(apiKey, [...thesePendingUpdates], {
          timeout: this.timeout,
        })
        // The /v0/purl endpoint can stream MULTIPLE artifacts for the same
        // input PURL (e.g. a PyPI sdist and wheel of one version) with
        // different scores and alerts. Buffer them all, then collapse to the
        // worst-scoring artifact per PURL so a clean artifact can't hide a
        // dangerous one (SURF-276). See worstArtifactsByPurl.
        const streamedArtifacts: PackageScoreAndAlerts[] = []
        for await (const scoreAndAlerts of scores) {
          // The timer above may have already bailed these entries; stop
          // consuming once aborted so we don't resurrect stale updates.
          if (controller.signal.aborted) {
            break
          }
          streamedArtifacts.push(scoreAndAlerts)
        }
        // Collapsing needs the whole stream, so the abort check above cannot
        // also gate the writes the way it did when each artifact was applied
        // as it arrived. Re-check here or an aborted batch would resurrect the
        // entries bailPendingCacheEntries just errored out.
        if (controller.signal.aborted) {
          return
        }
        // oxlint-disable-next-line socket/prefer-cached-for-loop -- iterating a Map.
        for (const [inputPurl, scoreAndAlerts] of worstArtifactsByPurl(
          streamedArtifacts,
        )) {
          this.#pkgData.get(inputPurl)?.update(scoreAndAlerts)
          thesePendingUpdates.delete(inputPurl)
        }
        clearTimeout(timer)
        bailPendingCacheEntries(new Error('Not Found'))
      } catch (e) {
        // Report the REAL failure. A bare `catch { abort() }` here collapsed
        // every cause — an expired token, a proxy refusal, a DNS failure, a
        // malformed response — into the abort listener's generic reason, so
        // the inline error read "the operation has been aborted" whatever went
        // wrong and nothing reached the log. The one message a user sees named
        // the mechanism instead of the cause, which is why a report of it
        // could not be diagnosed from the error alone.
        clearTimeout(timer)
        // An abort already reported these with the timeout's own reason;
        // re-bailing would overwrite that with a downstream symptom.
        if (controller.signal.aborted) {
          return
        }
        const reason = e instanceof Error ? e : new Error(String(e))
        logger.error(
          `Socket API request failed for ${thesePendingUpdates.size} PURL(s)`,
          reason,
        )
        bailPendingCacheEntries(reason)
      }
    })()
  }
}
