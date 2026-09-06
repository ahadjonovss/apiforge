import { useCallback, useEffect, useRef } from 'react'
import { useTabsStore } from '@/features/tabs'
import { useCollectionsStore } from './collections-store'

const DELAY_MS = 800

export function useAutoSave(workspaceId: string, collectionId: string | null) {
  const autoSave = useCollectionsStore((state) => state.autoSave)
  const markSaved = useTabsStore((state) => state.markSaved)
  const tabs = useTabsStore((state) => state.tabs)

  const running = useRef(false)
  const rerun = useRef(false)

  const flush = useCallback(async () => {
    if (!collectionId) return

    if (running.current) {
      rerun.current = true
      return
    }

    running.current = true
    try {
      do {
        rerun.current = false
        const pending = useTabsStore
          .getState()
          .tabs.filter((tab) => tab.dirty && tab.request.collectionId === collectionId)

        for (const tab of pending) {
          const revision = tab.revision
          if (await autoSave(workspaceId, tab.request)) markSaved(tab.id, revision)
        }
      } while (rerun.current)
    } finally {
      running.current = false
    }
  }, [workspaceId, collectionId, autoSave, markSaved])

  const pendingKey = tabs
    .filter((tab) => tab.dirty && tab.request.collectionId === collectionId)
    .map((tab) => `${tab.id}:${tab.revision}`)
    .join(',')

  useEffect(() => {
    if (!pendingKey) return

    const timer = setTimeout(() => void flush(), DELAY_MS)
    return () => clearTimeout(timer)
  }, [pendingKey, flush])

  const flushRef = useRef(flush)
  flushRef.current = flush

  useEffect(() => {
    return () => void flushRef.current()
  }, [])

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
