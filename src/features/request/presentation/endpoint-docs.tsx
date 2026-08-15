import { useEffect, useState } from 'react'
import { Check, FileText, Pencil } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Markdown } from '@/shared/ui/markdown'
import { MarkdownEditor } from '@/shared/ui/markdown-editor'
import { MethodBadge } from '@/shared/ui/method-badge'
import { JsonEditor } from '@/shared/ui/json-editor'
import { useTabsStore, type Tab } from '@/features/tabs'
import { interpolate } from '../application/interpolate'
import { stripFence } from '../application/response-examples'
import { statusTone } from './status-tone'
import { useT } from '@/app/providers/i18n-provider'

const TEMPLATE = `## Nima qiladi

…

## So'rov

| Maydon | Turi | Majburiy | Izoh |
| --- | --- | --- | --- |
| phone | string | ha | Foydalanuvchi raqami |

## Eslatmalar

-
`

export function EndpointDocs({ tab }: { tab: Tab }) {
  const t = useT()
  const patchRequest = useTabsStore((state) => state.patchRequest)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(tab.request.docs)

  useEffect(() => {
    setDraft(tab.request.docs)
    setEditing(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab.id])

  const scope = tab.inherited?.variables ?? {}
  const base = interpolate(tab.inherited?.baseUrl ?? '', scope)
  const path = interpolate(tab.request.url, scope)
  const examples = tab.request.responseDocs ?? []

  const commit = () => {
    patchRequest(tab.id, { docs: draft })
    setEditing(false)
  }

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-5 p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{tab.request.name}</h1>
            <p className="mt-1 flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <MethodBadge method={tab.request.method} />
              <span className="truncate">{`${base}${path}` || t('docs.noUrl')}</span>
            </p>
          </div>

          {editing ? (
            <Button size="sm" onClick={commit}>
              <Check className="size-3.5" />
              {t('common.done')}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" />
              {t('common.edit')}
            </Button>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-2">
            <MarkdownEditor value={draft} onChange={setDraft} minHeight="360px" />
            {!draft.trim() && (
              <button
                type="button"
                onClick={() => setDraft(TEMPLATE)}
                className="w-fit text-[11px] text-primary hover:underline"
              >
                {t('collection.template')}
              </button>
            )}
          </div>
        ) : tab.request.docs.trim() ? (
          <Markdown source={tab.request.docs} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-10 text-center">
            <FileText className="size-7 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium">{t('docs.endpointEmpty')}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('docs.endpointEmptyHint')}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" />
              {t('collection.startWriting')}
            </Button>
          </div>
        )}

        {examples.length > 0 && (
          <section className="flex flex-col gap-3 border-t border-border pt-5">
            <h2 className="text-sm font-semibold">{t('docs.examplesSection')}</h2>
            {examples
              .slice()
              .sort((a, b) => a.status.localeCompare(b.status))
              .map((doc) => (
                <div key={doc.id} className="rounded-lg border border-border p-4">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold">
                    <span className={`font-mono ${statusTone(doc.status)}`}>{doc.status}</span>
                    {doc.title && <span>{doc.title}</span>}
                  </p>
                  {stripFence(doc.body).trim() ? (
                    <JsonEditor value={stripFence(doc.body)} readOnly minHeight="80px" />
                  ) : (
                    <p className="text-xs text-muted-foreground">{t('docs.exampleEmpty')}</p>
                  )}
                </div>
              ))}
          </section>
        )}
      </div>
    </div>
  )
}
