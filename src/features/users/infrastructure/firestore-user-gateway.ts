import {
  collection,
  doc,
  documentId,
  getDocs,
  limit,
  query,
  setDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/core/config/firebase'
import type { DirectoryUser } from '../domain/directory-user'
import type { UserGateway } from '../domain/user-gateway'

const USERS = 'users'

function toUser(id: string, data: DocumentData): DirectoryUser {
  return {
    id,
    email: data.email ?? '',
    displayName: data.displayName ?? null,
    photoUrl: data.photoUrl ?? null,
    updatedAt: data.updatedAt ?? 0,
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }
  return result
}

export const firestoreUserGateway: UserGateway = {
  async upsert(user) {
    await setDoc(
      doc(db, USERS, user.id),
      {
        email: user.email.toLowerCase(),
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        updatedAt: Date.now(),
      },
      { merge: true },
    )
  },

  async findByEmail(email) {
    const snapshot = await getDocs(
      query(collection(db, USERS), where('email', '==', email.trim().toLowerCase()), limit(1)),
    )
    const found = snapshot.docs[0]
    return found ? toUser(found.id, found.data()) : null
  },

  async findByIds(ids) {
    if (ids.length === 0) return []

    const batches = await Promise.all(
      chunk([...new Set(ids)], 30).map((group) =>
        getDocs(query(collection(db, USERS), where(documentId(), 'in', group))),
      ),
    )

    return batches.flatMap((snapshot) =>
      snapshot.docs.map((entry) => toUser(entry.id, entry.data())),
    )
  },
}
