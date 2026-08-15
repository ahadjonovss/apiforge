import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Boxes, LogOut, User as UserIcon } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { useAuthStore } from './auth-store'
import { useT } from '@/app/providers/i18n-provider'

function initials(name: string | null, email: string | null) {
  const source = name?.trim() || email || '?'
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function UserMenu() {
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const t = useT()
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (!user) return null

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md px-1.5 py-1 transition hover:bg-accent"
      >
        {user.photoUrl ? (
          <img src={user.photoUrl} alt="" className="size-6 rounded-full object-cover" />
        ) : (
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {initials(user.displayName, user.email)}
          </span>
        )}
        <span className="max-w-[140px] truncate text-xs text-muted-foreground">
          {user.displayName || user.email}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-md border border-border bg-popover shadow-lg"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-xs font-medium">{user.displayName || t('profile.noName')}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
            {!user.emailVerified && (
              <p className="mt-1 text-[10px] text-status-redirect">{t('profile.emailNotVerified')}</p>
            )}
          </div>

          <Link
            to="/workspaces"
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-xs transition',
              'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Boxes className="size-3.5" />
            {t('workspaces.title')}
          </Link>

          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-xs transition',
              'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <UserIcon className="size-3.5" />
            {t('profile.title')}
          </Link>

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              void signOut()
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition hover:bg-accent hover:text-destructive"
          >
            <LogOut className="size-3.5" />
            {t('auth.signOut')}
          </button>
        </div>
      )}
    </div>
  )
}
