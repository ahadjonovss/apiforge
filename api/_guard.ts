const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/

export function isPrivateAddress(address: string): boolean {
  const value = address.trim().toLowerCase()
  if (!value) return true

  const mapped = value.startsWith('::ffff:') ? value.slice(7) : value
  const v4 = IPV4.exec(mapped)

  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])]
    if ([a, Number(v4[2]), Number(v4[3]), Number(v4[4])].some((n) => Number.isNaN(n) || n > 255)) {
      return true
    }
    if (a === 0 || a === 10 || a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true
    if (a >= 224) return true
    return false
  }

  if (value === '::' || value === '::1') return true
  if (/^f[cd][0-9a-f]{2}:/.test(value)) return true
  if (/^fe[89ab][0-9a-f]:/.test(value)) return true
  if (value.startsWith('ff')) return true

  return false
}

export type TargetRejection =
  | { ok: true; url: URL }
  | { ok: false; status: number; reason: string }

export function validateTarget(raw: string | null): TargetRejection {
  if (!raw) return { ok: false, status: 400, reason: 'target parameter is missing' }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { ok: false, status: 400, reason: `not a valid URL: ${raw}` }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, status: 400, reason: `unsupported protocol: ${url.protocol}` }
  }

  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
    return { ok: false, status: 403, reason: 'internal hosts are not allowed' }
  }

  if (isPrivateAddress(host)) {
    return { ok: false, status: 403, reason: 'private addresses are not allowed' }
  }

  return { ok: true, url }
}

export const CONTENT_TYPE_HEADER = 'x-apiforge-content-type'
export const TOKEN_HEADER = 'x-apiforge-token'

export const STRIPPED_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'origin',
  'referer',
  'accept-encoding',
  'content-length',
  'cookie',
  'x-vercel-id',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-real-ip',
  TOKEN_HEADER,
])

export const STRIPPED_RESPONSE_HEADERS = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'keep-alive',
  'set-cookie',
  'set-cookie2',
  'strict-transport-security',
  'clear-site-data',
  'content-security-policy',
  'content-security-policy-report-only',
  'public-key-pins',
  'public-key-pins-report-only',
])

export function applyInertResponseHeaders(
  set: (key: string, value: string) => void,
  upstreamContentType: string | null,
) {
  if (upstreamContentType) set(CONTENT_TYPE_HEADER, upstreamContentType)
  set('content-type', 'application/octet-stream')
  set('x-content-type-options', 'nosniff')
  set('content-security-policy', "sandbox; default-src 'none'")
}
