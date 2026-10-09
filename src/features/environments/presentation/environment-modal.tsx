import { useT } from '@/app/providers/i18n-provider'
import { Modal } from '@/shared/ui/modal'
import { EnvironmentsManager } from './environments-manager'

export function EnvironmentModal({
  open,
  workspaceId,
  onClose,
}: {
  open: boolean
  workspaceId: string
  onClose: () => void
}) {
  const t = useT()

  return (
    <Modal
      open={open}
      size="lg"
      title={t('environment.manage')}
      description={t('environment.manageHint')}
      onClose={onClose}
    >
      <EnvironmentsManager workspaceId={workspaceId} />
    </Modal>
  )
}
