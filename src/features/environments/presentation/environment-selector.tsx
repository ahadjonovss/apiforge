import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Layers, Plus, Settings2 } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { useT } from '@/app/providers/i18n-provider'
import { DataErrorNote } from '@/shared/ui/data-error-note'
import { toScope } from '../application/scope'
import { EnvironmentModal } from './environment-modal'
import { useEnvironmentsStore } from './environments-store'

export function EnvironmentSelector({ workspaceId }: { workspaceId: string }) {
  const t = useT()
  const environments = useEnvironmentsStore((state) => state.environments)
  const activeId = useEnvironmentsStore((state) => state.activeId)
  const loading = useEnvironmentsStore((state) => state.loading)
  const pending = useEnvironmentsStore((state) => state.pending)
  const error = useEnvironmentsStore((state) => state.error)
  const activate = useEnvironmentsStore((state) => state.activate)
  const createEnvironment = useEnvironmentsStore((state) => state.create)
  const clearError = useEnvironmentsStore((state) => state.clearError)

  const [open, setOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const active = environments.find((item) => item.id === activeId) ?? null
  const entries = active ? Object.entries(toScope(active.variables)) : []

  useEffect(() => {
    if (open) return
    setDraft('')
  }, [open])

  const toggle = () => {
    clearError()
    setOpen((value) => !value)
  }

  const pick = (id: string | null) => {
    activate(id)
    setOpen(false)
  }

  const add = async () => {
    const name = draft.trim()
    if (!name || pending) return
    const created = await createEnvironment(workspaceId, name)
    if (!created) return
    setDraft('')
    inputRef.current?.focus()
  }

  const manage = () => {
    setOpen(false)
    setManageOpen(true)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={t('environment.active')}
        title={t('environment.active')}
        className={cn(
          'flex max-w-44 items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs transition hover:bg-accent',
          open && 'bg-accent',
        )}
      >
        <Layers className="size-3.5 shrink-0 text-muted-foreground" />
        <span className={cn('truncate', !active && 'text-muted-foreground')}>
          {active ? active.name : t('environment.none')}
        </span>
        <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="absolute top-full right-0 z-50 mt-1 w-72 rounded-md border border-border bg-popover p-1 shadow-lg">
            <div className="max-h-56 overflow-auto">
              <button
                type="button"
                onClick={() => pick(null)}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition hover:bg-accent',
                  active ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                <Check className={cn('size-3 shrink-0 text-primary', active && 'opacity-0')} />
                <span className="truncate">{t('environment.none')}</span>
              </button>

              {environments.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => pick(item.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition hover:bg-accent',
                    item.id === activeId ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <Check
                    className={cn(
                      'size-3 shrink-0 text-primary',
                      item.id !== activeId && 'opacity-0',
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                    {item.variables.filter((variable) => variable.key.trim()).length}
                  </span>
                </button>
              ))}

              {loading && environments.length === 0 && (
                <p className="px-2 py-2 text-[11px] text-muted-foreground">{t('common.loading')}</p>
              )}
            </div>

            <div className="mt-1 flex items-center gap-1 border-t border-border px-1 pt-1">
              <input
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  void add()
                }}
                placeholder={t('environment.newPlaceholder')}
                spellCheck={false}
                className="min-w-0 flex-1 rounded bg-transparent px-1 py-1 text-xs outline-none placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                onClick={() => void add()}
                disabled={!draft.trim() || pending}
                aria-label={t('environment.create')}
                title={t('environment.create')}
                className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <Plus className="size-3.5" />
              </button>
            </div>

            {error && (
              <div className="px-1 pt-1">
                <DataErrorNote error={error} />
              </div>
            )}

            {active && (
              <div className="mt-1 max-h-40 overflow-auto border-t border-border px-2 pt-1">
                {entries.length === 0 ? (
                  <p className="py-1 text-[11px] text-muted-foreground">
                    {t('environment.noVariables')}
                  </p>
                ) : (
                  entries.map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2 gap-2 py-0.5">
                      <span className="truncate font-mono text-[11px] text-foreground">{key}</span>
                      <span className="truncate font-mono text-[11px] text-muted-foreground">
                        {value || t('environment.emptyValue')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            <button
              type="button"
              onClick={manage}
              className="mt-1 flex w-full items-center gap-1.5 rounded border-t border-border px-2 py-1.5 text-left text-[11px] text-primary transition hover:bg-accent"
            >
              <Settings2 className="size-3" />
              {t('environment.manage')}
            </button>
          </div>
        </>
      )}

      <EnvironmentModal
        open={manageOpen}
        workspaceId={workspaceId}
        onClose={() => setManageOpen(false)}
      />
    </div>
  )
}
