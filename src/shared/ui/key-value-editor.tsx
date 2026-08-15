import { Trash2 } from 'lucide-react'
import type { KeyValue } from '@/core/domain/http'
import { emptyKeyValue } from '@/core/lib/key-value'
import { useT } from '@/app/providers/i18n-provider'

interface Props {
  rows: KeyValue[]
  onChange: (rows: KeyValue[]) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
}

export function KeyValueEditor({
  rows,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
}: Props) {
  const t = useT()
  const keyLabel = keyPlaceholder ?? t('kv.key')
  const valueLabel = valuePlaceholder ?? t('kv.value')
  const withTrailingRow = rows.length === 0 ? [emptyKeyValue()] : rows

  const update = (id: string, patch: Partial<KeyValue>) => {
    const next = withTrailingRow.map((row) => (row.id === id ? { ...row, ...patch } : row))
    const last = next[next.length - 1]
    if (last && (last.key.trim() || last.value.trim())) next.push(emptyKeyValue())
    onChange(next)
  }

  const remove = (id: string) => onChange(withTrailingRow.filter((row) => row.id !== id))

  return (
    <div className="divide-y divide-border">
      <div className="grid grid-cols-[32px_1fr_1fr_32px] items-center gap-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span />
        <span>{keyLabel}</span>
        <span>{valueLabel}</span>
        <span />
      </div>

      {withTrailingRow.map((row) => (
        <div
          key={row.id}
          className="group grid grid-cols-[32px_1fr_1fr_32px] items-center gap-2 px-3 py-1"
        >
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(event) => update(row.id, { enabled: event.target.checked })}
            className="mx-auto size-3.5 accent-primary"
          />
          <input
            value={row.key}
            onChange={(event) => update(row.id, { key: event.target.value })}
            placeholder={keyLabel}
            spellCheck={false}
            className="bg-transparent py-1 font-mono text-xs outline-none placeholder:text-muted-foreground/60"
          />
          <input
            value={row.value}
            onChange={(event) => update(row.id, { value: event.target.value })}
            placeholder={valueLabel}
            spellCheck={false}
            className="bg-transparent py-1 font-mono text-xs outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="button"
            onClick={() => remove(row.id)}
            className="mx-auto rounded p-1 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-destructive group-hover:opacity-100"
            aria-label={t('common.delete')}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
