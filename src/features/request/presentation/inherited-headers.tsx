import { Lock } from 'lucide-react'
import type { Tab } from '@/features/tabs'
import { authHeaderEntries, effectiveAuth } from '../application/build-http-call'
import { interpolate } from '../application/interpolate'

export function InheritedHeaders({ tab }: { tab: Tab }) {
  const inherited = tab.inherited
  if (!inherited) return null

  const scope = inherited.variables
  const own = new Set(
    tab.request.headers
      .filter((row) => row.enabled && row.key.trim() !== '')
      .map((row) => row.key.toLowerCase()),
  )

  const fromCollection: [string, string][] = inherited.headers
    .filter((row) => row.enabled && row.key.trim() !== '')
    .map((row) => [interpolate(row.key, scope), interpolate(row.value, scope)])

  const fromAuth = authHeaderEntries(effectiveAuth(tab.request, inherited), scope)

  const rows = [...fromCollection, ...fromAuth].filter(
    ([key]) => !own.has(key.toLowerCase()),
  )

  if (rows.length === 0) return null

  return (
    <div className="border-b border-border bg-muted/40">
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        <Lock className="size-3 text-muted-foreground" />
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          To'plamdan meros
        </span>
      </div>

      {rows.map(([key, value]) => (
        <div
          key={key}
          className="grid grid-cols-[32px_1fr_1fr_32px] items-center gap-2 px-3 py-1"
          title="To'plam sozlamalaridan keladi — bu yerda tahrirlanmaydi"
        >
          <span />
          <span className="truncate font-mono text-xs text-muted-foreground">{key}</span>
          <span className="truncate font-mono text-xs text-muted-foreground">{value}</span>
          <span />
        </div>
      ))}
    </div>
  )
}
