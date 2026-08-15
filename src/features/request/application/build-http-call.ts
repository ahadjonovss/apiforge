import type { KeyValue } from '@/core/domain/http'
import type { VariableScope } from '@/core/domain/variables'
import type { RequestDef } from '../domain/request'
import type { HttpCall } from '../domain/request-gateway'
import { HttpRequestFailure } from '../domain/response'
import { interpolate } from './interpolate'

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

export function buildHttpCall(request: RequestDef, scope: VariableScope): HttpCall {
  const url = buildUrl(request, scope)
  const headers = buildHeaders(request, scope)
  const body = buildBody(request, headers, scope)

  if (request.auth.mode === 'apiKey' && request.auth.apiKey?.addTo === 'query') {
    const { key, value } = request.auth.apiKey
    if (key) url.searchParams.set(interpolate(key, scope), interpolate(value, scope))
  }

  return { method: request.method, url, headers, body }
}
