import { FolderPlus, Plus, Search } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { MethodBadge } from '@/shared/ui/method-badge'
import { useTabsStore } from '@/features/tabs'

export function Sidebar() {
  const tabs = useTabsStore((state) => state.tabs)
  const activeTabId = useTabsStore((state) => state.activeTabId)
  const setActiveTab = useTabsStore((state) => state.setActiveTab)
  const openTab = useTabsStore((state) => state.openTab)

  return (
    <aside className="flex h-full flex-col bg-card">
      <div className="flex items-center gap-1 border-b border-border px-2 py-2">
        <button
          type="button"
          onClick={() => openTab()}
          className="flex flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Yangi so'rov
        </button>
        <button
          type="button"
          className="rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label="Yangi collection"
        >
          <FolderPlus className="size-3.5" />
        </button>
      </div>

      <div className="border-b border-border px-2 py-2">
        <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1.5">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            placeholder="Qidirish"
            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-1">
        <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Ochiq so'rovlar
        </p>

        {tabs.length === 0 && (
          <p className="px-2 py-2 text-xs text-muted-foreground">Hozircha bo'sh</p>
        )}

        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition',
              tab.id === activeTabId
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            )}
          >
            <MethodBadge method={tab.request.method} className="w-12 shrink-0" />
            <span className="truncate">{tab.request.url || tab.request.name}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
