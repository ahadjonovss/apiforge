import type { KeyValue } from '@/core/domain/http'
import type { EnvVariable } from '@/features/environments/domain/environment'
import type { AuthConfig } from '@/features/request/domain/request'

export interface ApiCollection {
  id: string
  workspaceId: string
  teamId: string | null
  name: string
  description: string
  baseUrl: string
  headers: KeyValue[]
  auth: AuthConfig
  variables: EnvVariable[]
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
