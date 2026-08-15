export const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const

export type HttpMethod = (typeof HTTP_METHODS)[number]

export interface KeyValue {
  id: string
  key: string
  value: string
  enabled: boolean
  description?: string
}

export type BodyMode = 'none' | 'json' | 'raw' | 'form-data' | 'urlencoded' | 'binary'

export interface FormField extends KeyValue {
  type: 'text' | 'file'
  fileName?: string
}

export interface RequestBody {
  mode: BodyMode
  raw?: string
  rawLanguage?: 'json' | 'xml' | 'html' | 'text'
  formData?: FormField[]
  urlencoded?: KeyValue[]
}

export type AuthMode = 'none' | 'inherit' | 'bearer' | 'basic' | 'apiKey'

export interface AuthConfig {
  mode: AuthMode
  bearer?: { token: string }
  basic?: { username: string; password: string }
  apiKey?: { key: string; value: string; addTo: 'header' | 'query' }
}

export interface RequestDef {
  id: string
  name: string
  method: HttpMethod
  url: string
  params: KeyValue[]
  headers: KeyValue[]
  body: RequestBody
  auth: AuthConfig
  collectionId: string | null
  folderId: string | null
  order: number
  createdAt: number
  updatedAt: number
}

export interface ResponseResult {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  contentType: string | null
  durationMs: number
  sizeBytes: number
  receivedAt: number
}

export interface RequestError {
  kind: 'network' | 'timeout' | 'blocked' | 'invalid' | 'unknown'
  message: string
}

export interface EnvVariable {
  id: string
  key: string
  value: string
  enabled: boolean
  secret: boolean
}

export interface Environment {
  id: string
  name: string
  variables: EnvVariable[]
  workspaceId: string
  updatedAt: number
}

export interface TreeNode {
  id: string
  name: string
  kind: 'folder' | 'request'
  parentId: string | null
  order: number
}

export interface Collection {
  id: string
  name: string
  workspaceId: string
  auth: AuthConfig
  variables: EnvVariable[]
  createdAt: number
  updatedAt: number
}

export interface Workspace {
  id: string
  name: string
  ownerId: string
  memberIds: string[]
  createdAt: number
}
