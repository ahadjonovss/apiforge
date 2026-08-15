import { createAuthService } from './application/auth-service'
import { firebaseAuthGateway } from './infrastructure/firebase-auth-gateway'

export const authService = createAuthService(firebaseAuthGateway)
