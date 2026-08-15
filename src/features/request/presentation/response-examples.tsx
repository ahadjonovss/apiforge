import { useState } from 'react'
import { AlertTriangle, BookOpen, Check, Pencil, Plus, Save, Wand2, X } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { newId } from '@/core/lib/id'
import { JsonEditor } from '@/shared/ui/json-editor'
import { useTabsStore, type Tab } from '@/features/tabs'
import type { ResponseDoc } from '../domain/request'
import type { ResponseResult } from '../domain/response'
import {
  formatJson,
  hasExampleData,
  isJson,
  pruneEmptyExample,
  stripFence,
  visibleExamples,
} from '../application/response-examples'
import { statusTone } from './status-tone'
import { useT } from '@/app/providers/i18n-provider'

function toExample(response: ResponseResult): string {
  const body = response.body.trim()
  return body ? formatJson(body) : ''
}

export function ResponseExamples({ tab }: { tab: Tab }) {
  const t = useT()
  const patchRequest = useTabsStore((state) => state.patchRequest)
  const [openId, setOpenId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const docs = tab.request.responseDocs ?? []
  const response = tab.response
  const current = response ? String(response.status) : null

  const setDocs = (next: ResponseDoc[]) => patchRequest(tab.id, { responseDocs: next })
  const patchDoc = (id: string, patch: Partial<ResponseDoc>) =>
    setDocs(docs.map((doc) => (doc.id === id ? { ...doc, ...patch } : doc)))

  const shown = visibleExamples(docs, openId)
  const discardIfEmpty = (id: string) => setDocs(pruneEmptyExample(docs, id))
  const open = openId ? (docs.find((doc) => doc.id === openId) ?? null) : null
  const openBody = open ? stripFence(open.body) : ''

  const close = () => {
    if (openId) discardIfEmpty(openId)
    setOpenId(null)
    setEditing(false)
  }

  const add = (status: string, body = '', title = '') => {
    const existing = docs.find((doc) => doc.status === status)
    if (existing) {
      if (body) patchDoc(existing.id, { body })
      setOpenId(existing.id)
      setEditing(!body && !hasExampleData(existing))
      return
    }

    const created: ResponseDoc = { id: newId(), status, title, body }
    setDocs([...docs, created])
    setOpenId(created.id)
    setEditing(!body)
  }

  return (
    <div className="border-b border-border">
      <div className="flex flex-wrap items-center gap-1 px-3 py-1.5">
        <BookOpen className="size-3 shrink-0 text-muted-foreground" />
        <span className="mr-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          {t('response.examples')}
        </span>

        {shown.length === 0 && (
          <span className="mr-1 text-[11px] text-muted-foreground/70">{t('response.examplesEmpty')}</span>
        )}

        {shown.map((doc) => {
          const isOpen = doc.id === openId
          return (
            <button
              key={doc.id}
              type="button"
              title={doc.title || `${doc.status} misoli`}
              onClick={() => {
                if (isOpen) {
                  close()
                  return
                }
                if (openId) discardIfEmpty(openId)
                setOpenId(doc.id)
                setEditing(!hasExampleData(doc))
              }}
              className={cn(
                'rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold transition',
                statusTone(doc.status),
                isOpen
                  ? 'border-primary bg-accent'
                  : current === doc.status
                    ? 'border-primary/60'
                    : 'border-border hover:border-primary/60',
              )}
            >
              {doc.status}
            </button>
          )
        })}

        <button
          type="button"
          aria-label={t('response.addExample')}
          onClick={() => {
            const status = window.prompt(t('response.statusPrompt'))?.trim()
            if (status) add(status)
          }}
          className="rounded border border-dashed border-border px-1.5 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
        >
          <Plus className="size-3" />
        </button>

        {response && current && (
          <button
            type="button"
            onClick={() => add(current, toExample(response), response.statusText || '')}
            title={t('response.saveAsTitle', { status: current })}
            className="ml-auto flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary hover:text-foreground"
          >
            <Save className="size-3" />
            {t('response.saveAs', { status: current })}
          </button>
        )}
      </div>

      {open && (
        <div className="border-t border-border bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className={cn('font-mono text-xs font-bold', statusTone(open.status))}>
                {open.status}
              </span>
              {editing ? (
                <input
                  value={open.title}
                  onChange={(event) => patchDoc(open.id, { title: event.target.value })}
                  placeholder={t('response.exampleTitle')}
                  className="min-w-0 flex-1 rounded border border-border bg-card px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                />
              ) : (
                open.title && <span className="truncate text-xs font-medium">{open.title}</span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {editing && openBody.trim() !== '' && (
                <button
                  type="button"
                  onClick={() => patchDoc(open.id, { body: formatJson(openBody) })}
                  title={t('response.formatJson')}
                  className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  <Wand2 className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditing(!editing)}
                aria-label={editing ? t('common.done') : t('common.edit')}
                className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                {editing ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
              </button>
              <button
                type="button"
                onClick={close}
                aria-label={t('common.close')}
                className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {editing ? (
            <>
              <JsonEditor
                value={openBody}
                onChange={(value) => patchDoc(open.id, { body: value })}
                placeholder={'{\n  "access_token": "…"\n}'}
              />
              {openBody.trim() !== '' && !isJson(openBody) && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-status-redirect">
                  <AlertTriangle className="size-3" />
                  {t('response.brokenJson')}
                </p>
              )}
            </>
          ) : openBody.trim() ? (
            <JsonEditor value={openBody} readOnly />
          ) : (
            <p className="text-xs text-muted-foreground">
              {t('response.exampleEmpty')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
