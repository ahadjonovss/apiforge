import { useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AlertTriangle, FileJson, Upload } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { importService } from '../composition'
import { ImportFailure, type ImportPlan } from '../domain/import-plan'
import { useT } from '@/app/providers/i18n-provider'

interface Props {
  workspaceId: string
  teams: { id: string; name: string }[]
  open: boolean
  onClose: () => void
  onImported: () => void
}

export function ImportDialog({ workspaceId, teams, open, onClose, onImported }: Props) {
  const t = useT()
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)

  const [plan, setPlan] = useState<ImportPlan | null>(null)
  const [teamId, setTeamId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const reset = () => {
    setPlan(null)
    setError(null)
    setPending(false)
  }

  const read = async (file: File) => {
    setError(null)
    try {
      setPlan(importService.preview(await file.text()))
    } catch (failure) {
      setPlan(null)
      setError(
        failure instanceof ImportFailure ? t(failure.message as never) : t('import.readFailed'),
      )
    }
  }

  const apply = async () => {
    if (!plan) return
    setPending(true)
    setError(null)
    try {
      const outcome = await importService.apply(workspaceId, teamId || null, plan)
      onImported()
      reset()
      onClose()
      void navigate({
        to: '/workspace/$workspaceId/collection/$collectionId',
        params: { workspaceId, collectionId: outcome.collectionId },
      })
    } catch (failure) {
      setPending(false)
      setError(failure instanceof Error ? failure.message : t('import.failed'))
    }
  }

  return (
    <Modal
      open={open}
      title={t('import.title')}
      description={t('import.hint')}
      onClose={() => {
        reset()
        onClose()
      }}
    >
      <div className="flex max-h-[70vh] flex-col gap-3 overflow-auto">
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void read(file)
            event.target.value = ''
          }}
        />

        <Button variant="outline" size="lg" block onClick={() => fileInput.current?.click()}>
          <Upload className="size-3.5" />
          {plan ? t('import.pickAnother') : t('import.pickFile')}
        </Button>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
            <p className="text-[11px] text-destructive">{error}</p>
          </div>
        )}

        {plan && (
          <>
            <div className="rounded-md border border-border p-3">
              <div className="flex items-start gap-2">
                <FileJson className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{plan.collection.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {t('import.summary', { folders: plan.folders.length, endpoints: plan.endpoints.length, variables: plan.collection.variables.length })}
                  </p>
                </div>
              </div>
            </div>

            {plan.warnings.length > 0 && (
              <div className="rounded-md border border-status-redirect/40 bg-status-redirect/10 p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-3.5 shrink-0 text-status-redirect" />
                  <p className="text-[11px] font-medium text-status-redirect">
                    {t('import.warnings')}
                  </p>
                </div>
                <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
                  {plan.warnings.map((warning, index) => (
                    <li
                      key={`${warning.key}:${index}`}
                      className="text-[11px] text-muted-foreground"
                    >
                      {t(warning.key as never, warning.params)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">{t('common.team')}</label>
              <select
                value={teamId}
                onChange={(event) => setTeamId(event.target.value)}
                className="rounded-md border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">{t('workspace.unassigned')}</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button size="sm" loading={pending} disabled={!plan} onClick={() => void apply()}>
            {t('import.action')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
