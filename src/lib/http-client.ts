import type { KeyValue, RequestDef, RequestError, ResponseResult } from '@/types/http'
import { interpolate, type VariableScope } from '@/lib/interpolate'

export class HttpRequestFailure extends Error {
  readonly detail: RequestError

  constructor(detail: RequestError) {
    super(detail.message)
    this.name = 'HttpRequestFailure'
    this.detail = detail
  }
}

function activePairs(pairs: KeyValue[], scope: VariableScope) {
  return pairs
    .filter((pair) => pair.enabled && pair.key.trim() !== '')
    .map((pair) => [interpolate(pair.key, scope), interpolate(pair.value, scope)] as const)
}

function buildUrl(request: RequestDef, scope: VariableScope): URL {
  const raw = interpolate(request.url, scope).trim()
  if (!raw) {
    throw new HttpRequestFailure({ kind: 'invalid', message: 'URL kiritilmagan' })
  }

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`

  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    throw new HttpRequestFailure({ kind: 'invalid', message: `URL noto'g'ri: ${raw}` })
  }

  for (const [key, value] of activePairs(request.params, scope)) {
    url.searchParams.append(key, value)
  }

  return url
}

function buildHeaders(request: RequestDef, scope: VariableScope): Headers {
  const headers = new Headers()

  for (const [key, value] of activePairs(request.headers, scope)) {
    headers.append(key, value)
  }

  const auth = request.auth
  if (auth.mode === 'bearer' && auth.bearer?.token) {
    headers.set('Authorization', `Bearer ${interpolate(auth.bearer.token, scope)}`)
  } else if (auth.mode === 'basic' && auth.basic) {
    const user = interpolate(auth.basic.username, scope)
    const pass = interpolate(auth.basic.password, scope)
    headers.set('Authorization', `Basic ${btoa(`${user}:${pass}`)}`)
  } else if (auth.mode === 'apiKey' && auth.apiKey?.addTo === 'header' && auth.apiKey.key) {
    headers.set(interpolate(auth.apiKey.key, scope), interpolate(auth.apiKey.value, scope))
  }

  return headers
}

function buildBody(request: RequestDef, headers: Headers, scope: VariableScope): BodyInit | null {
  const body = request.body

  if (request.method === 'GET' || request.method === 'HEAD') return null

  switch (body.mode) {
    case 'none':
      return null

    case 'json':
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
      return interpolate(body.raw ?? '', scope)

    case 'raw':
      return interpolate(body.raw ?? '', scope)

    case 'urlencoded': {
      const params = new URLSearchParams()
      for (const [key, value] of activePairs(body.urlencoded ?? [], scope)) {
        params.append(key, value)
      }
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/x-www-form-urlencoded')
      }
      return params
    }

    case 'form-data': {
      const form = new FormData()
      for (const field of body.formData ?? []) {
        if (!field.enabled || !field.key.trim()) continue
        form.append(interpolate(field.key, scope), interpolate(field.value, scope))
      }
      headers.delete('Content-Type')
      return form
    }

    default:
      return null
  }
}

export interface SendOptions {
  scope?: VariableScope
  timeoutMs?: number
  signal?: AbortSignal
}

export async function sendRequest(
  request: RequestDef,
  options: SendOptions = {},
): Promise<ResponseResult> {
  const scope = options.scope ?? {}
  const timeoutMs = options.timeoutMs ?? 30_000

  const url = buildUrl(request, scope)
  const headers = buildHeaders(request, scope)
  const body = buildBody(request, headers, scope)

  if (request.auth.mode === 'apiKey' && request.auth.apiKey?.addTo === 'query') {
    const { key, value } = request.auth.apiKey
    if (key) url.searchParams.set(interpolate(key, scope), interpolate(value, scope))
  }

  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal

  const startedAt = performance.now()

  let response: Response
  try {
    response = await fetch(url, { method: request.method, headers, body, signal })
  } catch (error) {
    const durationMs = Math.round(performance.now() - startedAt)
    if (timeoutSignal.aborted) {
      throw new HttpRequestFailure({
        kind: 'timeout',
        message: `So'rov ${timeoutMs}ms ichida javob bermadi`,
      })
    }
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

  const responseHeaders: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value
  })

  return {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    body: text,
    contentType: response.headers.get('content-type'),
    durationMs,
    sizeBytes: new Blob([text]).size,
    receivedAt: Date.now(),
  }
}
