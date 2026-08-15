import { createFileRoute } from '@tanstack/react-router'
import { RequireAuth } from '@/features/auth'
import { HomePage } from '@/features/workspaces/presentation/home-page'

export const Route = createFileRoute('/workspaces')({
  component: () => (
    <RequireAuth>
      <HomePage />
    </RequireAuth>
  ),
})
