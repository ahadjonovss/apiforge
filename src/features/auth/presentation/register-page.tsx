import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { UserPlus } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { signUpSchema, type SignUpValues } from '../application/schemas'
import { useAuthStore } from './auth-store'
import { AuthShell } from './auth-shell'
import { AuthErrorNote } from './auth-error-note'
import { useT } from '@/app/providers/i18n-provider'

export function RegisterPage() {
  const navigate = useNavigate()
  const t = useT()
  const status = useAuthStore((state) => state.status)
  const pending = useAuthStore((state) => state.pending)
  const error = useAuthStore((state) => state.error)
  const signUp = useAuthStore((state) => state.signUp)
  const clearError = useAuthStore((state) => state.clearError)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  })

  useEffect(() => {
    clearError()
  }, [clearError])

  useEffect(() => {
    if (status === 'authenticated') void navigate({ to: '/' })
  }, [status, navigate])

  const onSubmit = handleSubmit(async (values) => {
    await signUp({
      displayName: values.displayName,
      email: values.email,
      password: values.password,
    })
  })

  return (
    <AuthShell
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerHint')}
      footer={
        <>
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('auth.signIn')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <TextField
          label={t('auth.fullName')}
          autoComplete="name"
          placeholder="Samandar Ahadjonov"
          error={t(errors.displayName?.message as never)}
          {...register('displayName')}
        />

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
          autoComplete="new-password"
          placeholder="••••••••"
          hint={t('auth.passwordHint')}
          error={t(errors.password?.message as never)}
          {...register('password')}
        />

        <TextField
          label={t('auth.confirmPassword')}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={t(errors.confirmPassword?.message as never)}
          {...register('confirmPassword')}
        />

        <AuthErrorNote error={error} />

        <Button type="submit" size="lg" block loading={pending}>
          <UserPlus className="size-3.5" />
          {t('auth.register')}
        </Button>
      </form>
    </AuthShell>
  )
}
