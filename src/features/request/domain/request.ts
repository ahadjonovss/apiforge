import type { HttpMethod, KeyValue } from '@/core/domain/http'
import type { VariableScope } from '@/core/domain/variables'

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

export interface InheritedConfig {
  baseUrl: string
  headers: KeyValue[]
  auth: AuthConfig
  variables: VariableScope
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
