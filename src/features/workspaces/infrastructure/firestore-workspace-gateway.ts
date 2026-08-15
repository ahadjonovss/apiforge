import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/core/config/firebase'
import { toDataFailure } from '@/core/domain/data-error'
import { newId } from '@/core/lib/id'
import type {
  AddMemberInput,
  CreateWorkspaceInput,
  WorkspaceGateway,
} from '../domain/workspace-gateway'
import type { Workspace, WorkspaceMember } from '../domain/workspace'

const WORKSPACES = 'workspaces'
const MEMBERS = 'members'

function toWorkspace(id: string, data: DocumentData): Workspace {
  return {
    id,
    name: data.name ?? '',
    description: data.description ?? '',
    docs: data.docs ?? '',
    ownerId: data.ownerId ?? '',
    memberIds: data.memberIds ?? [],
    createdAt: data.createdAt ?? 0,
    updatedAt: data.updatedAt ?? 0,
  }
}

function toMember(id: string, data: DocumentData): WorkspaceMember {
  return {
    id,
    userId: data.userId ?? id,
    email: data.email ?? '',
    displayName: data.displayName ?? null,
    photoUrl: data.photoUrl ?? null,
    role: data.role ?? 'member',
    joinedAt: data.joinedAt ?? 0,
  }
}

export const firestoreWorkspaceGateway: WorkspaceGateway = {
  async listForUser(userId) {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, WORKSPACES),
          where('memberIds', 'array-contains', userId),
          orderBy('createdAt', 'desc'),
        ),
      )
      return snapshot.docs.map((entry) => toWorkspace(entry.id, entry.data()))
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async get(workspaceId) {
    try {
      const snapshot = await getDoc(doc(db, WORKSPACES, workspaceId))
      return snapshot.exists() ? toWorkspace(snapshot.id, snapshot.data()) : null
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async create({ name, description, owner }: CreateWorkspaceInput) {
    try {
      const id = newId()
      const now = Date.now()
      const workspace: Workspace = {
        id,
        name,
        description,
        docs: '',
        ownerId: owner.id,
        memberIds: [owner.id],
        createdAt: now,
        updatedAt: now,
      }

      await setDoc(doc(db, WORKSPACES, id), {
        name: workspace.name,
        description: workspace.description,
        docs: workspace.docs,
        ownerId: workspace.ownerId,
        memberIds: workspace.memberIds,
        createdAt: now,
        updatedAt: now,
      })

      await setDoc(doc(db, WORKSPACES, id, MEMBERS, owner.id), {
        userId: owner.id,
        email: owner.email,
        displayName: owner.displayName,
        photoUrl: owner.photoUrl,
        role: 'owner',
        joinedAt: now,
      })

      return workspace
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async rename(workspaceId, name, description) {
    try {
      await updateDoc(doc(db, WORKSPACES, workspaceId), {
        name,
        description,
        updatedAt: Date.now(),
      })
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async remove(workspaceId) {
    try {
      await deleteDoc(doc(db, WORKSPACES, workspaceId))
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async saveDocs(workspaceId, docs) {
    try {
      await updateDoc(doc(db, WORKSPACES, workspaceId), { docs, updatedAt: Date.now() })
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async listMembers(workspaceId) {
    try {
      const snapshot = await getDocs(collection(db, WORKSPACES, workspaceId, MEMBERS))
      return snapshot.docs
        .map((entry) => toMember(entry.id, entry.data()))
        .sort((a, b) => a.joinedAt - b.joinedAt)
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async addMember({ workspaceId, user, role }: AddMemberInput) {
    try {
      const now = Date.now()
      const member: WorkspaceMember = {
        id: user.id,
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        role,
        joinedAt: now,
      }

      await setDoc(doc(db, WORKSPACES, workspaceId, MEMBERS, user.id), {
        userId: member.userId,
        email: member.email,
        displayName: member.displayName,
        photoUrl: member.photoUrl,
        role: member.role,
        joinedAt: now,
      })

      await updateDoc(doc(db, WORKSPACES, workspaceId), {
        memberIds: arrayUnion(user.id),
        updatedAt: now,
      })

      return member
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async removeMember(workspaceId, userId) {
    try {
      await deleteDoc(doc(db, WORKSPACES, workspaceId, MEMBERS, userId))
      await updateDoc(doc(db, WORKSPACES, workspaceId), {
        memberIds: arrayRemove(userId),
        updatedAt: Date.now(),
      })
    } catch (error) {
      throw toDataFailure(error)
    }
  },
}
