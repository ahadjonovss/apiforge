export type AuthErrorKind =
  | 'invalid-credentials'
  | 'email-in-use'
  | 'weak-password'
  | 'invalid-email'
  | 'user-disabled'
  | 'too-many-requests'
  | 'requires-recent-login'
  | 'network'
  | 'validation'
  | 'unknown'

export interface AuthErrorDetail {
  kind: AuthErrorKind
  message: string
}

export class AuthFailure extends Error {
  readonly detail: AuthErrorDetail

  constructor(detail: AuthErrorDetail) {
    super(detail.message)
    this.name = 'AuthFailure'
    this.detail = detail
  }
}
