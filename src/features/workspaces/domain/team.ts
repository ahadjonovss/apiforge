export type TeamRole = 'lead' | 'member'

export const TEAM_ROLES: TeamRole[] = ['lead', 'member']

export interface Team {
  id: string
  workspaceId: string
  name: string
  description: string
  members: Record<string, TeamRole>
  createdAt: number
  updatedAt: number
}

export function teamMemberIds(team: Team): string[] {
  return Object.keys(team.members)
}

export function teamRoleOf(team: Team, userId: string): TeamRole | null {
  return team.members[userId] ?? null
}
