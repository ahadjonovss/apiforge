import { useEffect, useState } from 'react'
import type { VariableSource } from '@/core/domain/variables'
import { cn } from '@/core/lib/cn'
import { useT } from '@/app/providers/i18n-provider'
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { TextField } from '@/shared/ui/text-field'
import { toScope, useActiveEnvironment, useEnvironmentsStore } from '@/features/environments'
import { useCollectionsStore } from './collections-store'

export function VariableEditModal({
  workspaceId,
  name,
  onClose,
}: {
  workspaceId: string
  name: string | null
  onClose: () => void
}) {
  const t = useT()
  const collection = useCollectionsStore((state) => state.current)
  const captureVariables = useCollectionsStore((state) => state.captureVariables)
  const environment = useActiveEnvironment()
  const setEnvironmentVariables = useEnvironmentsStore((state) => state.setVariables)

  const environmentScope = environment ? toScope(environment.variables) : {}
  const collectionScope = collection ? toScope(collection.variables) : {}
  const inEnvironment = name !== null && name in environmentScope
  const inCollection = name !== null && name in collectionScope

  const [value, setValue] = useState('')
  const [target, setTarget] = useState<VariableSource>('collection')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (name === null) return
    const source: VariableSource =
      inEnvironment || (!inCollection && environment) ? 'environment' : 'collection'
    setTarget(source)
    setValue(
      source === 'environment' ? (environmentScope[name] ?? '') : (collectionScope[name] ?? ''),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  if (name === null) return null

  const save = async () => {
    setSaving(true)
    const entries = [{ key: name, value }]
    const done =
      target === 'environment' && environment
        ? await setEnvironmentVariables(workspaceId, entries)
        : await captureVariables(workspaceId, entries)
    setSaving(false)
    if (done) onClose()
  }

  const options: { id: VariableSource; label: string; disabled: boolean }[] = [
    {
      id: 'environment',
      label: environment ? environment.name : t('environment.none'),
      disabled: !environment,
    },
    { id: 'collection', label: collection?.name ?? t('variable.sourceCollection'), disabled: false },
  ]

  return (
    <Modal open title={t('variable.title')} description={name} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <TextField
          label={t('kv.value')}
          value={value}
          autoFocus
          onChange={(event) => setValue(event.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">{t('variable.saveTo')}</span>
          <div className="flex gap-1.5">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  setTarget(option.id)
                  setValue(
                    option.id === 'environment'
                      ? (environmentScope[name] ?? value)
                      : (collectionScope[name] ?? value),
                  )
                }}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-xs transition disabled:opacity-40',
                  target === option.id
                    ? 'border-primary bg-accent text-foreground'
                    : 'border-border text-muted-foreground hover:bg-accent/50',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" loading={saving} onClick={() => void save()}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
