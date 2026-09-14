import { createEnvironmentService } from './application/environment-service'
import { firestoreEnvironmentGateway } from './infrastructure/firestore-environment-gateway'

export const environmentService = createEnvironmentService(firestoreEnvironmentGateway)
