import { AlertTriangle, Terminal, Variable } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import type { ScriptOutcome } from '../domain/script'
import { useT } from '@/app/providers/i18n-provider'

const LOG_TONE = {
  log: 'text-muted-foreground',
  warn: 'text-status-redirect',
  error: 'text-destructive',
} as const

export function ScriptNote({ outcome }: { outcome: ScriptOutcome | null }) {
  const t = useT()
  if (!outcome) return null
  if (!outcome.timedOut && !outcome.error && outcome.logs.length === 0 && outcome.variables.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-1 border-b border-border px-3 py-1.5">
      {outcome.variables.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Variable className="size-3 shrink-0 text-status-success" />
          <span className="text-[11px] text-muted-foreground">{t('script.saved')}</span>
          {outcome.variables.map((variable) => (
            <code
              key={variable.key}
              className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-foreground"
            >
              {variable.key}
            </code>
          ))}
        </div>
      )}

      {outcome.logs.map((entry, index) => (
        <div key={`${entry.level}-${index}`} className="flex items-start gap-1.5">
          <Terminal className="mt-px size-3 shrink-0 text-muted-foreground" />
          <span className={cn('font-mono text-[10px] break-all', LOG_TONE[entry.level])}>
            {entry.text}
          </span>
        </div>
      ))}

      {outcome.timedOut && (
        <div className="flex items-start gap-1.5">
          <AlertTriangle className="mt-px size-3 shrink-0 text-destructive" />
          <span className="text-[11px] text-destructive">{t('script.timeout')}</span>
        </div>
      )}

      {outcome.error && (
        <div className="flex items-start gap-1.5">
          <AlertTriangle className="mt-px size-3 shrink-0 text-destructive" />
          <span className="text-[11px] text-destructive">
            {t('script.failed')} <code className="font-mono">{outcome.error}</code>
          </span>
        </div>
      )}
    </div>
  )
}
