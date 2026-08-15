import type { RequestDef } from '@/features/request/domain/request'
import type { ApiCollection } from './collection'
import type { Folder } from './folder'

export interface CreateCollectionInput {
  workspaceId: string
  teamId: string | null
  name: string
  description: string
}

export type CollectionPatch = Partial<
  Pick<
    ApiCollection,
    'name' | 'description' | 'baseUrl' | 'headers' | 'auth' | 'variables' | 'teamId'
  >
>

export interface CollectionGateway {
  list(workspaceId: string): Promise<ApiCollection[]>
  get(workspaceId: string, collectionId: string): Promise<ApiCollection | null>
  create(input: CreateCollectionInput): Promise<ApiCollection>
  update(workspaceId: string, collectionId: string, patch: CollectionPatch): Promise<void>
  remove(workspaceId: string, collectionId: string): Promise<void>

  listEndpoints(workspaceId: string, collectionId: string): Promise<RequestDef[]>
  saveEndpoint(workspaceId: string, collectionId: string, endpoint: RequestDef): Promise<void>
  removeEndpoint(workspaceId: string, collectionId: string, endpointId: string): Promise<void>

  listFolders(workspaceId: string, collectionId: string): Promise<Folder[]>
  saveFolder(workspaceId: string, collectionId: string, folder: Folder): Promise<void>
  removeFolders(workspaceId: string, collectionId: string, folderIds: string[]): Promise<void>
  removeEndpoints(workspaceId: string, collectionId: string, endpointIds: string[]): Promise<void>
}
