const BASE = 'https://firestore.googleapis.com/v1'

export interface FsDocument {
  name: string
  fields?: Record<string, unknown>
}

export interface Doc {
  id: string
  path: string
  data: Record<string, unknown>
}

export class FirestoreError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'FirestoreError'
    this.status = status
  }
}

export function fromValue(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return null
  const entry = value as Record<string, unknown>

  if ('nullValue' in entry) return null
  if ('booleanValue' in entry) return entry.booleanValue
  if ('stringValue' in entry) return entry.stringValue
  if ('integerValue' in entry) return Number(entry.integerValue)
  if ('doubleValue' in entry) return entry.doubleValue
  if ('timestampValue' in entry) return entry.timestampValue
  if ('arrayValue' in entry) {
    const values = (entry.arrayValue as { values?: unknown[] })?.values ?? []
    return values.map(fromValue)
  }
  if ('mapValue' in entry) {
    const fields = (entry.mapValue as { fields?: Record<string, unknown> })?.fields ?? {}
    return fromFields(fields)
  }
  return null
}

export function fromFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) out[key] = fromValue(value)
  return out
}

export function toValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value }
  }
  if (typeof value === 'string') return { stringValue: value }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toValue) } }
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: toFields(value as Record<string, unknown>) } }
  }
  return { nullValue: null }
}

export function toFields(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    out[key] = toValue(value)
  }
  return out
}

function toDoc(raw: FsDocument): Doc {
  const path = raw.name.split('/documents/')[1] ?? raw.name
  return {
    id: path.split('/').pop() ?? '',
    path,
    data: fromFields(raw.fields ?? {}),
  }
}

export function createFirestore(projectId: string, idToken: string) {
  const root = `${BASE}/projects/${projectId}/databases/(default)/documents`

  async function call(url: string, init?: RequestInit): Promise<unknown> {
    const response = await fetch(url, {
      ...init,
      headers: {
        authorization: `Bearer ${idToken}`,
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })

    if (!response.ok) {
      const text = await response.text()
      const reason =
        response.status === 403
          ? 'permission denied — the signed-in user cannot reach this document'
          : text.slice(0, 300)
      throw new FirestoreError(response.status, reason)
    }

    return response.status === 204 ? null : await response.json()
  }

  return {
    async get(path: string): Promise<Doc | null> {
      try {
        const raw = (await call(`${root}/${path}`)) as FsDocument
        return toDoc(raw)
      } catch (error) {
        if (error instanceof FirestoreError && error.status === 404) return null
        throw error
      }
    },

    async list(path: string, pageSize = 300): Promise<Doc[]> {
      const raw = (await call(`${root}/${path}?pageSize=${pageSize}`)) as {
        documents?: FsDocument[]
      }
      return (raw.documents ?? []).map(toDoc)
    },

    async query(
      parent: string,
      collectionId: string,
      where: Record<string, unknown>,
    ): Promise<Doc[]> {
      const url = parent ? `${root}/${parent}:runQuery` : `${root}:runQuery`
      const raw = (await call(url, {
        method: 'POST',
        body: JSON.stringify({
          structuredQuery: { from: [{ collectionId }], where, limit: 300 },
        }),
      })) as { document?: FsDocument }[]

      return raw.filter((entry) => entry.document).map((entry) => toDoc(entry.document!))
    },

    async write(path: string, data: Record<string, unknown>): Promise<Doc> {
      const mask = Object.keys(data)
        .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
        .join('&')

      const raw = (await call(`${root}/${path}?${mask}`, {
        method: 'PATCH',
        body: JSON.stringify({ fields: toFields(data) }),
      })) as FsDocument

      return toDoc(raw)
    },
  }
}

export type Firestore = ReturnType<typeof createFirestore>
