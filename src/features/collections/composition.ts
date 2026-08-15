import { createCollectionService } from './application/collection-service'
import { firestoreCollectionGateway } from './infrastructure/firestore-collection-gateway'

export const collectionService = createCollectionService(firestoreCollectionGateway)
