import { AlertTriangle, BookOpen, Plus, Save, Trash2, Wand2 } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { newId } from '@/core/lib/id'
import { Button } from '@/shared/ui/button'
import { JsonEditor } from '@/shared/ui/json-editor'
import { useConfirm } from '@/shared/ui/confirm-dialog'
import { useTabsStore, type Tab } from '@/features/tabs'
import type { ResponseDoc } from '../domain/request'
import { formatJson, isJson, stripFence } from '../application/response-examples'
import { statusTone } from './status-tone'
import { useT } from '@/app/providers/i18n-provider'

function nextStatus(docs: ResponseDoc[]): string {
  const taken = new Set(docs.map((doc) => doc.status.trim()))
  return ['200', '400', '401', '404', '500'].find((status) => !taken.has(status)) ?? ''
}

export function EndpointResponses({ tab }: { tab: Tab }) {
  const t = useT()
  const { ask, dialog } = useConfirm()
  const patchRequest = useTabsStore((state) => state.patchRequest)

  const docs = tab.request.responseDocs ?? []
  const response = tab.response
  const current = response ? String(response.status) : null

  const setDocs = (next: ResponseDoc[]) => patchRequest(tab.id, { responseDocs: next })
  const patchDoc = (id: string, patch: Partial<ResponseDoc>) =>
    setDocs(docs.map((doc) => (doc.id === id ? { ...doc, ...patch } : doc)))

  const add = (status: string, body = '', title = '') => {
    const existing = docs.find((doc) => doc.status.trim() === status.trim())
    if (existing) {
      if (body) patchDoc(existing.id, { body, title: existing.title || title })
      return
    }
    setDocs([...docs, { id: newId(), status, title, body }])
  }

  const drop = (doc: ResponseDoc) =>
    ask({
      title: t('responses.confirmDelete', { status: doc.status }),
      onConfirm: () => setDocs(docs.filter((item) => item.id !== doc.id)),
    })

  const sorted = docs.slice().sort((a, b) => a.status.localeCompare(b.status))

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold">{t('responses.title')}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('responses.hint')}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {response && current && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  add(current, formatJson(response.body.trim()), response.statusText || '')
                }
              >
                <Save className="size-3.5" />
                {t('response.saveAs', { status: current })}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => add(nextStatus(docs))}>
              <Plus className="size-3.5" />
              {t('responses.add')}
            </Button>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-10 text-center">
            <BookOpen className="size-7 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium">{t('responses.empty')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('responses.emptyHint')}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => add(nextStatus(docs))}>
              <Plus className="size-3.5" />
              {t('responses.add')}
            </Button>
          </div>
        ) : (
          sorted.map((doc) => {
            const body = stripFence(doc.body)
            return (
              <section
                key={doc.id}
                className={cn(
                  'rounded-lg border p-4',
                  current === doc.status.trim() ? 'border-primary/60' : 'border-border',
                )}
              >
                <div className="mb-3 flex items-center gap-2">
                  <input
                    value={doc.status}
                    onChange={(event) => patchDoc(doc.id, { status: event.target.value })}
                    aria-label={t('responses.statusLabel')}
                    placeholder="200"
                    className={cn(
                      'w-16 rounded border border-border bg-card px-2 py-1 text-center font-mono text-xs font-bold outline-none focus:ring-1 focus:ring-ring',
                      statusTone(doc.status),
                    )}
                  />
                  <input
                    value={doc.title}
                    onChange={(event) => patchDoc(doc.id, { title: event.target.value })}
                    placeholder={t('response.exampleTitle')}
                    className="min-w-0 flex-1 rounded border border-border bg-card px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                  />

                  {body.trim() !== '' && (
                    <button
                      type="button"
                      onClick={() => patchDoc(doc.id, { body: formatJson(body) })}
                      title={t('response.formatJson')}
                      aria-label={t('response.formatJson')}
                      className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    >
                      <Wand2 className="size-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => drop(doc)}
                    aria-label={t('common.delete')}
                    className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <JsonEditor
                  value={body}
                  onChange={(value) => patchDoc(doc.id, { body: value })}
                  placeholder={'{\n  "access_token": "…"\n}'}
                  minHeight="100px"
                />

                {body.trim() !== '' && !isJson(body) && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-status-redirect">
                    <AlertTriangle className="size-3" />
                    {t('response.brokenJson')}
                  </p>
                )}
              </section>
            )
          })
        )}
      </div>

      {dialog}
    </div>
  )
}
