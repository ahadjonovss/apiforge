import { firestoreUserGateway } from './infrastructure/firestore-user-gateway'

export const userDirectory = firestoreUserGateway

export type { DirectoryUser } from './domain/directory-user'
export type { UserGateway } from './domain/user-gateway'
