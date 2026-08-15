import { createFileRoute } from '@tanstack/react-router'
import { RequireAuth } from '@/features/auth'
import { ProfilePage } from '@/features/profile/presentation/profile-page'

export const Route = createFileRoute('/profile')({
  component: () => (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  ),
})
