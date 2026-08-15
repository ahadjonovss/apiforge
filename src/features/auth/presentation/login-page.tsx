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

export function LoginPage() {
  const navigate = useNavigate()
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
    if (status === 'authenticated') void navigate({ to: '/' })
  }, [status, navigate])

  const onSubmit = handleSubmit(async (values) => {
    setNotice(null)
    await signIn(values.email, values.password)
  })

  const onReset = async () => {
    const email = getValues('email')
    setNotice(null)
    if (await sendPasswordReset(email)) {
      setNotice('Parolni tiklash havolasi emailingizga yuborildi')
    }
  }

  return (
    <AuthShell
      title="Xush kelibsiz"
      subtitle="So'rovlaringizga kirish uchun tizimga kiring"
      footer={
        <>
          Hisobingiz yo'qmi?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Ro'yxatdan o'ting
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
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
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <AuthErrorNote error={error} />
        <AuthSuccessNote message={notice} />

        <Button type="submit" size="lg" block loading={pending}>
          <LogIn className="size-3.5" />
          Kirish
        </Button>

        <button
          type="button"
          onClick={() => void onReset()}
          className="text-[11px] text-muted-foreground transition hover:text-foreground"
        >
          Parolni unutdingizmi?
        </button>
      </form>
    </AuthShell>
  )
}
