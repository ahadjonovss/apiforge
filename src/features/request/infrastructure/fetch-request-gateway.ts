import { auth } from '@/core/config/firebase'
import { describeNetworkError } from '../application/describe-error'
import type { HttpCall, RequestGateway } from '../domain/request-gateway'
import { HttpRequestFailure, type ResponseResult } from '../domain/response'

const DEV_PROXY_PATH = '/__apiforge_proxy'
const DEPLOYED_PROXY_PATH = '/api/proxy'
const PROXY_ERROR_HEADER = 'x-apiforge-proxy-error'
const PROXY_CODE_HEADER = 'x-apiforge-error-code'
const PROXY_CONTENT_TYPE_HEADER = 'x-apiforge-content-type'
const PROXY_TOKEN_HEADER = 'x-apiforge-token'
const PROXY_ADDED_HEADERS = new Set(['x-content-type-options', 'content-security-policy'])

function proxyPath(): string {
  if (__DEV_PROXY__) {
    return import.meta.env.VITE_DEV_PROXY === 'false' ? '' : DEV_PROXY_PATH
  }
  const configured = import.meta.env.VITE_PROXY_PATH?.trim()
  return configured ? configured : DEPLOYED_PROXY_PATH
}

function resolveTarget(url: URL): string {
  const path = proxyPath()
  if (!path) return url.toString()
  return `${path}?target=${encodeURIComponent(url.toString())}`
}

export const fetchRequestGateway: RequestGateway = {
  async send(call: HttpCall, signal: AbortSignal): Promise<ResponseResult> {
    const startedAt = performance.now()
    const viaProxy = proxyPath() !== ''

    const headers = new Headers(call.headers)
    if (viaProxy) {
      const token = await auth.currentUser?.getIdToken().catch(() => null)
      if (token) headers.set(PROXY_TOKEN_HEADER, token)
    }

    let response: Response
    try {
      response = await fetch(resolveTarget(call.url), {
        method: call.method,
        headers,
        body: call.body,
        signal,
      })
    } catch (error) {
      const durationMs = Math.round(performance.now() - startedAt)

      if (viaProxy) {
        throw new HttpRequestFailure({
          kind: 'network',
          title: 'error.title.proxyDown',
          message: 'error.msg.proxyDown',
          hint: 'error.hint.proxyDown',
          params: { ms: durationMs },
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
          title: 'error.title.invalid',
          message: text,
          params: { ms: durationMs },
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

    const upstreamType = response.headers.get(PROXY_CONTENT_TYPE_HEADER)

    const received: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      if (key === PROXY_CONTENT_TYPE_HEADER) return
      if (viaProxy && PROXY_ADDED_HEADERS.has(key)) return
      received[key] = key === 'content-type' && upstreamType ? upstreamType : value
    })
    if (upstreamType) received['content-type'] = upstreamType

    return {
      status: response.status,
      statusText: response.statusText,
      headers: received,
      body: text,
      contentType: upstreamType ?? response.headers.get('content-type'),
      durationMs,
      sizeBytes: new Blob([text]).size,
      receivedAt: Date.now(),
    }
  },
}
