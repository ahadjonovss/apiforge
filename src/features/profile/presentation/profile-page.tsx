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
          <p className="truncate text-sm font-semibold">{user.displayName || 'Ismsiz'}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <span className="mt-1 inline-flex items-center gap-1 text-[11px]">
            {user.emailVerified ? (
              <>
                <BadgeCheck className="size-3 text-status-success" />
                <span className="text-status-success">Email tasdiqlangan</span>
              </>
            ) : (
              <>
                <MailWarning className="size-3 text-status-redirect" />
                <span className="text-status-redirect">Email tasdiqlanmagan</span>
              </>
            )}
          </span>
        </div>
      </div>

      <dl className="mt-5 grid gap-2 border-t border-border pt-4 text-xs">
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <dt className="text-muted-foreground">Foydalanuvchi ID</dt>
          <dd className="truncate font-mono text-[11px]">{user.id}</dd>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <dt className="text-muted-foreground">Ro'yxatdan o'tgan</dt>
          <dd>{formatDateTime(user.createdAt)}</dd>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <dt className="text-muted-foreground">Oxirgi kirish</dt>
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
                setNotice('Tasdiqlash havolasi yuborildi')
              }
            }}
          >
            Tasdiqlash havolasini yuborish
          </Button>
        </div>
      )}
    </section>
  )
}

function ProfileForm() {
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
      setNotice('Profil yangilandi')
      reset(values)
    }
  })

  return (
    <Section title="Profil ma'lumotlari" description="Ism va avatar havolasini o'zgartiring">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <TextField
          label="Ism"
          autoComplete="name"
          error={errors.displayName?.message}
          {...register('displayName')}
        />
        <TextField
          label="Avatar havolasi"
          placeholder="https://…"
          hint="Bo'sh qoldirsangiz bosh harflar ko'rsatiladi"
          error={errors.photoUrl?.message}
          {...register('photoUrl')}
        />

        {error?.kind === 'validation' && <AuthErrorNote error={error} />}
        <AuthSuccessNote message={notice} />

        <div>
          <Button type="submit" size="sm" loading={pending} disabled={!isDirty}>
            <Save className="size-3.5" />
            Saqlash
          </Button>
        </div>
      </form>
    </Section>
  )
}

function PasswordForm() {
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
      setNotice('Parol almashtirildi')
      reset()
    }
  })

  return (
    <Section title="Parol" description="Xavfsizlik uchun joriy parolni tasdiqlash talab qilinadi">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <TextField
          label="Joriy parol"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <TextField
          label="Yangi parol"
          type="password"
          autoComplete="new-password"
          hint="Kamida 8 belgi, harf va raqam"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <TextField
          label="Yangi parolni tasdiqlang"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <AuthErrorNote error={error} />
        <AuthSuccessNote message={notice} />

        <div>
          <Button type="submit" size="sm" loading={pending}>
            <KeyRound className="size-3.5" />
            Parolni almashtirish
          </Button>
        </div>
      </form>
    </Section>
  )
}

export function ProfilePage() {
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
            Ish stoliga qaytish
          </Link>

          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            <LogOut className="size-3.5" />
            Chiqish
          </Button>
        </div>

        <IdentityCard />
        <ProfileForm />
        <PasswordForm />
      </div>
    </div>
  )
}
