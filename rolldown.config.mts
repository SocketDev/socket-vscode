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
 *   - Externals: `vscode` (provided by the extension host) and `tree-sitter-java`
 *     (a native module not bundled).
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

import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import type { RolldownOptions } from 'rolldown'

import { defineGuardedPlugin } from './.config/repo/rolldown/define-guarded.mts'

const rootPath = process.cwd()

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
  // module resolved at runtime, not bundled.
  external: ['vscode', 'tree-sitter-java'],
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
  ],
}

// oxlint-disable-next-line socket/no-default-export -- rolldown config-file contract requires a default-exported options object.
export default config
