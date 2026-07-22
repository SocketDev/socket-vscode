/**
 * @file Rolldown bundler config for the Socket Security VS Code extension.
 *   Replaces the previous esbuild invocation (see git history of package.json's
 *   `esbuild` script). Single entry `src/extension.ts` → `out/main.js`, CJS for
 *   the VS Code extension host (Node platform). Behavior preserved 1:1 from the
 *   esbuild build:
 *
 *   - Output: CJS, `out/main.js` (package.json `main` is `./out/main.js`). The
 *     esbuild `main=src/extension.ts` entry-naming syntax produced `main.js`;
 *     we pin `entryFileNames` to `main.js` to match.
 *   - Externals: `vscode` (provided by the extension host), `tree-sitter-java` (a
 *     native module not bundled), and `@ultrathink/acorn.wasm` (its CJS entry
 *     reads a sibling `acorn.wasm` file at load — `output.paths` rewrites the
 *     require to `./acorn-wasm.cjs` and `stageAcornWasmPlugin` copies both
 *     files next to `out/main.js`; see
 *     src/ui/externals/js-source-externals.ts).
 *   - Asset loaders (esbuild `--loader:` equivalents via rolldown `moduleTypes`):
 *     `.wasm` → `binary` (import default = `Uint8Array`; see
 *     src/data/go/mod-parser.ts — fed to WebAssembly). `.py` → `text` (import
 *     default = file contents string; see src/ui/externals/parse-externals.ts).
 *     `.go` → `asset` (import default = emitted file path; see
 *     src/data/go/import-finder.ts — passed to `go build -o <out> <path>`, so
 *     it MUST be a real file on disk next to the bundle).
 *   - `process.env.INLINED_EXTENSION_VERSION` compile-time define = the
 *     package.json version, applied via the fleet-canonical `defineGuarded`
 *     plugin (esbuild-define semantics: read positions only, never
 *     lvalues/`delete` operands). The `INLINED_*` env-var naming follows the
 *     fleet convention (see socket-cli) that flags build-inlined values.
 *   - `--minify` on publish: gated behind the `MINIFY` env var (the
 *     `vscode:prepublish` script sets it), mirroring `esbuild --minify`.
 */

import { promises as fsPromises, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'

import type { Plugin, RolldownOptions } from 'rolldown'

import { defineGuardedPlugin } from './.config/repo/rolldown/define-guarded.mts'

const rootPath = process.cwd()
const require = createRequire(import.meta.url)

/**
 * Stage the `@ultrathink/acorn.wasm` parser next to the bundle. Its CJS entry
 * reads `${__dirname}/./acorn.wasm` synchronously at module load, so the
 * entry (kept external and rewritten to `./acorn-wasm.cjs` via
 * `output.paths`) and its `acorn.wasm` sibling must both sit beside
 * `out/main.js` at runtime — the packaged VSIX ships `out/` verbatim but
 * never `node_modules/`.
 */
export function stageAcornWasmPlugin(): Plugin {
  return {
    name: 'stage-acorn-wasm',
    async writeBundle(options) {
      const opts = { __proto__: null, ...options }
      const outDir = opts.dir ?? path.join(rootPath, 'out')
      const acornEntry = require.resolve('@ultrathink/acorn.wasm')
      const acornDir = path.dirname(acornEntry)
      await fsPromises.copyFile(acornEntry, path.join(outDir, 'acorn-wasm.cjs'))
      await fsPromises.copyFile(
        path.join(acornDir, 'acorn.wasm'),
        path.join(outDir, 'acorn.wasm'),
      )
    },
  }
}

// Read the version the same way esbuild's
// `--define:process.env.INLINED_EXTENSION_VERSION` did (from package.json), so
// the bundled constant matches the published VSIX.
const pkg = JSON.parse(
  readFileSync(path.join(rootPath, 'package.json'), 'utf8'),
) as { version?: string | undefined }
const extensionVersion = pkg.version ?? '0.0.0'

const minify = process.env['MINIFY'] === '1'

const config: RolldownOptions = {
  // `vscode` is injected by the extension host; `tree-sitter-java` is a native
  // module resolved at runtime, not bundled. `@ultrathink/acorn.wasm` stays
  // external so the bundle keeps a runtime `require('@ultrathink/acorn.wasm')`;
  // `output.paths` rewrites that to the `./acorn-wasm.cjs` sibling
  // `stageAcornWasmPlugin` copies into `out/`.
  external: ['vscode', 'tree-sitter-java', '@ultrathink/acorn.wasm'],
  input: { main: path.join(rootPath, 'src', 'extension.ts') },
  moduleTypes: {
    '.wasm': 'binary',
    // Gzipped binary assets (mod-parser.wasm.gz) — imported as raw bytes and
    // inflated at runtime with node:zlib.
    '.gz': 'binary',
    '.py': 'text',
    '.go': 'asset',
  },
  output: {
    dir: path.join(rootPath, 'out'),
    format: 'cjs',
    entryFileNames: 'main.js',
    // Keep emitted `.go` (and any other) asset filenames stable + readable;
    // the extension resolves them relative to the bundle at runtime.
    assetFileNames: '[name][extname]',
    minify,
    paths: { '@ultrathink/acorn.wasm': './acorn-wasm.cjs' },
  },
  platform: 'node',
  plugins: [
    // `defineGuarded` matches a member chain by its exact printed source text,
    // so the key is the dot-access form and source must use dot access too
    // (`process.env.INLINED_EXTENSION_VERSION`, not bracket access). The
    // `INLINED_*` name follows the fleet convention (see socket-cli) for
    // build-inlined values.
    defineGuardedPlugin({
      'process.env.INLINED_EXTENSION_VERSION': JSON.stringify(extensionVersion),
    }),
    stageAcornWasmPlugin(),
  ],
}

// oxlint-disable-next-line socket/no-default-export -- rolldown config-file contract requires a default-exported options object.
export default config
