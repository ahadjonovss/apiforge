import type { EnvVariable } from '@/features/environments/domain/environment'
import type { AuthConfig } from '@/features/request/domain/request'

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
