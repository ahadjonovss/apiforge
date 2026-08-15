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
    message: "Email yoki parol noto'g'ri",
  },
  'auth/invalid-login-credentials': {
    kind: 'invalid-credentials',
    message: "Email yoki parol noto'g'ri",
  },
  'auth/user-not-found': {
    kind: 'invalid-credentials',
    message: 'Bunday foydalanuvchi topilmadi',
  },
  'auth/wrong-password': {
    kind: 'invalid-credentials',
    message: "Parol noto'g'ri",
  },
  'auth/email-already-in-use': {
    kind: 'email-in-use',
    message: 'Bu email allaqachon ro‘yxatdan o‘tgan',
  },
  'auth/weak-password': {
    kind: 'weak-password',
    message: 'Parol juda oddiy',
  },
  'auth/invalid-email': {
    kind: 'invalid-email',
    message: "Email manzil noto'g'ri",
  },
  'auth/user-disabled': {
    kind: 'user-disabled',
    message: 'Bu hisob bloklangan',
  },
  'auth/too-many-requests': {
    kind: 'too-many-requests',
    message: 'Juda ko‘p urinish. Biroz kutib, qayta urinib ko‘ring',
  },
  'auth/requires-recent-login': {
    kind: 'requires-recent-login',
    message: 'Xavfsizlik uchun qaytadan kiring va amalni takrorlang',
  },
  'auth/network-request-failed': {
    kind: 'network',
    message: 'Tarmoqqa ulanib bo‘lmadi',
  },
  'auth/operation-not-allowed': {
    kind: 'unknown',
    message: 'Email/parol usuli Firebase konsolida yoqilmagan',
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
    message: error instanceof Error ? error.message : 'Noma’lum xatolik',
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
    throw new AuthFailure({ kind: 'requires-recent-login', message: 'Avval tizimga kiring' })
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
        message: 'Bu hisobda email yo‘q, parolni almashtirib bo‘lmaydi',
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
