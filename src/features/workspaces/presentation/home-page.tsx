import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { Folder, Plus, Trash2, Users } from 'lucide-react'
import { formatDateTime } from '@/core/lib/format'
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { TextField } from '@/shared/ui/text-field'
import { DataErrorNote } from '@/shared/ui/data-error-note'
import { useAuthStore } from '@/features/auth'
import { workspaceSchema, type WorkspaceValues } from '../application/schemas'
import { useWorkspacesStore } from './workspaces-store'
import { useT } from '@/app/providers/i18n-provider'

function CreateWorkspaceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT()
  const user = useAuthStore((state) => state.user)
  const pending = useWorkspacesStore((state) => state.pending)
  const error = useWorkspacesStore((state) => state.error)
  const createWorkspace = useWorkspacesStore((state) => state.createWorkspace)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkspaceValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: '', description: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    if (!user) return
    const created = await createWorkspace(values.name, values.description, {
      id: user.id,
      email: user.email ?? '',
      displayName: user.displayName,
      photoUrl: user.photoUrl,
    })
    if (created) {
      reset()
      onClose()
    }
  })

  return (
    <Modal
      open={open}
      title={t('workspaces.newTitle')}
      description={t('workspaces.newHint')}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <TextField
          label={t('common.name')}
          placeholder="Alif Backend"
          error={t(errors.name?.message as never)}
          {...register('name')}
        />
        <TextField
          label={t('common.description')}
          placeholder={t('common.optional')}
          error={t(errors.description?.message as never)}
          {...register('description')}
        />

        <DataErrorNote error={error} />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" size="sm" loading={pending}>
            {t('common.create')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function HomePage() {
  const t = useT()
  const user = useAuthStore((state) => state.user)
  const workspaces = useWorkspacesStore((state) => state.workspaces)
  const loading = useWorkspacesStore((state) => state.loading)
  const error = useWorkspacesStore((state) => state.error)
  const loadWorkspaces = useWorkspacesStore((state) => state.loadWorkspaces)
  const removeWorkspace = useWorkspacesStore((state) => state.removeWorkspace)

  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (user) void loadWorkspaces(user.id)
  }, [user, loadWorkspaces])

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-5 p-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-lg font-semibold">{t('workspaces.title')}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('workspaces.subtitle')}
            </p>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-3.5" />
            {t('workspaces.new')}
          </Button>
        </div>

        <DataErrorNote error={error} />

        {loading && <p className="text-xs text-muted-foreground">{t('common.loading')}</p>}

        {!loading && workspaces.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-10 text-center">
            <Folder className="size-8 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium">{t('workspaces.empty')}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('workspaces.emptyHint')}
              </p>
            </div>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-3.5" />
              {t('workspaces.new')}
            </Button>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="group relative rounded-lg border border-border bg-card p-4 transition hover:border-primary/50"
            >
              <Link to="/workspace/$workspaceId" params={{ workspaceId: workspace.id }}>
                <p className="text-sm font-medium">{workspace.name}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {workspace.description || t('workspaces.noDescription')}
                </p>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3" />
                    {t('workspaces.memberCount', { count: workspace.memberIds.length })}
                  </span>
                  <span>{formatDateTime(workspace.createdAt)}</span>
                </div>
              </Link>

              {workspace.ownerId === user?.id && (
                <button
                  type="button"
                  onClick={() => void removeWorkspace(workspace.id)}
                  aria-label={t('common.delete')}
                  className="absolute right-3 top-3 rounded p-1 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <CreateWorkspaceModal open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
