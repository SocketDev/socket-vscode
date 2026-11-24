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
    setupFiles: [path.join(root, 'test/repo/vitest.setup.mts')],
    include: ['test/repo/unit/**/*.test.mts'],
    testTimeout: 15_000,
    hookTimeout: 15_000,
    pool: 'forks',
    maxWorkers: 4,
  },
})
