import path from "node:path";
import { defineConfig } from "vitest/config";

const root = path.resolve(import.meta.dirname, "../..");

export default defineConfig({
  resolve: {
    alias: {
      vscode: path.join(root, "test/stubs/vscode.mts"),
    },
  },
  test: {
    setupFiles: [path.join(root, "test/repo/vitest.setup.mts")],
    include: ["test/repo/unit/**/*.test.mts"],
    exclude: [
      "test/**/*.fuzz.mts",
      "test/repo/unit/test-extension.test.mts",
      "test/repo/unit/test-extension-auth.test.mts",
      "test/repo/unit/scripts/install-claude-plugins.test.mts",
    ],
    testTimeout: 15000,
    hookTimeout: 15000,
    pool: "forks",
    maxWorkers: 4,
  },
});
