/**
 * @file Reapplies wheelhouse-owned patches to the local Claude Code plugin
 *   cache. Split out of `install-claude-plugins.mts` to keep the reconciler
 *   under the file-size cap.
 */

import { spawnSync } from '@socketsecurity/lib-stable/process/spawn/child'
import { cpSync, existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { getDefaultLogger } from '@socketsecurity/lib-stable/logger/default'

const logger = getDefaultLogger()

function resolvePluginCacheDir(
  pluginsDir: string,
  marketplaceName: string,
  pluginName: string,
  version: string,
): string | undefined {
  const dir = path.join(
    pluginsDir,
    'cache',
    marketplaceName,
    pluginName,
    version,
  )
  return existsSync(dir) ? dir : undefined
}

/**
 * Strip the leading `# @key: value` / `#` comment header from a fleet-style
 * patch, returning just the unified-diff body (everything from the first `--- `
 * line onward). Mirrors socket-btm's node-smol patch convention, where the
 * header carries provenance metadata and the apply step feeds only the diff to
 * `patch`. Returns an empty string if the file has no `--- ` line.
 */
export function stripPatchHeader(patchText: string): string {
  const idx = patchText.search(/^--- /m)
  return idx === -1 ? '' : patchText.slice(idx)
}

/**
 * Derive the sidecar dir for a patch file. A patch named `<x>.patch` may ship a
 * companion `<x>.files/` directory whose tree mirrors the plugin cache root
 * (e.g. `<x>.files/scripts/lib/read-stdin-sync.mjs` → `<cache>/scripts/lib/…`).
 * The fleet "smallest patch footprint" rule prefers moving substantial logic
 * into such a sidecar module so the diff itself stays an import + call-site
 * swap, rather than inlining a 30-line function body. Returns the dir path
 * (whether or not it exists — caller checks).
 */
export function patchSidecarDir(patchPath: string): string {
  return patchPath.replace(/\.patch$/, '.files')
}

/**
 * Copy a patch's sidecar `.files/` tree into the plugin cache, overwriting.
 * No-op when the patch ships no sidecar. Runs before the diff is applied so the
 * thin diff's `import` of a sidecar module resolves. Idempotent (plain
 * overwrite copy).
 */
function copyPatchSidecar(patchPath: string, cacheDir: string): void {
  const sidecar = patchSidecarDir(patchPath)
  if (!existsSync(sidecar)) {
    return
  }
  cpSync(sidecar, cacheDir, { recursive: true })
}

/**
 * Reapply wheelhouse-owned patches to plugin caches. The cache is regenerated
 * on every (re)install, so an upstream-bug fix we can't land upstream yet has
 * to be replayed from a checked-in diff.
 *
 * Patches use the fleet (socket-btm) convention: a `# @key: value` provenance
 * header above a plain `diff -u` body (NOT a `git diff` — no `index`/`mode`
 * markers), applied with `patch -p1`, the same tool the node-smol build chain
 * uses. The header is stripped before feeding the diff to `patch`.
 *
 * Idempotent: a forward `--dry-run` that fails while a reverse `--dry-run`
 * succeeds means the fix is already present, so it's skipped. A patch that
 * applies neither way (e.g. the plugin bumped and the patch went stale) is
 * reported, not fatal — a stale patch shouldn't wedge the whole reconcile.
 */
export function reapplyPluginPatches(options: {
  getPluginsDir: () => string | undefined
  marketplaceName: string
  parsePatchFileName: (
    fileName: string,
  ) => { plugin: string; version: string } | undefined
  pluginPatchesDir: string
}): void {
  const {
    getPluginsDir,
    marketplaceName,
    parsePatchFileName,
    pluginPatchesDir,
  } = { __proto__: null, ...options } as typeof options
  if (!existsSync(pluginPatchesDir)) {
    return
  }
  const pluginsDir = getPluginsDir()
  const patchFiles = readdirSync(pluginPatchesDir)
    .filter(f => f.endsWith('.patch'))
    .toSorted()
  for (let i = 0, { length } = patchFiles; i < length; i += 1) {
    const file = patchFiles[i]!
    const parsed = parsePatchFileName(file)
    if (!parsed) {
      logger.warn(
        `Skipping patch "${file}": name must match <plugin>-<version>-<slug>.patch.`,
      )
      continue
    }
    const { plugin: pluginName, version } = parsed
    const patchPath = path.join(pluginPatchesDir, file)
    const diff = stripPatchHeader(readFileSync(patchPath, 'utf8'))
    if (!diff) {
      logger.warn(`Skipping patch "${file}": no \`--- \` diff body found.`)
      continue
    }
    const cacheDir = pluginsDir
      ? resolvePluginCacheDir(pluginsDir, marketplaceName, pluginName, version)
      : undefined
    if (!cacheDir) {
      logger.log(
        `Patch "${file}": no cache for ${pluginName}@${version}; skipping (plugin not installed).`,
      )
      continue
    }
    // Copy any sidecar modules into the cache first, so the thin diff's
    // import of them resolves (and so the already-applied reverse-check sees
    // the same tree the forward apply produced).
    copyPatchSidecar(patchPath, cacheDir)
    // patch reads the diff from stdin. -p1 strips the leading a/ b/ segment;
    // --forward refuses to re-apply an already-applied hunk (so the forward
    // dry-run cleanly fails when the fix is present).
    const runPatch = (extraArgs: readonly string[]) =>
      spawnSync('patch', ['-p1', '--forward', '--silent', ...extraArgs], {
        cwd: cacheDir,
        input: diff,
        stdio: ['pipe', 'ignore', 'ignore'],
      })
    if (runPatch(['--dry-run']).status !== 0) {
      // Forward dry-run failed. Either already applied or genuinely stale —
      // a reverse dry-run that succeeds means the fix is already present.
      if (runPatch(['--reverse', '--dry-run']).status === 0) {
        logger.log(
          `Patch "${file}" already applied to ${pluginName}@${version}.`,
        )
      } else {
        logger.warn(
          `Patch "${file}" did not apply to ${pluginName}@${version} ` +
            '(neither forward nor already-applied). The plugin may have ' +
            'changed upstream — regenerate via the regenerating-plugin-patches skill.',
        )
      }
      continue
    }
    if (runPatch([]).status === 0) {
      logger.success(`Applied patch "${file}" to ${pluginName}@${version}.`)
    } else {
      logger.warn(`Patch "${file}" dry-run passed but apply failed; skipped.`)
    }
  }
}
