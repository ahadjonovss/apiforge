import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import type { KeyValue } from '@/core/domain/http'
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { TextField } from '@/shared/ui/text-field'
import { KeyValueEditor } from '@/shared/ui/key-value-editor'
import { DataErrorNote } from '@/shared/ui/data-error-note'
import type { AuthConfig, AuthMode } from '@/features/request/domain/request'
import { AuthFields } from '@/features/request/presentation/auth-fields'
import {
  collectionSettingsSchema,
  type CollectionSettingsValues,
} from '../application/schemas'
import type { ApiCollection } from '../domain/collection'
import { useCollectionsStore } from './collections-store'

const AUTH_MODES: AuthMode[] = ['none', 'bearer', 'basic', 'apiKey']

export function CollectionSettingsModal({
  workspaceId,
  collection,
  open,
  onClose,
}: {
  workspaceId: string
  collection: ApiCollection
  open: boolean
  onClose: () => void
}) {
  const pending = useCollectionsStore((state) => state.pending)
  const error = useCollectionsStore((state) => state.error)
  const updateSettings = useCollectionsStore((state) => state.updateSettings)

  const [headers, setHeaders] = useState<KeyValue[]>(collection.headers)
  const [auth, setAuth] = useState<AuthConfig>(collection.auth)
  const [variables, setVariables] = useState<KeyValue[]>(() =>
    collection.variables.map((variable) => ({
      id: variable.id,
      key: variable.key,
      value: variable.value,
      enabled: variable.enabled,
    })),
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CollectionSettingsValues>({
    resolver: zodResolver(collectionSettingsSchema),
    values: {
      name: collection.name,
      description: collection.description,
      baseUrl: collection.baseUrl,
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    const saved = await updateSettings(workspaceId, collection.id, {
      name: values.name,
      description: values.description,
      baseUrl: values.baseUrl,
      headers: headers.filter((row) => row.key.trim() !== ''),
      auth,
      variables: variables
        .filter((row) => row.key.trim() !== '')
        .map((row) => ({
          id: row.id,
          key: row.key,
          value: row.value,
          enabled: row.enabled,
          secret: false,
        })),
    })
    if (saved) onClose()
  })

  return (
    <Modal
      open={open}
      title="To'plam sozlamalari"
      description="Bu qiymatlar to'plamdagi barcha endpointlarga tegishli"
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex max-h-[70vh] flex-col gap-3 overflow-auto">
        <TextField label="Nomi" error={errors.name?.message} {...register('name')} />
        <TextField
          label="Tavsif"
          error={errors.description?.message}
          {...register('description')}
        />
        <TextField
          label="Base URL"
          placeholder="https://api.example.com yoki {{gateway}}"
          hint="Barcha endpointlar shu manzildan boshlanadi. O'zgaruvchi ham bo'lishi mumkin."
          error={errors.baseUrl?.message}
          {...register('baseUrl')}
        />

        <AuthFields value={auth} modes={AUTH_MODES} onChange={setAuth} />

        <div>
          <p className="mb-1 text-xs font-medium">O'zgaruvchilar</p>
          <p className="mb-1 text-[11px] text-muted-foreground">
            URL, header va body ichida <code>{'{{nom}}'}</code> ko'rinishida ishlatiladi
          </p>
          <div className="rounded-md border border-border">
            <KeyValueEditor
              rows={variables}
              onChange={setVariables}
              keyPlaceholder="Nom"
              valuePlaceholder="Qiymat"
            />
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium">Umumiy headerlar</p>
          <div className="rounded-md border border-border">
            <KeyValueEditor rows={headers} onChange={setHeaders} />
          </div>
        </div>

        <DataErrorNote error={error} />

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit" size="sm" loading={pending}>
            Saqlash
          </Button>
        </div>
      </form>
    </Modal>
  )
}
