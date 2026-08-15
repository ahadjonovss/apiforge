import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth } from '@/core/config/firebase'
import { AuthFailure, type AuthErrorKind } from '../domain/auth-error'
import type {
  AuthGateway,
  Credentials,
  ProfilePatch,
  SignUpInput,
} from '../domain/auth-gateway'
import type { AuthUser } from '../domain/user'

const ERROR_MAP: Record<string, { kind: AuthErrorKind; message: string }> = {
  'auth/invalid-credential': {
    kind: 'invalid-credentials',
    message: 'auth.error.invalid-credentials',
  },
  'auth/invalid-login-credentials': {
    kind: 'invalid-credentials',
    message: 'auth.error.invalid-credentials',
  },
  'auth/user-not-found': {
    kind: 'invalid-credentials',
    message: 'auth.error.userNotFound',
  },
  'auth/wrong-password': {
    kind: 'invalid-credentials',
    message: 'auth.error.invalid-credentials',
  },
  'auth/email-already-in-use': {
    kind: 'email-in-use',
    message: 'auth.error.email-in-use',
  },
  'auth/weak-password': {
    kind: 'weak-password',
    message: 'auth.error.weak-password',
  },
  'auth/invalid-email': {
    kind: 'invalid-email',
    message: 'auth.error.invalid-email',
  },
  'auth/user-disabled': {
    kind: 'user-disabled',
    message: 'auth.error.user-disabled',
  },
  'auth/too-many-requests': {
    kind: 'too-many-requests',
    message: 'auth.error.too-many-requests',
  },
  'auth/requires-recent-login': {
    kind: 'requires-recent-login',
    message: 'auth.error.requires-recent-login',
  },
  'auth/network-request-failed': {
    kind: 'network',
    message: 'auth.error.network',
  },
  'auth/operation-not-allowed': {
    kind: 'unknown',
    message: 'auth.error.not-enabled',
  },
}

function toFailure(error: unknown): AuthFailure {
  if (error instanceof AuthFailure) return error

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''

  const mapped = ERROR_MAP[code]
  if (mapped) return new AuthFailure(mapped)

  return new AuthFailure({
    kind: 'unknown',
    message: error instanceof Error ? error.message : 'auth.error.unknown',
  })
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoUrl: user.photoURL,
    emailVerified: user.emailVerified,
    createdAt: user.metadata.creationTime
      ? new Date(user.metadata.creationTime).getTime()
      : null,
    lastSignInAt: user.metadata.lastSignInTime
      ? new Date(user.metadata.lastSignInTime).getTime()
      : null,
  }
}

function requireUser(): User {
  const user = auth.currentUser
  if (!user) {
    throw new AuthFailure({ kind: 'requires-recent-login', message: 'auth.error.signInFirst' })
  }
  return user
}

export const firebaseAuthGateway: AuthGateway = {
  async signIn({ email, password }: Credentials) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return toAuthUser(result.user)
    } catch (error) {
      throw toFailure(error)
    }
  },

  async signUp({ email, password, displayName }: SignUpInput) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName })
      await result.user.reload()
      return toAuthUser(auth.currentUser ?? result.user)
    } catch (error) {
      throw toFailure(error)
    }
  },

  async signOut() {
    try {
      await signOut(auth)
    } catch (error) {
      throw toFailure(error)
    }
  },

  observe(listener) {
    return onAuthStateChanged(auth, (user) => listener(user ? toAuthUser(user) : null))
  },

  currentUser() {
    return auth.currentUser ? toAuthUser(auth.currentUser) : null
  },

  async updateProfile(patch: ProfilePatch) {
    const user = requireUser()
    try {
      await updateProfile(user, {
        ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
        ...(patch.photoUrl !== undefined ? { photoURL: patch.photoUrl || null } : {}),
      })
      await user.reload()
      return toAuthUser(auth.currentUser ?? user)
    } catch (error) {
      throw toFailure(error)
    }
  },

  async changePassword(currentPassword: string, nextPassword: string) {
    const user = requireUser()
    if (!user.email) {
      throw new AuthFailure({
        kind: 'unknown',
        message: 'auth.error.no-email',
      })
    }
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, nextPassword)
    } catch (error) {
      throw toFailure(error)
    }
  },

  async sendPasswordReset(email: string) {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      throw toFailure(error)
    }
  },

  async sendEmailVerification() {
    const user = requireUser()
    try {
      await sendEmailVerification(user)
    } catch (error) {
      throw toFailure(error)
    }
  },
}
