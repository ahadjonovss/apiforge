export interface ResponseResult {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  contentType: string | null
  durationMs: number
  sizeBytes: number
  receivedAt: number
}

export type RequestErrorKind =
  | 'invalid'
  | 'dns'
  | 'refused'
  | 'unreachable'
  | 'tls'
  | 'timeout'
  | 'cors'
  | 'network'
  | 'blocked'
  | 'unknown'

export interface RequestError {
  kind: RequestErrorKind
  title: string
  message: string
  hint?: string
}

export class HttpRequestFailure extends Error {
  readonly detail: RequestError

  constructor(detail: RequestError) {
    super(detail.message)
    this.name = 'HttpRequestFailure'
    this.detail = detail
  }
}
