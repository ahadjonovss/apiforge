const JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

const JWKS_TTL_MS = 60 * 60 * 1000

const PROJECT_IDS = (process.env.APIFORGE_PROJECT_IDS ?? 'apiforge-prod,apiforge-dev')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)

interface Jwk {
  kid?: string
  kty?: string
  n?: string
  e?: string
  alg?: string
  use?: string
}

interface JwkSet {
  keys: Jwk[]
}

let cache: { at: number; keys: Map<string, Jwk> } | null = null

async function keyFor(kid: string): Promise<Jwk | null> {
  if (!cache || Date.now() - cache.at > JWKS_TTL_MS) {
    const response = await fetch(JWKS_URL)
    if (!response.ok) return null

    const set = (await response.json()) as JwkSet
    const keys = new Map<string, Jwk>()
    for (const key of set.keys ?? []) {
      if (key.kid) keys.set(key.kid, key)
    }
    cache = { at: Date.now(), keys }
  }

  return cache.keys.get(kid) ?? null
}

function decodeSegment(segment: string): unknown {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'))
}

export interface VerifiedUser {
  uid: string
  projectId: string
}

export async function verifyIdToken(token: string | undefined): Promise<VerifiedUser | null> {
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  let header: { alg?: string; kid?: string }
  let payload: { aud?: string; iss?: string; sub?: string; exp?: number; iat?: number }
  try {
    header = decodeSegment(parts[0]) as typeof header
    payload = decodeSegment(parts[1]) as typeof payload
  } catch {
    return null
  }

  if (header.alg !== 'RS256' || !header.kid) return null

  const projectId = payload.aud
  if (!projectId || !PROJECT_IDS.includes(projectId)) return null
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null
  if (!payload.sub) return null

  const now = Math.floor(Date.now() / 1000)
  if (typeof payload.exp !== 'number' || payload.exp <= now) return null
  if (typeof payload.iat === 'number' && payload.iat > now + 300) return null

  const jwk = await keyFor(header.kid)
  if (!jwk) return null

  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    )

    const signature = Buffer.from(parts[2].replace(/-/g, '+').replace(/_/g, '/'), 'base64')
    const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)

    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signed)
    if (!valid) return null
  } catch {
    return null
  }

  return { uid: payload.sub, projectId }
}
