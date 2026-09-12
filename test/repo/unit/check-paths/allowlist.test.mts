import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { safeDelete } from '@socketsecurity/lib-stable/fs/safe'
import os from 'node:os'
import path from 'node:path'
import { afterEach, expect, it } from 'vitest'

import { loadAllowlist } from '../../../../scripts/check-paths/allowlist.mts'

const directories: string[] = []

afterEach(async () => {
  for (const directory of directories.splice(0)) {
    await safeDelete(directory)
  }
})

it.each(['|', '>'])(
  'parses a %s reason and a following dedented entry',
  kind => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'allowlist-test-'))
    directories.push(directory)
    mkdirSync(path.join(directory, '.github'))
    writeFileSync(
      path.join(directory, '.github/paths-allowlist.yml'),
      [
        '- file: example.mts',
        `  reason: ${kind}`,
        '    first line',
        '    second line',
        '- file: another.mts',
        '  reason: approved exception',
        '',
      ].join('\n'),
    )
    expect(loadAllowlist(directory)).toEqual([
      {
        file: 'example.mts',
        reason:
          kind === '|' ? 'first line\nsecond line' : 'first line second line',
      },
      { file: 'another.mts', reason: 'approved exception' },
    ])
  },
)
