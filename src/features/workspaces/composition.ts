import { firestoreUserGateway } from '@/features/users/infrastructure/firestore-user-gateway'
import { createTeamService } from './application/team-service'
import { createWorkspaceService } from './application/workspace-service'
import { firestoreTeamGateway } from './infrastructure/firestore-team-gateway'
import { firestoreWorkspaceGateway } from './infrastructure/firestore-workspace-gateway'

export const workspaceService = createWorkspaceService(
  firestoreWorkspaceGateway,
  firestoreUserGateway,
)

export const teamService = createTeamService(firestoreTeamGateway)
