import { lookup } from 'node:dns/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  STRIPPED_REQUEST_HEADERS,
  STRIPPED_RESPONSE_HEADERS,
  TOKEN_HEADER,
  applyInertResponseHeaders,
  isPrivateAddress,
  validateTarget,
} from './_guard.js'
import { verifyIdToken } from './_auth.js'

const MAX_REDIRECTS = 5
const MAX_BODY_BYTES = 8 * 1024 * 1024
const TIMEOUT_MS = 25_000

async function resolvesToPublicAddress(hostname: string): Promise<boolean> {
  if (isPrivateAddress(hostname)) return false

  try {
    const records = await lookup(hostname, { all: true })
    if (records.length === 0) return false
    return records.every((record) => !isPrivateAddress(record.address))
  } catch {
    return false
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const fail = (status: number, message: string, code = '') => {
    res.statusCode = status
    res.setHeader('x-apiforge-proxy-error', '1')
    if (code) res.setHeader('x-apiforge-error-code', code)
    res.setHeader('content-type', 'text/plain; charset=utf-8')
    res.end(message)
  }

  const header = req.headers[TOKEN_HEADER]
  const token = Array.isArray(header) ? header[0] : header
  if (!(await verifyIdToken(token))) {
    return fail(401, 'sign in to use the proxy', 'UNAUTHORIZED')
  }

  const requestUrl = new URL(req.url ?? '/', 'http://localhost')
  const checked = validateTarget(requestUrl.searchParams.get('target'))
  if (!checked.ok) return fail(checked.status, checked.reason)

  let target = checked.url
  if (!(await resolvesToPublicAddress(target.hostname))) {
    return fail(403, 'target resolves to a private address', 'BLOCKED')
  }

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (STRIPPED_REQUEST_HEADERS.has(key) || key.startsWith('sec-')) continue
    if (Array.isArray(value)) for (const item of value) headers.append(key, item)
    else if (value !== undefined) headers.set(key, value)
  }

  const chunks: Buffer[] = []
  let received = 0
  for await (const chunk of req) {
    received += (chunk as Buffer).length
    if (received > MAX_BODY_BYTES) return fail(413, 'request body is too large')
    chunks.push(chunk as Buffer)
  }
  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined

  const signal = AbortSignal.timeout(TIMEOUT_MS)
  let upstream: Response
  let method = req.method ?? 'GET'
  let payload = body

  try {
    for (let hop = 0; ; hop += 1) {
      upstream = await fetch(target, { method, headers, body: payload, redirect: 'manual', signal })

      const location = upstream.headers.get('location')
      if (!location || upstream.status < 300 || upstream.status >= 400) break

      if (hop >= MAX_REDIRECTS) return fail(508, 'too many redirects')

      const next = validateTarget(new URL(location, target).toString())
      if (!next.ok) return fail(next.status, `redirect blocked: ${next.reason}`)
      if (!(await resolvesToPublicAddress(next.url.hostname))) {
        return fail(403, 'redirect target resolves to a private address', 'BLOCKED')
      }

      target = next.url
      if (
        upstream.status === 303 ||
        ((upstream.status === 301 || upstream.status === 302) && method === 'POST')
      ) {
        method = 'GET'
        payload = undefined
        headers.delete('content-type')
        headers.delete('content-length')
      }
    }
  } catch (error) {
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause : null
    const carrier = cause ?? error
    const code =
      typeof carrier === 'object' && carrier !== null && 'code' in carrier
        ? String((carrier as { code: unknown }).code)
        : ''
    return fail(502, carrier instanceof Error ? carrier.message : String(error), code)
  }

  const buffer = Buffer.from(await upstream.arrayBuffer())
  if (buffer.length > MAX_BODY_BYTES) return fail(413, 'response is too large')

  res.statusCode = upstream.status
  res.statusMessage = upstream.statusText

  upstream.headers.forEach((value, key) => {
    if (STRIPPED_RESPONSE_HEADERS.has(key)) return
    res.setHeader(key, value)
  })

  applyInertResponseHeaders(
    (key, value) => res.setHeader(key, value),
    upstream.headers.get('content-type'),
  )

  res.end(buffer)
}
