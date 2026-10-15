import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

export const TOKEN_PREFIX = 'afm_'

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12
const TAG_BYTES = 16

export interface McpIdentity {
  rt: string
  uid: string
  pid: string
  ak?: string
}

function secretKey(): Buffer | null {
  const secret = process.env.APIFORGE_MCP_SECRET
  if (!secret || secret.length < 16) return null
  return createHash('sha256').update(secret).digest()
}

export function sealToken(identity: McpIdentity): string | null {
  const key = secretKey()
  if (!key) return null

  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const body = Buffer.concat([
    cipher.update(JSON.stringify(identity), 'utf-8'),
    cipher.final(),
  ])

  return TOKEN_PREFIX + Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url')
}

export function openToken(token: string | undefined): McpIdentity | null {
  const key = secretKey()
  if (!key || !token || !token.startsWith(TOKEN_PREFIX)) return null

  try {
    const raw = Buffer.from(token.slice(TOKEN_PREFIX.length), 'base64url')
    if (raw.length <= IV_BYTES + TAG_BYTES) return null

    const decipher = createDecipheriv(ALGORITHM, key, raw.subarray(0, IV_BYTES))
    decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES))

    const plain = Buffer.concat([
      decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)),
      decipher.final(),
    ]).toString('utf-8')

    const parsed: unknown = JSON.parse(plain)
    if (typeof parsed !== 'object' || parsed === null) return null

    const { rt, uid, pid, ak } = parsed as Partial<McpIdentity>
    if (typeof rt !== 'string' || typeof uid !== 'string' || typeof pid !== 'string') return null
    return { rt, uid, pid, ak: typeof ak === 'string' && ak ? ak : undefined }
  } catch {
    return null
  }
}

export function apiKeyFor(projectId: string): string | null {
  const direct = process.env.APIFORGE_FIREBASE_API_KEY
  if (direct) return direct

  const pairs = (process.env.APIFORGE_FIREBASE_API_KEYS ?? '')
    .split(',')
    .map((entry) => entry.split(':'))

  const found = pairs.find(([id]) => id?.trim() === projectId)
  return found?.[1]?.trim() ?? null
}

interface CachedToken {
  idToken: string
  expiresAt: number
}

const idTokens = new Map<string, CachedToken>()

export interface ExchangeResult {
  idToken: string | null
  reason: string
}

export async function idTokenFor(
  refreshToken: string,
  apiKey: string,
): Promise<ExchangeResult> {
  const cacheKey = createHash('sha256').update(refreshToken).digest('hex')
  const cached = idTokens.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return { idToken: cached.idToken, reason: '' }

  let response: Response
  try {
    response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    })
  } catch (error) {
    return { idToken: null, reason: error instanceof Error ? error.message : 'network error' }
  }

  if (!response.ok) {
    idTokens.delete(cacheKey)
    const text = await response.text()
    let code = ''
    try {
      code = (JSON.parse(text) as { error?: { message?: string } }).error?.message ?? ''
    } catch {
      code = text.slice(0, 120)
    }
    return { idToken: null, reason: `${response.status} ${code || 'token exchange refused'}` }
  }

  const payload = (await response.json()) as { id_token?: string; expires_in?: string }
  if (!payload.id_token) return { idToken: null, reason: 'no id_token in the response' }

  const seconds = Number(payload.expires_in ?? '3600')
  idTokens.set(cacheKey, {
    idToken: payload.id_token,
    expiresAt: Date.now() + Math.max(60, seconds - 120) * 1000,
  })

  return { idToken: payload.id_token, reason: '' }
}
