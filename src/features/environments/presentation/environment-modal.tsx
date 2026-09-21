import { useEffect, useMemo, useState } from 'react'
import { Layers, Plus, Trash2 } from 'lucide-react'
import type { KeyValue } from '@/core/domain/http'
import { cn } from '@/core/lib/cn'
import { useT } from '@/app/providers/i18n-provider'
import { Button } from '@/shared/ui/button'
import { DataErrorNote } from '@/shared/ui/data-error-note'
import { KeyValueEditor } from '@/shared/ui/key-value-editor'
import { Modal } from '@/shared/ui/modal'
import { TextField } from '@/shared/ui/text-field'
import { useConfirm } from '@/shared/ui/confirm-dialog'
import type { EnvVariable } from '../domain/environment'
import { useEnvironmentsStore } from './environments-store'

function toRows(variables: EnvVariable[]): KeyValue[] {
  return variables.map((variable) => ({
    id: variable.id,
    key: variable.key,
    value: variable.value,
    enabled: variable.enabled,
  }))
}

function toVariables(rows: KeyValue[], previous: EnvVariable[]): EnvVariable[] {
  return rows
    .filter((row) => row.key.trim() !== '' || row.value.trim() !== '')
    .map((row) => ({
      id: row.id,
      key: row.key,
      value: row.value,
      enabled: row.enabled,
      secret: previous.find((variable) => variable.id === row.id)?.secret ?? false,
    }))
}

export function EnvironmentModal({
  open,
  workspaceId,
  onClose,
}: {
  open: boolean
  workspaceId: string
  onClose: () => void
}) {
  const t = useT()
  const { ask, dialog } = useConfirm()
  const environments = useEnvironmentsStore((state) => state.environments)
  const activeId = useEnvironmentsStore((state) => state.activeId)
  const pending = useEnvironmentsStore((state) => state.pending)
  const error = useEnvironmentsStore((state) => state.error)
  const createEnvironment = useEnvironmentsStore((state) => state.create)
  const renameEnvironment = useEnvironmentsStore((state) => state.rename)
  const saveVariables = useEnvironmentsStore((state) => state.saveVariables)
  const removeEnvironment = useEnvironmentsStore((state) => state.remove)
  const activate = useEnvironmentsStore((state) => state.activate)

  const [selectedId, setSelectedId] = useState<string | null>(activeId)
  const selected = useMemo(
    () => environments.find((item) => item.id === selectedId) ?? null,
    [environments, selectedId],
  )

  const [name, setName] = useState('')
  const [rows, setRows] = useState<KeyValue[]>([])
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedId((current) => current ?? activeId ?? environments[0]?.id ?? null)
  }, [open, activeId, environments])

  useEffect(() => {
    setName(selected?.name ?? '')
    setRows(selected ? toRows(selected.variables) : [])
    setDirty(false)
  }, [selected])

  const add = async () => {
    const created = await createEnvironment(workspaceId, t('environment.newName'))
    if (created) setSelectedId(created.id)
  }

  const save = async () => {
    if (!selected) return
    if (name.trim() && name.trim() !== selected.name) {
      await renameEnvironment(workspaceId, selected.id, name)
    }
    const saved = await saveVariables(workspaceId, selected.id, toVariables(rows, selected.variables))
    if (saved) setDirty(false)
  }

  const drop = (id: string, label: string) =>
    ask({
      title: t('confirm.deleteEnvironment', { name: label }),
      description: t('confirm.description'),
      onConfirm: async () => {
        const removed = await removeEnvironment(workspaceId, id)
        if (removed) setSelectedId(null)
        return removed
      },
    })

  return (
    <>
      <Modal
        open={open}
        size="lg"
        title={t('environment.manage')}
        description={t('environment.manageHint')}
        onClose={onClose}
      >
        <div className="grid grid-cols-[200px_1fr] gap-4">
          <div className="flex flex-col gap-1 border-r border-border pr-3">
            {environments.length === 0 && (
              <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">
                {t('environment.empty')}
              </p>
            )}

            {environments.map((item) => (
              <div key={item.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left transition',
                    item.id === selectedId
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent/50',
                  )}
                >
                  <Layers className="size-3.5 shrink-0" />
                  <span className="truncate text-xs">{item.name}</span>
                  {item.id === activeId && (
                    <span className="ml-auto size-1.5 shrink-0 rounded-full bg-status-success" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void drop(item.id, item.name)}
                  aria-label={t('common.delete')}
                  className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}

            <Button size="sm" variant="ghost" className="mt-1 justify-start" onClick={() => void add()}>
              <Plus className="size-3.5" />
              {t('environment.create')}
            </Button>
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            {!selected ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                {t('environment.pick')}
              </p>
            ) : (
              <>
                <TextField
                  label={t('environment.name')}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setDirty(true)
                  }}
                />

                <div className="overflow-hidden rounded-md border border-border">
                  <KeyValueEditor
                    rows={rows}
                    onChange={(next) => {
                      setRows(next)
                      setDirty(true)
                    }}
                    keyPlaceholder={t('environment.variable')}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" loading={pending} onClick={() => void save()} disabled={pending || !dirty}>
                    {t('common.save')}
                  </Button>
                  {selected.id !== activeId && (
                    <Button size="sm" variant="outline" onClick={() => activate(selected.id)}>
                      {t('environment.activate')}
                    </Button>
                  )}
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {t('environment.count', { count: rows.filter((row) => row.key.trim()).length })}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 empty:mt-0">
          <DataErrorNote error={error} />
        </div>
      </Modal>

      {dialog}
    </>
  )
}