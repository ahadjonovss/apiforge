import { create } from 'zustand'
import { createRequest, sendRequest, HttpRequestFailure } from '@/features/request'
import type { RequestDef, RequestError } from '@/features/request'
import type { InheritedConfig } from '@/features/request/domain/request'
import type { Tab } from '../domain/tab'

interface TabsState {
  tabs: Tab[]
  activeTabId: string | null
  openTab: (request?: RequestDef, inherited?: InheritedConfig | null) => string
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  patchRequest: (tabId: string, patch: Partial<RequestDef>) => void
  syncInherited: (collectionId: string, inherited: InheritedConfig) => void
  send: (tabId: string) => Promise<void>
}

function makeTab(request: RequestDef, inherited: InheritedConfig | null): Tab {
  return {
    id: request.id,
    request,
    inherited,
    response: null,
    error: null,
    isSending: false,
    dirty: false,
  }
}

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: (request, inherited = null) => {
    const tab = makeTab(request ?? createRequest(), inherited)
    set((state) => ({ tabs: [...state.tabs, tab], activeTabId: tab.id }))
    return tab.id
  },

  closeTab: (tabId) =>
    set((state) => {
      const index = state.tabs.findIndex((tab) => tab.id === tabId)
      if (index === -1) return state

      const tabs = state.tabs.filter((tab) => tab.id !== tabId)
      if (state.activeTabId !== tabId) return { tabs, activeTabId: state.activeTabId }

      const neighbour = tabs[index] ?? tabs[index - 1] ?? null
      return { tabs, activeTabId: neighbour?.id ?? null }
    }),

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  patchRequest: (tabId, patch) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId
          ? { ...tab, request: { ...tab.request, ...patch, updatedAt: Date.now() }, dirty: true }
          : tab,
      ),
    })),

  syncInherited: (collectionId, inherited) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.request.collectionId === collectionId ? { ...tab, inherited } : tab,
      ),
    })),

  send: async (tabId) => {
    const tab = get().tabs.find((item) => item.id === tabId)
    if (!tab || tab.isSending) return

    const patchTab = (patch: Partial<Tab>) =>
      set((state) => ({
        tabs: state.tabs.map((item) => (item.id === tabId ? { ...item, ...patch } : item)),
      }))

    patchTab({ isSending: true, error: null })

    try {
      const response = await sendRequest(tab.request, {
        inherited: tab.inherited ?? undefined,
      })
      patchTab({ response, isSending: false })
    } catch (error) {
      const detail: RequestError =
        error instanceof HttpRequestFailure
          ? error.detail
          : { kind: 'unknown', message: String(error) }
      patchTab({ error: detail, response: null, isSending: false })
    }
  },
}))
