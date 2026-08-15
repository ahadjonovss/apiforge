import { create } from 'zustand'
import { DataFailure, type DataErrorDetail } from '@/core/domain/data-error'
import { teamService, workspaceService } from '../composition'
import type { Team } from '../domain/team'
import type { Workspace, WorkspaceMember, WorkspaceRole } from '../domain/workspace'

interface WorkspacesState {
  workspaces: Workspace[]
  current: Workspace | null
  members: WorkspaceMember[]
  teams: Team[]
  loading: boolean
  pending: boolean
  error: DataErrorDetail | null

  clearError: () => void
  loadWorkspaces: (userId: string) => Promise<void>
  createWorkspace: (
    name: string,
    description: string,
    owner: { id: string; email: string; displayName: string | null; photoUrl: string | null },
  ) => Promise<Workspace | null>
  removeWorkspace: (workspaceId: string) => Promise<boolean>

  openWorkspace: (workspaceId: string) => Promise<void>
  renameWorkspace: (workspaceId: string, name: string, description: string) => Promise<boolean>
  saveDocs: (workspaceId: string, docs: string) => Promise<boolean>

  addMember: (workspaceId: string, email: string, role: WorkspaceRole) => Promise<boolean>
  removeMember: (workspaceId: string, userId: string) => Promise<boolean>

  createTeam: (workspaceId: string, name: string, description: string) => Promise<boolean>
  removeTeam: (workspaceId: string, teamId: string) => Promise<boolean>
  toggleTeamMember: (team: Team, userId: string) => Promise<boolean>
}

function toDetail(error: unknown): DataErrorDetail {
  return error instanceof DataFailure
    ? error.detail
    : { kind: 'unknown', message: String(error) }
}

export const useWorkspacesStore = create<WorkspacesState>((set, get) => {
  async function run(action: () => Promise<void>): Promise<boolean> {
    if (get().pending) return false
    set({ pending: true, error: null })
    try {
      await action()
      set({ pending: false })
      return true
    } catch (error) {
      set({ pending: false, error: toDetail(error) })
      return false
    }
  }

  async function refreshWorkspace(workspaceId: string) {
    const [current, members, teams] = await Promise.all([
      workspaceService.get(workspaceId),
      workspaceService.listMembers(workspaceId),
      teamService.list(workspaceId),
    ])
    set({ current, members, teams })
  }

  return {
    workspaces: [],
    current: null,
    members: [],
    teams: [],
    loading: false,
    pending: false,
    error: null,

    clearError: () => set({ error: null }),

    loadWorkspaces: async (userId) => {
      set({ loading: true, error: null })
      try {
        set({ workspaces: await workspaceService.list(userId), loading: false })
      } catch (error) {
        set({ loading: false, error: toDetail(error) })
      }
    },

    createWorkspace: async (name, description, owner) => {
      let created: Workspace | null = null
      await run(async () => {
        created = await workspaceService.create(name, description, owner)
        set((state) => ({ workspaces: [created as Workspace, ...state.workspaces] }))
      })
      return created
    },

    removeWorkspace: (workspaceId) =>
      run(async () => {
        await workspaceService.remove(workspaceId)
        set((state) => ({
          workspaces: state.workspaces.filter((item) => item.id !== workspaceId),
        }))
      }),

    openWorkspace: async (workspaceId) => {
      set({ loading: true, error: null })
      try {
        await refreshWorkspace(workspaceId)
        set({ loading: false })
      } catch (error) {
        set({ loading: false, error: toDetail(error) })
      }
    },

    renameWorkspace: (workspaceId, name, description) =>
      run(async () => {
        await workspaceService.rename(workspaceId, name, description)
        await refreshWorkspace(workspaceId)
      }),

    saveDocs: (workspaceId, docs) =>
      run(async () => {
        await workspaceService.saveDocs(workspaceId, docs)
        set((state) => ({
          current: state.current ? { ...state.current, docs } : state.current,
        }))
      }),

    addMember: (workspaceId, email, role) =>
      run(async () => {
        await workspaceService.addMemberByEmail(workspaceId, email, role)
        await refreshWorkspace(workspaceId)
      }),

    removeMember: (workspaceId, userId) =>
      run(async () => {
        await workspaceService.removeMember(workspaceId, userId)
        await refreshWorkspace(workspaceId)
      }),

    createTeam: (workspaceId, name, description) =>
      run(async () => {
        await teamService.create(workspaceId, name, description)
        set({ teams: await teamService.list(workspaceId) })
      }),

    removeTeam: (workspaceId, teamId) =>
      run(async () => {
        await teamService.remove(workspaceId, teamId)
        set({ teams: await teamService.list(workspaceId) })
      }),

    toggleTeamMember: (team, userId) =>
      run(async () => {
        await teamService.toggleMember(team, userId)
        set({ teams: await teamService.list(team.workspaceId) })
      }),
  }
})
