/**
 * @file Unit tests for worstArtifactsByPurl (src/ui/purl-alerts-and-scores/
 *   select-artifacts.ts) — the fix for SURF-276, where the hover popup showed a
 *   clean score for a package whose sdist was flagged as malware. The
 *   `/v0/purl` endpoint streams one entry per artifact, so a single PURL can
 *   return several entries; the popup must surface the worst one, not whichever
 *   arrives last.
 */

import { describe, expect, test } from 'vitest'

import { worstArtifactsByPurl } from '../src/ui/purl-alerts-and-scores/select-artifacts'

import type { SimPURL } from '../src/ui/externals/parse-externals'
import type { PackageScoreAndAlerts } from '../src/ui/purl-alerts-and-scores/manager'

// Build a minimal artifact entry of the shape the /v0/purl endpoint returns.
// Only the fields worstArtifactsByPurl reads (inputPurl, score.overall) matter;
// the rest satisfy the type.
function makeArtifact(
  inputPurl: SimPURL,
  overall: number | undefined,
  extra?: Partial<PackageScoreAndAlerts> | undefined,
): PackageScoreAndAlerts {
  return {
    alerts: [],
    inputPurl,
    score: {
      license: 1,
      maintenance: 1,
      overall: overall as number,
      quality: 1,
      supplyChain: 1,
      vulnerability: 1,
    },
    type: 'pypi',
    name: inputPurl.split('/')[1] ?? 'pkg',
    ...extra,
  }
}

describe('worstArtifactsByPurl', () => {
  const purl = 'pkg:pypi/smscallbomber' as SimPURL

  // The exact SURF-276 shape: /v0/purl returns a malicious sdist (overall 0,
  // malware alert) and a clean wheel (overall 0.99) for the same PURL. The
  // popup must show the sdist regardless of stream order.
  const maliciousSdist = makeArtifact(purl, 0, {
    alerts: [
      {
        action: 'error',
        type: 'malware',
        severity: 'critical',
        props: {},
      },
    ],
  })
  const cleanWheel = makeArtifact(purl, 0.99)

  test('keeps the malware sdist when the clean wheel is last', () => {
    const result = worstArtifactsByPurl([maliciousSdist, cleanWheel])
    expect(result.get(purl)).toBe(maliciousSdist)
  })

  test('keeps the malware sdist when the clean wheel is first', () => {
    const result = worstArtifactsByPurl([cleanWheel, maliciousSdist])
    expect(result.get(purl)).toBe(maliciousSdist)
  })

  test('returns a single artifact unchanged', () => {
    const only = makeArtifact(purl, 0.5)
    const result = worstArtifactsByPurl([only])
    expect(result.size).toBe(1)
    expect(result.get(purl)).toBe(only)
  })

  test('an entry with a real score beats one with a missing score', () => {
    const scored = makeArtifact(purl, 0.4)
    const unscored = makeArtifact(purl, undefined)
    expect(worstArtifactsByPurl([scored, unscored]).get(purl)).toBe(scored)
    expect(worstArtifactsByPurl([unscored, scored]).get(purl)).toBe(scored)
  })

  test('keeps each distinct PURL independently', () => {
    const purlA = 'pkg:pypi/a' as SimPURL
    const purlB = 'pkg:pypi/b' as SimPURL
    const aLow = makeArtifact(purlA, 0.1)
    const aHigh = makeArtifact(purlA, 0.9)
    const bOnly = makeArtifact(purlB, 0.7)
    const result = worstArtifactsByPurl([aHigh, bOnly, aLow])
    expect(result.size).toBe(2)
    expect(result.get(purlA)).toBe(aLow)
    expect(result.get(purlB)).toBe(bOnly)
  })

  test('returns an empty map for no entries', () => {
    expect(worstArtifactsByPurl([]).size).toBe(0)
  })
})
