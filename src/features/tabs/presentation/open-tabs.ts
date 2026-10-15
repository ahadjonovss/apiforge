const KEY = 'apiforge.openTabs'

export interface OpenTabsState {
  ids: string[]
  activeId: string | null
  onEndpoint: boolean
}

export function readOpenTabs(collectionId: string): OpenTabsState | null {
  try {
    const raw = localStorage.getItem(`${KEY}.${collectionId}`)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null

    const { ids, activeId, onEndpoint } = parsed as Partial<OpenTabsState>
    if (!Array.isArray(ids)) return null

    return {
      ids: ids.filter((id): id is string => typeof id === 'string'),
      activeId: typeof activeId === 'string' ? activeId : null,
      onEndpoint: onEndpoint === true,
    }
  } catch {
    return null
  }
}

export function writeOpenTabs(collectionId: string, state: OpenTabsState) {
  try {
    const key = `${KEY}.${collectionId}`
    if (state.ids.length === 0) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(state))
  } catch {
    return
  }
}
