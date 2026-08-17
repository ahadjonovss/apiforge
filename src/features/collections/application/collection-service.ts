import { DataFailure } from '@/core/domain/data-error'
import { newId } from '@/core/lib/id'
import { createRequest } from '@/features/request/application/request-factory'
import type { RequestDef } from '@/features/request/domain/request'
import {
  grantKey,
  type AccessSubject,
  type CollectionRole,
} from '../domain/access'
import type { ApiCollection } from '../domain/collection'
import type { CollectionGateway, CollectionPatch } from '../domain/collection-gateway'
import type { Folder } from '../domain/folder'
import { collectionSchema, collectionSettingsSchema, endpointSchema, folderSchema } from './schemas'
import { descendantFolderIds, isDescendant } from './tree'

function assertValid(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  if (!result.success) {
    throw new DataFailure({
      kind: 'validation',
      message: result.error?.issues[0]?.message ?? 'data.error.validation',
    })
  }
}

export function createCollectionService(gateway: CollectionGateway) {
  return {
    list(workspaceId: string): Promise<ApiCollection[]> {
      return gateway.list(workspaceId)
    },

    get(workspaceId: string, collectionId: string): Promise<ApiCollection | null> {
      return gateway.get(workspaceId, collectionId)
    },

    create(
      workspaceId: string,
      name: string,
      description: string,
      teamId: string | null,
      createdBy = '',
    ): Promise<ApiCollection> {
      assertValid(collectionSchema.safeParse({ name, description }))
      return gateway.create({
        workspaceId,
        teamId,
        createdBy,
        name: name.trim(),
        description: description.trim(),
      })
    },

    grantAccess(
      workspaceId: string,
      collectionId: string,
      subject: AccessSubject,
      role: CollectionRole,
      addedBy: string,
      addedAt: number,
    ): Promise<void> {
      return gateway.setAccess(workspaceId, collectionId, grantKey(subject), {
        role,
        addedBy,
        addedAt,
      })
    },

    revokeAccess(
      workspaceId: string,
      collectionId: string,
      subject: AccessSubject,
    ): Promise<void> {
      return gateway.setAccess(workspaceId, collectionId, grantKey(subject), null)
    },

    updateSettings(
      workspaceId: string,
      collectionId: string,
      patch: CollectionPatch,
    ): Promise<void> {
      if (patch.name !== undefined || patch.baseUrl !== undefined) {
        assertValid(
          collectionSettingsSchema.safeParse({
            name: patch.name ?? '',
            description: patch.description ?? '',
            baseUrl: patch.baseUrl ?? '',
          }),
        )
      }
      return gateway.update(workspaceId, collectionId, patch)
    },

    remove(workspaceId: string, collectionId: string): Promise<void> {
      return gateway.remove(workspaceId, collectionId)
    },

    listEndpoints(workspaceId: string, collectionId: string): Promise<RequestDef[]> {
      return gateway.listEndpoints(workspaceId, collectionId)
    },

    async addEndpoint(
      workspaceId: string,
      collection: ApiCollection,
      name: string,
      order: number,
      folderId: string | null,
    ): Promise<RequestDef> {
      assertValid(endpointSchema.safeParse({ name }))

      const endpoint = createRequest({
        name: name.trim(),
        url: '',
        auth: { mode: 'inherit' },
        collectionId: collection.id,
        folderId,
        order,
      })

      await gateway.saveEndpoint(workspaceId, collection.id, endpoint)
      return endpoint
    },

    listFolders(workspaceId: string, collectionId: string): Promise<Folder[]> {
      return gateway.listFolders(workspaceId, collectionId)
    },

    async addFolder(
      workspaceId: string,
      collectionId: string,
      name: string,
      parentId: string | null,
      order: number,
    ): Promise<Folder> {
      assertValid(folderSchema.safeParse({ name }))

      const now = Date.now()
      const folder: Folder = {
        id: newId(),
        collectionId,
        parentId,
        name: name.trim(),
        order,
        createdAt: now,
        updatedAt: now,
      }

      await gateway.saveFolder(workspaceId, collectionId, folder)
      return folder
    },

    async renameFolder(
      workspaceId: string,
      folder: Folder,
      name: string,
    ): Promise<Folder> {
      assertValid(folderSchema.safeParse({ name }))
      const next = { ...folder, name: name.trim(), updatedAt: Date.now() }
      await gateway.saveFolder(workspaceId, folder.collectionId, next)
      return next
    },

    async moveFolder(
      workspaceId: string,
      folders: Folder[],
      folder: Folder,
      parentId: string | null,
    ): Promise<Folder> {
      if (parentId === folder.id) {
        throw new DataFailure({
          kind: 'validation',
          message: 'folder.error.self',
        })
      }
      if (parentId && isDescendant(folders, folder.id, parentId)) {
        throw new DataFailure({
          kind: 'validation',
          message: 'folder.error.descendant',
        })
      }

      const next = { ...folder, parentId, updatedAt: Date.now() }
      await gateway.saveFolder(workspaceId, folder.collectionId, next)
      return next
    },

    async removeFolder(
      workspaceId: string,
      collectionId: string,
      folders: Folder[],
      endpoints: RequestDef[],
      folderId: string,
    ): Promise<{ folderIds: string[]; endpointIds: string[] }> {
      const folderIds = [folderId, ...descendantFolderIds(folders, folderId)]
      const doomed = new Set(folderIds)
      const endpointIds = endpoints
        .filter((endpoint) => endpoint.folderId && doomed.has(endpoint.folderId))
        .map((endpoint) => endpoint.id)

      if (endpointIds.length > 0) {
        await gateway.removeEndpoints(workspaceId, collectionId, endpointIds)
      }
      await gateway.removeFolders(workspaceId, collectionId, folderIds)

      return { folderIds, endpointIds }
    },

    async moveEndpoint(
      workspaceId: string,
      collectionId: string,
      endpoint: RequestDef,
      folderId: string | null,
    ): Promise<RequestDef> {
      const next = { ...endpoint, folderId, updatedAt: Date.now() }
      await gateway.saveEndpoint(workspaceId, collectionId, next)
      return next
    },

    saveEndpoint(
      workspaceId: string,
      collectionId: string,
      endpoint: RequestDef,
    ): Promise<void> {
      return gateway.saveEndpoint(workspaceId, collectionId, endpoint)
    },

    removeEndpoint(
      workspaceId: string,
      collectionId: string,
      endpointId: string,
    ): Promise<void> {
      return gateway.removeEndpoint(workspaceId, collectionId, endpointId)
    },
  }
}

export type CollectionService = ReturnType<typeof createCollectionService>
