/**
 * @file Pure artifact-selection logic for the Socket `/v0/purl` response,
 *   extracted from `manager.ts` so it can be unit-tested without pulling in the
 *   VSCode runtime. Note: the manager module opens an output channel at import
 *   time. Only type imports are used here, so importing this file executes no
 *   VSCode code.
 */

import type { SimPURL } from '../externals/parse-externals'
import type { PackageScoreAndAlerts } from './manager'

/**
 * Collapse the artifacts the `/v0/purl` endpoint streams into a single entry
 * per input PURL, keeping the WORST-scoring artifact.
 *
 * The endpoint returns one entry per artifact, so a single input PURL can yield
 * several entries (for example a PyPI sdist and a wheel of the same version).
 * Those artifacts can carry different scores and alerts: a malicious sdist with
 * a `setup.py` payload can score 0 with a `malware` alert while the wheel of
 * the same version scores 99 with no alerts. Keeping the entry with the lowest
 * `score.overall` stops a clean artifact from hiding a dangerous one and makes
 * the hover popup agree with socket.dev's package headline (SURF-276).
 *
 * A missing or non-numeric score sorts last (treated as `Infinity`) so an entry
 * that actually has a score always wins over one that does not. When two
 * entries for the same PURL tie, the first one seen is kept.
 */
export function worstArtifactsByPurl(
  entries: readonly PackageScoreAndAlerts[],
): Map<SimPURL, PackageScoreAndAlerts> {
  const overallScoreOf = (data: PackageScoreAndAlerts): number =>
    typeof data?.score?.overall === 'number' ? data.score.overall : Infinity
  const worstByPurl = new Map<SimPURL, PackageScoreAndAlerts>()
  for (let i = 0, { length } = entries; i < length; i += 1) {
    const entry = entries[i]!
    const prev = worstByPurl.get(entry.inputPurl)
    if (!prev || overallScoreOf(entry) < overallScoreOf(prev)) {
      worstByPurl.set(entry.inputPurl, entry)
    }
  }
  return worstByPurl
}
