import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck, UserPlus, Users, X } from 'lucide-react'
import { formatDateTime } from '@/core/lib/format'
import { Button } from '@/shared/ui/button'
import { useConfirm } from '@/shared/ui/confirm-dialog'
import { useT } from '@/app/providers/i18n-provider'
import { useAuthStore } from '@/features/auth'
import { canManageCollections } from '@/features/workspaces/domain/workspace'
import { useWorkspacesStore } from '@/features/workspaces/presentation/workspaces-store'
import {
  COLLECTION_ROLES,
  accessEntries,
  type AccessSubject,
  type CollectionRole,
} from '../domain/access'
import type { ApiCollection } from '../domain/collection'
import { useCollectionsStore } from './collections-store'

export function CollectionAccessPanel({
  workspaceId,
  collection,
}: {
  workspaceId: string
  collection: ApiCollection
}) {
  const t = useT()
  const { ask, dialog } = useConfirm()
  const user = useAuthStore((state) => state.user)
  const members = useWorkspacesStore((state) => state.members)
  const teams = useWorkspacesStore((state) => state.teams)
  const currentWorkspace = useWorkspacesStore((state) => state.current)
  const openWorkspace = useWorkspacesStore((state) => state.openWorkspace)
  const pending = useCollectionsStore((state) => state.pending)
  const grantAccess = useCollectionsStore((state) => state.grantAccess)
  const revokeAccess = useCollectionsStore((state) => state.revokeAccess)

  const [adding, setAdding] = useState(false)
  const [role, setRole] = useState<CollectionRole>('editor')

  useEffect(() => {
    if (currentWorkspace?.id !== workspaceId) void openWorkspace(workspaceId)
  }, [workspaceId, currentWorkspace?.id, openWorkspace])

  const entries = useMemo(() => accessEntries(collection), [collection])
  const manages = canManageCollections(members, user?.id ?? null)

  const nameOf = (subject: AccessSubject): string => {
    if (subject.type === 'team') {
      return teams.find((team) => team.id === subject.id)?.name ?? t('access.unknownTeam')
    }
    const member = members.find((item) => item.userId === subject.id)
    return member ? member.displayName || member.email : t('access.unknownUser')
  }

  const actorName = (userId: string): string => {
    if (!userId) return t('access.unknownUser')
    const member = members.find((item) => item.userId === userId)
    return member ? member.displayName || member.email : t('access.unknownUser')
  }

  const granted = new Set(entries.map((entry) => `${entry.subject.type}:${entry.subject.id}`))
  const freeTeams = teams.filter((team) => !granted.has(`team:${team.id}`))
  const freeMembers = members.filter((member) => !granted.has(`user:${member.userId}`))

  const add = async (subject: AccessSubject) => {
    if (await grantAccess(workspaceId, collection.id, subject, role, user?.id ?? '')) {
      setAdding(false)
    }
  }

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-muted-foreground" />
          <p className="text-xs font-medium">{t('access.title')}</p>
          <span className="text-[11px] text-muted-foreground">
            {t('access.count', { count: entries.length })}
          </span>
        </div>
        {manages && (
          <Button size="sm" variant="ghost" onClick={() => setAdding((value) => !value)}>
            <UserPlus className="size-3.5" />
            {t('access.add')}
          </Button>
        )}
      </div>

      {adding && manages && (
        <div className="flex flex-col gap-2 border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{t('common.role')}</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as CollectionRole)}
              className="rounded border border-border bg-card px-1.5 py-0.5 text-[11px] outline-none focus:ring-1 focus:ring-ring"
            >
              {COLLECTION_ROLES.map((option) => (
                <option key={option} value={option}>
                  {t(`access.role.${option}` as never)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-medium text-muted-foreground">{t('access.teams')}</p>
            {freeTeams.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">{t('access.allTeamsAdded')}</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {freeTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    disabled={pending}
                    onClick={() => void add({ type: 'team', id: team.id })}
                    className="flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary hover:text-foreground disabled:opacity-50"
                  >
                    <Users className="size-3" />
                    {team.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-medium text-muted-foreground">{t('access.people')}</p>
            {freeMembers.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">{t('access.allPeopleAdded')}</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {freeMembers.map((member) => (
                  <button
                    key={member.userId}
                    type="button"
                    disabled={pending}
                    onClick={() => void add({ type: 'user', id: member.userId })}
                    className="rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary hover:text-foreground disabled:opacity-50"
                  >
                    {member.displayName || member.email}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="px-4 py-3 text-[11px] text-muted-foreground">{t('access.empty')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {entries.map((entry) => (
            <li
              key={`${entry.subject.type}:${entry.subject.id}`}
              className="flex items-center gap-2 px-4 py-2"
            >
              {entry.subject.type === 'team' ? (
                <Users className="size-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[8px] font-semibold text-primary">
                  {nameOf(entry.subject).charAt(0).toUpperCase()}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs">{nameOf(entry.subject)}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {t('access.addedLine', {
                    who: actorName(entry.grant.addedBy),
                    when: formatDateTime(entry.grant.addedAt),
                  })}
                </p>
              </div>

              {manages ? (
                <select
                  value={entry.grant.role}
                  onChange={(event) =>
                    void grantAccess(
                      workspaceId,
                      collection.id,
                      entry.subject,
                      event.target.value as CollectionRole,
                      entry.grant.addedBy || (user?.id ?? ''),
                    )
                  }
                  className="rounded border border-border bg-card px-1.5 py-0.5 text-[11px] outline-none focus:ring-1 focus:ring-ring"
                >
                  {COLLECTION_ROLES.map((option) => (
                    <option key={option} value={option}>
                      {t(`access.role.${option}` as never)}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                  {t(`access.role.${entry.grant.role}` as never)}
                </span>
              )}

              {manages && (
                <button
                  type="button"
                  aria-label={t('access.revoke')}
                  onClick={() =>
                    ask({
                      title: t('confirm.revokeAccess', { name: nameOf(entry.subject) }),
                      description: t('confirm.revokeAccessHint', { name: collection.name }),
                      confirmLabel: t('access.revoke'),
                      onConfirm: () => revokeAccess(workspaceId, collection.id, entry.subject),
                    })
                  }
                  className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {dialog}
    </div>
  )
}
