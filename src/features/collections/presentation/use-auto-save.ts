import { useEffect, useRef } from 'react'
import { useTabsStore, type Tab } from '@/features/tabs'
import { useCollectionsStore } from './collections-store'

const DELAY_MS = 800

export function useAutoSave(workspaceId: string, tab: Tab | null) {
  const autoSave = useCollectionsStore((state) => state.autoSave)
  const markSaved = useTabsStore((state) => state.markSaved)
  const inFlight = useRef(false)

  const dirty = tab?.dirty ?? false
  const revision = tab?.revision ?? 0
  const tabId = tab?.id
  const request = tab?.request

  useEffect(() => {
    if (!dirty || !request || !tabId) return

    const timer = setTimeout(async () => {
      if (inFlight.current) return
      inFlight.current = true
      try {
        if (await autoSave(workspaceId, request)) markSaved(tabId, revision)
      } finally {
        inFlight.current = false
      }
    }, DELAY_MS)

    return () => clearTimeout(timer)
  }, [dirty, revision, tabId, request, workspaceId, autoSave, markSaved])

  useEffect(() => {
    const unsaved = () => useTabsStore.getState().tabs.some((item) => item.dirty)

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!unsaved()) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])
}
