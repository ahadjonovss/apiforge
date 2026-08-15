import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { AuthErrorDetail } from '../domain/auth-error'
import { useT } from '@/app/providers/i18n-provider'

export function AuthErrorNote({ error }: { error: AuthErrorDetail | null }) {
  const t = useT()
  if (!error) return null

  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
      <AlertCircle className="mt-px size-3.5 shrink-0 text-destructive" />
      <p className="text-[11px] text-destructive">{t(error.message as never)}</p>
    </div>
  )
}

export function AuthSuccessNote({ message }: { message: string | null }) {
  if (!message) return null

  return (
    <div className="flex items-start gap-2 rounded-md border border-status-success/40 bg-status-success/10 px-3 py-2">
      <CheckCircle2 className="mt-px size-3.5 shrink-0 text-status-success" />
      <p className="text-[11px] text-status-success">{message}</p>
    </div>
  )
}
