export type WorkspaceRole = 'owner' | 'admin' | 'member'

export const WORKSPACE_ROLES: WorkspaceRole[] = ['owner', 'admin', 'member']

export interface Workspace {
  id: string
  name: string
  description: string
  ownerId: string
  memberIds: string[]
  createdAt: number
  updatedAt: number
}

export interface WorkspaceMember {
  id: string
  userId: string
  email: string
  displayName: string | null
  photoUrl: string | null
  role: WorkspaceRole
  joinedAt: number
}

export function canManage(workspace: Workspace, userId: string | null): boolean {
  return !!userId && workspace.ownerId === userId
}
