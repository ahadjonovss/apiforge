import { useState } from 'react'
import { Eye, Layers, Settings2 } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { useT } from '@/app/providers/i18n-provider'
import { toScope } from '../application/scope'
import { EnvironmentModal } from './environment-modal'
import { useEnvironmentsStore } from './environments-store'

export function EnvironmentSelector({ workspaceId }: { workspaceId: string }) {
  const t = useT()
  const environments = useEnvironmentsStore((state) => state.environments)
  const activeId = useEnvironmentsStore((state) => state.activeId)
  const activate = useEnvironmentsStore((state) => state.activate)

  const [manageOpen, setManageOpen] = useState(false)
  const [peekOpen, setPeekOpen] = useState(false)

  const active = environments.find((item) => item.id === activeId) ?? null
  const scope = active ? toScope(active.variables) : {}
  const entries = Object.entries(scope)

  return (
    <div className="relative flex items-center gap-1">
      <Layers className="size-3.5 shrink-0 text-muted-foreground" />

      <select
        value={activeId ?? ''}
        onChange={(event) => activate(event.target.value || null)}
        className={cn(
          'min-w-0 flex-1 truncate rounded-md border border-border bg-card px-2 py-1 text-xs outline-none transition focus:ring-1 focus:ring-ring',
          !active && 'text-muted-foreground',
        )}
        aria-label={t('environment.active')}
      >
        <option value="">{t('environment.none')}</option>
        {environments.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setPeekOpen((open) => !open)}
        aria-label={t('environment.peek')}
        title={t('environment.peek')}
        className={cn(
          'rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground',
          peekOpen && 'bg-accent text-foreground',
        )}
      >
        <Eye className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setManageOpen(true)}
        aria-label={t('environment.manage')}
        title={t('environment.manage')}
        className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        <Settings2 className="size-3.5" />
      </button>

      {peekOpen && (
        <>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => setPeekOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute top-full right-0 z-50 mt-1 max-h-72 w-72 overflow-auto rounded-md border border-border bg-popover p-2 shadow-lg">
            <p className="mb-1 px-1 text-[11px] font-medium text-muted-foreground">
              {active ? active.name : t('environment.none')}
            </p>
            {entries.length === 0 ? (
              <p className="px-1 py-2 text-[11px] text-muted-foreground">
                {t('environment.noVariables')}
              </p>
            ) : (
              entries.map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 gap-2 px-1 py-0.5">
                  <span className="truncate font-mono text-[11px] text-foreground">{key}</span>
                  <span className="truncate font-mono text-[11px] text-muted-foreground">
                    {value || t('environment.emptyValue')}
                  </span>
                </div>
              ))
            )}
            <button
              type="button"
              onClick={() => {
                setPeekOpen(false)
                setManageOpen(true)
              }}
              className="mt-1 w-full rounded px-1 py-1 text-left text-[11px] text-primary hover:bg-accent"
            >
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
