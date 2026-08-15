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

export function RegisterPage() {
  const navigate = useNavigate()
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
      title="Hisob yaratish"
      subtitle="So'rovlaringiz va to'plamlaringiz bulutda saqlanadi"
      footer={
        <>
          Hisobingiz bormi?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Kirish
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <TextField
          label="Ism"
          autoComplete="name"
          placeholder="Samandar Ahadjonov"
          error={errors.displayName?.message}
          {...register('displayName')}
        />

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="siz@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <TextField
          label="Parol"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          hint="Kamida 8 belgi, harf va raqam"
          error={errors.password?.message}
          {...register('password')}
        />

        <TextField
          label="Parolni tasdiqlang"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <AuthErrorNote error={error} />

        <Button type="submit" size="lg" block loading={pending}>
          <UserPlus className="size-3.5" />
          Ro'yxatdan o'tish
        </Button>
      </form>
    </AuthShell>
  )
}
