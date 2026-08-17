import { useMemo } from 'react'
import { Users } from 'lucide-react'
import { formatDateTime } from '@/core/lib/format'
import { Modal } from '@/shared/ui/modal'
import { useT } from '@/app/providers/i18n-provider'
import { grantsForSubject, type AccessSubject } from '@/features/collections/domain/access'
import { useCollectionsStore } from '@/features/collections/presentation/collections-store'
import { teamRoleOf, type Team } from '../domain/team'
import type { WorkspaceMember } from '../domain/workspace'

export function SubjectAccessDialog({
  subject,
  members,
  teams,
  onClose,
}: {
  subject: AccessSubject | null
  members: WorkspaceMember[]
  teams: Team[]
  onClose: () => void
}) {
  const t = useT()
  const collections = useCollectionsStore((state) => state.collections)

  const name = useMemo(() => {
    if (!subject) return ''
    if (subject.type === 'team') {
      return teams.find((team) => team.id === subject.id)?.name ?? t('access.unknownTeam')
    }
    const member = members.find((item) => item.userId === subject.id)
    return member ? member.displayName || member.email : t('access.unknownUser')
  }, [subject, teams, members, t])

  const grants = useMemo(() => {
    if (!subject) return []
    const teamIds =
      subject.type === 'user'
        ? teams.filter((team) => teamRoleOf(team, subject.id)).map((team) => team.id)
        : []
    return grantsForSubject(collections, subject, teamIds)
  }, [subject, collections, teams])

  const actorName = (userId: string): string => {
    if (!userId) return t('access.unknownUser')
    const member = members.find((item) => item.userId === userId)
    return member ? member.displayName || member.email : t('access.unknownUser')
  }

  if (!subject) return null

  return (
    <Modal
      open
      title={t('access.subjectTitle', { name })}
      description={
        subject.type === 'team' ? t('access.subjectTeamHint') : t('access.subjectUserHint')
      }
      onClose={onClose}
    >
      {grants.length === 0 ? (
        <p className="py-4 text-xs text-muted-foreground">{t('access.noGrants')}</p>
      ) : (
        <ul className="flex max-h-[60vh] flex-col divide-y divide-border overflow-auto">
          {grants.map((item) => (
            <li key={item.collection.id} className="flex items-start gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{item.collection.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t('access.addedLine', {
                    who: actorName(item.grant.addedBy),
                    when: formatDateTime(item.grant.addedAt),
                  })}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  {item.viaTeamId ? (
                    <>
                      <Users className="size-3" />
                      {t('access.viaTeam', {
                        name: teams.find((team) => team.id === item.viaTeamId)?.name ?? '',
                      })}
                    </>
                  ) : (
                    t('access.direct')
                  )}
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                {t(`access.role.${item.grant.role}` as never)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
