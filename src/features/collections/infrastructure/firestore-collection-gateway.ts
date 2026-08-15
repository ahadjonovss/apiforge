import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/core/config/firebase'
import { toDataFailure } from '@/core/domain/data-error'
import { newId } from '@/core/lib/id'
import { stripUndefined } from '@/core/lib/plain'
import { createRequest } from '@/features/request/application/request-factory'
import type { RequestDef } from '@/features/request/domain/request'
import type { ApiCollection } from '../domain/collection'
import type {
  CollectionGateway,
  CollectionPatch,
  CreateCollectionInput,
} from '../domain/collection-gateway'

const WORKSPACES = 'workspaces'
const COLLECTIONS = 'collections'
const ENDPOINTS = 'endpoints'

function toCollection(workspaceId: string, id: string, data: DocumentData): ApiCollection {
  return {
    id,
    workspaceId,
    teamId: data.teamId ?? null,
    name: data.name ?? '',
    description: data.description ?? '',
    baseUrl: data.baseUrl ?? '',
    headers: data.headers ?? [],
    auth: data.auth ?? { mode: 'none' },
    variables: data.variables ?? [],
    createdAt: data.createdAt ?? 0,
    updatedAt: data.updatedAt ?? 0,
  }
}

function toEndpoint(id: string, data: DocumentData): RequestDef {
  return createRequest({ ...(data as Partial<RequestDef>), id })
}

export const firestoreCollectionGateway: CollectionGateway = {
  async list(workspaceId) {
    try {
      const snapshot = await getDocs(collection(db, WORKSPACES, workspaceId, COLLECTIONS))
      return snapshot.docs
        .map((entry) => toCollection(workspaceId, entry.id, entry.data()))
        .sort((a, b) => a.createdAt - b.createdAt)
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async get(workspaceId, collectionId) {
    try {
      const snapshot = await getDoc(doc(db, WORKSPACES, workspaceId, COLLECTIONS, collectionId))
      return snapshot.exists()
        ? toCollection(workspaceId, snapshot.id, snapshot.data())
        : null
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async create({ workspaceId, teamId, name, description }: CreateCollectionInput) {
    try {
      const id = newId()
      const now = Date.now()
      const created: ApiCollection = {
        id,
        workspaceId,
        teamId,
        name,
        description,
        baseUrl: '',
        headers: [],
        auth: { mode: 'none' },
        variables: [],
        createdAt: now,
        updatedAt: now,
      }

      await setDoc(
        doc(db, WORKSPACES, workspaceId, COLLECTIONS, id),
        stripUndefined({
          teamId: created.teamId,
          name: created.name,
          description: created.description,
          baseUrl: created.baseUrl,
          headers: created.headers,
          auth: created.auth,
          variables: created.variables,
          createdAt: now,
          updatedAt: now,
        }),
      )

      return created
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async update(workspaceId, collectionId, patch: CollectionPatch) {
    try {
      await updateDoc(
        doc(db, WORKSPACES, workspaceId, COLLECTIONS, collectionId),
        stripUndefined({ ...patch, updatedAt: Date.now() }),
      )
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async remove(workspaceId, collectionId) {
    try {
      const endpoints = await getDocs(
        collection(db, WORKSPACES, workspaceId, COLLECTIONS, collectionId, ENDPOINTS),
      )
      await Promise.all(endpoints.docs.map((entry) => deleteDoc(entry.ref)))
      await deleteDoc(doc(db, WORKSPACES, workspaceId, COLLECTIONS, collectionId))
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async listEndpoints(workspaceId, collectionId) {
    try {
      const snapshot = await getDocs(
        collection(db, WORKSPACES, workspaceId, COLLECTIONS, collectionId, ENDPOINTS),
      )
      return snapshot.docs
        .map((entry) => toEndpoint(entry.id, entry.data()))
        .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt)
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async saveEndpoint(workspaceId, collectionId, endpoint) {
    try {
      await setDoc(
        doc(db, WORKSPACES, workspaceId, COLLECTIONS, collectionId, ENDPOINTS, endpoint.id),
        stripUndefined({ ...endpoint, collectionId, updatedAt: Date.now() }),
      )
    } catch (error) {
      throw toDataFailure(error)
    }
  },

  async removeEndpoint(workspaceId, collectionId, endpointId) {
    try {
      await deleteDoc(
        doc(db, WORKSPACES, workspaceId, COLLECTIONS, collectionId, ENDPOINTS, endpointId),
      )
    } catch (error) {
      throw toDataFailure(error)
    }
  },
}
