import { rm } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
for (const entry of ['coverage', 'dist', 'out', '.vitest']) {
  await rm(path.join(root, entry), { force: true, recursive: true })
}
