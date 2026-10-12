import crypto from 'node:crypto'

export const RETIRED_API_TOKEN_ERROR_CODE = 'SOCKET_RETIRED_API_TOKEN'
export const RETIRED_API_TOKEN_ERROR_MESSAGE =
  'This API token is retired. Reauthenticate through Socket Security Login.'

const retiredApiTokenFingerprint =
  '9cab58b24140ee12c08e265729d246f9200f8ef9b1d884f90c06c4e6b69adf18'

export function createRetiredApiTokenError(): Error & { code: string } {
  return Object.assign(new Error(RETIRED_API_TOKEN_ERROR_MESSAGE), {
    code: RETIRED_API_TOKEN_ERROR_CODE,
  })
}

export function isRetiredApiToken(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    crypto.createHash('sha256').update(value.trim()).digest('hex') ===
      retiredApiTokenFingerprint
  )
}

export function throwIfRetiredApiToken(value: unknown): void {
  if (isRetiredApiToken(value)) {
    throw createRetiredApiTokenError()
  }
}
