import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Layers, Plus, Settings2 } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { useT } from '@/app/providers/i18n-provider'
import { useEnvironmentsStore } from './environments-store'

export function EnvironmentPicker({
  workspaceId,
  onManage,
}: {
  workspaceId: string
  onManage?: () => void
}) {
  const t = useT()
  const environments = useEnvironmentsStore((state) => state.environments)
  const activeId = useEnvironmentsStore((state) => state.activeId)
  const pending = useEnvironmentsStore((state) => state.pending)
  const activate = useEnvironmentsStore((state) => state.activate)
  const createEnvironment = useEnvironmentsStore((state) => state.create)

  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const active = environments.find((item) => item.id === activeId) ?? null

  useEffect(() => {
    if (creating) inputRef.current?.focus()
  }, [creating])

  const close = () => {
    setOpen(false)
    setCreating(false)
    setName('')
  }

  const submit = async () => {
    if (!name.trim()) return
    const created = await createEnvironment(workspaceId, name)
    if (created) close()
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title={t('environment.active')}
        className={cn(
          'flex max-w-44 items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition',
          active
            ? 'border-primary/40 bg-accent text-foreground'
            : 'border-border bg-card text-muted-foreground hover:text-foreground',
        )}
      >
        <Layers className="size-3.5 shrink-0" />
        <span className="truncate">{active ? active.name : t('environment.none')}</span>
        <ChevronDown className="size-3 shrink-0 opacity-60" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={close}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute top-full right-0 z-50 mt-1 w-60 overflow-hidden rounded-md border border-border bg-popover shadow-lg">
            <div className="max-h-64 overflow-auto p-1">
              <button
                type="button"
                onClick={() => {
                  activate(null)
                  close()
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-muted-foreground transition hover:bg-accent"
              >
                <Check className={cn('size-3.5 shrink-0', activeId && 'opacity-0')} />
                <span className="truncate">{t('environment.none')}</span>
              </button>

              {environments.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    activate(item.id)
                    close()
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition hover:bg-accent',
                    item.id === activeId ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <Check
                    className={cn('size-3.5 shrink-0', item.id !== activeId && 'opacity-0')}
                  />
                  <span className="truncate">{item.name}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                    {item.variables.filter((variable) => variable.key.trim()).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="border-t border-border p-1">
              {creating ? (
                <input
                  ref={inputRef}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void submit()
                    if (event.key === 'Escape') {
                      setName('')
                      setCreating(false)
                    }
                  }}
                  onBlur={() => {
                    if (!name.trim()) setCreating(false)
                  }}
                  disabled={pending}
                  placeholder={t('environment.namePlaceholder')}
                  className="w-full rounded border border-border bg-card px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-primary transition hover:bg-accent"
                >
                  <Plus className="size-3.5 shrink-0" />
                  {t('environment.create')}
                </button>
              )}

              {onManage && (
                <button
                  type="button"
                  onClick={() => {
                    close()
                    onManage()
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  <Settings2 className="size-3.5 shrink-0" />
                  {t('environment.manage')}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
