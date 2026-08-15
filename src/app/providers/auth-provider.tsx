import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/features/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => useAuthStore.getState().init(), [])

  return <>{children}</>
}
