import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { ArrowLeft, FilePlus2, FolderPlus, Home, Settings } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { Button } from '@/shared/ui/button'
import { DataErrorNote } from '@/shared/ui/data-error-note'
import type { RequestDef } from '@/features/request/domain/request'
import { useTabsStore } from '@/features/tabs'
import { RequestPanel } from '@/features/request/presentation/request-panel'
import { ResponsePanel } from '@/features/request/presentation/response-panel'
import { buildTree } from '../application/tree'
import type { Folder } from '../domain/folder'
import { useCollectionsStore } from './collections-store'
import { CollectionHome } from './collection-home'
import { SaveStatus } from './save-status'
import { useAutoSave } from './use-auto-save'
import { CollectionSettingsModal } from './collection-settings-modal'
import { CollectionTree, type TreeHandlers } from './collection-tree'
import { EndpointModal } from './endpoint-modal'
import { FolderModal } from './folder-modal'

export function CollectionPage({
  workspaceId,
  collectionId,
}: {
  workspaceId: string
  collectionId: string
}) {
  const current = useCollectionsStore((state) => state.current)
  const endpoints = useCollectionsStore((state) => state.endpoints)
  const folders = useCollectionsStore((state) => state.folders)
  const loading = useCollectionsStore((state) => state.loading)
  const error = useCollectionsStore((state) => state.error)
  const openCollection = useCollectionsStore((state) => state.openCollection)
  const removeEndpoint = useCollectionsStore((state) => state.removeEndpoint)
  const removeFolder = useCollectionsStore((state) => state.removeFolder)

  const tabs = useTabsStore((state) => state.tabs)
  const activeTabId = useTabsStore((state) => state.activeTabId)
  const openTab = useTabsStore((state) => state.openTab)
  const setActiveTab = useTabsStore((state) => state.setActiveTab)
  const syncInherited = useTabsStore((state) => state.syncInherited)

  const [view, setView] = useState<'home' | 'endpoint'>('home')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [folderModal, setFolderModal] = useState<{ folder: Folder | null; parentId: string | null } | null>(null)
  const [endpointModal, setEndpointModal] = useState<{ endpoint: RequestDef | null; parentId: string | null } | null>(null)

  useEffect(() => {
    void openCollection(workspaceId, collectionId)
    setView('home')
  }, [workspaceId, collectionId, openCollection])

  const tree = useMemo(() => buildTree(folders, endpoints), [folders, endpoints])
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null

  useAutoSave(workspaceId, activeTab)

  const inherited = useMemo(
    () =>
      current
        ? {
            baseUrl: current.baseUrl,
            headers: current.headers,
            auth: current.auth,
            variables: Object.fromEntries(
              current.variables
                .filter((variable) => variable.enabled && variable.key.trim() !== '')
                .map((variable) => [variable.key, variable.value]),
            ),
          }
        : null,
    [current],
  )

  useEffect(() => {
    if (current && inherited) syncInherited(current.id, inherited)
  }, [current, inherited, syncInherited])

  const openEndpoint = (endpoint: RequestDef) => {
    const existing = tabs.find((tab) => tab.id === endpoint.id)
    if (existing) setActiveTab(existing.id)
    else openTab(endpoint, inherited)
    setView('endpoint')
  }

  const handlers: TreeHandlers = {
    activeId: activeTabId,
    expanded,
    onToggle: (folderId) =>
      setExpanded((current) => {
        const next = new Set(current)
        if (next.has(folderId)) next.delete(folderId)
        else next.add(folderId)
        return next
      }),
    onOpenEndpoint: openEndpoint,
    onCreateFolder: (parentId) => {
      if (parentId) setExpanded((current) => new Set(current).add(parentId))
      setFolderModal({ folder: null, parentId })
    },
    onCreateEndpoint: (parentId) => {
      if (parentId) setExpanded((current) => new Set(current).add(parentId))
      setEndpointModal({ endpoint: null, parentId })
    },
    onEditFolder: (folder) => setFolderModal({ folder, parentId: folder.parentId }),
    onDeleteFolder: (folderId) => void removeFolder(workspaceId, folderId),
    onEditEndpoint: (endpoint) => setEndpointModal({ endpoint, parentId: endpoint.folderId }),
    onDeleteEndpoint: (endpointId) => void removeEndpoint(workspaceId, endpointId),
  }

  if (loading && !current) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-muted-foreground">Yuklanmoqda…</p>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm">To'plam topilmadi</p>
        <DataErrorNote error={error} />
        <Link
          to="/workspace/$workspaceId"
          params={{ workspaceId }}
          className="text-xs text-primary hover:underline"
        >
          Ish maydoniga qaytish
        </Link>
      </div>
    )
  }

  return (
    <Group orientation="horizontal" className="h-full">
      <Panel defaultSize="26" minSize="18" maxSize="45">
        <aside className="flex h-full flex-col bg-card">
          <div className="border-b border-border px-3 py-2">
            <Link
              to="/workspace/$workspaceId"
              params={{ workspaceId }}
              className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="size-3" />
              Ish maydoni
            </Link>
            <p className="mt-1 truncate text-sm font-semibold">{current.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {current.baseUrl || 'Base URL belgilanmagan'}
            </p>
          </div>

          <div className="flex items-center gap-1 border-b border-border px-2 py-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFolderModal({ folder: null, parentId: null })}
            >
              <FolderPlus className="size-3.5" />
              Papka
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEndpointModal({ endpoint: null, parentId: null })}
            >
              <FilePlus2 className="size-3.5" />
              Endpoint
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Sozlamalar"
              className="ml-auto"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="size-3.5" />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-1">
            <button
              type="button"
              onClick={() => setView('home')}
              className={cn(
                'mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition',
                view === 'home' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50',
              )}
            >
              <Home className="size-3.5 shrink-0" />
              <span className="truncate text-xs font-medium">Bosh sahifa</span>
            </button>

            {tree.length === 0 ? (
              <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">
                Bo'sh — papka yoki endpoint qo'shing
              </p>
            ) : (
              <CollectionTree nodes={tree} handlers={handlers} />
            )}
          </div>

          {error && (
            <div className="border-t border-border p-2">
              <DataErrorNote error={error} />
            </div>
          )}
        </aside>
      </Panel>

      <Separator className="w-px shrink-0 bg-border transition-colors hover:bg-primary data-[state=dragging]:bg-primary" />

      <Panel defaultSize="74">
        {view === 'home' || !activeTab ? (
          <CollectionHome
            workspaceId={workspaceId}
            collection={current}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
              <span className="truncate text-xs text-muted-foreground">
                {activeTab.request.name}
              </span>
              <SaveStatus tab={activeTab} />
            </div>

            <Group orientation="vertical" className="min-h-0 flex-1">
              <Panel defaultSize="45" minSize="20">
                <RequestPanel tab={activeTab} />
              </Panel>

              <Separator className="h-px shrink-0 bg-border transition-colors hover:bg-primary data-[state=dragging]:bg-primary" />

              <Panel defaultSize="55" minSize="20">
                <ResponsePanel tab={activeTab} />
              </Panel>
            </Group>
          </div>
        )}
      </Panel>

      <FolderModal
        workspaceId={workspaceId}
        open={folderModal !== null}
        folder={folderModal?.folder ?? null}
        parentId={folderModal?.parentId ?? null}
        onClose={() => setFolderModal(null)}
      />
      <EndpointModal
        workspaceId={workspaceId}
        open={endpointModal !== null}
        endpoint={endpointModal?.endpoint ?? null}
        parentId={endpointModal?.parentId ?? null}
        onClose={() => setEndpointModal(null)}
        onCreated={openEndpoint}
      />
      <CollectionSettingsModal
        workspaceId={workspaceId}
        collection={current}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </Group>
  )
}
