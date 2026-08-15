import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, FolderOpen, Plus, Trash2, UserPlus, Users } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { TextField } from '@/shared/ui/text-field'
import { DataErrorNote } from '@/shared/ui/data-error-note'
import { useAuthStore } from '@/features/auth'
import { useCollectionsStore } from '@/features/collections/presentation/collections-store'
import { collectionSchema, type CollectionValues } from '@/features/collections/application/schemas'
import { memberSchema, teamSchema, type MemberValues, type TeamValues } from '../application/schemas'
import { canManage } from '../domain/workspace'
import { useWorkspacesStore } from './workspaces-store'

function Panel({
  title,
  count,
  action,
  children,
}: {
  title: string
  count: number
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title} <span className="ml-1 text-foreground">{count}</span>
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function AddMemberModal({
  workspaceId,
  open,
  onClose,
}: {
  workspaceId: string
  open: boolean
  onClose: () => void
}) {
  const pending = useWorkspacesStore((state) => state.pending)
  const error = useWorkspacesStore((state) => state.error)
  const addMember = useWorkspacesStore((state) => state.addMember)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemberValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { email: '', role: 'member' },
  })

  const onSubmit = handleSubmit(async (values) => {
    if (await addMember(workspaceId, values.email, values.role)) {
      reset()
      onClose()
    }
  })

  return (
    <Modal
      open={open}
      title="A'zo qo'shish"
      description="Foydalanuvchi avval APIForge'da ro'yxatdan o'tgan bo'lishi kerak"
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <TextField
          label="Email"
          type="email"
          placeholder="hamkasb@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Rol</label>
          <select
            className="rounded-md border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring"
            {...register('role')}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <DataErrorNote error={error} />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit" size="sm" loading={pending}>
            Qo'shish
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function CreateTeamModal({
  workspaceId,
  open,
  onClose,
}: {
  workspaceId: string
  open: boolean
  onClose: () => void
}) {
  const pending = useWorkspacesStore((state) => state.pending)
  const error = useWorkspacesStore((state) => state.error)
  const createTeam = useWorkspacesStore((state) => state.createTeam)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: '', description: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    if (await createTeam(workspaceId, values.name, values.description)) {
      reset()
      onClose()
    }
  })

  return (
    <Modal open={open} title="Yangi jamoa" description="Jamoaga a'zolarni keyin biriktirasiz" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <TextField label="Nomi" placeholder="Platform" error={errors.name?.message} {...register('name')} />
        <TextField
          label="Tavsif"
          placeholder="Ixtiyoriy"
          error={errors.description?.message}
          {...register('description')}
        />

        <DataErrorNote error={error} />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit" size="sm" loading={pending}>
            Yaratish
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function CreateCollectionModal({
  workspaceId,
  open,
  onClose,
}: {
  workspaceId: string
  open: boolean
  onClose: () => void
}) {
  const teams = useWorkspacesStore((state) => state.teams)
  const pending = useCollectionsStore((state) => state.pending)
  const error = useCollectionsStore((state) => state.error)
  const createCollection = useCollectionsStore((state) => state.createCollection)
  const [teamId, setTeamId] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CollectionValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: { name: '', description: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    const created = await createCollection(
      workspaceId,
      values.name,
      values.description,
      teamId || null,
    )
    if (created) {
      reset()
      setTeamId('')
      onClose()
    }
  })

  return (
    <Modal
      open={open}
      title="Yangi API to'plami"
      description="Endpointlar shu to'plam ichida saqlanadi"
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <TextField label="Nomi" placeholder="Billing API" error={errors.name?.message} {...register('name')} />
        <TextField
          label="Tavsif"
          placeholder="Ixtiyoriy"
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Jamoa</label>
          <select
            value={teamId}
            onChange={(event) => setTeamId(event.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Biriktirilmagan</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <DataErrorNote error={error} />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit" size="sm" loading={pending}>
            Yaratish
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function WorkspacePage({ workspaceId }: { workspaceId: string }) {
  const user = useAuthStore((state) => state.user)
  const current = useWorkspacesStore((state) => state.current)
  const members = useWorkspacesStore((state) => state.members)
  const teams = useWorkspacesStore((state) => state.teams)
  const loading = useWorkspacesStore((state) => state.loading)
  const error = useWorkspacesStore((state) => state.error)
  const openWorkspace = useWorkspacesStore((state) => state.openWorkspace)
  const removeMember = useWorkspacesStore((state) => state.removeMember)
  const removeTeam = useWorkspacesStore((state) => state.removeTeam)
  const toggleTeamMember = useWorkspacesStore((state) => state.toggleTeamMember)

  const collections = useCollectionsStore((state) => state.collections)
  const collectionsError = useCollectionsStore((state) => state.error)
  const loadCollections = useCollectionsStore((state) => state.loadCollections)
  const removeCollection = useCollectionsStore((state) => state.removeCollection)

  const [addingMember, setAddingMember] = useState(false)
  const [addingTeam, setAddingTeam] = useState(false)
  const [addingCollection, setAddingCollection] = useState(false)

  useEffect(() => {
    void openWorkspace(workspaceId)
    void loadCollections(workspaceId)
  }, [workspaceId, openWorkspace, loadCollections])

  const owner = current ? canManage(current, user?.id ?? null) : false

  if (loading && !current) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-muted-foreground">Yuklanmoqda…</p>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm">Ish maydoni topilmadi</p>
        <DataErrorNote error={error} />
        <Link to="/" className="text-xs text-primary hover:underline">
          Bosh sahifaga qaytish
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Ish maydonlari
        </Link>

        <div>
          <h1 className="text-lg font-semibold">{current.name}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {current.description || 'Tavsifsiz'}
          </p>
        </div>

        <DataErrorNote error={error ?? collectionsError} />

        <Panel
          title="API to'plamlari"
          count={collections.length}
          action={
            <Button size="sm" variant="outline" onClick={() => setAddingCollection(true)}>
              <Plus className="size-3.5" />
              To'plam
            </Button>
          }
        >
          {collections.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              Hali to'plam yo'q
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {collections.map((item) => (
                <li key={item.id} className="group flex items-center gap-3 px-4 py-2.5">
                  <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                  <Link
                    to="/workspace/$workspaceId/collection/$collectionId"
                    params={{ workspaceId, collectionId: item.id }}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate text-xs font-medium">{item.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {item.description || 'Tavsifsiz'}
                      {item.teamId &&
                        ` · ${teams.find((team) => team.id === item.teamId)?.name ?? 'jamoa'}`}
                    </p>
                  </Link>
                  <button
                    type="button"
                    onClick={() => void removeCollection(workspaceId, item.id)}
                    aria-label="O'chirish"
                    className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Jamoalar"
          count={teams.length}
          action={
            <Button size="sm" variant="outline" onClick={() => setAddingTeam(true)}>
              <Plus className="size-3.5" />
              Jamoa
            </Button>
          }
        >
          {teams.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              Hali jamoa yo'q
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {teams.map((team) => (
                <li key={team.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{team.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {team.description || 'Tavsifsiz'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeTeam(workspaceId, team.id)}
                      aria-label="O'chirish"
                      className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {members.map((member) => {
                      const active = team.memberIds.includes(member.userId)
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => void toggleTeamMember(team, member.userId)}
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[11px] transition',
                            active
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {member.displayName || member.email}
                        </button>
                      )
                    })}
                    {members.length === 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        Avval ish maydoniga a'zo qo'shing
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="A'zolar"
          count={members.length}
          action={
            <Button size="sm" variant="outline" onClick={() => setAddingMember(true)}>
              <UserPlus className="size-3.5" />
              A'zo
            </Button>
          }
        >
          <ul className="divide-y divide-border">
            {members.map((member) => (
              <li key={member.id} className="group flex items-center gap-3 px-4 py-2.5">
                <Users className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">
                    {member.displayName || 'Ismsiz'}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{member.email}</p>
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                  {member.role}
                </span>
                {owner && member.role !== 'owner' && (
                  <button
                    type="button"
                    onClick={() => void removeMember(workspaceId, member.userId)}
                    aria-label="Chiqarish"
                    className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <AddMemberModal
        workspaceId={workspaceId}
        open={addingMember}
        onClose={() => setAddingMember(false)}
      />
      <CreateTeamModal
        workspaceId={workspaceId}
        open={addingTeam}
        onClose={() => setAddingTeam(false)}
      />
      <CreateCollectionModal
        workspaceId={workspaceId}
        open={addingCollection}
        onClose={() => setAddingCollection(false)}
      />
    </div>
  )
}
