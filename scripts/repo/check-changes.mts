import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

function git(...args: string[]) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
}

function reject(reason: string) {
  console.error(reason)
  process.exitCode = 1
}

function checkMessage(message: string) {
  if (
    !/^(?:(?:build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(?:\([^)]+\))?!?: \S|Merge |Revert "|fixup! |squash! )/.test(
      message,
    )
  ) {
    reject('Use a Conventional Commit subject.')
  }
  if (
    /^(?:assisted-by:|co-authored-by:.*(?:claude|codex|copilot|openai))/im.test(
      message,
    )
  ) {
    reject('Remove agent attribution from the commit message.')
  }
}

const paths = new Set(
  '.config .editorconfig .gitattributes .github .git-hooks .gitignore .node-version .npmrc .toolingignore .vscode AGENTS.md LICENSE README.md assets depot.json docs package.json patches pnpm-lock.yaml pnpm-workspace.yaml scripts src test tsconfig.json vendor vitest.config.mts'.split(
    ' ',
  ),
)
const credentials =
  /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY(?: BLOCK)?-----|\bAKIA[A-Z0-9]{16}\b|\bgh[pours]_[A-Za-z0-9._]{36,}|\bgithub_pat_[A-Za-z0-9_]{20,}|\bsktsec_[A-Za-z0-9_-]+/
const homePath = /(?:\/Users\/|\/home\/|[A-Z]:[\\/]Users[\\/])[\w.-]+[\\/]/i

function checkDiff(args: string[]) {
  for (const file of git(
    'diff',
    ...args,
    '--name-only',
    '--no-renames',
    '--diff-filter=AMT',
    '-z',
    '--',
  )
    .split('\0')
    .filter(Boolean)) {
    if (
      !paths.has(file.split('/')[0]!) ||
      /(?:^|\/)(?:\.env(?:\.|$)|id_rsa$|id_ed25519$)|\.(?:pem|p12|pfx|vsix)$/i.test(
        file,
      )
    ) {
      reject('Unexpected tracked path: ' + file)
    }
  }
  const patch = git(
    'diff',
    ...args,
    '--no-ext-diff',
    '--no-textconv',
    '--no-renames',
    '--unified=0',
    '--',
  )
  let file = ''
  for (const line of patch.split('\n')) {
    if (line.startsWith('+++ ')) {
      file = line.slice(4)
    } else if (line.startsWith('+')) {
      const content = line.slice(1)
      if (
        credentials.test(content.replace(/\bsktsec_test_token\b/g, '')) ||
        homePath.test(content) ||
        /^(?:<{7} |>{7} )/.test(content)
      ) {
        reject('Credential, personal path, or conflict marker in ' + file)
      }
    }
  }
}

function checkRange(base: string, head: string) {
  for (const commit of git('rev-list', '--reverse', head, '^' + base)
    .trim()
    .split('\n')
    .filter(Boolean)) {
    checkMessage(git('show', '-s', '--format=%B', commit))
    checkDiff([commit + '^1', commit])
  }
}

const [mode, base, head] = process.argv.slice(2)
if (mode === 'staged') {
  checkDiff(['--cached'])
} else if (mode === 'message' && base) {
  checkMessage(readFileSync(base, 'utf8'))
} else if (mode === 'range' && base && head) {
  checkRange(base, head)
} else if (mode === 'push') {
  for (const row of readFileSync(0, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)) {
    const [, local, , remote] = row.split(' ')
    if (local && remote && !/^0+$/.test(local)) {
      checkRange(
        /^0+$/.test(remote)
          ? git('merge-base', 'origin/main', local).trim()
          : remote,
        local,
      )
    }
  }
} else {
  throw new Error('Expected staged, message, range or push.')
}
