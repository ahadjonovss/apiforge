import { newId } from '@/core/lib/id'
import type { AuthConfig, RequestBody, RequestDef } from '../domain/request'

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
