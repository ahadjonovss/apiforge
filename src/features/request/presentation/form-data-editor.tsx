import { useRef } from 'react'
import { Paperclip, Trash2, X } from 'lucide-react'
import { newId } from '@/core/lib/id'
import { useT } from '@/app/providers/i18n-provider'
import { useTabsStore, type Tab } from '@/features/tabs'
import type { FormField } from '../domain/request'

function emptyField(): FormField {
  return { id: newId(), key: '', value: '', enabled: true, type: 'text' }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function FileCell({ tab, field }: { tab: Tab; field: FormField }) {
  const t = useT()
  const setFile = useTabsStore((state) => state.setFile)
  const patchRequest = useTabsStore((state) => state.patchRequest)
  const input = useRef<HTMLInputElement>(null)

  const file = tab.files[field.id]
  const rows = tab.request.body.formData ?? []

  const update = (patch: Partial<FormField>) =>
    patchRequest(tab.id, {
      body: {
        ...tab.request.body,
        formData: rows.map((row) => (row.id === field.id ? { ...row, ...patch } : row)),
      },
    })

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <input
        ref={input}
        type="file"
        className="hidden"
        onChange={(event) => {
          const picked = event.target.files?.[0]
          if (!picked) return
          setFile(tab.id, field.id, picked)
          update({ fileName: picked.name })
          event.target.value = ''
        }}
      />

      <button
        type="button"
        onClick={() => input.current?.click()}
        className="flex min-w-0 items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary hover:text-foreground"
      >
        <Paperclip className="size-3 shrink-0" />
        <span className="truncate">
          {file ? `${file.name} · ${formatSize(file.size)}` : (field.fileName ?? t('body.pickFile'))}
        </span>
      </button>

      {(file || field.fileName) && (
        <button
          type="button"
          aria-label={t('common.delete')}
          onClick={() => {
            setFile(tab.id, field.id, null)
            update({ fileName: undefined })
          }}
          className="rounded p-0.5 text-muted-foreground transition hover:text-destructive"
        >
          <X className="size-3" />
        </button>
      )}

      {!file && field.fileName && (
        <span className="shrink-0 text-[10px] text-status-redirect">{t('body.reselect')}</span>
      )}
    </div>
  )
}

export function FormDataEditor({ tab }: { tab: Tab }) {
  const t = useT()
  const patchRequest = useTabsStore((state) => state.patchRequest)
  const setFile = useTabsStore((state) => state.setFile)

  const stored = tab.request.body.formData ?? []
  const rows = stored.length === 0 ? [emptyField()] : stored

  const commit = (next: FormField[]) =>
    patchRequest(tab.id, { body: { ...tab.request.body, formData: next } })

  const update = (id: string, patch: Partial<FormField>) => {
    const next = rows.map((row) => (row.id === id ? { ...row, ...patch } : row))
    const last = next[next.length - 1]
    if (last && (last.key.trim() || last.value.trim())) next.push(emptyField())
    commit(next)
  }

  return (
    <div>
      <p className="border-b border-border px-3 py-1.5 text-[11px] text-muted-foreground">
        {t('body.fileHint')}
      </p>

      <div className="divide-y divide-border">
        <div className="grid grid-cols-[32px_1fr_80px_1fr_32px] items-center gap-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <span />
          <span>{t('kv.key')}</span>
          <span>{t('body.type')}</span>
          <span>{t('kv.value')}</span>
          <span />
        </div>

        {rows.map((row) => (
          <div
            key={row.id}
            className="group grid grid-cols-[32px_1fr_80px_1fr_32px] items-center gap-2 px-3 py-1"
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
              placeholder={t('kv.key')}
              spellCheck={false}
              className="bg-transparent py-1 font-mono text-xs outline-none placeholder:text-muted-foreground/60"
            />

            <select
              value={row.type}
              onChange={(event) => {
                const type = event.target.value as FormField['type']
                if (type === 'text') setFile(tab.id, row.id, null)
                update(row.id, { type, value: '', fileName: undefined })
              }}
              className="rounded border border-border bg-card px-1 py-0.5 text-[11px] outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="text">{t('body.text')}</option>
              <option value="file">{t('body.file')}</option>
            </select>

            {row.type === 'file' ? (
              <FileCell tab={tab} field={row} />
            ) : (
              <input
                value={row.value}
                onChange={(event) => update(row.id, { value: event.target.value })}
                placeholder={t('kv.value')}
                spellCheck={false}
                className="bg-transparent py-1 font-mono text-xs outline-none placeholder:text-muted-foreground/60"
              />
            )}

            <button
              type="button"
              onClick={() => {
                setFile(tab.id, row.id, null)
                commit(rows.filter((item) => item.id !== row.id))
              }}
              aria-label={t('common.delete')}
              className="mx-auto rounded p-1 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-destructive group-hover:opacity-100"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
