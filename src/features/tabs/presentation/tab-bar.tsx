import { Plus, X } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { MethodBadge } from '@/shared/ui/method-badge'
import { useTabsStore } from './tabs-store'

export function TabBar() {
  const tabs = useTabsStore((state) => state.tabs)
  const activeTabId = useTabsStore((state) => state.activeTabId)
  const setActiveTab = useTabsStore((state) => state.setActiveTab)
  const closeTab = useTabsStore((state) => state.closeTab)
  const openTab = useTabsStore((state) => state.openTab)

  return (
    <div className="flex items-stretch overflow-x-auto border-b border-border bg-card">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tab"
          tabIndex={0}
          aria-selected={tab.id === activeTabId}
          onClick={() => setActiveTab(tab.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') setActiveTab(tab.id)
          }}
          className={cn(
            'group flex shrink-0 cursor-pointer items-center gap-2 border-r border-border px-3 py-2 text-xs transition',
            tab.id === activeTabId
              ? 'bg-background text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <MethodBadge method={tab.request.method} />
          <span className="max-w-[160px] truncate">
            {tab.request.url || tab.request.name}
          </span>
          {tab.dirty && <span className="size-1.5 rounded-full bg-primary" />}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              closeTab(tab.id)
            }}
            className="rounded p-0.5 opacity-0 transition hover:bg-accent group-hover:opacity-100"
            aria-label="Yopish"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => openTab()}
        className="shrink-0 px-3 text-muted-foreground transition hover:text-foreground"
        aria-label="Yangi tab"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}
