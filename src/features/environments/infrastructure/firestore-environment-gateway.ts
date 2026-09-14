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
import { stripUndefined } from '@/core/lib/plain'
import type { EnvVariable, Environment } from '../domain/environment'
import type { EnvironmentGateway, EnvironmentPatch } from '../domain/environment-gateway'

const WORKSPACES = 'workspaces'
const ENVIRONMENTS = 'environments'

function toVariable(data: DocumentData): EnvVariable {
  return {
    id: data.id ?? newId(),
    key: data.key ?? '',
    value: data.value ?? '',
    enabled: data.enabled ?? true,
    secret: data.secret ?? false,
  }
}

function toEnvironment(workspaceId: string, id: string, data: DocumentData): Environment {
  const variables: DocumentData[] = Array.isArray(data.variables) ? data.variables : []
  return {
    id,
    workspaceId,
    name: data.name ?? '',
    variables: variables.map(toVariable),
    updatedAt: data.updatedAt ?? 0,
  }
}

export const firestoreEnvironmentGateway: EnvironmentGateway = {
  async list(workspaceId) {
    try {
      const snapshot = await getDocs(collection(db, WORKSPACES, workspaceId, ENVIRONMENTS))
      return snapshot.docs
        .map((entry) => toEnvironment(workspaceId, entry.id, entry.data()))
        .sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async create(workspaceId, name) {
    try {
      const id = newId()
      const now = Date.now()
      const created: Environment = { id, workspaceId, name, variables: [], updatedAt: now }

      await setDoc(
        doc(db, WORKSPACES, workspaceId, ENVIRONMENTS, id),
        stripUndefined({ name, variables: [], createdAt: now, updatedAt: now }),
      )

      return created
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async update(workspaceId, environmentId, patch: EnvironmentPatch) {
    try {
      await updateDoc(
        doc(db, WORKSPACES, workspaceId, ENVIRONMENTS, environmentId),
        stripUndefined({ ...patch, updatedAt: Date.now() }),
      )
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async remove(workspaceId, environmentId) {
    try {
      await deleteDoc(doc(db, WORKSPACES, workspaceId, ENVIRONMENTS, environmentId))
    } catch (error) {
      throw toDataFailure(error)
    }
  },
}
