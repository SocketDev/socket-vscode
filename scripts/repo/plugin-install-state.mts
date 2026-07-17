/**
 * @file Pure Claude Code plugin install-state helpers (SHA lookup, foreign-
 *   install / orphan-marketplace detection), split out of
 *   `install-claude-plugins.mts` to keep the reconciler under the file-size
 *   cap.
 */

import path from 'node:path'

import type {
  MarketplaceListEntry,
  PluginListEntry,
} from './install-claude-plugins.mts'

// Claude Code stores SHA-pinned plugin installs at a cache directory whose
// name is `<sha-12-chars>-<content-hash-8-chars>`. We parse the first
// segment to extract the pinned SHA for drift comparison.
const SHA_PINNED_DIR_NAME = /^([0-9a-f]{12})-[0-9a-f]{8,}$/

/**
 * Parse the plugin's `installPath` to extract the SHA prefix it was pinned to
 * (12 chars). Returns `null` for directory installs, version-tagged installs,
 * or any path shape we don't recognize as SHA-pinned. Claude Code uses this
 * dir-name shape for ref-less pins; version-tagged pins use a dir name like
 * `1.0.1` instead — see `lookupInstalledSha` for the authoritative source.
 */
export function extractInstalledSha(
  installPath: string | undefined,
): string | undefined {
  if (!installPath) {
    return undefined
  }
  const dirName = path.basename(installPath)
  const m = SHA_PINNED_DIR_NAME.exec(dirName)
  return m ? (m[1] ?? undefined) : undefined
}

/**
 * Look up the installed `gitCommitSha` for a plugin from Claude Code's own
 * state file `~/.claude/plugins/installed_plugins.json`. This is the
 * authoritative record of which commit a plugin was installed from, regardless
 * of whether the cache dir is SHA-prefixed (`9cb4fe40-deadbeef/`) or
 * version-tagged (`1.0.1/`).
 *
 * Returns the full 40-char SHA, or `null` if the file/entry is missing or the
 * `gitCommitSha` field is absent (some plugin sources don't carry it —
 * directory installs, for example).
 */
export function lookupInstalledSha(
  installedPluginsJson: unknown,
  installId: string,
): string | undefined {
  if (!installedPluginsJson || typeof installedPluginsJson !== 'object') {
    return undefined
  }
  const plugins = (installedPluginsJson as { plugins?: unknown | undefined })
    .plugins
  if (!plugins || typeof plugins !== 'object') {
    return undefined
  }
  const entries = (plugins as Record<string, unknown>)[installId]
  if (!Array.isArray(entries)) {
    return undefined
  }
  for (let i = 0, { length } = entries; i < length; i += 1) {
    const entry = entries[i]!
    if (!entry || typeof entry !== 'object') {
      continue
    }
    const sha = (entry as { gitCommitSha?: unknown | undefined }).gitCommitSha
    if (typeof sha === 'string' && /^[0-9a-f]{40}$/.test(sha)) {
      return sha
    }
  }
  return undefined
}

/**
 * Find an existing install of `pluginName` that came from a marketplace _other
 * than_ ours. Plugin ids have the shape `<name>@<marketplace>`. Returns the
 * foreign install entry, or `undefined` if none.
 */
export function findForeignInstall(
  pluginName: string,
  plugins: PluginListEntry[],
  ourMarketplace: string,
): PluginListEntry | undefined {
  const ourId = `${pluginName}@${ourMarketplace}`
  for (let i = 0, { length } = plugins; i < length; i += 1) {
    const p = plugins[i]!
    if (!p.id.startsWith(`${pluginName}@`)) {
      continue
    }
    if (p.id === ourId) {
      continue
    }
    return p
  }
  return undefined
}

/**
 * Identify marketplaces that look orphaned — exist locally, aren't ours, and
 * only serve plugins our marketplace now serves canonically. Returns the
 * marketplace names; we warn the user rather than auto-remove (a dev-source
 * override is a legitimate deliberate state).
 */
export function findOrphanMarketplaces(
  marketplaces: MarketplaceListEntry[],
  ourMarketplace: string,
  ourPluginNames: Set<string>,
  plugins: PluginListEntry[],
): string[] {
  const orphans: string[] = []
  for (let i = 0, { length } = marketplaces; i < length; i += 1) {
    const mkt = marketplaces[i]!
    if (mkt.name === ourMarketplace) {
      continue
    }
    // Find every plugin installed from this marketplace.
    const installedFromHere = plugins
      .filter(p => p.id.endsWith(`@${mkt.name}`))
      .map(p => p.id.slice(0, -`@${mkt.name}`.length))
    if (installedFromHere.length === 0) {
      // No installs from this marketplace — leave it alone. The user
      // added it for a reason we can't see.
      continue
    }
    if (installedFromHere.every(name => ourPluginNames.has(name))) {
      orphans.push(mkt.name)
    }
  }
  return orphans
}
