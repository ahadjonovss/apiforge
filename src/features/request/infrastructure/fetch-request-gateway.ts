import type { HttpCall, RequestGateway } from '../domain/request-gateway'
import { HttpRequestFailure, type ResponseResult } from '../domain/response'

const DEV_PROXY_PATH = '/__apiforge_proxy'
const PROXY_ERROR_HEADER = 'x-apiforge-proxy-error'

function resolveTarget(url: URL): string {
  if (!__DEV_PROXY__ || import.meta.env.VITE_DEV_PROXY === 'false') return url.toString()
  return `${DEV_PROXY_PATH}?target=${encodeURIComponent(url.toString())}`
}

export const fetchRequestGateway: RequestGateway = {
  async send(call: HttpCall, signal: AbortSignal): Promise<ResponseResult> {
    const startedAt = performance.now()

    let response: Response
    try {
      response = await fetch(resolveTarget(call.url), {
        method: call.method,
        headers: call.headers,
        body: call.body,
        signal,
      })
    } catch (error) {
      const durationMs = Math.round(performance.now() - startedAt)
      throw new HttpRequestFailure({
        kind: 'network',
        message:
          error instanceof Error
            ? `${error.message} (${durationMs}ms) — CORS yoki tarmoq muammosi bo'lishi mumkin`
            : 'Nomaʼlum tarmoq xatosi',
      })
    }

    const text = await response.text()
    const durationMs = Math.round(performance.now() - startedAt)

    if (response.headers.has(PROXY_ERROR_HEADER)) {
      throw new HttpRequestFailure({
        kind: response.status === 400 ? 'invalid' : 'network',
        message: `${text} (${durationMs}ms)`,
      })
    }

    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })

    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      body: text,
      contentType: response.headers.get('content-type'),
      durationMs,
      sizeBytes: new Blob([text]).size,
      receivedAt: Date.now(),
    }
  },
}
