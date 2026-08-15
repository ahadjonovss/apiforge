import { Plus, Trash2 } from 'lucide-react'
import { newId } from '@/core/lib/id'
import { Button } from '@/shared/ui/button'
import { MarkdownEditor } from '@/shared/ui/markdown-editor'
import { useTabsStore, type Tab } from '@/features/tabs'
import type { ResponseDoc } from '../domain/request'
import { statusTone } from './status-tone'

const SUGGESTED = ['200', '201', '400', '401', '403', '404', '422', '500']

export function DocsEditor({ tab }: { tab: Tab }) {
  const patchRequest = useTabsStore((state) => state.patchRequest)
  const { docs, responseDocs } = tab.request

  const setResponseDocs = (next: ResponseDoc[]) => patchRequest(tab.id, { responseDocs: next })

  const add = (status: string) => {
    if (responseDocs.some((doc) => doc.status === status)) return
    setResponseDocs([
      ...responseDocs,
      { id: newId(), status, title: '', body: '' },
    ])
  }

  const update = (id: string, patch: Partial<ResponseDoc>) =>
    setResponseDocs(responseDocs.map((doc) => (doc.id === id ? { ...doc, ...patch } : doc)))

  const used = new Set(responseDocs.map((doc) => doc.status))

  return (
    <div className="flex flex-col gap-5 p-4">
      <section>
        <h3 className="mb-1 text-xs font-semibold">Endpoint hujjati</h3>
        <p className="mb-2 text-[11px] text-muted-foreground">
          Bu so'rov nima qilishi, qanday parametr kutishi va nimaga e'tibor berish kerakligi
        </p>
        <MarkdownEditor
          value={docs}
          onChange={(value) => patchRequest(tab.id, { docs: value })}
          placeholder={'## Nima qiladi\n\n…'}
        />
      </section>

      <section>
        <h3 className="mb-1 text-xs font-semibold">Javob hujjatlari</h3>
        <p className="mb-2 text-[11px] text-muted-foreground">
          Har bir status kod uchun alohida izoh. Javob panelining tepasida ko'rinadi.
        </p>

        <div className="mb-3 flex flex-wrap items-center gap-1">
          {SUGGESTED.filter((status) => !used.has(status)).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => add(status)}
              className="rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground transition hover:border-primary hover:text-foreground"
            >
              + {status}
            </button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const next = String(Math.max(200, ...responseDocs.map((d) => Number(d.status) || 0)) + 1)
              add(used.has(next) ? `${next}x` : next)
            }}
          >
            <Plus className="size-3" />
            Boshqa
          </Button>
        </div>

        {responseDocs.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-center text-[11px] text-muted-foreground">
            Hali javob hujjati yo'q — yuqoridagi status kodlardan birini qo'shing
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {responseDocs
              .slice()
              .sort((a, b) => a.status.localeCompare(b.status))
              .map((doc) => (
                <div key={doc.id} className="rounded-md border border-border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      value={doc.status}
                      onChange={(event) => update(doc.id, { status: event.target.value })}
                      className={`w-16 rounded border border-border bg-card px-1.5 py-1 text-center font-mono text-xs font-bold outline-none focus:ring-1 focus:ring-ring ${statusTone(doc.status)}`}
                    />
                    <input
                      value={doc.title}
                      onChange={(event) => update(doc.id, { title: event.target.value })}
                      placeholder="Sarlavha, masalan: Muvaffaqiyatli"
                      className="flex-1 rounded border border-border bg-card px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setResponseDocs(responseDocs.filter((item) => item.id !== doc.id))
                      }
                      aria-label="O'chirish"
                      className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <MarkdownEditor
                    value={doc.body}
                    onChange={(value) => update(doc.id, { body: value })}
                    minHeight="140px"
                    placeholder={'Qachon qaytadi, javob tuzilishi, xato kodlari…'}
                  />
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  )
}
