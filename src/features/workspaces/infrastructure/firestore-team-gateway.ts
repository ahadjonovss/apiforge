import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/core/config/firebase'
import { toDataFailure } from '@/core/domain/data-error'
import { newId } from '@/core/lib/id'
import type { Team, TeamRole } from '../domain/team'
import type { CreateTeamInput, TeamGateway } from '../domain/workspace-gateway'

const WORKSPACES = 'workspaces'
const TEAMS = 'teams'

function toMembers(data: DocumentData): Record<string, TeamRole> {
  if (data.members && typeof data.members === 'object') {
    return data.members as Record<string, TeamRole>
  }
  const legacy: string[] = data.memberIds ?? []
  return Object.fromEntries(legacy.map((id) => [id, 'member' as TeamRole]))
}

function toTeam(workspaceId: string, id: string, data: DocumentData): Team {
  return {
    id,
    workspaceId,
    name: data.name ?? '',
    description: data.description ?? '',
    members: toMembers(data),
    createdAt: data.createdAt ?? 0,
    updatedAt: data.updatedAt ?? 0,
  }
}

export const firestoreTeamGateway: TeamGateway = {
  async list(workspaceId) {
    try {
      const snapshot = await getDocs(collection(db, WORKSPACES, workspaceId, TEAMS))
      return snapshot.docs
        .map((entry) => toTeam(workspaceId, entry.id, entry.data()))
        .sort((a, b) => a.createdAt - b.createdAt)
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async create({ workspaceId, name, description }: CreateTeamInput) {
    try {
      const id = newId()
      const now = Date.now()
      const team: Team = {
        id,
        workspaceId,
        name,
        description,
        members: {},
        createdAt: now,
        updatedAt: now,
      }

      await setDoc(doc(db, WORKSPACES, workspaceId, TEAMS, id), {
        name: team.name,
        description: team.description,
        members: team.members,
        createdAt: now,
        updatedAt: now,
      })

      return team
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async rename(workspaceId, teamId, name, description) {
    try {
      await updateDoc(doc(db, WORKSPACES, workspaceId, TEAMS, teamId), {
        name,
        description,
        updatedAt: Date.now(),
      })
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async remove(workspaceId, teamId) {
    try {
      await deleteDoc(doc(db, WORKSPACES, workspaceId, TEAMS, teamId))
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async setMembers(workspaceId, teamId, members) {
    try {
      await updateDoc(doc(db, WORKSPACES, workspaceId, TEAMS, teamId), {
        members,
        updatedAt: Date.now(),
      })
    } catch (error) {
      throw toDataFailure(error)
    }
  },
}
