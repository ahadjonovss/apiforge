import { describeNetworkError } from '../application/describe-error'
import type { HttpCall, RequestGateway } from '../domain/request-gateway'
import { HttpRequestFailure, type ResponseResult } from '../domain/response'

const DEV_PROXY_PATH = '/__apiforge_proxy'
const PROXY_ERROR_HEADER = 'x-apiforge-proxy-error'
const PROXY_CODE_HEADER = 'x-apiforge-error-code'

function proxyEnabled(): boolean {
  return __DEV_PROXY__ && import.meta.env.VITE_DEV_PROXY !== 'false'
}

function resolveTarget(url: URL): string {
  if (!proxyEnabled()) return url.toString()
  return `${DEV_PROXY_PATH}?target=${encodeURIComponent(url.toString())}`
}

export const fetchRequestGateway: RequestGateway = {
  async send(call: HttpCall, signal: AbortSignal): Promise<ResponseResult> {
    const startedAt = performance.now()
    const viaProxy = proxyEnabled()

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

      if (viaProxy) {
        throw new HttpRequestFailure({
          kind: 'network',
          title: 'Dev server javob bermadi',
          message: `So'rov proxy'ga ham yetib bormadi (${durationMs}ms)`,
          hint: '`npm run dev` ishlab turibdimi tekshiring.',
        })
      }

      throw new HttpRequestFailure(
        describeNetworkError({
          code: null,
          raw: error instanceof Error ? error.message : String(error),
          host: call.url.hostname,
          viaProxy: false,
          durationMs,
        }),
      )
    }

    const text = await response.text()
    const durationMs = Math.round(performance.now() - startedAt)

    if (response.headers.has(PROXY_ERROR_HEADER)) {
      if (response.status === 400) {
        throw new HttpRequestFailure({
          kind: 'invalid',
          title: "So'rov noto'g'ri",
          message: `${text} (${durationMs}ms)`,
        })
      }

      throw new HttpRequestFailure(
        describeNetworkError({
          code: response.headers.get(PROXY_CODE_HEADER),
          raw: text,
          host: call.url.hostname,
          viaProxy,
          durationMs,
        }),
      )
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
