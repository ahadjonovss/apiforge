import type { AuthUser } from './user'

export interface Credentials {
  email: string
  password: string
}

export interface SignUpInput extends Credentials {
  displayName: string
}

export interface ProfilePatch {
  displayName?: string
  photoUrl?: string
}

export interface AuthGateway {
  signIn(credentials: Credentials): Promise<AuthUser>
  signUp(input: SignUpInput): Promise<AuthUser>
  signOut(): Promise<void>
  observe(listener: (user: AuthUser | null) => void): () => void
  currentUser(): AuthUser | null
  updateProfile(patch: ProfilePatch): Promise<AuthUser>
  changePassword(currentPassword: string, nextPassword: string): Promise<void>
  sendPasswordReset(email: string): Promise<void>
  sendEmailVerification(): Promise<void>
}
