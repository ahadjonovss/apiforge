import { useEffect, useState } from 'react'
import { Check, FileText, Pencil, X } from 'lucide-react'
import { formatDateTime } from '@/core/lib/format'
import { Button } from '@/shared/ui/button'
import { Markdown } from '@/shared/ui/markdown'
import { MarkdownEditor } from '@/shared/ui/markdown-editor'
import { useT } from '@/app/providers/i18n-provider'
import type { Workspace, WorkspaceMember } from '../domain/workspace'
import { useWorkspacesStore } from './workspaces-store'

interface Props {
  workspace: Workspace
  members: WorkspaceMember[]
  teamCount: number
  collectionCount: number
  canEdit: boolean
}

export function WorkspaceHome({
  workspace,
  members,
  teamCount,
  collectionCount,
  canEdit,
}: Props) {
  const t = useT()
  const pending = useWorkspacesStore((state) => state.pending)
  const saveDocs = useWorkspacesStore((state) => state.saveDocs)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(workspace.docs)

  useEffect(() => {
    setDraft(workspace.docs)
    setEditing(false)
  }, [workspace.id, workspace.docs])

  const owner = members.find((member) => member.userId === workspace.ownerId)

  const stats = [
    { label: t('workspace.statCollections'), value: collectionCount },
    { label: t('workspace.statTeams'), value: teamCount },
    { label: t('workspace.statMembers'), value: members.length },
  ]

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{t('workspace.docs')}</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {t('workspace.owner')}: {owner?.displayName || owner?.email || '—'} ·{' '}
            {t('workspace.createdAt')}: {formatDateTime(workspace.createdAt)}
          </p>
        </div>

        {canEdit &&
          (editing ? (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(workspace.docs)
                  setEditing(false)
                }}
              >
                <X className="size-3.5" />
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                loading={pending}
                onClick={async () => {
                  if (await saveDocs(workspace.id, draft)) setEditing(false)
                }}
              >
                <Check className="size-3.5" />
                {t('common.save')}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" />
              {t('common.edit')}
            </Button>
          ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-md border border-border p-3">
            <p className="text-lg font-semibold">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        {editing ? (
          <div className="mt-2 flex flex-col gap-2">
            <MarkdownEditor value={draft} onChange={setDraft} minHeight="260px" />
            {!draft.trim() && (
              <button
                type="button"
                onClick={() => setDraft(t('workspace.template', { name: workspace.name }))}
                className="w-fit text-[11px] text-primary hover:underline"
              >
                {t('collection.template')}
              </button>
            )}
          </div>
        ) : workspace.docs.trim() ? (
          <Markdown source={workspace.docs} />
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border p-8 text-center">
            <FileText className="size-6 text-muted-foreground/40" />
            <p className="text-xs font-medium">{t('workspace.docsEmpty')}</p>
            <p className="text-[11px] text-muted-foreground">{t('workspace.docsEmptyHint')}</p>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="size-3.5" />
                {t('collection.startWriting')}
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
