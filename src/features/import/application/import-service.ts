import { createRequest } from '@/features/request/application/request-factory'
import type { ImportMessage, ImportPlan } from '../domain/import-plan'
import type { ImportSink } from '../domain/import-sink'
import { parseCollectionSource } from './parse-collection-source'

export interface ImportOutcome {
  collectionId: string
  folders: number
  endpoints: number
  warnings: ImportMessage[]
}

export function createImportService(sink: ImportSink) {
  return {
    preview(source: string): ImportPlan {
      return parseCollectionSource(source)
    },

    async apply(
      workspaceId: string,
      teamId: string | null,
      plan: ImportPlan,
    ): Promise<ImportOutcome> {
      const collection = await sink.createCollection(
        workspaceId,
        plan.collection.name,
        plan.collection.description,
        teamId,
      )

      await sink.applySettings(workspaceId, collection.id, {
        docs: plan.collection.docs,
        baseUrl: plan.collection.baseUrl,
        headers: plan.collection.headers,
        auth: plan.collection.auth,
        variables: plan.collection.variables,
      })

      const now = Date.now()

      await Promise.all(
        plan.folders.map((folder) =>
          sink.saveFolder(workspaceId, collection.id, {
            id: folder.id,
            collectionId: collection.id,
            parentId: folder.parentId,
            name: folder.name,
            order: folder.order,
            createdAt: now,
            updatedAt: now,
          }),
        ),
      )

      await Promise.all(
        plan.endpoints.map((endpoint) =>
          sink.saveEndpoint(
            workspaceId,
            collection.id,
            createRequest({
              id: endpoint.id,
              name: endpoint.name,
              docs: endpoint.docs,
              responseDocs: endpoint.responseDocs,
              method: endpoint.method,
              url: endpoint.url,
              params: endpoint.params,
              headers: endpoint.headers,
              body: endpoint.body,
              auth: endpoint.auth,
              collectionId: collection.id,
              folderId: endpoint.folderId,
              order: endpoint.order,
            }),
          ),
        ),
      )

      return {
        collectionId: collection.id,
        folders: plan.folders.length,
        endpoints: plan.endpoints.length,
        warnings: plan.warnings,
      }
    },
  }
}

export type ImportService = ReturnType<typeof createImportService>
