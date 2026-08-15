import type { RequestDef } from '@/features/request/domain/request'
import type { Folder } from '../domain/folder'

export interface FolderNode {
  kind: 'folder'
  folder: Folder
  children: TreeNode[]
}

export interface EndpointNode {
  kind: 'endpoint'
  endpoint: RequestDef
}

export type TreeNode = FolderNode | EndpointNode

function byOrder(a: { order: number; name: string }, b: { order: number; name: string }) {
  return a.order - b.order || a.name.localeCompare(b.name)
}

function resolveParent(folder: Folder, byId: Map<string, Folder>): string | null {
  if (!folder.parentId) return null

  const seen = new Set<string>([folder.id])
  let cursor: string | null = folder.parentId

  while (cursor) {
    if (seen.has(cursor)) return null
    const parent = byId.get(cursor)
    if (!parent) return null
    seen.add(cursor)
    cursor = parent.parentId
  }

  return folder.parentId
}

export function buildTree(folders: Folder[], endpoints: RequestDef[]): TreeNode[] {
  const byId = new Map(folders.map((folder) => [folder.id, folder]))
  const childFolders = new Map<string | null, Folder[]>()

  for (const folder of folders) {
    const parentId = resolveParent(folder, byId)
    const bucket = childFolders.get(parentId) ?? []
    bucket.push(folder)
    childFolders.set(parentId, bucket)
  }

  const childEndpoints = new Map<string | null, RequestDef[]>()
  for (const endpoint of endpoints) {
    const parentId = endpoint.folderId && byId.has(endpoint.folderId) ? endpoint.folderId : null
    const bucket = childEndpoints.get(parentId) ?? []
    bucket.push(endpoint)
    childEndpoints.set(parentId, bucket)
  }

  const build = (parentId: string | null): TreeNode[] => [
    ...(childFolders.get(parentId) ?? [])
      .slice()
      .sort(byOrder)
      .map<TreeNode>((folder) => ({
        kind: 'folder',
        folder,
        children: build(folder.id),
      })),
    ...(childEndpoints.get(parentId) ?? [])
      .slice()
      .sort(byOrder)
      .map<TreeNode>((endpoint) => ({ kind: 'endpoint', endpoint })),
  ]

  return build(null)
}

export function descendantFolderIds(folders: Folder[], folderId: string): string[] {
  const children = new Map<string, string[]>()
  for (const folder of folders) {
    if (!folder.parentId) continue
    const bucket = children.get(folder.parentId) ?? []
    bucket.push(folder.id)
    children.set(folder.parentId, bucket)
  }

  const result: string[] = []
  const queue = [folderId]
  const seen = new Set<string>([folderId])

  while (queue.length > 0) {
    const current = queue.shift() as string
    for (const child of children.get(current) ?? []) {
      if (seen.has(child)) continue
      seen.add(child)
      result.push(child)
      queue.push(child)
    }
  }

  return result
}

export function isDescendant(folders: Folder[], folderId: string, candidateId: string): boolean {
  return descendantFolderIds(folders, folderId).includes(candidateId)
}

export interface FlatFolder {
  folder: Folder
  depth: number
}

export function flattenFolders(folders: Folder[], exclude?: string): FlatFolder[] {
  const blocked = exclude
    ? new Set([exclude, ...descendantFolderIds(folders, exclude)])
    : new Set<string>()

  const walk = (nodes: TreeNode[], depth: number): FlatFolder[] =>
    nodes.flatMap((node) =>
      node.kind === 'folder' && !blocked.has(node.folder.id)
        ? [{ folder: node.folder, depth }, ...walk(node.children, depth + 1)]
        : [],
    )

  return walk(buildTree(folders, []), 0)
}
