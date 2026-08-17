import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { TextField } from '@/shared/ui/text-field'
import { DataErrorNote } from '@/shared/ui/data-error-note'
import { useT } from '@/app/providers/i18n-provider'
import { TEAM_ROLES, type Team, type TeamRole } from '../domain/team'
import type { WorkspaceMember } from '../domain/workspace'
import { useWorkspacesStore } from './workspaces-store'

interface Props {
  workspaceId: string
  team: Team
  members: WorkspaceMember[]
  open: boolean
  onClose: () => void
}

export function TeamInviteDialog({ workspaceId, team, members, open, onClose }: Props) {
  const t = useT()
  const pending = useWorkspacesStore((state) => state.pending)
  const error = useWorkspacesStore((state) => state.error)
  const clearError = useWorkspacesStore((state) => state.clearError)
  const inviteToTeam = useWorkspacesStore((state) => state.inviteToTeam)

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<TeamRole>('member')

  useEffect(() => {
    if (!open) return
    setEmail('')
    setRole('member')
    clearError()
  }, [open, clearError])

  const available = members.filter((member) => !team.members[member.userId])

  const submit = async (value: string) => {
    if (!value.trim()) return
    if (await inviteToTeam(workspaceId, team, value, role)) onClose()
  }

  return (
    <Modal open={open} title={t('team.invite')} description={t('team.inviteHint')} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">{t('common.role')}</label>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as TeamRole)}
            className="rounded-md border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring"
          >
            {TEAM_ROLES.map((option) => (
              <option key={option} value={option}>
                {t(`team.role.${option}` as never)}
              </option>
            ))}
          </select>
        </div>

        {available.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-medium text-muted-foreground">{t('team.existing')}</p>
            <div className="flex flex-wrap gap-1">
              {available.map((member) => (
                <button
                  key={member.userId}
                  type="button"
                  disabled={pending}
                  onClick={() => void submit(member.email)}
                  className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary hover:text-foreground disabled:opacity-50"
                >
                  {member.displayName || member.email}
                </button>
              ))}
            </div>
          </div>
        )}

        <TextField
          label={t('team.inviteEmail')}
          type="email"
          placeholder="hamkasb@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void submit(email)
          }}
        />

        <DataErrorNote error={error} />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" loading={pending} onClick={() => void submit(email)}>
            <UserPlus className="size-3.5" />
            {t('common.add')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
