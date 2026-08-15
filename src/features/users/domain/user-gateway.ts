import type { DirectoryUser } from './directory-user'

export interface UserGateway {
  upsert(user: Omit<DirectoryUser, 'updatedAt'>): Promise<void>
  findByEmail(email: string): Promise<DirectoryUser | null>
  findByIds(ids: string[]): Promise<DirectoryUser[]>
}
