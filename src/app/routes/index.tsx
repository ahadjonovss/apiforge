import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { useTabsStore } from '@/features/tabs'
import { Sidebar } from '@/features/collections/presentation/sidebar'
import { TabBar } from '@/features/tabs/presentation/tab-bar'
import { RequestPanel } from '@/features/request/presentation/request-panel'
import { ResponsePanel } from '@/features/request/presentation/response-panel'

function ResizeHandle({ orientation }: { orientation: 'horizontal' | 'vertical' }) {
  return (
    <Separator
      className={
        orientation === 'horizontal'
          ? 'w-px shrink-0 bg-border transition-colors hover:bg-primary data-[state=dragging]:bg-primary'
          : 'h-px shrink-0 bg-border transition-colors hover:bg-primary data-[state=dragging]:bg-primary'
      }
    />
  )
}

function Workbench() {
  const tabs = useTabsStore((state) => state.tabs)
  const activeTabId = useTabsStore((state) => state.activeTabId)
  const openTab = useTabsStore((state) => state.openTab)

  useEffect(() => {
    if (useTabsStore.getState().tabs.length === 0) openTab()
  }, [openTab])

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null

  return (
    <Group orientation="horizontal" className="h-full">
      <Panel defaultSize="20" minSize="14" maxSize="40">
        <Sidebar />
      </Panel>

      <ResizeHandle orientation="horizontal" />

      <Panel defaultSize="80">
        <div className="flex h-full flex-col">
          <TabBar />

          {activeTab ? (
            <Group orientation="vertical" className="min-h-0 flex-1">
              <Panel defaultSize="45" minSize="20">
                <RequestPanel tab={activeTab} />
              </Panel>

              <ResizeHandle orientation="vertical" />

              <Panel defaultSize="55" minSize="20">
                <ResponsePanel tab={activeTab} />
              </Panel>
            </Group>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-xs text-muted-foreground">Ochiq tab yo'q</p>
            </div>
          )}
        </div>
      </Panel>
    </Group>
  )
}

export const Route = createFileRoute('/')({
  component: Workbench,
})
