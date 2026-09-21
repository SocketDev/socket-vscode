import { promises as fsPromises, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import type { Plugin, RolldownOptions } from 'rolldown'

import { getEnvValue } from '@socketsecurity/lib-stable/env/rewire'

import { defineGuardedPlugin } from '../fleet/rolldown/define-guarded.mts'

const rootPath = path.resolve(import.meta.dirname, '../..')
const require = createRequire(import.meta.url)

// Parser glue resolves each WASM file beside itself at runtime.
export function stageParserWasmPlugin(): Plugin {
  return {
    name: 'stage-parser-wasm',
    // oxlint-disable-next-line socket/bag-param-optionality-naming -- rolldown hook signature; the param is rolldown's OutputOptions, not a repo options bag.
    async writeBundle(options) {
      const opts = { __proto__: null, ...options }
      const outDir = opts.dir ?? path.join(rootPath, 'out')
      const acornEntry = require.resolve('@ultrathink/acorn.rs.wasm')
      const acornDir = path.dirname(acornEntry)
      await fsPromises.copyFile(acornEntry, path.join(outDir, 'acorn-wasm.cjs'))
      await fsPromises.copyFile(
        path.join(acornDir, 'acorn.wasm'),
        path.join(outDir, 'acorn.wasm'),
      )
      const results = await Promise.allSettled(
        ['json', 'toml'].flatMap(parser => {
          const parserDir = path.dirname(
            require.resolve(`local-${parser}-wasm`),
          )
          return [`${parser}-bindgen.cjs`, `${parser}.wasm`].map(asset =>
            fsPromises.copyFile(
              path.join(parserDir, asset),
              path.join(outDir, asset),
            ),
          )
        }),
      )
      const failedCopy = results.find(result => result.status === 'rejected')
      if (failedCopy?.status === 'rejected') {
        throw failedCopy.reason
      }
    },
  }
}

const pkg = JSON.parse(
  readFileSync(path.join(rootPath, 'package.json'), 'utf8'),
) as { version?: string | undefined }
const extensionVersion = pkg.version ?? '0.0.0'

const minify = getEnvValue('MINIFY') === '1'

const config: RolldownOptions = {
  experimental: { attachDebugInfo: 'none' },
  // `vscode` is injected by the extension host; `tree-sitter-java` is a native
  // module resolved at runtime, not bundled. `@ultrathink/acorn.rs.wasm` stays
  // external so the bundle keeps a runtime
  // `require('@ultrathink/acorn.rs.wasm')`; `output.paths` rewrites that to the
  // `./acorn-wasm.cjs` sibling `stageParserWasmPlugin` copies into `out/`.
  external: ['vscode', 'tree-sitter-java', '@ultrathink/acorn.rs.wasm'],
  input: { main: path.join(rootPath, 'src', 'extension.mts') },
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
    entryFileNames: 'main.cjs',
    // Keep emitted `.go` (and any other) asset filenames stable + readable;
    // the extension resolves them relative to the bundle at runtime.
    assetFileNames: '[name][extname]',
    minify,
    paths: { '@ultrathink/acorn.rs.wasm': './acorn-wasm.cjs' },
    sourcemap: !minify,
  },
  platform: 'node',
  plugins: [
    // `defineGuarded` keys are dotted member chains. Source may spell the
    // access with a dot or with quoted brackets — TypeScript forces
    // `process.env['X']` on index-signature types — and both normalize to this
    // same key. The `INLINED_*` name follows the fleet convention (see
    // socket-cli) for build-inlined values.
    defineGuardedPlugin({
      'process.env.INLINED_EXTENSION_VERSION': JSON.stringify(extensionVersion),
    }),
    stageParserWasmPlugin(),
  ],
  // The sources are `.mts` (the fleet's sources-are-mts rule) and import each
  // other extensionlessly, which rolldown's default extension list does not
  // cover — without `.mts` here every relative import fails to resolve.
  resolve: {
    extensions: ['.mts', '.ts', '.mjs', '.js', '.json'],
  },
}

// rolldown requires default-exported config object.
// oxlint-disable-next-line socket/no-default-export -- config
export default config
