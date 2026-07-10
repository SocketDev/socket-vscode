/**
 * @file Shared types for the git-partial-submodule CLI split (types /
 *   git-helpers / commands / entry point).
 */

export type CommonOpts = {
  dryRun: boolean
  verbose: boolean
}

export type AddOpts = CommonOpts & {
  branch: string | undefined
  name: string | undefined
  path: string
  repository: string
  sparse: boolean
}

export type CloneOpts = CommonOpts & {
  paths: string[]
}

export type SaveOrRestoreOpts = CommonOpts & {
  paths: string[]
}

export type Submodule = {
  branch?: string | undefined
  name: string
  path?: string | undefined
  'sparse-checkout'?: string | undefined
  url?: string | undefined
}

export type Gitmodules = {
  byName: Map<string, Submodule>
  byPath: Map<string, Submodule>
}
