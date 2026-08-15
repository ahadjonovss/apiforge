import { DataFailure } from '@/core/domain/data-error'
import type { UserLookup } from '../domain/user-lookup'
import type { WorkspaceGateway } from '../domain/workspace-gateway'
import type { Workspace, WorkspaceMember, WorkspaceRole } from '../domain/workspace'
import { memberSchema, workspaceSchema } from './schemas'

function assertValid(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  if (!result.success) {
    throw new DataFailure({
      kind: 'validation',
      message: result.error?.issues[0]?.message ?? 'data.error.validation',
    })
  }
}

export interface WorkspaceOwner {
  id: string
  email: string
  displayName: string | null
  photoUrl: string | null
}

export function createWorkspaceService(gateway: WorkspaceGateway, users: UserLookup) {
  return {
    list(userId: string): Promise<Workspace[]> {
      return gateway.listForUser(userId)
    },

    get(workspaceId: string): Promise<Workspace | null> {
      return gateway.get(workspaceId)
    },

    create(name: string, description: string, owner: WorkspaceOwner): Promise<Workspace> {
      assertValid(workspaceSchema.safeParse({ name, description }))
      return gateway.create({ name: name.trim(), description: description.trim(), owner })
    },

    rename(workspaceId: string, name: string, description: string): Promise<void> {
      assertValid(workspaceSchema.safeParse({ name, description }))
      return gateway.rename(workspaceId, name.trim(), description.trim())
    },

    remove(workspaceId: string): Promise<void> {
      return gateway.remove(workspaceId)
    },

    listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
      return gateway.listMembers(workspaceId)
    },

    async addMemberByEmail(
      workspaceId: string,
      email: string,
      role: WorkspaceRole,
    ): Promise<WorkspaceMember> {
      assertValid(memberSchema.safeParse({ email, role }))

      const user = await users.findByEmail(email)
      if (!user) {
        throw new DataFailure({
          kind: 'not-found',
          message: 'data.error.notRegistered',
          params: { email },
        })
      }

      const workspace = await gateway.get(workspaceId)
      if (workspace?.memberIds.includes(user.id)) {
        throw new DataFailure({
          kind: 'already-exists',
          message: 'data.error.already-exists',
        })
      }

      return gateway.addMember({ workspaceId, user, role })
    },

    async removeMember(workspaceId: string, userId: string): Promise<void> {
      const workspace = await gateway.get(workspaceId)
      if (workspace?.ownerId === userId) {
        throw new DataFailure({
          kind: 'validation',
          message: 'data.error.ownerRemove',
        })
      }
      return gateway.removeMember(workspaceId, userId)
    },
  }
}

export type WorkspaceService = ReturnType<typeof createWorkspaceService>
