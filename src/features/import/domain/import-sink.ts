import type { ApiCollection } from '@/features/collections/domain/collection'
import type { Folder } from '@/features/collections/domain/folder'
import type { RequestDef } from '@/features/request/domain/request'

export type CollectionSettings = Partial<
  Pick<ApiCollection, 'headers' | 'auth' | 'variables' | 'baseUrl'>
>

export interface ImportSink {
  createCollection(
    workspaceId: string,
    name: string,
    description: string,
    teamId: string | null,
  ): Promise<ApiCollection>
  applySettings(
    workspaceId: string,
    collectionId: string,
    settings: CollectionSettings,
  ): Promise<void>
  saveFolder(workspaceId: string, collectionId: string, folder: Folder): Promise<void>
  saveEndpoint(workspaceId: string, collectionId: string, endpoint: RequestDef): Promise<void>
}
