import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, BadgeCheck, KeyRound, LogOut, MailWarning, Save } from 'lucide-react'
import { formatDateTime } from '@/core/lib/format'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { useAuthStore } from '@/features/auth'
import {
  passwordChangeSchema,
  profileSchema,
  type PasswordChangeValues,
  type ProfileValues,
} from '@/features/auth/application/schemas'
import { AuthErrorNote, AuthSuccessNote } from '@/features/auth/presentation/auth-error-note'
import { useT } from '@/app/providers/i18n-provider'

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function IdentityCard() {
  const t = useT()
  const user = useAuthStore((state) => state.user)
  const pending = useAuthStore((state) => state.pending)
  const sendEmailVerification = useAuthStore((state) => state.sendEmailVerification)
  const [notice, setNotice] = useState<string | null>(null)

  if (!user) return null

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-4">
        {user.photoUrl ? (
          <img src={user.photoUrl} alt="" className="size-14 rounded-full object-cover" />
        ) : (
          <span className="flex size-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {(user.displayName || user.email || '?')[0]?.toUpperCase()}
          </span>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user.displayName || t('profile.noName')}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <span className="mt-1 inline-flex items-center gap-1 text-[11px]">
            {user.emailVerified ? (
              <>
                <BadgeCheck className="size-3 text-status-success" />
                <span className="text-status-success">{t('profile.emailVerified')}</span>
              </>
            ) : (
              <>
                <MailWarning className="size-3 text-status-redirect" />
                <span className="text-status-redirect">{t('profile.emailNotVerified')}</span>
              </>
            )}
          </span>
        </div>
      </div>

      <dl className="mt-5 grid gap-2 border-t border-border pt-4 text-xs">
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <dt className="text-muted-foreground">{t('profile.userId')}</dt>
          <dd className="truncate font-mono text-[11px]">{user.id}</dd>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <dt className="text-muted-foreground">{t('profile.createdAt')}</dt>
          <dd>{formatDateTime(user.createdAt)}</dd>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <dt className="text-muted-foreground">{t('profile.lastSignIn')}</dt>
          <dd>{formatDateTime(user.lastSignInAt)}</dd>
        </div>
      </dl>

      {!user.emailVerified && (
        <div className="mt-4 flex flex-col gap-2">
          <AuthSuccessNote message={notice} />
          <Button
            variant="outline"
            size="sm"
            loading={pending}
            onClick={async () => {
              if (await sendEmailVerification()) {
                setNotice(t('profile.verificationSent'))
              }
            }}
          >
            {t('profile.sendVerification')}
          </Button>
        </div>
      )}
    </section>
  )
}

function ProfileForm() {
  const t = useT()
  const user = useAuthStore((state) => state.user)
  const pending = useAuthStore((state) => state.pending)
  const error = useAuthStore((state) => state.error)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const [notice, setNotice] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      displayName: user?.displayName ?? '',
      photoUrl: user?.photoUrl ?? '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setNotice(null)
    if (await updateProfile({ displayName: values.displayName, photoUrl: values.photoUrl })) {
      setNotice(t('profile.updated'))
      reset(values)
    }
  })

  return (
    <Section title={t('profile.info')} description={t('profile.infoHint')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <TextField
          label={t('auth.fullName')}
          autoComplete="name"
          error={t(errors.displayName?.message as never)}
          {...register('displayName')}
        />
        <TextField
          label={t('profile.avatarUrl')}
          placeholder="https://…"
          hint={t('profile.avatarHint')}
          error={t(errors.photoUrl?.message as never)}
          {...register('photoUrl')}
        />

        {error?.kind === 'validation' && <AuthErrorNote error={error} />}
        <AuthSuccessNote message={notice} />

        <div>
          <Button type="submit" size="sm" loading={pending} disabled={!isDirty}>
            <Save className="size-3.5" />
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Section>
  )
}

function PasswordForm() {
  const t = useT()
  const pending = useAuthStore((state) => state.pending)
  const error = useAuthStore((state) => state.error)
  const changePassword = useAuthStore((state) => state.changePassword)
  const [notice, setNotice] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setNotice(null)
    if (await changePassword(values.currentPassword, values.newPassword)) {
      setNotice(t('profile.passwordChanged'))
      reset()
    }
  })

  return (
    <Section title={t('profile.password')} description={t('profile.passwordHint')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <TextField
          label={t('profile.currentPassword')}
          type="password"
          autoComplete="current-password"
          error={t(errors.currentPassword?.message as never)}
          {...register('currentPassword')}
        />
        <TextField
          label={t('profile.newPassword')}
          type="password"
          autoComplete="new-password"
          hint={t('auth.passwordHint')}
          error={t(errors.newPassword?.message as never)}
          {...register('newPassword')}
        />
        <TextField
          label={t('profile.confirmNewPassword')}
          type="password"
          autoComplete="new-password"
          error={t(errors.confirmPassword?.message as never)}
          {...register('confirmPassword')}
        />

        <AuthErrorNote error={error} />
        <AuthSuccessNote message={notice} />

        <div>
          <Button type="submit" size="sm" loading={pending}>
            <KeyRound className="size-3.5" />
            {t('profile.changePassword')}
          </Button>
        </div>
      </form>
    </Section>
  )
}

export function ProfilePage() {
  const t = useT()
  const signOut = useAuthStore((state) => state.signOut)
  const clearError = useAuthStore((state) => state.clearError)

  useEffect(() => {
    clearError()
  }, [clearError])

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            {t('profile.backToWorkbench')}
          </Link>

          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            <LogOut className="size-3.5" />
            {t('auth.signOut')}
          </Button>
        </div>

        <IdentityCard />
        <ProfileForm />
        <PasswordForm />
      </div>
    </div>
  )
}
