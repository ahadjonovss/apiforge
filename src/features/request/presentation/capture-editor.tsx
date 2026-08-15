import { ArrowRight, Plus, Trash2 } from 'lucide-react'
import { newId } from '@/core/lib/id'
import { Button } from '@/shared/ui/button'
import { useTabsStore, type Tab } from '@/features/tabs'
import type { CaptureRule } from '../domain/request'
import { useT } from '@/app/providers/i18n-provider'

export function CaptureEditor({ tab }: { tab: Tab }) {
  const t = useT()
  const patchRequest = useTabsStore((state) => state.patchRequest)
  const rules = tab.request.captures ?? []

  const setRules = (next: CaptureRule[]) => patchRequest(tab.id, { captures: next })

  const update = (id: string, patch: Partial<CaptureRule>) =>
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)))

  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <h3 className="text-xs font-semibold">{t('capture.title')}</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {t('capture.hint')}
        </p>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-4 text-center">
          <p className="text-[11px] text-muted-foreground">{t('capture.example')}</p>
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
                aria-label={t('common.add')}
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
                aria-label={t('common.delete')}
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
          {t('capture.addRule')}
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">{t('capture.pathHint')}</p>
    </div>
  )
}
