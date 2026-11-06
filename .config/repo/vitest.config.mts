import path from 'node:path'
import { defineConfig } from 'vitest/config'

const root = path.resolve(import.meta.dirname, '../..')

export default defineConfig({
  resolve: {
    alias: {
      vscode: path.join(root, 'test/stubs/vscode.mts'),
    },
  },
  test: {
    include: ['test/**/*.test.mts'],
    exclude: ['test/**/*.fuzz.mts'],
  },
})
