import { Outlet, createFileRoute } from '@tanstack/react-router'
import { RequireAuth } from '@/features/auth'

export const Route = createFileRoute('/workspace/$workspaceId')({
  component: () => (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  ),
})
