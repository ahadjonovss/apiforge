export type DataErrorKind =
  | 'not-found'
  | 'permission-denied'
  | 'already-exists'
  | 'validation'
  | 'network'
  | 'unknown'

export interface DataErrorDetail {
  kind: DataErrorKind
  message: string
  params?: Record<string, string | number>
}

export class DataFailure extends Error {
  readonly detail: DataErrorDetail

  constructor(detail: DataErrorDetail) {
    super(detail.message)
    this.name = 'DataFailure'
    this.detail = detail
  }
}

const FIRESTORE_CODES: Record<string, DataErrorDetail> = {
  'permission-denied': {
    kind: 'permission-denied',
    message: 'data.error.permission-denied',
  },
  'not-found': { kind: 'not-found', message: 'data.error.not-found' },
  unavailable: { kind: 'network', message: 'data.error.network' },
  'failed-precondition': {
    kind: 'unknown',
    message: 'data.error.indexMissing',
  },
}

export function toDataFailure(error: unknown): DataFailure {
  if (error instanceof DataFailure) return error

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''

  const mapped = FIRESTORE_CODES[code]
  if (mapped) return new DataFailure(mapped)

  return new DataFailure({
    kind: 'unknown',
    message: error instanceof Error ? error.message : 'data.error.unknown',
  })
}
