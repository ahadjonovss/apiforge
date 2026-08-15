import { useEffect, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from './auth-store'
import { useT } from '@/app/providers/i18n-provider'

export function RequireAuth({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const t = useT()
  const status = useAuthStore((state) => state.status)

  useEffect(() => {
    if (status === 'anonymous') void navigate({ to: '/login', replace: true })
  }, [status, navigate])

  if (status !== 'authenticated') {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-xs">{t('common.loading')}</span>
      </div>
    )
  }

  return <>{children}</>
}
