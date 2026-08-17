import { DataFailure } from '@/core/domain/data-error'
import type { Team, TeamRole } from '../domain/team'
import type { TeamGateway } from '../domain/workspace-gateway'
import { teamSchema } from './schemas'

function assertValid(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  if (!result.success) {
    throw new DataFailure({
      kind: 'validation',
      message: result.error?.issues[0]?.message ?? 'data.error.validation',
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

    setMemberRole(team: Team, userId: string, role: TeamRole | null): Promise<void> {
      const next = { ...team.members }

      if (role === null) delete next[userId]
      else next[userId] = role

      if (role === null && Object.values(team.members).filter((r) => r === 'lead').length === 1
          && team.members[userId] === 'lead') {
        throw new DataFailure({ kind: 'validation', message: 'team.error.lastLead' })
      }

      return gateway.setMembers(team.workspaceId, team.id, next)
    },
  }
}

export type TeamService = ReturnType<typeof createTeamService>
