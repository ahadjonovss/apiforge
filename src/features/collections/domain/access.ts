import type { ApiCollection } from './collection'

export type CollectionRole = 'viewer' | 'editor' | 'admin'

export const COLLECTION_ROLES: CollectionRole[] = ['viewer', 'editor', 'admin']

export type SubjectType = 'team' | 'user'

export interface AccessSubject {
  type: SubjectType
  id: string
}

export interface AccessGrant {
  role: CollectionRole
  addedAt: number
  addedBy: string
}

export interface AccessEntry {
  subject: AccessSubject
  grant: AccessGrant
}

export interface SubjectGrant {
  collection: ApiCollection
  grant: AccessGrant
  viaTeamId: string | null
}

export function grantKey(subject: AccessSubject): string {
  return `${subject.type}:${subject.id}`
}

export function parseGrantKey(key: string): AccessSubject | null {
  const separator = key.indexOf(':')
  if (separator < 1) return null
  const type = key.slice(0, separator)
  const id = key.slice(separator + 1)
  if (!id || (type !== 'team' && type !== 'user')) return null
  return { type, id }
}

export function accessEntries(collection: ApiCollection): AccessEntry[] {
  return Object.entries(collection.access)
    .map(([key, grant]) => {
      const subject = parseGrantKey(key)
      return subject ? { subject, grant } : null
    })
    .filter((entry): entry is AccessEntry => entry !== null)
    .sort((a, b) => a.grant.addedAt - b.grant.addedAt)
}

export function grantOf(
  collection: ApiCollection,
  subject: AccessSubject,
): AccessGrant | null {
  return collection.access[grantKey(subject)] ?? null
}

export function grantsForSubject(
  collections: ApiCollection[],
  subject: AccessSubject,
  teamIds: string[] = [],
): SubjectGrant[] {
  const result: SubjectGrant[] = []

  for (const item of collections) {
    const direct = grantOf(item, subject)
    if (direct) {
      result.push({ collection: item, grant: direct, viaTeamId: null })
      continue
    }

    if (subject.type !== 'user') continue

    for (const teamId of teamIds) {
      const inherited = grantOf(item, { type: 'team', id: teamId })
      if (inherited) {
        result.push({ collection: item, grant: inherited, viaTeamId: teamId })
        break
      }
    }
  }

  return result.sort((a, b) => a.grant.addedAt - b.grant.addedAt)
}
