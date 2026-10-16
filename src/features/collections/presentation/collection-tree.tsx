import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  FilePlus2,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Trash2,
} from 'lucide-react'
import type { DragEvent } from 'react'
import { cn } from '@/core/lib/cn'
import { MethodBadge } from '@/shared/ui/method-badge'
import type { RequestDef } from '@/features/request/domain/request'
import type { DropPosition, NodeRef } from '../application/reorder'
import type { TreeNode } from '../application/tree'
import type { Folder as FolderModel } from '../domain/folder'
import { MenuTrigger, RowMenu, type MenuItem } from './row-menu'
import { useRowMenu } from './use-row-menu'
import type { TreeDrag } from './use-tree-drag'
import { useT } from '@/app/providers/i18n-provider'

export interface TreeHandlers {
  activeId: string | null
  expanded: Set<string>
  drag: TreeDrag
  onToggle: (folderId: string) => void
  onOpenEndpoint: (endpoint: RequestDef) => void
  onCreateFolder: (parentId: string | null) => void
  onCreateEndpoint: (parentId: string | null) => void
  onEditFolder: (folder: FolderModel) => void
  onDeleteFolder: (folderId: string) => void
  onEditEndpoint: (endpoint: RequestDef) => void
  onDeleteEndpoint: (endpointId: string) => void
  onDuplicateEndpoint: (endpoint: RequestDef) => void
  onAddExample: (endpoint: RequestDef) => void
}

function positionAt(event: DragEvent<HTMLElement>, nestable: boolean): DropPosition {
  const box = event.currentTarget.getBoundingClientRect()
  const offset = (event.clientY - box.top) / (box.height || 1)
  if (!nestable) return offset < 0.5 ? 'before' : 'after'
  if (offset < 0.3) return 'before'
  if (offset > 0.7) return 'after'
  return 'inside'
}

function dragProps(ref: NodeRef, drag: TreeDrag, nestable: boolean) {
  const hint = drag.hint && drag.hint.target?.id === ref.id ? drag.hint.position : null

  return {
    draggable: true,
    className: cn(
      drag.active?.id === ref.id && 'opacity-50',
      hint === 'before' && 'shadow-[inset_0_2px_0_0_var(--color-primary)]',
      hint === 'after' && 'shadow-[inset_0_-2px_0_0_var(--color-primary)]',
      hint === 'inside' && 'ring-1 ring-primary',
    ),
    onDragStart: (event: DragEvent<HTMLElement>) => {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', ref.id)
      drag.onStart(ref)
    },
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!drag.active) return
      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = 'move'
      drag.onOver(ref, positionAt(event, nestable))
    },
    onDragLeave: (event: DragEvent<HTMLElement>) => {
      const next = event.relatedTarget as Node | null
      if (next && event.currentTarget.contains(next)) return
      drag.onLeave(ref.id)
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      drag.onDrop()
    },
    onDragEnd: () => drag.onEnd(),
  }
}

function FolderRow({
  node,
  depth,
  handlers,
}: {
  node: Extract<TreeNode, { kind: 'folder' }>
  depth: number
  handlers: TreeHandlers
}) {
  const t = useT()
  const open = handlers.expanded.has(node.folder.id)
  const menu = useRowMenu()
  const dnd = dragProps({ kind: 'folder', id: node.folder.id }, handlers.drag, true)

  const items: MenuItem[] = [
    {
      label: t('folder.addInside'),
      icon: <FolderPlus className="size-3.5" />,
      onClick: () => handlers.onCreateFolder(node.folder.id),
    },
    {
      label: t('endpoint.addInside'),
      icon: <FilePlus2 className="size-3.5" />,
      onClick: () => handlers.onCreateEndpoint(node.folder.id),
    },
    {
      label: t('common.edit'),
      icon: <Pencil className="size-3.5" />,
      onClick: () => handlers.onEditFolder(node.folder),
      separated: true,
    },
    {
      label: t('common.delete'),
      icon: <Trash2 className="size-3.5" />,
      onClick: () => handlers.onDeleteFolder(node.folder.id),
      danger: true,
    },
  ]

  return (
    <>
      <div
        {...dnd}
        className={cn(
          'group flex items-center gap-1 rounded-md py-1 pr-1 transition hover:bg-accent/50',
          dnd.className,
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onContextMenu={menu.openAtCursor}
      >
        <button
          type="button"
          onClick={() => handlers.onToggle(node.folder.id)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          {open ? (
            <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
          )}
          {open ? (
            <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <Folder className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-xs">{node.folder.name}</span>
        </button>

        <div
          className={cn(
            'flex shrink-0 items-center transition group-hover:opacity-100',
            menu.at ? 'opacity-100' : 'opacity-0',
          )}
        >
          <MenuTrigger label={t('tree.actions')} onOpen={menu.openAtTrigger} />
        </div>
      </div>

      <RowMenu at={menu.at} items={items} onClose={menu.close} />

      {open &&
        (node.children.length > 0 ? (
          <CollectionTree nodes={node.children} depth={depth + 1} handlers={handlers} />
        ) : (
          <p
            className="py-1 text-[11px] text-muted-foreground"
            style={{ paddingLeft: `${(depth + 1) * 12 + 22}px` }}
          >
            {t('common.empty')}
          </p>
        ))}
    </>
  )
}

function EndpointRow({
  endpoint,
  depth,
  handlers,
}: {
  endpoint: RequestDef
  depth: number
  handlers: TreeHandlers
}) {
  const t = useT()
  const menu = useRowMenu()
  const dnd = dragProps({ kind: 'endpoint', id: endpoint.id }, handlers.drag, false)

  const items: MenuItem[] = [
    {
      label: t('tree.addExample'),
      icon: <BookOpen className="size-3.5" />,
      onClick: () => handlers.onAddExample(endpoint),
    },
    {
      label: t('tree.duplicate'),
      icon: <Copy className="size-3.5" />,
      onClick: () => handlers.onDuplicateEndpoint(endpoint),
    },
    {
      label: t('common.edit'),
      icon: <Pencil className="size-3.5" />,
      onClick: () => handlers.onEditEndpoint(endpoint),
      separated: true,
    },
    {
      label: t('common.delete'),
      icon: <Trash2 className="size-3.5" />,
      onClick: () => handlers.onDeleteEndpoint(endpoint.id),
      danger: true,
    },
  ]

  return (
    <div
      {...dnd}
      className={cn(
        'group flex items-center gap-1 rounded-md py-1 pr-1 transition',
        endpoint.id === handlers.activeId ? 'bg-accent' : 'hover:bg-accent/50',
        dnd.className,
      )}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
      onContextMenu={menu.openAtCursor}
    >
      <button
        type="button"
        onClick={() => handlers.onOpenEndpoint(endpoint)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <MethodBadge method={endpoint.method} className="w-10 shrink-0" />
        <span className="truncate text-xs">{endpoint.name}</span>
      </button>

      <div
        className={cn(
          'flex shrink-0 items-center transition group-hover:opacity-100',
          menu.at ? 'opacity-100' : 'opacity-0',
        )}
      >
        <MenuTrigger label={t('tree.actions')} onOpen={menu.openAtTrigger} />
      </div>

      <RowMenu at={menu.at} items={items} onClose={menu.close} />
    </div>
  )
}

export function CollectionTree({
  nodes,
  depth = 0,
  handlers,
}: {
  nodes: TreeNode[]
  depth?: number
  handlers: TreeHandlers
}) {
  return (
    <>
      {nodes.map((node) =>
        node.kind === 'folder' ? (
          <FolderRow key={node.folder.id} node={node} depth={depth} handlers={handlers} />
        ) : (
          <EndpointRow
            key={node.endpoint.id}
            endpoint={node.endpoint}
            depth={depth}
            handlers={handlers}
          />
        ),
      )}
    </>
  )
}
