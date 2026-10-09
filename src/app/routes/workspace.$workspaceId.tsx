import { useEffect } from 'react'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { RequireAuth } from '@/features/auth'
import { useEnvironmentsStore } from '@/features/environments'

function WorkspaceScope({ workspaceId }: { workspaceId: string }) {
  const loadEnvironments = useEnvironmentsStore((state) => state.load)

  useEffect(() => {
    void loadEnvironments(workspaceId)
  }, [workspaceId, loadEnvironments])

  return <Outlet />
}

export const Route = createFileRoute('/workspace/$workspaceId')({
  component: function WorkspaceLayout() {
    const { workspaceId } = Route.useParams()
    return (
      <RequireAuth>
        <WorkspaceScope workspaceId={workspaceId} />
      </RequireAuth>
    )
  },
})
