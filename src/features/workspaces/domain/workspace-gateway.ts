import type { Team } from './team'
import type { Workspace, WorkspaceMember, WorkspaceRole } from './workspace'

export interface CreateWorkspaceInput {
  name: string
  description: string
  owner: { id: string; email: string; displayName: string | null; photoUrl: string | null }
}

export interface AddMemberInput {
  workspaceId: string
  user: { id: string; email: string; displayName: string | null; photoUrl: string | null }
  role: WorkspaceRole
}

export interface WorkspaceGateway {
  listForUser(userId: string): Promise<Workspace[]>
  get(workspaceId: string): Promise<Workspace | null>
  create(input: CreateWorkspaceInput): Promise<Workspace>
  rename(workspaceId: string, name: string, description: string): Promise<void>
  saveDocs(workspaceId: string, docs: string): Promise<void>
  remove(workspaceId: string): Promise<void>
  listMembers(workspaceId: string): Promise<WorkspaceMember[]>
  addMember(input: AddMemberInput): Promise<WorkspaceMember>
  removeMember(workspaceId: string, userId: string): Promise<void>
}

export interface CreateTeamInput {
  workspaceId: string
  name: string
  description: string
}

export interface TeamGateway {
  list(workspaceId: string): Promise<Team[]>
  create(input: CreateTeamInput): Promise<Team>
  rename(workspaceId: string, teamId: string, name: string, description: string): Promise<void>
  remove(workspaceId: string, teamId: string): Promise<void>
  setMembers(workspaceId: string, teamId: string, memberIds: string[]): Promise<void>
}
