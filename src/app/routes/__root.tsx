import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { Moon, Sun, Zap } from 'lucide-react'
import { useTheme } from '@/app/providers/theme-provider'
import { useT } from '@/app/providers/i18n-provider'
import { LanguageSwitcher } from '@/shared/ui/language-switcher'
import { UserMenu } from '@/features/auth'

function TopBar() {
  const { resolved, setTheme } = useTheme()
  const t = useT()

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
      <Link to="/" className="flex items-center gap-2">
        <Zap className="size-4 text-primary" />
        <span className="text-sm font-semibold">APIForge</span>
      </Link>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
          className="rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label={t('theme.toggle')}
        >
          {resolved === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        <LanguageSwitcher />
        <UserMenu />
      </div>
    </header>
  )
}

export const Route = createRootRoute({
  component: () => (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  ),
})
