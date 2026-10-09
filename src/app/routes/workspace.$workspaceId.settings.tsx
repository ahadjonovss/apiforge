import { createFileRoute } from '@tanstack/react-router'
import { WorkspaceSettingsPage } from '@/features/workspaces/presentation/workspace-settings-page'

export const Route = createFileRoute('/workspace/$workspaceId/settings')({
  component: function WorkspaceSettingsRoute() {
    const { workspaceId } = Route.useParams()
    return <WorkspaceSettingsPage workspaceId={workspaceId} />
  },
})
