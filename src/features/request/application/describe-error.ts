import type { RequestError, RequestErrorKind } from '../domain/response'

interface Descriptor {
  kind: RequestErrorKind
  slug: string
}

const BY_CODE: Record<string, Descriptor> = {
  ENOTFOUND: { kind: 'dns', slug: 'dns' },
  EAI_AGAIN: { kind: 'dns', slug: 'dnsTemp' },
  ECONNREFUSED: { kind: 'refused', slug: 'refused' },
  ECONNRESET: { kind: 'network', slug: 'reset' },
  EPIPE: { kind: 'network', slug: 'reset' },
  ETIMEDOUT: { kind: 'timeout', slug: 'timeout' },
  UND_ERR_CONNECT_TIMEOUT: { kind: 'timeout', slug: 'timeout' },
  EHOSTUNREACH: { kind: 'unreachable', slug: 'unreachable' },
  ENETUNREACH: { kind: 'unreachable', slug: 'unreachable' },
  CERT_HAS_EXPIRED: { kind: 'tls', slug: 'tls' },
  DEPTH_ZERO_SELF_SIGNED_CERT: { kind: 'tls', slug: 'tls' },
  SELF_SIGNED_CERT_IN_CHAIN: { kind: 'tls', slug: 'tls' },
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: { kind: 'tls', slug: 'tls' },
  EPROTO: { kind: 'tls', slug: 'tls' },
}

const UNKNOWN: Descriptor = { kind: 'network', slug: 'network' }

export interface NetworkErrorInput {
  code: string | null
  raw: string
  host: string
  viaProxy: boolean
  durationMs: number
}

export function describeNetworkError({
  code,
  host,
  viaProxy,
  durationMs,
}: NetworkErrorInput): RequestError {
  const descriptor = viaProxy ? ((code && BY_CODE[code]) || UNKNOWN) : { kind: 'cors' as const, slug: 'cors' }

  return {
    kind: descriptor.kind,
    title: `error.title.${descriptor.slug}`,
    message: `error.msg.${descriptor.slug}`,
    hint: `error.hint.${descriptor.slug}`,
    params: { host, ms: durationMs },
  }
}

export function describeRawError(raw: string, durationMs: number): RequestError {
  return {
    kind: 'unknown',
    title: 'error.title.failed',
    message: raw,
    params: { ms: durationMs },
  }
}
