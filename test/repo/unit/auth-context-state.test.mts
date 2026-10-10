import { describe, expect, test } from 'vitest'

import {
  AuthContextState,
  type AuthContextIdentity,
} from '../../../src/auth-context-state.mts'

const identity: AuthContextIdentity = {
  credential: 'token-one',
  configuredSlug: 'example-org',
  status: 'selected',
  organizationId: 'org-one',
  organizationSlug: 'example-org',
}

describe('authentication context state', () => {
  test('keeps the opaque ID for an unchanged committed identity', () => {
    const state = new AuthContextState(() => 'context-one')
    const firstRevision = state.begin()
    const first = state.finish(firstRevision, identity)
    const secondRevision = state.begin()
    const second = state.finish(secondRevision, { ...identity })

    expect(first?.contextId).toBe('context-one')
    expect(second?.contextId).toBe('context-one')
  })

  test('changes identity when the credential, slug, org, or status changes', () => {
    let id = 0
    const state = new AuthContextState(() => `context-${++id}`)
    const firstRevision = state.begin()
    state.finish(firstRevision, identity)
    const variants: AuthContextIdentity[] = [
      { ...identity, credential: 'token-two' },
      { ...identity, configuredSlug: 'other-org' },
      { ...identity, organizationId: 'org-two' },
      { ...identity, status: 'inaccessible' },
    ]
    const results = variants.map(variant => {
      const revision = state.begin()
      return state.finish(revision, variant)
    })

    expect(results.map(result => result?.contextId)).toEqual([
      'context-2',
      'context-3',
      'context-4',
      'context-5',
    ])
  })

  test('lets only the newest overlapping sync commit', () => {
    let id = 0
    const state = new AuthContextState(() => `context-${++id}`)
    const firstRevision = state.begin()
    const secondRevision = state.begin()

    expect(state.finish(firstRevision, identity)).toBeUndefined()
    expect(state.get().ready).toBe(false)
    expect(state.finish(secondRevision, identity)?.contextId).toBe('context-1')
  })

  test('keeps one pending generation while synchronization repeats', () => {
    const state = new AuthContextState(() => 'context-one')
    const revisions = [state.begin(), state.begin(), state.begin()]

    expect(revisions).toEqual([1, 2, 3])
    expect(state.get()).toEqual({
      revision: 3,
      ready: false,
      contextId: undefined,
      valid: false,
    })
  })

  test('marks a failed organization lookup invalid for consumers', () => {
    const state = new AuthContextState(() => 'context-failed')
    const revision = state.begin()
    const result = state.finish(revision, {
      ...identity,
      status: 'lookup-failed',
    })

    expect(result).toEqual({
      revision,
      ready: true,
      contextId: 'context-failed',
      valid: false,
    })
  })
})
