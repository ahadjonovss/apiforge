import { create } from 'zustand'
import { DataFailure, type DataErrorDetail } from '@/core/domain/data-error'
import { environmentService } from '../composition'
import type { EnvVariable, Environment } from '../domain/environment'

const ACTIVE_KEY = 'apiforge.environment'

function readActive(workspaceId: string): string | null {
  try {
    return localStorage.getItem(`${ACTIVE_KEY}.${workspaceId}`)
  } catch {
    return null
  }
}

function writeActive(workspaceId: string, environmentId: string | null) {
  try {
    const key = `${ACTIVE_KEY}.${workspaceId}`
    if (environmentId) localStorage.setItem(key, environmentId)
    else localStorage.removeItem(key)
  } catch {
    return
  }
}

function toDetail(error: unknown): DataErrorDetail {
  return error instanceof DataFailure
    ? error.detail
    : { kind: 'unknown', message: 'data.error.unknown' }
}

interface EnvironmentsState {
  workspaceId: string | null
  environments: Environment[]
  activeId: string | null
  loading: boolean
  pending: boolean
  error: DataErrorDetail | null

  clearError: () => void
  load: (workspaceId: string) => Promise<void>
  activate: (environmentId: string | null) => void
  create: (workspaceId: string, name: string) => Promise<Environment | null>
  rename: (workspaceId: string, environmentId: string, name: string) => Promise<boolean>
  saveVariables: (
    workspaceId: string,
    environmentId: string,
    variables: EnvVariable[],
  ) => Promise<boolean>
  setVariables: (
    workspaceId: string,
    entries: { key: string; value: string }[],
  ) => Promise<boolean>
  remove: (workspaceId: string, environmentId: string) => Promise<boolean>
}

export const useEnvironmentsStore = create<EnvironmentsState>((set, get) => ({
  workspaceId: null,
  environments: [],
  activeId: null,
  loading: false,
  pending: false,
  error: null,

  clearError: () => set({ error: null }),

  load: async (workspaceId) => {
    set({ loading: true, error: null })
    try {
      const environments = await environmentService.list(workspaceId)
      const stored = readActive(workspaceId)
      const activeId = environments.some((item) => item.id === stored) ? stored : null
      set({ workspaceId, environments, activeId, loading: false })
    } catch (error) {
      set({ loading: false, error: toDetail(error) })
    }
  },

  activate: (environmentId) => {
    const workspaceId = get().workspaceId
    if (workspaceId) writeActive(workspaceId, environmentId)
    set({ activeId: environmentId })
  },

  create: async (workspaceId, name) => {
    set({ pending: true, error: null })
    try {
      const created = await environmentService.create(workspaceId, name)
      set((state) => ({
        environments: [...state.environments, created].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
        pending: false,
      }))
      get().activate(created.id)
      return created
    } catch (error) {
      set({ pending: false, error: toDetail(error) })
      return null
    }
  },

  rename: async (workspaceId, environmentId, name) => {
    set({ pending: true, error: null })
    try {
      await environmentService.rename(workspaceId, environmentId, name)
      set((state) => ({
        environments: state.environments
          .map((item) => (item.id === environmentId ? { ...item, name: name.trim() } : item))
          .sort((a, b) => a.name.localeCompare(b.name)),
        pending: false,
      }))
      return true
    } catch (error) {
      set({ pending: false, error: toDetail(error) })
      return false
    }
  },

  saveVariables: async (workspaceId, environmentId, variables) => {
    set({ pending: true, error: null })
    try {
      await environmentService.saveVariables(workspaceId, environmentId, variables)
      set((state) => ({
        environments: state.environments.map((item) =>
          item.id === environmentId ? { ...item, variables, updatedAt: Date.now() } : item,
        ),
        pending: false,
      }))
      return true
    } catch (error) {
      set({ pending: false, error: toDetail(error) })
      return false
    }
  },

  setVariables: async (workspaceId, entries) => {
    const { environments, activeId } = get()
    const active = environments.find((item) => item.id === activeId)
    if (!active || entries.length === 0) return false

    try {
      const variables = await environmentService.setVariables(workspaceId, active, entries)
      set((state) => ({
        environments: state.environments.map((item) =>
          item.id === active.id ? { ...item, variables, updatedAt: Date.now() } : item,
        ),
      }))
      return true
    } catch (error) {
      set({ error: toDetail(error) })
      return false
    }
  },

  remove: async (workspaceId, environmentId) => {
    set({ pending: true, error: null })
    try {
      await environmentService.remove(workspaceId, environmentId)
      set((state) => ({
        environments: state.environments.filter((item) => item.id !== environmentId),
        pending: false,
      }))
      if (get().activeId === environmentId) get().activate(null)
      return true
    } catch (error) {
      set({ pending: false, error: toDetail(error) })
      return false
    }
  },
}))

export function useActiveEnvironment(): Environment | null {
  return useEnvironmentsStore(
    (state) => state.environments.find((item) => item.id === state.activeId) ?? null,
  )
}
