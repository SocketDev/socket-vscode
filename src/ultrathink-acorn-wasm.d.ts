/**
 * Ambient module declaration for `@ultrathink/acorn.wasm`.
 *
 * The package ships a plain CJS entry (`index.cjs`) with no bundled type
 * declarations, and its name matches the `*.wasm` asset wildcard in
 * `assets.d.ts` — this exact-match declaration overrides that wildcard.
 * Only the surface `src/ui/externals/js-source-externals.ts` consumes
 * (`parse`, `simple`) is declared.
 */
declare module '@ultrathink/acorn.wasm' {
  interface AcornWasmNode {
    type: string
    start: number
    end: number
    [key: string]: unknown
  }

  export function parse(
    code: string,
    options?: Record<string, unknown>,
  ): AcornWasmNode
  export function simple(
    code: string,
    visitors: Record<string, (node: AcornWasmNode) => void>,
    options?: Record<string, unknown>,
  ): void
}
