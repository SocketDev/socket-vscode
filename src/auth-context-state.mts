export type Listener = (ready: boolean) => void

let revision = 0
let ready = true
const listeners = new Set<Listener>()

export function beginAuthContextSync(): number {
  revision += 1
  ready = false
  for (const listener of listeners) {
    listener(false)
  }
  return revision
}

export function finishAuthContextSync(syncRevision: number): boolean {
  if (syncRevision !== revision) {
    return false
  }
  ready = true
  for (const listener of listeners) {
    listener(true)
  }
  return true
}

export function getAuthContextState(): { revision: number; ready: boolean } {
  return { revision, ready }
}

export function onAuthContextStateChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
