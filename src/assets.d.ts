// The `lib` compiler option for the check-only tsconfig is ES-only (no DOM),
// so `WebAssembly`/`BufferSource` — used by the Go WASM glue — are otherwise
// unresolved. This pulls in just their declarations without adding DOM lib
// to the fleet-canonical compilerOptions.
/// <reference lib="dom" />

declare module '*.wasm' {
  const content: Uint8Array
  export default content
}

declare module '*.wasm.gz' {
  const gzippedContent: Uint8Array
  export default gzippedContent
}

declare module '*.go' {
  const filePath: string
  export default filePath
}

declare module '*.py' {
  const fileContents: string
  export default fileContents
}
