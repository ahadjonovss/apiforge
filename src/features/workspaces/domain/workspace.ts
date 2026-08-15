export type WorkspaceRole = 'owner' | 'admin' | 'member'

export const WORKSPACE_ROLES: WorkspaceRole[] = ['owner', 'admin', 'member']

export interface Workspace {
  id: string
  name: string
  description: string
  docs: string
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

export function roleOf(members: WorkspaceMember[], userId: string | null): WorkspaceRole | null {
  if (!userId) return null
  return members.find((member) => member.userId === userId)?.role ?? null
}

export function canManageCollections(
  members: WorkspaceMember[],
  userId: string | null,
): boolean {
  const role = roleOf(members, userId)
  return role === 'owner' || role === 'admin'
}
