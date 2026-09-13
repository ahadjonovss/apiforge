import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import type { KeyValue } from '@/core/domain/http'
import { Button } from '@/shared/ui/button'
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
import { useT } from '@/app/providers/i18n-provider'

const AUTH_MODES: AuthMode[] = ['none', 'bearer', 'basic', 'apiKey']

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  )
}

function SettingsForm({
  workspaceId,
  collection,
}: {
  workspaceId: string
  collection: ApiCollection
}) {
  const t = useT()
  const navigate = useNavigate()
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

  const back = () =>
    navigate({
      to: '/workspace/$workspaceId/collection/$collectionId',
      params: { workspaceId, collectionId: collection.id },
    })

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
    if (saved) void back()
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Section title={t('collection.settingsBasics')} description={t('collection.settingsHint')}>
        <TextField
          label={t('common.name')}
          error={t(errors.name?.message as never)}
          {...register('name')}
        />
        <TextField
          label={t('common.description')}
          error={t(errors.description?.message as never)}
          {...register('description')}
        />
        <TextField
          label={t('collection.baseUrl')}
          placeholder="https://api.example.com · {{gateway}}"
          hint={t('collection.baseUrlHint')}
          error={t(errors.baseUrl?.message as never)}
          {...register('baseUrl')}
        />
      </Section>

      <Section title={t('collection.settingsAuth')} description={t('collection.settingsAuthHint')}>
        <AuthFields value={auth} modes={AUTH_MODES} onChange={setAuth} />
      </Section>

      <Section title={t('collection.variables')} description={t('collection.variablesHint')}>
        <div className="rounded-md border border-border">
          <KeyValueEditor
            rows={variables}
            onChange={setVariables}
            keyPlaceholder={t('kv.name')}
            valuePlaceholder={t('kv.valueLabel')}
          />
        </div>
      </Section>

      <Section
        title={t('collection.commonHeaders')}
        description={t('collection.commonHeadersHint')}
      >
        <div className="rounded-md border border-border">
          <KeyValueEditor rows={headers} onChange={setHeaders} />
        </div>
      </Section>

      <DataErrorNote error={error} />

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background/95 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" type="button" onClick={() => void back()}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" size="sm" loading={pending}>
          <Save className="size-3.5" />
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}

export function CollectionSettingsPage({
  workspaceId,
  collectionId,
}: {
  workspaceId: string
  collectionId: string
}) {
  const t = useT()
  const current = useCollectionsStore((state) => state.current)
  const loading = useCollectionsStore((state) => state.loading)
  const error = useCollectionsStore((state) => state.error)
  const openCollection = useCollectionsStore((state) => state.openCollection)

  useEffect(() => {
    void openCollection(workspaceId, collectionId)
  }, [workspaceId, collectionId, openCollection])

  const collection = current?.id === collectionId ? current : null

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/workspace/$workspaceId/collection/$collectionId"
            params={{ workspaceId, collectionId }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            {collection?.name ?? t('collection.backToCollection')}
          </Link>
          <h1 className="text-sm font-semibold">{t('collection.settingsTitle')}</h1>
        </div>

        {collection ? (
          <SettingsForm key={collection.id} workspaceId={workspaceId} collection={collection} />
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataErrorNote error={error} />
        )}
      </div>
    </div>
  )
}
