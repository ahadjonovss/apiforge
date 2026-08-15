import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/features/auth'
import { userDirectory } from '@/features/users'

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)

  useEffect(() => useAuthStore.getState().init(), [])

  useEffect(() => {
    if (!user?.email) return
    void userDirectory.upsert({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoUrl,
    })
  }, [user])

  return <>{children}</>
}
