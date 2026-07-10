/**
 * @file The four git-partial-submodule subcommands: add, clone, save-sparse,
 *   restore-sparse.
 */

import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import {
  applySparsePatterns,
  getRoots,
  logger,
  readGitmodules,
  readGitOutput,
  runGit,
  toWorktreeRelative,
} from './git-helpers.mts'

import type { AddOpts, CloneOpts, SaveOrRestoreOpts } from './types.mts'

export async function cmdAdd(common: AddOpts): Promise<void> {
  const { repoRoot, worktreeRoot } = await getRoots()
  if (common.verbose) {
    logger.log(`worktree root: ${worktreeRoot}`)
    logger.log(`repo root: ${repoRoot}`)
  }
  const submoduleRelPath = toWorktreeRelative(worktreeRoot, common.path)
  const submoduleName = common.name ?? submoduleRelPath
  const submoduleRepoRoot = path.join(repoRoot, 'modules', submoduleName)
  if (existsSync(submoduleRepoRoot)) {
    logger.error(`submodule ${submoduleName} repo already exists!`)
    process.exit(1)
  }
  const submoduleWorktreeRoot = path.join(worktreeRoot, submoduleRelPath)
  if (
    existsSync(submoduleWorktreeRoot) &&
    readdirSync(submoduleWorktreeRoot).length > 0
  ) {
    logger.error(`${common.path} submodule worktree is nonempty!`)
    process.exit(1)
  }
  const indexCheck = (
    await readGitOutput([
      '-C',
      worktreeRoot,
      'ls-files',
      '--cached',
      submoduleRelPath,
    ])
  ).trim()
  if (indexCheck) {
    logger.error(
      `${common.path} submodule worktree is nonempty in the index!\n` +
        `You might need to \`git rm\` that directory first.`,
    )
    process.exit(1)
  }
  if (!common.dryRun) {
    mkdirSync(path.dirname(submoduleRepoRoot), { recursive: true })
    mkdirSync(submoduleWorktreeRoot, { recursive: true })
  }
  await runGit(common, [
    'clone',
    '--filter=blob:none',
    '--no-checkout',
    '--separate-git-dir',
    submoduleRepoRoot,
    ...(common.branch ? ['--branch', common.branch] : []),
    ...(common.sparse ? ['--sparse'] : []),
    common.repository,
    submoduleWorktreeRoot,
  ])
  await runGit(common, [
    '-C',
    submoduleWorktreeRoot,
    'checkout',
    ...(common.branch ? [common.branch] : []),
  ])
  await runGit(common, [
    '-C',
    submoduleWorktreeRoot,
    'config',
    'core.worktree',
    submoduleWorktreeRoot.replaceAll(path.sep, '/'),
  ])
  await runGit(common, [
    '-C',
    worktreeRoot,
    'submodule',
    'add',
    ...(common.branch ? ['-b', common.branch] : []),
    ...(common.name ? ['--name', common.name] : []),
    common.repository,
    submoduleRelPath,
  ])
}

export async function cmdClone(common: CloneOpts): Promise<void> {
  const { repoRoot, worktreeRoot } = await getRoots()
  if (common.verbose) {
    logger.log(`worktree root: ${worktreeRoot}`)
    logger.log(`repo root: ${repoRoot}`)
  }
  const gitmodules = await readGitmodules(common, worktreeRoot)
  await runGit(common, ['submodule', 'init', ...common.paths])
  const relPaths: string[] = common.paths.length
    ? common.paths.map(p => toWorktreeRelative(worktreeRoot, p))
    : [...gitmodules.byPath.keys()]
  let skipped = 0
  let processed = 0
  for (let i = 0, { length } = relPaths; i < length; i += 1) {
    const submoduleRelPath = relPaths[i]!
    const submodule = gitmodules.byPath.get(submoduleRelPath)
    if (!submodule) {
      logger.error(
        `Couldn't find ${submoduleRelPath} in .gitmodules! Skipping.`,
      )
      skipped += 1
      continue
    }
    const submoduleRepoRoot = path.join(repoRoot, 'modules', submodule.name)
    if (
      existsSync(submoduleRepoRoot) &&
      readdirSync(submoduleRepoRoot).length > 0
    ) {
      if (common.verbose) {
        logger.log(`submodule ${submodule.name} repo already exists; skipping`)
      }
      skipped += 1
      continue
    }
    const submoduleWorktreeRoot = path.join(worktreeRoot, submoduleRelPath)
    if (
      existsSync(submoduleWorktreeRoot) &&
      readdirSync(submoduleWorktreeRoot).length > 0
    ) {
      logger.error(
        `${submoduleRelPath} submodule worktree is nonempty! Skipping.`,
      )
      skipped += 1
      continue
    }
    if (!common.dryRun) {
      mkdirSync(path.dirname(submoduleRepoRoot), { recursive: true })
      mkdirSync(submoduleWorktreeRoot, { recursive: true })
    }
    const url = submodule.url
    if (!url) {
      logger.error(`Submodule ${submodule.name} missing url; skipping`)
      skipped += 1
      continue
    }
    await runGit(common, [
      'clone',
      '--filter=blob:none',
      '--no-checkout',
      '--separate-git-dir',
      submoduleRepoRoot,
      ...(submodule.branch ? ['--branch', submodule.branch] : []),
      url,
      submoduleWorktreeRoot,
    ])
    const sparsePatterns = submodule['sparse-checkout']
    if (sparsePatterns) {
      await applySparsePatterns(common, submoduleWorktreeRoot, sparsePatterns)
      logger.log(`Applied sparse-checkout patterns: ${sparsePatterns}`)
    }
    // Resolve the recorded gitlink sha to detach-checkout at.
    const treeInfo = (
      await readGitOutput([
        '-C',
        worktreeRoot,
        'ls-tree',
        'HEAD',
        submoduleRelPath,
      ])
    )
      .trim()
      .split(/\s+/)
    if (treeInfo.length !== 4) {
      logger.error('git ls-tree produced unexpected output:')
      logger.error(treeInfo.join(' '))
      process.exit(1)
    }
    const submoduleCommit = treeInfo[2]!
    if (common.verbose) {
      logger.log(`${submodule.name} submodule sha1 is ${submoduleCommit}`)
    }
    let checkoutArgs: string[] = ['--detach', submoduleCommit]
    if (submodule.branch && !common.dryRun) {
      const branchHeadCommit = (
        await readGitOutput([
          '-C',
          submoduleWorktreeRoot,
          'rev-parse',
          submodule.branch,
        ])
      ).trim()
      if (common.verbose) {
        logger.log(
          `${submoduleRelPath} branch ${submodule.branch} is at sha1 ${branchHeadCommit}`,
        )
      }
      if (branchHeadCommit === submoduleCommit) {
        checkoutArgs = [submodule.branch]
      }
    }
    await runGit(common, [
      '-C',
      submoduleWorktreeRoot,
      'checkout',
      ...checkoutArgs,
    ])
    await runGit(common, [
      '-C',
      submoduleWorktreeRoot,
      'config',
      'core.worktree',
      submoduleWorktreeRoot.replaceAll(path.sep, '/'),
    ])
    processed += 1
  }
  logger.log(`Cloned ${processed} submodules and skipped ${skipped}.`)
}

export async function cmdSaveSparse(common: SaveOrRestoreOpts): Promise<void> {
  const { worktreeRoot } = await getRoots()
  const gitmodules = await readGitmodules(common, worktreeRoot)
  const relPaths: string[] = common.paths.length
    ? common.paths.map(p => toWorktreeRelative(worktreeRoot, p))
    : [...gitmodules.byPath.keys()]
  for (let i = 0, { length } = relPaths; i < length; i += 1) {
    const submoduleRelPath = relPaths[i]!
    const submodule = gitmodules.byPath.get(submoduleRelPath)
    if (!submodule) {
      logger.error(
        `Couldn't find ${submoduleRelPath} in .gitmodules! Skipping.`,
      )
      continue
    }
    const submoduleWorktreeRoot = path.join(worktreeRoot, submoduleRelPath)
    if (
      !existsSync(submoduleWorktreeRoot) ||
      readdirSync(submoduleWorktreeRoot).length === 0
    ) {
      logger.error(`${submoduleRelPath} submodule worktree is empty! Skipping.`)
      continue
    }
    const sparseEnabled = (
      await readGitOutput(
        ['-C', submoduleWorktreeRoot, 'config', 'core.sparseCheckout'],
        { okReturnCodes: [0, 1] },
      )
    ).trim()
    if (sparseEnabled === 'true') {
      const sparsePatterns = (
        await readGitOutput([
          '-C',
          submoduleWorktreeRoot,
          'sparse-checkout',
          'list',
        ])
      ).trim()
      await runGit(common, [
        '-C',
        worktreeRoot,
        'config',
        '-f',
        '.gitmodules',
        `submodule.${submodule.name}.sparse-checkout`,
        sparsePatterns.replaceAll('\n', ' '),
      ])
      logger.log(`Saved sparse-checkout patterns for ${submodule.name}.`)
    } else {
      await runGit(
        common,
        [
          '-C',
          worktreeRoot,
          'config',
          '-f',
          '.gitmodules',
          '--unset',
          `submodule.${submodule.name}.sparse-checkout`,
        ],
        { okReturnCodes: [0, 5] },
      )
      logger.log(`Sparse checkout not enabled for ${submodule.name}.`)
    }
  }
}

export async function cmdRestoreSparse(
  common: SaveOrRestoreOpts,
): Promise<void> {
  const { worktreeRoot } = await getRoots()
  const gitmodules = await readGitmodules(common, worktreeRoot)
  const relPaths: string[] = common.paths.length
    ? common.paths.map(p => toWorktreeRelative(worktreeRoot, p))
    : [...gitmodules.byPath.keys()]
  for (let i = 0, { length } = relPaths; i < length; i += 1) {
    const submoduleRelPath = relPaths[i]!
    const submodule = gitmodules.byPath.get(submoduleRelPath)
    if (!submodule) {
      logger.error(
        `Couldn't find ${submoduleRelPath} in .gitmodules! Skipping.`,
      )
      continue
    }
    const submoduleWorktreeRoot = path.join(worktreeRoot, submoduleRelPath)
    if (
      !existsSync(submoduleWorktreeRoot) ||
      readdirSync(submoduleWorktreeRoot).length === 0
    ) {
      logger.error(`${submoduleRelPath} submodule worktree is empty! Skipping.`)
      continue
    }
    const sparsePatterns = submodule['sparse-checkout']
    if (sparsePatterns) {
      await applySparsePatterns(common, submoduleWorktreeRoot, sparsePatterns)
      logger.log(`Applied sparse-checkout patterns for ${submodule.name}.`)
    } else {
      await runGit(common, [
        '-C',
        submoduleWorktreeRoot,
        'sparse-checkout',
        'disable',
      ])
      logger.log(`Sparse checkout disabled for ${submodule.name}.`)
    }
  }
}
