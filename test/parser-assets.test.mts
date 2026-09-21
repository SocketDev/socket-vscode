import { mkdtemp } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'

import { expect, test } from 'vitest'
import { safeDelete } from '@socketsecurity/lib-stable/fs/safe'

import { stageParserWasmPlugin } from '../.config/repo/rolldown.config.mts'

test('staged parser runtimes load and parse without workspace dependencies', async () => {
  const outputDir = await mkdtemp(
    path.join(os.tmpdir(), 'socket-parser-assets-'),
  )
  try {
    const plugin = stageParserWasmPlugin()
    expect(typeof plugin.writeBundle).toBe('function')
    if (typeof plugin.writeBundle !== 'function') {
      throw new TypeError('Parser staging requires a writeBundle function.')
    }
    await Reflect.apply(plugin.writeBundle, {}, [{ dir: outputDir }, {}])
    const require = createRequire(path.join(outputDir, 'extension.cjs'))
    const jsonParser = require('./json-bindgen.cjs') as {
      parse: (source: string) => unknown
    }
    const tomlParser = require('./toml-bindgen.cjs') as {
      parse: (source: string) => unknown
    }
    const jsParser = require('./acorn-wasm.cjs') as {
      parse: (source: string, options: { ecmaVersion: number }) => unknown
    }
    expect(jsonParser.parse('{"name":"example-package"}')).toMatchObject({
      root: {
        type: 'object',
        members: [
          { key: { value: 'name' }, value: { value: 'example-package' } },
        ],
      },
    })
    expect(tomlParser.parse('name = "example-package"')).toMatchObject({
      root: {
        type: 'table',
        members: [
          { key: { value: 'name' }, value: { value: 'example-package' } },
        ],
      },
    })
    expect(
      jsParser.parse('const dependency = 1', { ecmaVersion: 2024 }),
    ).toMatchObject({
      type: 'Program',
      body: [{ type: 'VariableDeclaration' }],
    })
  } finally {
    await safeDelete(outputDir)
  }
})
