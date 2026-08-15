export interface Folder {
  id: string
  collectionId: string
  parentId: string | null
  name: string
  order: number
  createdAt: number
  updatedAt: number
}
