import { useEffect, useState } from 'react'
import { Check, FileText, Pencil, Settings, X } from 'lucide-react'
import { formatDateTime } from '@/core/lib/format'
import { Button } from '@/shared/ui/button'
import { Markdown } from '@/shared/ui/markdown'
import { MarkdownEditor } from '@/shared/ui/markdown-editor'
import { DataErrorNote } from '@/shared/ui/data-error-note'
import type { ApiCollection } from '../domain/collection'
import { CollectionAccessPanel } from './collection-access-panel'
import { useCollectionsStore } from './collections-store'
import { useT } from '@/app/providers/i18n-provider'

const TEMPLATE = `# Kirish

Bu to'plam nima uchun kerakligini yozing.

## Autentifikatsiya

Qanday token olinadi va qayerda ishlatiladi.

## Muhitlar

| Nom | Base URL |
| --- | --- |
| dev | https://… |
| prod | https://… |
`

export function CollectionHome({
  workspaceId,
  collection,
  onOpenSettings,
}: {
  workspaceId: string
  collection: ApiCollection
  onOpenSettings: () => void
}) {
  const t = useT()
  const endpoints = useCollectionsStore((state) => state.endpoints)
  const folders = useCollectionsStore((state) => state.folders)
  const pending = useCollectionsStore((state) => state.pending)
  const error = useCollectionsStore((state) => state.error)
  const updateSettings = useCollectionsStore((state) => state.updateSettings)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(collection.docs)

  useEffect(() => {
    setDraft(collection.docs)
  }, [collection.docs, collection.id])

  const save = async () => {
    if (await updateSettings(workspaceId, collection.id, { docs: draft })) setEditing(false)
  }

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-5 p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{collection.name}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {collection.description || t('workspaces.noDescription')}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {editing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDraft(collection.docs)
                    setEditing(false)
                  }}
                >
                  <X className="size-3.5" />
                  {t('common.cancel')}
                </Button>
                <Button size="sm" loading={pending} onClick={() => void save()}>
                  <Check className="size-3.5" />
                  {t('common.save')}
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={onOpenSettings}>
                  <Settings className="size-3.5" />
                  {t('collection.settings')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="size-3.5" />
                  {t('common.edit')}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t('collection.statEndpoints'), value: endpoints.length },
            { label: t('collection.statFolders'), value: folders.length },
            { label: t('collection.statVariables'), value: collection.variables.length },
            { label: t('collection.statHeaders'), value: collection.headers.length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-3">
              <p className="text-lg font-semibold">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 border-y border-border py-2 text-[11px] text-muted-foreground">
          <span>
            {t('collection.baseUrl')}:{' '}
            <span className="font-mono text-foreground">
              {collection.baseUrl || t('collection.baseUrlUnset')}
            </span>
          </span>
          <span>
            Auth: <span className="font-mono text-foreground">{collection.auth.mode}</span>
          </span>
          <span>{t('collection.updatedAt')}: {formatDateTime(collection.updatedAt)}</span>
        </div>

        <CollectionAccessPanel workspaceId={workspaceId} collection={collection} />

        <DataErrorNote error={error} />

        {editing ? (
          <div className="flex flex-col gap-2">
            <MarkdownEditor value={draft} onChange={setDraft} minHeight="340px" />
            {!draft.trim() && (
              <button
                type="button"
                onClick={() => setDraft(TEMPLATE)}
                className="w-fit text-[11px] text-primary hover:underline"
              >
                {t('collection.template')}
              </button>
            )}
          </div>
        ) : collection.docs.trim() ? (
          <Markdown source={collection.docs} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-10 text-center">
            <FileText className="size-7 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium">{t('collection.docsEmpty')}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('collection.docsEmptyHint')}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" />
              {t('collection.startWriting')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
