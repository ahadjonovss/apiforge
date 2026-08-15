import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { ArrowLeft, Plus, Save, Settings, Trash2 } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { TextField } from '@/shared/ui/text-field'
import { DataErrorNote } from '@/shared/ui/data-error-note'
import { MethodBadge } from '@/shared/ui/method-badge'
import { useTabsStore } from '@/features/tabs'
import { RequestPanel } from '@/features/request/presentation/request-panel'
import { ResponsePanel } from '@/features/request/presentation/response-panel'
import { useCollectionsStore } from './collections-store'
import { CollectionSettingsModal } from './collection-settings-modal'

function AddEndpointModal({
  workspaceId,
  open,
  onClose,
}: {
  workspaceId: string
  open: boolean
  onClose: () => void
}) {
  const pending = useCollectionsStore((state) => state.pending)
  const error = useCollectionsStore((state) => state.error)
  const addEndpoint = useCollectionsStore((state) => state.addEndpoint)
  const [name, setName] = useState('')

  const submit = async () => {
    if (await addEndpoint(workspaceId, name)) {
      setName('')
      onClose()
    }
  }

  return (
    <Modal open={open} title="Yangi endpoint" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <TextField
          label="Nomi"
          placeholder="Foydalanuvchilar ro'yxati"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void submit()
          }}
        />

        <DataErrorNote error={error} />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button size="sm" loading={pending} onClick={() => void submit()}>
            Qo'shish
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function CollectionPage({
  workspaceId,
  collectionId,
}: {
  workspaceId: string
  collectionId: string
}) {
  const current = useCollectionsStore((state) => state.current)
  const endpoints = useCollectionsStore((state) => state.endpoints)
  const loading = useCollectionsStore((state) => state.loading)
  const pending = useCollectionsStore((state) => state.pending)
  const error = useCollectionsStore((state) => state.error)
  const openCollection = useCollectionsStore((state) => state.openCollection)
  const removeEndpoint = useCollectionsStore((state) => state.removeEndpoint)
  const saveEndpoint = useCollectionsStore((state) => state.saveEndpoint)

  const tabs = useTabsStore((state) => state.tabs)
  const activeTabId = useTabsStore((state) => state.activeTabId)
  const openTab = useTabsStore((state) => state.openTab)
  const setActiveTab = useTabsStore((state) => state.setActiveTab)

  const [adding, setAdding] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    void openCollection(workspaceId, collectionId)
  }, [workspaceId, collectionId, openCollection])

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null

  const open = (endpointId: string) => {
    const existing = tabs.find((tab) => tab.id === endpointId)
    if (existing) {
      setActiveTab(existing.id)
      return
    }
    const endpoint = endpoints.find((item) => item.id === endpointId)
    if (endpoint) openTab(endpoint)
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
            <Button size="sm" variant="ghost" block onClick={() => setAdding(true)}>
              <Plus className="size-3.5" />
              Endpoint
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Sozlamalar"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="size-3.5" />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-1">
            {endpoints.length === 0 && (
              <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">
                Hali endpoint yo'q
              </p>
            )}

            {endpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className={cn(
                  'group flex items-center gap-2 rounded-md px-2 py-1.5 transition',
                  endpoint.id === activeTabId ? 'bg-accent' : 'hover:bg-accent/50',
                )}
              >
                <button
                  type="button"
                  onClick={() => open(endpoint.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <MethodBadge method={endpoint.method} className="w-12 shrink-0" />
                  <span className="truncate text-xs">{endpoint.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void removeEndpoint(workspaceId, endpoint.id)}
                  aria-label="O'chirish"
                  className="rounded p-1 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-2">
            <DataErrorNote error={error} />
          </div>
        </aside>
      </Panel>

      <Separator className="w-px shrink-0 bg-border transition-colors hover:bg-primary data-[state=dragging]:bg-primary" />

      <Panel defaultSize="74">
        {activeTab ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
              <span className="truncate text-xs text-muted-foreground">
                {activeTab.request.name}
              </span>
              <Button
                size="sm"
                variant="outline"
                loading={pending}
                onClick={() => void saveEndpoint(workspaceId, activeTab.request)}
              >
                <Save className="size-3.5" />
                Saqlash
              </Button>
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
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium">Endpoint tanlanmagan</p>
            <p className="text-xs text-muted-foreground">
              Chapdan birini oching yoki yangisini qo'shing
            </p>
          </div>
        )}
      </Panel>

      <AddEndpointModal
        workspaceId={workspaceId}
        open={adding}
        onClose={() => setAdding(false)}
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
