import { useState } from 'react'
import { BookOpen, Check, Pencil, Plus, Save, X } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { newId } from '@/core/lib/id'
import { Markdown } from '@/shared/ui/markdown'
import { MarkdownEditor } from '@/shared/ui/markdown-editor'
import { useTabsStore, type Tab } from '@/features/tabs'
import type { ResponseDoc } from '../domain/request'
import type { ResponseResult } from '../domain/response'
import { statusTone } from './status-tone'

function fence(response: ResponseResult): string {
  const body = response.body.trim()
  if (!body) return '_Bo‘sh javob_'

  const isJson = response.contentType?.includes('json') ?? false
  if (!isJson) return ['```', body, '```'].join('\n')

  try {
    return ['```json', JSON.stringify(JSON.parse(body), null, 2), '```'].join('\n')
  } catch {
    return ['```', body, '```'].join('\n')
  }
}

export function ResponseExamples({ tab }: { tab: Tab }) {
  const patchRequest = useTabsStore((state) => state.patchRequest)
  const [openId, setOpenId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const docs = tab.request.responseDocs ?? []
  const response = tab.response
  const current = response ? String(response.status) : null

  const setDocs = (next: ResponseDoc[]) => patchRequest(tab.id, { responseDocs: next })

  const shown = docs
    .map((doc) => doc.status)
    .sort((a, b) => a.localeCompare(b))

  const byStatus = (status: string) => docs.find((doc) => doc.status === status)
  const open = openId ? (docs.find((doc) => doc.id === openId) ?? null) : null

  const ensure = (status: string): ResponseDoc => {
    const found = byStatus(status)
    if (found) return found
    const created: ResponseDoc = { id: newId(), status, title: '', body: '' }
    setDocs([...docs, created])
    return created
  }

  const saveCurrent = () => {
    if (!response || !current) return
    const existing = byStatus(current)
    const body = fence(response)

    if (existing) {
      setDocs(docs.map((doc) => (doc.id === existing.id ? { ...doc, body } : doc)))
      setOpenId(existing.id)
    } else {
      const created: ResponseDoc = {
        id: newId(),
        status: current,
        title: response.statusText || '',
        body,
      }
      setDocs([...docs, created])
      setOpenId(created.id)
    }
    setEditing(false)
  }

  return (
    <div className="border-b border-border">
      <div className="flex flex-wrap items-center gap-1 px-3 py-1.5">
        <BookOpen className="size-3 shrink-0 text-muted-foreground" />
        <span className="mr-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          Javob misollari
        </span>

        {shown.length === 0 && (
          <span className="mr-1 text-[11px] text-muted-foreground/70">hali yo'q</span>
        )}

        {shown.map((status) => {
          const doc = byStatus(status)
          const isOpen = doc ? doc.id === openId : false
          return (
            <button
              key={status}
              type="button"
              title={
                doc
                  ? doc.title || `${status} misoli`
                  : `${status} uchun misol qo'shish`
              }
              onClick={() => {
                const target = doc ?? ensure(status)
                setOpenId(openId === target.id ? null : target.id)
                setEditing(!doc)
              }}
              className={cn(
                'rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold transition',
                doc ? statusTone(status) : 'text-muted-foreground/50',
                isOpen
                  ? 'border-primary bg-accent'
                  : current === status
                    ? 'border-primary/60'
                    : doc
                      ? 'border-border hover:border-primary/60'
                      : 'border-dashed border-border hover:border-primary/60',
              )}
            >
              {status}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => {
            const status = window.prompt('Status kod (masalan 409 yoki 4xx)')?.trim()
            if (!status) return
            const target = ensure(status)
            setOpenId(target.id)
            setEditing(true)
          }}
          className="rounded border border-dashed border-border px-1.5 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
        >
          <Plus className="size-3" />
        </button>

        {response && (
          <button
            type="button"
            onClick={saveCurrent}
            title={`Hozirgi javobni ${current} misoli sifatida saqlash`}
            className="ml-auto flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary hover:text-foreground"
          >
            <Save className="size-3" />
            Javobni {current} ga saqlash
          </button>
        )}
      </div>

      {open && (
        <div className="border-t border-border bg-muted/30 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn('font-mono text-xs font-bold', statusTone(open.status))}>
                {open.status}
              </span>
              {editing ? (
                <input
                  value={open.title}
                  onChange={(event) =>
                    setDocs(
                      docs.map((doc) =>
                        doc.id === open.id ? { ...doc, title: event.target.value } : doc,
                      ),
                    )
                  }
                  placeholder="Sarlavha"
                  className="min-w-0 flex-1 rounded border border-border bg-card px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                />
              ) : (
                open.title && <span className="truncate text-xs font-medium">{open.title}</span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setEditing(!editing)}
                aria-label={editing ? 'Tayyor' : 'Tahrirlash'}
                className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                {editing ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenId(null)
                  setEditing(false)
                }}
                aria-label="Yopish"
                className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {editing ? (
            <MarkdownEditor
              value={open.body}
              minHeight="160px"
              onChange={(value) =>
                setDocs(docs.map((doc) => (doc.id === open.id ? { ...doc, body: value } : doc)))
              }
              placeholder="Qachon qaytadi, javob tuzilishi, xato sabablari…"
            />
          ) : open.body.trim() ? (
            <Markdown source={open.body} />
          ) : (
            <p className="text-xs text-muted-foreground">
              Hali yozilmagan — qalam belgisini bosing yoki javob kelganda «Javobni saqlash»
              tugmasidan foydalaning
            </p>
          )}
        </div>
      )}
    </div>
  )
}
