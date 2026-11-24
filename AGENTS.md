# Socket Security VS Code extension


This repo is the Socket Security VS Code extension: `src/extension.mts` bundles to `out/main.cjs` for the extension host.

- Build with `pnpm run build` (defaults to `build:dev`, config at `.config/repo/rolldown.config.mts`); use `build:prod` for production, `watch` for rebuilds, and `package-for-vscode` for the VSIX.
- The VSIX ships `out/` and never `node_modules/`, so a runtime-external package must be staged into `out/` by a rolldown plugin.
- `stageParserWasmPlugin` stages the Acorn, JSON, and TOML parser glue and WASM files into `out/`; `output.paths` rewrites Acorn's external require to `./acorn-wasm.cjs`.
- The extension version reaches runtime as the build-time define `process.env.INLINED_EXTENSION_VERSION`, substituted in read positions only by Rolldown’s native define transform.
- Tests use the `vscode` stub configured in `.config/repo/vitest.local.mts`. Modules that import `vscode` need this alias or their own `vi.mock`.
- Root `vitest.config.mts` discovers `.config/repo/vitest.fuzz.config.mts` for the fuzz lane; run it through `pnpm run test:fuzz`.
- Hover text renders as a `MarkdownString` with `supportHtml` on, so interpolate API and workspace strings only through `escapeMarkdownHtml` / `encodeMarkdownLinkUrl` (`src/util.mts`).
- A resolver whose result gets spawned withholds the path until the workspace is trusted (`src/data/python/interpreter.mts`, `src/data/go/executable.mts`); callers fall back to source-text parsing.
