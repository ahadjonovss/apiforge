export interface LookedUpUser {
  id: string
  email: string
  displayName: string | null
  photoUrl: string | null
}

export interface UserLookup {
  findByEmail(email: string): Promise<LookedUpUser | null>
  findByIds(ids: string[]): Promise<LookedUpUser[]>
}
