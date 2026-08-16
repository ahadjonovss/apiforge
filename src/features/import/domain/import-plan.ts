import type { KeyValue } from '@/core/domain/http'
import type { EnvVariable } from '@/features/environments/domain/environment'
import type {
  AuthConfig,
  RequestBody,
  RequestDef,
  ResponseDoc,
} from '@/features/request/domain/request'

export interface PlannedCollection {
  name: string
  description: string
  docs: string
  baseUrl: string
  headers: KeyValue[]
  auth: AuthConfig
  variables: EnvVariable[]
}

export interface PlannedFolder {
  id: string
  parentId: string | null
  name: string
  order: number
}

export interface PlannedEndpoint {
  id: string
  folderId: string | null
  order: number
  name: string
  docs: string
  responseDocs: ResponseDoc[]
  method: RequestDef['method']
  url: string
  params: KeyValue[]
  headers: KeyValue[]
  body: RequestBody
  auth: AuthConfig
}

export interface ImportMessage {
  key: string
  params?: Record<string, string | number>
}

export interface ImportPlan {
  collection: PlannedCollection
  folders: PlannedFolder[]
  endpoints: PlannedEndpoint[]
  warnings: ImportMessage[]
}

export class ImportFailure extends Error {
  readonly key: string
  readonly params?: Record<string, string | number>

  constructor(key: string, params?: Record<string, string | number>) {
    super(key)
    this.name = 'ImportFailure'
    this.key = key
    this.params = params
  }
}
