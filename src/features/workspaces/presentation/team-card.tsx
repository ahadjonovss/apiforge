import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { useConfirm } from '@/shared/ui/confirm-dialog'
import { useT } from '@/app/providers/i18n-provider'
import { TEAM_ROLES, type Team, type TeamRole } from '../domain/team'
import type { WorkspaceMember } from '../domain/workspace'
import { useWorkspacesStore } from './workspaces-store'
import { TeamInviteDialog } from './team-invite-dialog'

interface Props {
  team: Team
  members: WorkspaceMember[]
  canManage: boolean
  onShowAccess: () => void
  onShowMemberAccess: (userId: string) => void
}

export function TeamCard({
  team,
  members,
  canManage,
  onShowAccess,
  onShowMemberAccess,
}: Props) {
  const t = useT()
  const pending = useWorkspacesStore((state) => state.pending)
  const removeTeam = useWorkspacesStore((state) => state.removeTeam)
  const renameTeam = useWorkspacesStore((state) => state.renameTeam)
  const setTeamMemberRole = useWorkspacesStore((state) => state.setTeamMemberRole)

  const { ask, dialog } = useConfirm()
  const [open, setOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(team.name)
  const [description, setDescription] = useState(team.description)

  const inTeam = members.filter((member) => team.members[member.userId])

  const label = (member: WorkspaceMember) => member.displayName || member.email

  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          {open ? (
            <ChevronDown className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{team.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {team.description || t('workspaces.noDescription')} ·{' '}
              {t('team.memberCount', { count: inTeam.length })}
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onShowAccess}
            aria-label={t('access.title')}
            title={t('access.subjectTeamHint')}
            className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <ShieldCheck className="size-3.5" />
          </button>
        </div>

        {canManage && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setOpen(true)
                setEditing(true)
              }}
              aria-label={t('team.edit')}
              className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() =>
                ask({
                  title: t('confirm.deleteTeam', { name: team.name }),
                  description: t('confirm.deleteTeamHint'),
                  onConfirm: () => removeTeam(team.workspaceId, team.id),
                })
              }
              aria-label={t('common.delete')}
              className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-3 border-l border-border pl-4">
          {editing && (
            <div className="flex flex-col gap-2">
              <TextField label={t('common.name')} value={name} onChange={(e) => setName(e.target.value)} />
              <TextField
                label={t('common.description')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  loading={pending}
                  onClick={async () => {
                    if (await renameTeam(team.workspaceId, team.id, name, description)) {
                      setEditing(false)
                    }
                  }}
                >
                  {t('common.save')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setName(team.name)
                    setDescription(team.description)
                    setEditing(false)
                  }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}

          {inTeam.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">{t('team.noMembers')}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {inTeam.map((member) => (
                <li key={member.userId} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onShowMemberAccess(member.userId)}
                    title={t('access.subjectUserHint')}
                    className="min-w-0 flex-1 truncate text-left text-xs hover:underline"
                  >
                    {label(member)}
                  </button>

                  {canManage ? (
                    <select
                      value={team.members[member.userId]}
                      onChange={(event) =>
                        void setTeamMemberRole(team, member.userId, event.target.value as TeamRole)
                      }
                      className="rounded border border-border bg-card px-1.5 py-0.5 text-[11px] outline-none focus:ring-1 focus:ring-ring"
                    >
                      {TEAM_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {t(`team.role.${role}` as never)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px]',
                        team.members[member.userId] === 'lead'
                          ? 'border-primary/60 text-primary'
                          : 'border-border text-muted-foreground',
                      )}
                    >
                      {t(`team.role.${team.members[member.userId]}` as never)}
                    </span>
                  )}

                  {canManage && (
                    <button
                      type="button"
                      onClick={() =>
                        ask({
                          title: t('confirm.removeFromTeam', { name: label(member) }),
                          description: t('confirm.removeFromTeamHint'),
                          confirmLabel: t('workspace.removeMember'),
                          onConfirm: () => setTeamMemberRole(team, member.userId, null),
                        })
                      }
                      aria-label={t('workspace.removeMember')}
                      className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-destructive"
                    >
                      <UserMinus className="size-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canManage && (
            <div>
              <Button size="sm" variant="ghost" onClick={() => setInviting(true)}>
                <UserPlus className="size-3.5" />
                {t('team.addPerson')}
              </Button>
            </div>
          )}

        </div>
      )}

      <TeamInviteDialog
        workspaceId={team.workspaceId}
        team={team}
        members={members}
        open={inviting}
        onClose={() => setInviting(false)}
      />
      {dialog}
    </li>
  )
}
