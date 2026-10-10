import crypto from 'node:crypto'

export type AuthContextIdentity = {
  credential: string | undefined
  configuredSlug: string | undefined
  status:
    | 'ambiguous'
    | 'inaccessible'
    | 'invalid'
    | 'invalid-token'
    | 'lookup-failed'
    | 'missing'
    | 'no-token'
    | 'selected'
    | 'unavailable'
  organizationId: string | undefined
  organizationSlug: string | undefined
}

export type AuthContextSnapshot = {
  revision: number
  ready: boolean
  contextId: string | undefined
  valid: boolean
}

export type AuthContextListener = (state: AuthContextSnapshot) => void

export class AuthContextState {
  #revision = 0
  #ready = true
  #contextId: string | undefined
  #identity: AuthContextIdentity | undefined
  #valid = false
  #listeners = new Set<AuthContextListener>()
  readonly #createContextId: () => string

  constructor(createContextId: () => string = () => crypto.randomUUID()) {
    this.#createContextId = createContextId
  }

  begin(): number {
    this.#revision += 1
    this.#ready = false
    this.#notify()
    return this.#revision
  }

  finish(
    syncRevision: number,
    identity: AuthContextIdentity,
  ): AuthContextSnapshot | undefined {
    if (syncRevision !== this.#revision) {
      return undefined
    }
    if (!this.#sameIdentity(identity)) {
      this.#contextId = this.#createContextId()
    }
    this.#identity = identity
    this.#ready = true
    this.#valid =
      identity.status !== 'invalid-token' &&
      identity.status !== 'lookup-failed' &&
      identity.status !== 'unavailable'
    this.#notify()
    return this.get()
  }

  get(): AuthContextSnapshot {
    return {
      revision: this.#revision,
      ready: this.#ready,
      contextId: this.#contextId,
      valid: this.#valid,
    }
  }

  subscribe(listener: AuthContextListener): () => void {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  #sameIdentity(right: AuthContextIdentity): boolean {
    const left = this.#identity
    return (
      left !== undefined &&
      left.credential === right.credential &&
      left.configuredSlug === right.configuredSlug &&
      left.status === right.status &&
      left.organizationId === right.organizationId &&
      left.organizationSlug === right.organizationSlug
    )
  }

  #notify(): void {
    const state = this.get()
    for (const listener of this.#listeners) {
      listener(state)
    }
  }
}

const authContextState = new AuthContextState()

export function beginAuthContextSync(): number {
  return authContextState.begin()
}

export function finishAuthContextSync(
  syncRevision: number,
  identity: AuthContextIdentity,
): boolean {
  return authContextState.finish(syncRevision, identity) !== undefined
}

export function getAuthContextState(): AuthContextSnapshot {
  return authContextState.get()
}

export function onAuthContextStateChange(
  listener: AuthContextListener,
): () => void {
  return authContextState.subscribe(listener)
}
