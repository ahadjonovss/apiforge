import { useState, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useT } from '@/app/providers/i18n-provider'
import { Button } from './button'
import { Modal } from './modal'

export interface ConfirmRequest {
  title: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void | Promise<unknown>
}

function ConfirmDialog({
  request,
  onClose,
}: {
  request: ConfirmRequest | null
  onClose: () => void
}) {
  const t = useT()
  const [pending, setPending] = useState(false)

  if (!request) return null

  return (
    <Modal open title={request.title} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-4 text-destructive" />
          </span>
          <p className="text-xs text-muted-foreground">
            {request.description ?? t('confirm.description')}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            loading={pending}
            onClick={async () => {
              setPending(true)
              try {
                await request.onConfirm()
                onClose()
              } finally {
                setPending(false)
              }
            }}
          >
            {request.confirmLabel ?? t('common.delete')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function useConfirm(): { ask: (request: ConfirmRequest) => void; dialog: ReactNode } {
  const [request, setRequest] = useState<ConfirmRequest | null>(null)

  return {
    ask: setRequest,
    dialog: <ConfirmDialog request={request} onClose={() => setRequest(null)} />,
  }
}
