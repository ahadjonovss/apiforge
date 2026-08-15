import { ArrowRight, Plus, Trash2 } from 'lucide-react'
import { newId } from '@/core/lib/id'
import { Button } from '@/shared/ui/button'
import { useTabsStore, type Tab } from '@/features/tabs'
import type { CaptureRule } from '../domain/request'

export function CaptureEditor({ tab }: { tab: Tab }) {
  const patchRequest = useTabsStore((state) => state.patchRequest)
  const rules = tab.request.captures ?? []

  const setRules = (next: CaptureRule[]) => patchRequest(tab.id, { captures: next })

  const update = (id: string, patch: Partial<CaptureRule>) =>
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)))

  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <h3 className="text-xs font-semibold">Javobdan o'zgaruvchiga olish</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          So'rov muvaffaqiyatli o'tgach, javobdan qiymat olinib to'plam o'zgaruvchisiga
          yoziladi. Postman'dagi test skriptining o'rnini bosadi.
        </p>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-4 text-center">
          <p className="text-[11px] text-muted-foreground">
            Masalan: login javobidagi <code className="font-mono">access_token</code> ni{' '}
            <code className="font-mono">authorizationToken</code> ga yozish
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2"
            >
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={(event) => update(rule.id, { enabled: event.target.checked })}
                className="size-3.5 accent-primary"
                aria-label="Yoqish"
              />

              <select
                value={rule.source}
                onChange={(event) =>
                  update(rule.id, { source: event.target.value as CaptureRule['source'] })
                }
                className="rounded border border-border bg-card px-1.5 py-1 text-[11px] outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="body">Body</option>
                <option value="header">Header</option>
              </select>

              <input
                value={rule.path}
                onChange={(event) => update(rule.id, { path: event.target.value })}
                placeholder={rule.source === 'body' ? 'access_token' : 'X-Token'}
                spellCheck={false}
                className="min-w-0 flex-1 rounded border border-border bg-card px-2 py-1 font-mono text-[11px] outline-none focus:ring-1 focus:ring-ring"
              />

              <ArrowRight className="size-3 shrink-0 text-muted-foreground" />

              <input
                value={rule.target}
                onChange={(event) => update(rule.id, { target: event.target.value })}
                placeholder="authorizationToken"
                spellCheck={false}
                className="min-w-0 flex-1 rounded border border-border bg-card px-2 py-1 font-mono text-[11px] outline-none focus:ring-1 focus:ring-ring"
              />

              <button
                type="button"
                onClick={() => setRules(rules.filter((item) => item.id !== rule.id))}
                aria-label="O'chirish"
                className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            setRules([
              ...rules,
              { id: newId(), source: 'body', path: '', target: '', enabled: true },
            ])
          }
        >
          <Plus className="size-3.5" />
          Qoida qo'shish
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Ichma-ich maydon uchun nuqta ishlating:{' '}
        <code className="font-mono">data.tokens.0.access</code>
      </p>
    </div>
  )
}
