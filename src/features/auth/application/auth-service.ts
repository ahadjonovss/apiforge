import { AuthFailure } from '../domain/auth-error'
import type {
  AuthGateway,
  Credentials,
  ProfilePatch,
  SignUpInput,
} from '../domain/auth-gateway'
import type { AuthUser } from '../domain/user'
import {
  displayNameSchema,
  emailSchema,
  passwordSchema,
  signInSchema,
} from './schemas'

function assert<T>(result: { success: boolean; data?: T; error?: { issues: { message: string }[] } }) {
  if (!result.success) {
    throw new AuthFailure({
      kind: 'validation',
      message: result.error?.issues[0]?.message ?? "Ma'lumot noto'g'ri",
    })
  }
  return result.data as T
}

export function createAuthService(gateway: AuthGateway) {
  return {
    async signIn(credentials: Credentials): Promise<AuthUser> {
      const parsed = assert(signInSchema.safeParse(credentials))
      return gateway.signIn(parsed)
    },

    async signUp(input: SignUpInput): Promise<AuthUser> {
      assert(displayNameSchema.safeParse(input.displayName))
      assert(emailSchema.safeParse(input.email))
      assert(passwordSchema.safeParse(input.password))
      return gateway.signUp({ ...input, displayName: input.displayName.trim() })
    },

    signOut(): Promise<void> {
      return gateway.signOut()
    },

    observe(listener: (user: AuthUser | null) => void) {
      return gateway.observe(listener)
    },

    currentUser(): AuthUser | null {
      return gateway.currentUser()
    },

    async updateProfile(patch: ProfilePatch): Promise<AuthUser> {
      if (patch.displayName !== undefined) {
        assert(displayNameSchema.safeParse(patch.displayName))
      }
      return gateway.updateProfile({
        ...patch,
        displayName: patch.displayName?.trim(),
      })
    },

    async changePassword(currentPassword: string, nextPassword: string): Promise<void> {
      assert(passwordSchema.safeParse(nextPassword))
      if (currentPassword === nextPassword) {
        throw new AuthFailure({
          kind: 'validation',
          message: 'Yangi parol joriysidan farq qilishi kerak',
        })
      }
      return gateway.changePassword(currentPassword, nextPassword)
    },

    async sendPasswordReset(email: string): Promise<void> {
      assert(emailSchema.safeParse(email))
      return gateway.sendPasswordReset(email)
    },

    sendEmailVerification(): Promise<void> {
      return gateway.sendEmailVerification()
    },
  }
}

export type AuthService = ReturnType<typeof createAuthService>
