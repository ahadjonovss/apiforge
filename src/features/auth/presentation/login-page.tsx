import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { LogIn } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { signInSchema, type SignInValues } from '../application/schemas'
import { useAuthStore } from './auth-store'
import { AuthShell } from './auth-shell'
import { AuthErrorNote, AuthSuccessNote } from './auth-error-note'
import { useT } from '@/app/providers/i18n-provider'

export function LoginPage() {
  const navigate = useNavigate()
  const t = useT()
  const status = useAuthStore((state) => state.status)
  const pending = useAuthStore((state) => state.pending)
  const error = useAuthStore((state) => state.error)
  const signIn = useAuthStore((state) => state.signIn)
  const sendPasswordReset = useAuthStore((state) => state.sendPasswordReset)
  const clearError = useAuthStore((state) => state.clearError)

  const [notice, setNotice] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    clearError()
  }, [clearError])

  useEffect(() => {
    if (status === 'authenticated') void navigate({ to: '/workspaces' })
  }, [status, navigate])

  const onSubmit = handleSubmit(async (values) => {
    setNotice(null)
    await signIn(values.email, values.password)
  })

  const onReset = async () => {
    const email = getValues('email')
    setNotice(null)
    if (await sendPasswordReset(email)) {
      setNotice(t('auth.resetSent'))
    }
  }

  return (
    <AuthShell
      title={t('auth.welcome')}
      subtitle={t('auth.welcomeHint')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            {t('auth.register')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <TextField
          label={t('common.email')}
          type="email"
          autoComplete="email"
          placeholder={t('auth.emailPlaceholder')}
          error={t(errors.email?.message as never)}
          {...register('email')}
        />

        <TextField
          label={t('common.password')}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={t(errors.password?.message as never)}
          {...register('password')}
        />

        <AuthErrorNote error={error} />
        <AuthSuccessNote message={notice} />

        <Button type="submit" size="lg" block loading={pending}>
          <LogIn className="size-3.5" />
          {t('auth.signIn')}
        </Button>

        <button
          type="button"
          onClick={() => void onReset()}
          className="text-[11px] text-muted-foreground transition hover:text-foreground"
        >
          {t('auth.forgotPassword')}
        </button>
      </form>
    </AuthShell>
  )
}
