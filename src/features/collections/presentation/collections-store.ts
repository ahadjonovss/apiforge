import { create } from 'zustand'
import { DataFailure, type DataErrorDetail } from '@/core/domain/data-error'
import { newId } from '@/core/lib/id'
import type { RequestDef } from '@/features/request/domain/request'
import { collectionService } from '../composition'
import { grantKey, type AccessSubject, type CollectionRole } from '../domain/access'
import type { ApiCollection } from '../domain/collection'
import type { CollectionPatch } from '../domain/collection-gateway'
import type { Folder } from '../domain/folder'

interface CollectionsState {
  collections: ApiCollection[]
  current: ApiCollection | null
  endpoints: RequestDef[]
  folders: Folder[]
  loading: boolean
  pending: boolean
  saving: boolean
  savedAt: number | null
  saveError: DataErrorDetail | null
  error: DataErrorDetail | null

  autoSave: (workspaceId: string, endpoint: RequestDef) => Promise<boolean>
  captureVariables: (
    workspaceId: string,
    entries: { key: string; value: string }[],
  ) => Promise<boolean>
  clearError: () => void
  loadCollections: (workspaceId: string) => Promise<void>
  createCollection: (
    workspaceId: string,
    name: string,
    description: string,
    teamId: string | null,
    createdBy?: string,
  ) => Promise<ApiCollection | null>
  grantAccess: (
    workspaceId: string,
    collectionId: string,
    subject: AccessSubject,
    role: CollectionRole,
    actorId: string,
  ) => Promise<boolean>
  revokeAccess: (
    workspaceId: string,
    collectionId: string,
    subject: AccessSubject,
  ) => Promise<boolean>
  removeCollection: (workspaceId: string, collectionId: string) => Promise<boolean>

  openCollection: (workspaceId: string, collectionId: string) => Promise<void>
  updateSettings: (
    workspaceId: string,
    collectionId: string,
    patch: CollectionPatch,
  ) => Promise<boolean>

  addEndpoint: (
    workspaceId: string,
    name: string,
    folderId: string | null,
  ) => Promise<RequestDef | null>
  saveEndpoint: (workspaceId: string, endpoint: RequestDef) => Promise<boolean>
  removeEndpoint: (workspaceId: string, endpointId: string) => Promise<boolean>
  moveEndpoint: (
    workspaceId: string,
    endpoint: RequestDef,
    folderId: string | null,
  ) => Promise<boolean>

  addFolder: (workspaceId: string, name: string, parentId: string | null) => Promise<boolean>
  renameFolder: (workspaceId: string, folder: Folder, name: string) => Promise<boolean>
  moveFolder: (workspaceId: string, folder: Folder, parentId: string | null) => Promise<boolean>
  removeFolder: (workspaceId: string, folderId: string) => Promise<boolean>
}

function toDetail(error: unknown): DataErrorDetail {
  return error instanceof DataFailure
    ? error.detail
    : { kind: 'unknown', message: String(error) }
}

export const useCollectionsStore = create<CollectionsState>((set, get) => {
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

  function patchAccess(
    collectionId: string,
    key: string,
    grant: { role: CollectionRole; addedBy: string; addedAt: number } | null,
  ) {
    const apply = (item: ApiCollection): ApiCollection => {
      if (item.id !== collectionId) return item
      const access = { ...item.access }
      if (grant) access[key] = grant
      else delete access[key]
      return { ...item, access }
    }

    set((state) => ({
      collections: state.collections.map(apply),
      current: state.current ? apply(state.current) : null,
    }))
  }

  return {
    collections: [],
    current: null,
    endpoints: [],
    folders: [],
    loading: false,
    pending: false,
    saving: false,
    savedAt: null,
    saveError: null,
    error: null,

    autoSave: async (workspaceId, endpoint) => {
      const collection = get().current
      if (!collection) return false

      set({ saving: true, saveError: null })
      try {
        await collectionService.saveEndpoint(workspaceId, collection.id, endpoint)
        set((state) => ({
          saving: false,
          savedAt: Date.now(),
          endpoints: state.endpoints.map((item) =>
            item.id === endpoint.id ? endpoint : item,
          ),
        }))
        return true
      } catch (error) {
        set({ saving: false, saveError: toDetail(error) })
        return false
      }
    },

    captureVariables: async (workspaceId, entries) => {
      const collection = get().current
      if (!collection || entries.length === 0) return false

      const variables = collection.variables.slice()
      for (const entry of entries) {
        const index = variables.findIndex((variable) => variable.key === entry.key)
        if (index === -1) {
          variables.push({
            id: newId(),
            key: entry.key,
            value: entry.value,
            enabled: true,
            secret: false,
          })
        } else {
          variables[index] = { ...variables[index], value: entry.value, enabled: true }
        }
      }

      try {
        await collectionService.updateSettings(workspaceId, collection.id, { variables })
        set({ current: { ...collection, variables } })
        return true
      } catch (error) {
        set({ saveError: toDetail(error) })
        return false
      }
    },

    clearError: () => set({ error: null }),

    loadCollections: async (workspaceId) => {
      set({ loading: true, error: null })
      try {
        set({ collections: await collectionService.list(workspaceId), loading: false })
      } catch (error) {
        set({ loading: false, error: toDetail(error) })
      }
    },

    createCollection: async (workspaceId, name, description, teamId, createdBy = '') => {
      let created: ApiCollection | null = null
      await run(async () => {
        created = await collectionService.create(
          workspaceId,
          name,
          description,
          teamId,
          createdBy,
        )
        set((state) => ({ collections: [...state.collections, created as ApiCollection] }))
      })
      return created
    },

    grantAccess: (workspaceId, collectionId, subject, role, actorId) =>
      run(async () => {
        const addedAt = Date.now()
        await collectionService.grantAccess(
          workspaceId,
          collectionId,
          subject,
          role,
          actorId,
          addedAt,
        )
        patchAccess(collectionId, grantKey(subject), { role, addedBy: actorId, addedAt })
      }),

    revokeAccess: (workspaceId, collectionId, subject) =>
      run(async () => {
        await collectionService.revokeAccess(workspaceId, collectionId, subject)
        patchAccess(collectionId, grantKey(subject), null)
      }),

    removeCollection: (workspaceId, collectionId) =>
      run(async () => {
        await collectionService.remove(workspaceId, collectionId)
        set((state) => ({
          collections: state.collections.filter((item) => item.id !== collectionId),
        }))
      }),

    openCollection: async (workspaceId, collectionId) => {
      set({ loading: true, error: null })
      try {
        const [current, endpoints, folders] = await Promise.all([
          collectionService.get(workspaceId, collectionId),
          collectionService.listEndpoints(workspaceId, collectionId),
          collectionService.listFolders(workspaceId, collectionId),
        ])
        set({ current, endpoints, folders, loading: false })
      } catch (error) {
        set({ loading: false, error: toDetail(error) })
      }
    },

    updateSettings: (workspaceId, collectionId, patch) =>
      run(async () => {
        await collectionService.updateSettings(workspaceId, collectionId, patch)
        set({ current: await collectionService.get(workspaceId, collectionId) })
      }),

    addEndpoint: async (workspaceId, name, folderId) => {
      const collection = get().current
      if (!collection) return null

      let created: RequestDef | null = null
      await run(async () => {
        created = await collectionService.addEndpoint(
          workspaceId,
          collection,
          name,
          get().endpoints.length,
          folderId,
        )
        set((state) => ({ endpoints: [...state.endpoints, created as RequestDef] }))
      })
      return created
    },

    saveEndpoint: (workspaceId, endpoint) =>
      run(async () => {
        const collection = get().current
        if (!collection) return
        await collectionService.saveEndpoint(workspaceId, collection.id, endpoint)
        set((state) => ({
          endpoints: state.endpoints.map((item) =>
            item.id === endpoint.id ? endpoint : item,
          ),
        }))
      }),

    removeEndpoint: (workspaceId, endpointId) =>
      run(async () => {
        const collection = get().current
        if (!collection) return
        await collectionService.removeEndpoint(workspaceId, collection.id, endpointId)
        set((state) => ({
          endpoints: state.endpoints.filter((item) => item.id !== endpointId),
        }))
      }),

    moveEndpoint: (workspaceId, endpoint, folderId) =>
      run(async () => {
        const collection = get().current
        if (!collection) return
        const next = await collectionService.moveEndpoint(
          workspaceId,
          collection.id,
          endpoint,
          folderId,
        )
        set((state) => ({
          endpoints: state.endpoints.map((item) => (item.id === next.id ? next : item)),
        }))
      }),

    addFolder: (workspaceId, name, parentId) =>
      run(async () => {
        const collection = get().current
        if (!collection) return
        const folder = await collectionService.addFolder(
          workspaceId,
          collection.id,
          name,
          parentId,
          get().folders.length,
        )
        set((state) => ({ folders: [...state.folders, folder] }))
      }),

    renameFolder: (workspaceId, folder, name) =>
      run(async () => {
        const next = await collectionService.renameFolder(workspaceId, folder, name)
        set((state) => ({
          folders: state.folders.map((item) => (item.id === next.id ? next : item)),
        }))
      }),

    moveFolder: (workspaceId, folder, parentId) =>
      run(async () => {
        const next = await collectionService.moveFolder(
          workspaceId,
          get().folders,
          folder,
          parentId,
        )
        set((state) => ({
          folders: state.folders.map((item) => (item.id === next.id ? next : item)),
        }))
      }),

    removeFolder: (workspaceId, folderId) =>
      run(async () => {
        const collection = get().current
        if (!collection) return
        const { folderIds, endpointIds } = await collectionService.removeFolder(
          workspaceId,
          collection.id,
          get().folders,
          get().endpoints,
          folderId,
        )
        const goneFolders = new Set(folderIds)
        const goneEndpoints = new Set(endpointIds)
        set((state) => ({
          folders: state.folders.filter((item) => !goneFolders.has(item.id)),
          endpoints: state.endpoints.filter((item) => !goneEndpoints.has(item.id)),
        }))
      }),
  }
})
