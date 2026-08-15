import type { AuthConfig, KeyValue, RequestBody, RequestDef } from '@/types/http'

export function newId() {
  return crypto.randomUUID()
}

export function emptyKeyValue(): KeyValue {
  return { id: newId(), key: '', value: '', enabled: true }
}

export function emptyBody(): RequestBody {
  return { mode: 'none', raw: '', rawLanguage: 'json', formData: [], urlencoded: [] }
}

export function emptyAuth(): AuthConfig {
  return { mode: 'none' }
}

export function createRequest(partial: Partial<RequestDef> = {}): RequestDef {
  const now = Date.now()
  return {
    id: newId(),
    name: 'Untitled request',
    method: 'GET',
    url: '',
    params: [],
    headers: [],
    body: emptyBody(),
    auth: emptyAuth(),
    collectionId: null,
    folderId: null,
    order: 0,
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}
