import { firestoreCollectionGateway } from '@/features/collections/infrastructure/firestore-collection-gateway'
import { createImportService } from './application/import-service'
import type { ImportSink } from './domain/import-sink'

const sink: ImportSink = {
  createCollection: (workspaceId, name, description, teamId) =>
    firestoreCollectionGateway.create({ workspaceId, teamId, name, description }),
  applySettings: (workspaceId, collectionId, settings) =>
    firestoreCollectionGateway.update(workspaceId, collectionId, settings),
  saveFolder: (workspaceId, collectionId, folder) =>
    firestoreCollectionGateway.saveFolder(workspaceId, collectionId, folder),
  saveEndpoint: (workspaceId, collectionId, endpoint) =>
    firestoreCollectionGateway.saveEndpoint(workspaceId, collectionId, endpoint),
}

export const importService = createImportService(sink)
