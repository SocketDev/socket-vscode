import { readFileSync } from 'node:fs'

import { rolldown } from 'rolldown'
import { expect, test } from 'vitest'

import config from '../../../.config/repo/rolldown.config.mts'

test('inlines static version reads and preserves strings and source maps', async () => {
  const source = [
    'export const dot = process.env.INLINED_EXTENSION_VERSION',
    "export const bracket = process.env['INLINED_EXTENSION_VERSION']",
    "export const literal = 'process.env.INLINED_EXTENSION_VERSION'",
  ].join('\n')
  const bundle = await rolldown({
    transform: config.transform,
    input: 'version.mts',
    plugins: [
      {
        name: 'version-fixture',
        resolveId: () => 'version.mts',
        load: () => source,
      },
    ],
  })
  try {
    const {
      output: [chunk],
    } = await bundle.generate({ format: 'esm', sourcemap: true })
    const { version } = JSON.parse(
      readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'),
    )
    const result = await import(
      'data:text/javascript,' + encodeURIComponent(chunk.code)
    )
    expect([result.dot, result.bracket]).toEqual([version, version])
    expect(result.literal).toBe('process.env.INLINED_EXTENSION_VERSION')
    expect(chunk.map?.sourcesContent).toContain(source)
  } finally {
    await bundle.close()
  }
})
