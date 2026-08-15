import { AlertTriangle, Variable } from 'lucide-react'
import type { Tab } from '@/features/tabs'

export function CaptureNote({
  tab,
  misses,
}: {
  tab: Tab
  misses: { target: string; reason: string }[]
}) {
  const rules = (tab.request.captures ?? []).filter((rule) => rule.enabled)
  if (rules.length === 0) return null

  const saved = rules
    .map((rule) => rule.target.trim())
    .filter((target) => target !== '' && !misses.some((miss) => miss.target === target))

  return (
    <div className="flex flex-col gap-1 border-b border-border px-3 py-1.5">
      {saved.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Variable className="size-3 shrink-0 text-status-success" />
          <span className="text-[11px] text-muted-foreground">O'zgaruvchiga yozildi:</span>
          {saved.map((target) => (
            <code
              key={target}
              className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-foreground"
            >
              {target}
            </code>
          ))}
        </div>
      )}

      {misses.map((miss) => (
        <div key={miss.target} className="flex items-start gap-1.5">
          <AlertTriangle className="mt-px size-3 shrink-0 text-status-redirect" />
          <span className="text-[11px] text-status-redirect">
            <code className="font-mono">{miss.target}</code> olinmadi — {miss.reason}
          </span>
        </div>
      ))}
    </div>
  )
}
