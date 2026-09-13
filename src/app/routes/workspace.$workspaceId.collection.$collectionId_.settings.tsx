import { createFileRoute } from '@tanstack/react-router'
import { CollectionSettingsPage } from '@/features/collections/presentation/collection-settings-page'

export const Route = createFileRoute(
  '/workspace/$workspaceId/collection/$collectionId_/settings',
)({
  component: function CollectionSettingsRoute() {
    const { workspaceId, collectionId } = Route.useParams()
    return <CollectionSettingsPage workspaceId={workspaceId} collectionId={collectionId} />
  },
})
