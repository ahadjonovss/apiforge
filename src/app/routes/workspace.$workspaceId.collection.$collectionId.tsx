import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '@/features/collections/presentation/collection-page'

export const Route = createFileRoute('/workspace/$workspaceId/collection/$collectionId')({
  component: function CollectionRoute() {
    const { workspaceId, collectionId } = Route.useParams()
    return <CollectionPage workspaceId={workspaceId} collectionId={collectionId} />
  },
})
