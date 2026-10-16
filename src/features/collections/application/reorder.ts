import type { RequestDef } from '@/features/request/domain/request'
import type { Folder } from '../domain/folder'
import { byOrder, isDescendant, resolveParent } from './tree'

export type DropPosition = 'before' | 'after' | 'inside'

export interface NodeRef {
  kind: 'folder' | 'endpoint'
  id: string
}

export interface ReorderPlan {
  folders: Folder[]
  endpoints: RequestDef[]
}

const EMPTY: ReorderPlan = { folders: [], endpoints: [] }

export function isEmptyPlan(plan: ReorderPlan): boolean {
  return plan.folders.length === 0 && plan.endpoints.length === 0
}

function insertIndex<T extends { id: string }>(
  list: T[],
  drag: NodeRef,
  target: NodeRef | null,
  position: DropPosition,
): number {
  if (!target || position === 'inside') return list.length
  if (target.kind !== drag.kind) return drag.kind === 'folder' ? list.length : 0

  const index = list.findIndex((item) => item.id === target.id)
  if (index === -1) return list.length
  return position === 'after' ? index + 1 : index
}

export function planReorder(
  folders: Folder[],
  endpoints: RequestDef[],
  drag: NodeRef,
  target: NodeRef | null,
  position: DropPosition,
): ReorderPlan {
  if (target && target.kind === drag.kind && target.id === drag.id) return EMPTY

  const byId = new Map(folders.map((folder) => [folder.id, folder]))

  const folderParent = (id: string) => {
    const folder = byId.get(id)
    return folder ? resolveParent(folder, byId) : null
  }
  const endpointParent = (endpoint: RequestDef) =>
    endpoint.folderId && byId.has(endpoint.folderId) ? endpoint.folderId : null

  let parentId: string | null
  if (!target) {
    parentId = null
  } else if (position === 'inside') {
    if (target.kind !== 'folder') return EMPTY
    parentId = target.id
  } else if (target.kind === 'folder') {
    parentId = folderParent(target.id)
  } else {
    const sibling = endpoints.find((item) => item.id === target.id)
    if (!sibling) return EMPTY
    parentId = endpointParent(sibling)
  }

  if (drag.kind === 'folder') {
    const folder = byId.get(drag.id)
    if (!folder) return EMPTY
    if (parentId === folder.id) return EMPTY
    if (parentId && isDescendant(folders, folder.id, parentId)) return EMPTY

    const siblings = folders
      .filter((item) => item.id !== folder.id && folderParent(item.id) === parentId)
      .sort(byOrder)

    siblings.splice(insertIndex(siblings, drag, target, position), 0, { ...folder, parentId })

    const changed = siblings
      .map((item, order) => ({ ...item, order }))
      .filter((item) => {
        const original = byId.get(item.id)
        return !original || original.parentId !== item.parentId || original.order !== item.order
      })

    return { folders: changed, endpoints: [] }
  }

  const endpoint = endpoints.find((item) => item.id === drag.id)
  if (!endpoint) return EMPTY

  const siblings = endpoints
    .filter((item) => item.id !== endpoint.id && endpointParent(item) === parentId)
    .sort(byOrder)

  siblings.splice(insertIndex(siblings, drag, target, position), 0, {
    ...endpoint,
    folderId: parentId,
  })

  const original = new Map(endpoints.map((item) => [item.id, item]))
  const changed = siblings
    .map((item, order) => ({ ...item, order }))
    .filter((item) => {
      const before = original.get(item.id)
      return !before || before.folderId !== item.folderId || before.order !== item.order
    })

  return { folders: [], endpoints: changed }
}
