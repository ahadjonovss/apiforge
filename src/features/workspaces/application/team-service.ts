import { DataFailure } from '@/core/domain/data-error'
import type { Team } from '../domain/team'
import type { TeamGateway } from '../domain/workspace-gateway'
import { teamSchema } from './schemas'

function assertValid(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  if (!result.success) {
    throw new DataFailure({
      kind: 'validation',
      message: result.error?.issues[0]?.message ?? "Ma'lumot noto'g'ri",
    })
  }
}

export function createTeamService(gateway: TeamGateway) {
  return {
    list(workspaceId: string): Promise<Team[]> {
      return gateway.list(workspaceId)
    },

    create(workspaceId: string, name: string, description: string): Promise<Team> {
      assertValid(teamSchema.safeParse({ name, description }))
      return gateway.create({ workspaceId, name: name.trim(), description: description.trim() })
    },

    rename(workspaceId: string, teamId: string, name: string, description: string): Promise<void> {
      assertValid(teamSchema.safeParse({ name, description }))
      return gateway.rename(workspaceId, teamId, name.trim(), description.trim())
    },

    remove(workspaceId: string, teamId: string): Promise<void> {
      return gateway.remove(workspaceId, teamId)
    },

    toggleMember(team: Team, userId: string): Promise<void> {
      const next = team.memberIds.includes(userId)
        ? team.memberIds.filter((id) => id !== userId)
        : [...team.memberIds, userId]
      return gateway.setMembers(team.workspaceId, team.id, next)
    },
  }
}

export type TeamService = ReturnType<typeof createTeamService>
