import { createFileRoute } from '@tanstack/react-router'
import { WorkspacePage } from '@/features/workspaces/presentation/workspace-page'

export const Route = createFileRoute('/workspace/$workspaceId/')({
  component: function WorkspaceRoute() {
    const { workspaceId } = Route.useParams()
    return <WorkspacePage workspaceId={workspaceId} />
  },
})
