import importFinder from './find-imports.go'
import childProcess from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'

let cachedBin: Promise<string> | null = null
let lastBinPath: string | null = null

export async function generateNativeGoImportBinary(goBin: string) {
  if (cachedBin && lastBinPath === goBin) {
    const bin = await cachedBin.catch(() => undefined)
    if (bin) {
      // Need metadata to reject directories at cached path.
      // oxlint-disable-next-line socket/prefer-exists-sync -- lstat
      const valid = await fs.lstat(bin).then(
        f => {
          return f.isFile()
        },
        err => {
          if (
            err &&
            (typeof err as { code?: unknown | undefined }).code === 'ENOENT'
          ) {
            return false
          }
          throw err
        },
      )
      if (valid) {
        return bin
      }
    }
  }
  lastBinPath = goBin
  cachedBin = (async () => {
    const outBin = path.join(
      await fs.mkdtemp(path.join(os.tmpdir(), 'socket-')),
      'go-import-parser',
    )
    const args = ['build', '-o', outBin, importFinder]
    // Need child handle for hand-rolled timeout; lib doesn't expose it.
    // oxlint-disable-next-line socket/prefer-async-spawn -- timeout
    const build = childProcess.spawn(goBin, args, {
      cwd: __dirname,
    })

    const exitCode = await new Promise<number | null>((resolve, reject) => {
      // oxlint-disable-next-line socket/no-bare-spawn-childproc-access -- `build` is node:child_process.spawn (not the fleet wrapper), so it's a real ChildProcess with .once
      build.once('exit', resolve)
      // oxlint-disable-next-line socket/no-bare-spawn-childproc-access -- same: real ChildProcess, not the fleet spawn wrapper
      build.once('error', reject)
      setTimeout(() => reject(new Error('timeout')), 3000)
    })

    if (exitCode) {
      throw new Error(`failed to build with code ${exitCode}`)
    }

    return outBin
  })()

  return cachedBin
}
