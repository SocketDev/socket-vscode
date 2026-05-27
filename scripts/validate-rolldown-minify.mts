#!/usr/bin/env node
/**
 * @file Validates that the rolldown build config does not minify by default.
 *   Minification breaks ESM/CJS interop and makes debugging harder, so the
 *   default (non-publish) build must emit readable output. Repos may still opt
 *   into minification for a publish artifact behind an env gate (e.g.
 *   `MINIFY=1` on `vscode:prepublish`); this validator only asserts the
 *   default, un-gated build stays unminified — it loads the config with the
 *   minify env var explicitly cleared.
 */

import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { getDefaultLogger } from '@socketsecurity/lib-stable/logger/default'

const logger = getDefaultLogger()

const here = path.dirname(fileURLToPath(import.meta.url))
const rootPath = path.join(here, '..')

interface MinifyViolation {
  config: string
  value: unknown
  message: string
  location: string
}

// Read `output.minify` off a rolldown options object, tolerating both the
// single-config and array-of-configs export shapes and an `output` that is
// itself a single object or an array of outputs.
export function collectMinifyFlags(config: unknown): unknown[] {
  const configs = Array.isArray(config) ? config : [config]
  const flags: unknown[] = []
  for (const cfg of configs) {
    const output = (cfg as { output?: unknown | undefined } | undefined)?.output
    const outputs = Array.isArray(output) ? output : [output]
    for (const out of outputs) {
      flags.push((out as { minify?: unknown | undefined } | undefined)?.minify)
    }
  }
  return flags
}

/**
 * Validate the rolldown config's default (MINIFY-unset) build has minify false.
 * Clears the `MINIFY` env gate before importing so a publish-only minify path
 * doesn't trip the check.
 */
export async function validateRolldownMinify(): Promise<MinifyViolation[]> {
  const configPath = path.join(rootPath, 'rolldown.config.mts')

  // Clear the publish-time gate so we evaluate the default build path. The
  // config reads `process.env.MINIFY` at module-evaluation time, so this MUST
  // happen before the import below — hence the dynamic import (a static import
  // would capture MINIFY at load time, defeating the clear).
  delete process.env['MINIFY']

  try {
    // oxlint-disable-next-line socket/no-dynamic-import-outside-bundle -- the config must load AFTER the MINIFY env gate is cleared (see above); a static top-level import would evaluate it too early.
    const imported = (await import(configPath)) as {
      default?: unknown | undefined
    }
    const config = imported.default
    const violations: MinifyViolation[] = []
    const flags = collectMinifyFlags(config)
    for (let i = 0, { length } = flags; i < length; i += 1) {
      const value = flags[i]
      if (value !== false && value !== undefined) {
        violations.push({
          config: `output[${i}]`,
          value,
          message: 'output.minify must be false (or unset) by default',
          location: configPath,
        })
      }
    }
    return violations
  } catch (e) {
    logger.error(
      `Failed to load rolldown config: ${e instanceof Error ? e.message : String(e)}`,
    )
    process.exitCode = 1
    return []
  }
}

async function main(): Promise<void> {
  const violations = await validateRolldownMinify()

  if (violations.length === 0) {
    logger.success('rolldown minify validation passed')
    process.exitCode = 0
    return
  }

  logger.fail('rolldown minify validation failed')
  logger.error('')

  for (let i = 0, { length } = violations; i < length; i += 1) {
    const violation = violations[i]!
    logger.error(`  ${violation.message}`)
    logger.error(`  Found: minify: ${violation.value}`)
    logger.error('  Expected: minify: false')
    logger.error(`  Location: ${violation.location}`)
    logger.error('')
  }

  logger.error(
    'Minification breaks ESM/CJS interop and makes debugging harder.',
  )
  logger.error('')

  process.exitCode = 1
}

main().catch((e: unknown) => {
  logger.error('Validation failed:', e)
  process.exitCode = 1
})
