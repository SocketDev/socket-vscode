/**
 * @file Socket-vscode repo oxlint config. Imports the fleet factory and
 *   augments it in JS — see `.config/fleet/oxlint.config.mts` for why this is
 *   a factory call rather than oxlint `extends` (extends drops
 *   plugins/categories/ignorePatterns and mis-roots relative globs).
 */

import { config } from '../fleet/oxlint.config.mts'

export default config({
  rules: {
    // This extension is interop-heavy by nature: acorn AST node probing
    // (js-source-externals), the Go wasm runtime glue (wasm-executor), branded
    // TextDocumentURIString casts, and JSON.parse narrowing across scripts.
    // Every one of its ~90 `as` sites is a deliberate narrowing at an untyped
    // boundary, so the type-aware blanket rule is noise here. Re-enable per
    // directory as boundaries grow real validators (typebox schemas already
    // cover the lockstep manifest path).
    'typescript/no-unsafe-type-assertion': 'off',
  },
  overrides: [
    {
      // tsgolint resolves each file's nearest tsconfig; everything outside
      // src/ falls back to a projectless view WITHOUT the fleet base's
      // noUncheckedIndexedAccess, so the type-aware pass mislabels the
      // `arr[i]!` assertions those trees need as "unnecessary" and its
      // autofix strips them — breaking the check-tier tsc
      // (.config/fleet/tsconfig.check.json), which DOES see the fleet base.
      // Scope the rule to src/ (covered by the root tsconfig project) until
      // the scripts/test trees get a real tsconfig project of their own.
      files: ['scripts/**', 'test/**', 'vendor/**', '.github/**', '*.mts'],
      rules: {
        'typescript/no-unnecessary-type-assertion': 'off',
      },
    },
  ],
})
