// The root config re-exports this file for vitiate child-process discovery.
import { defineConfig } from 'vitest/config'

import { getEnvValue } from '@socketsecurity/lib-stable/env/rewire'
import { vitiatePlugin } from '@vitiate/core/plugin'

// Non-`VITIATE_`-prefixed so vitiate's warnUnknownVitiateEnvVars() stays quiet;
// CI raises the budget by exporting FUZZ_TIME_MS before `pnpm run test:fuzz`.
const FUZZ_TIME_MS = Number(getEnvValue('FUZZ_TIME_MS')) || 15_000

// vitest config requires a default export.
// oxlint-disable-next-line socket/no-default-export -- config
export default defineConfig({
  plugins: [
    vitiatePlugin({
      // Instrument this repo's OWN source (the fuzz targets import `src/`
      // directly); `packages` is only for node_modules dependency
      // instrumentation.
      instrument: { include: ['src/**/*.mts'] },
      fuzz: {
        fuzzTimeMs: FUZZ_TIME_MS,
        stopOnCrash: true,
        detectors: { prototypePollution: true },
      },
    }),
  ],
  test: {
    include: ['test/**/*.fuzz.mts'],
    // An empty match is not a failure - a repo with no fuzz target yet
    // stays quiet instead of failing its scheduled run.
    passWithNoTests: true,
  },
})
