import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useT } from '@/app/providers/i18n-provider'
import { Button } from '@/shared/ui/button'
import { DataErrorNote } from '@/shared/ui/data-error-note'
import { useAuthStore } from '@/features/auth'
import { ScriptEditor } from '@/features/request/presentation/script-editor'
import { canManageCollections, type Workspace } from '../domain/workspace'
import { useWorkspacesStore } from './workspaces-store'

function ScriptSection({ workspace, canEdit }: { workspace: Workspace; canEdit: boolean }) {
  const t = useT()
  const pending = useWorkspacesStore((state) => state.pending)
  const error = useWorkspacesStore((state) => state.error)
  const saveScript = useWorkspacesStore((state) => state.saveScript)

  const [draft, setDraft] = useState(workspace.script)

  useEffect(() => {
    setDraft(workspace.script)
  }, [workspace.id, workspace.script])

  const dirty = draft !== workspace.script

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">{t('workspace.scriptTitle')}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{t('workspace.scriptHint')}</p>

      {canEdit ? (
        <>
          <div className="-mx-5 mt-2">
            <ScriptEditor value={draft} onChange={setDraft} />
          </div>

          <DataErrorNote error={error} />

          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              loading={pending}
              disabled={pending || !dirty}
              onClick={() => void saveScript(workspace.id, draft)}
            >
              {t('common.save')}
            </Button>
            {dirty && (
              <Button size="sm" variant="ghost" onClick={() => setDraft(workspace.script)}>
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">{t('workspace.scriptReadOnly')}</p>
          <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted p-3 font-mono text-[11px]">
            {workspace.script.trim() || t('workspace.scriptEmpty')}
          </pre>
        </div>
      )}
    </section>
  )
}

export function WorkspaceSettingsPage({ workspaceId }: { workspaceId: string }) {
  const t = useT()
  const user = useAuthStore((state) => state.user)
  const current = useWorkspacesStore((state) => state.current)
  const members = useWorkspacesStore((state) => state.members)
  const loading = useWorkspacesStore((state) => state.loading)
  const error = useWorkspacesStore((state) => state.error)
  const openWorkspace = useWorkspacesStore((state) => state.openWorkspace)

  useEffect(() => {
    void openWorkspace(workspaceId)
  }, [workspaceId, openWorkspace])

  const workspace = current?.id === workspaceId ? current : null
  const canEdit = Boolean(
    workspace &&
      (workspace.ownerId === (user?.id ?? '') || canManageCollections(members, user?.id ?? null)),
  )

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/workspace/$workspaceId"
            params={{ workspaceId }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            {workspace?.name ?? t('collection.workspace')}
          </Link>
          <h1 className="text-sm font-semibold">{t('workspace.settingsTitle')}</h1>
        </div>

        {workspace ? (
          <ScriptSection key={workspace.id} workspace={workspace} canEdit={canEdit} />
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
