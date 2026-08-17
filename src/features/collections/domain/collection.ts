import type { KeyValue } from '@/core/domain/http'
import type { EnvVariable } from '@/features/environments/domain/environment'
import type { AuthConfig } from '@/features/request/domain/request'
import type { AccessGrant } from './access'

export interface ApiCollection {
  id: string
  workspaceId: string
  teamId: string | null
  name: string
  description: string
  docs: string
  baseUrl: string
  headers: KeyValue[]
  auth: AuthConfig
  variables: EnvVariable[]
  access: Record<string, AccessGrant>
  createdAt: number
  updatedAt: number
}

export interface TreeNode {
  id: string
  name: string
  kind: 'folder' | 'request'
  parentId: string | null
  order: number
}
