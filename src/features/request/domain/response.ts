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

export interface RequestError {
  kind: 'network' | 'timeout' | 'blocked' | 'invalid' | 'unknown'
  message: string
}

export class HttpRequestFailure extends Error {
  readonly detail: RequestError

  constructor(detail: RequestError) {
    super(detail.message)
    this.name = 'HttpRequestFailure'
    this.detail = detail
  }
}
