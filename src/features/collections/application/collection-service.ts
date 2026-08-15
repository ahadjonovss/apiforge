import { DataFailure } from '@/core/domain/data-error'
import { createRequest } from '@/features/request/application/request-factory'
import type { RequestDef } from '@/features/request/domain/request'
import type { ApiCollection } from '../domain/collection'
import type { CollectionGateway, CollectionPatch } from '../domain/collection-gateway'
import { collectionSchema, collectionSettingsSchema, endpointSchema } from './schemas'

function assertValid(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  if (!result.success) {
    throw new DataFailure({
      kind: 'validation',
      message: result.error?.issues[0]?.message ?? "Ma'lumot noto'g'ri",
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
    ): Promise<ApiCollection> {
      assertValid(collectionSchema.safeParse({ name, description }))
      return gateway.create({
        workspaceId,
        teamId,
        name: name.trim(),
        description: description.trim(),
      })
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
    ): Promise<RequestDef> {
      assertValid(endpointSchema.safeParse({ name }))

      const endpoint = createRequest({
        name: name.trim(),
        url: collection.baseUrl,
        collectionId: collection.id,
        order,
      })

      await gateway.saveEndpoint(workspaceId, collection.id, endpoint)
      return endpoint
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
