import { create } from 'zustand'
import { authService } from '../composition'
import { AuthFailure, type AuthErrorDetail } from '../domain/auth-error'
import type { ProfilePatch, SignUpInput } from '../domain/auth-gateway'
import type { AuthUser } from '../domain/user'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

const RESOLVE_TIMEOUT_MS = 5_000

interface AuthState {
  user: AuthUser | null
  status: AuthStatus
  pending: boolean
  error: AuthErrorDetail | null
  init: () => () => void
  clearError: () => void
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (input: SignUpInput) => Promise<boolean>
  signOut: () => Promise<void>
  updateProfile: (patch: ProfilePatch) => Promise<boolean>
  changePassword: (currentPassword: string, nextPassword: string) => Promise<boolean>
  sendPasswordReset: (email: string) => Promise<boolean>
  sendEmailVerification: () => Promise<boolean>
}

function toDetail(error: unknown): AuthErrorDetail {
  return error instanceof AuthFailure
    ? error.detail
    : { kind: 'unknown', message: String(error) }
}

export const useAuthStore = create<AuthState>((set, get) => {
  async function run(action: () => Promise<void>): Promise<boolean> {
    if (get().pending) return false
    set({ pending: true, error: null })
    try {
      await action()
      set({ pending: false })
      return true
    } catch (error) {
      set({ pending: false, error: toDetail(error) })
      return false
    }
  }

  return {
    user: null,
    status: 'loading',
    pending: false,
    error: null,

    init: () => {
      const timeout = setTimeout(() => {
        if (get().status === 'loading') set({ status: 'anonymous' })
      }, RESOLVE_TIMEOUT_MS)

      const unsubscribe = authService.observe((user) => {
        clearTimeout(timeout)
        set({ user, status: user ? 'authenticated' : 'anonymous' })
      })

      return () => {
        clearTimeout(timeout)
        unsubscribe()
      }
    },

    clearError: () => set({ error: null }),

    signIn: (email, password) =>
      run(async () => {
        await authService.signIn({ email, password })
      }),

    signUp: (input) =>
      run(async () => {
        const user = await authService.signUp(input)
        set({ user })
      }),

    signOut: async () => {
      await run(async () => {
        await authService.signOut()
      })
    },

    updateProfile: (patch) =>
      run(async () => {
        const user = await authService.updateProfile(patch)
        set({ user })
      }),

    changePassword: (currentPassword, nextPassword) =>
      run(async () => {
        await authService.changePassword(currentPassword, nextPassword)
      }),

    sendPasswordReset: (email) =>
      run(async () => {
        await authService.sendPasswordReset(email)
      }),

    sendEmailVerification: () =>
      run(async () => {
        await authService.sendEmailVerification()
      }),
  }
})
