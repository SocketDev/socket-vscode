/**
 * @file Shared types + the `enosys` helper for the Go WASM syscall ABI shim
 *   (`wasm-executor.ts`). Split out to keep the executor under the file-size
 *   cap — these are the stable, rarely-touched contract pieces the executor and
 *   its syscall stub table both depend on.
 */

export interface GoSyscallError extends Error {
  code: string
}

export function enosys(): GoSyscallError {
  const err = new Error('not implemented') as GoSyscallError
  err.code = 'ENOSYS'
  if ('captureStackTrace' in Error) {
    Error.captureStackTrace(err, enosys)
  }
  return err
}

export type GoCallback<T = unknown> = {
  (err: Error): void
  (err: null, result: T): void
}

export type GoInstance = WebAssembly.Instance & {
  exports: {
    mem: WebAssembly.Memory
    getsp(): number
    run(argc: number, argv: number): void
    resume(): void
  }
}

export interface GoPendingEvent {
  id: number
  this: unknown
  args: IArguments
  result?: unknown | undefined
}
