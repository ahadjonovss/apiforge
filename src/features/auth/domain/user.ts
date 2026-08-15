export interface AuthUser {
  id: string
  email: string | null
  displayName: string | null
  photoUrl: string | null
  emailVerified: boolean
  createdAt: number | null
  lastSignInAt: number | null
}
