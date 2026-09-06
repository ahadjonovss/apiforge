import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookText,
  Boxes,
  FolderTree,
  ShieldCheck,
  Upload,
  Variable,
  Zap,
} from 'lucide-react'
import { useT } from '@/app/providers/i18n-provider'
import { useAuthStore } from '@/features/auth'

const FEATURES = [
  { icon: Boxes, key: 'f1' },
  { icon: FolderTree, key: 'f2' },
  { icon: BookText, key: 'f3' },
  { icon: Variable, key: 'f4' },
  { icon: Upload, key: 'f5' },
  { icon: ShieldCheck, key: 'f6' },
] as const

const STEPS = ['s1', 's2', 's3'] as const

const STACK = ['React 19', 'TypeScript', 'Vite', 'Firebase', 'Tailwind v4']

function Preview() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-primary/5">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <span className="size-2.5 rounded-full bg-status-error/60" />
        <span className="size-2.5 rounded-full bg-status-redirect/60" />
        <span className="size-2.5 rounded-full bg-status-success/60" />
      </div>

      <div className="grid grid-cols-[150px_1fr] divide-x divide-border">
        <div className="hidden flex-col gap-1 p-2 sm:flex">
          {['Auth', 'Profile', 'Clients', 'Sales'].map((name, index) => (
            <div
              key={name}
              className={`flex items-center gap-1.5 rounded px-1.5 py-1 text-[11px] ${
                index === 0 ? 'bg-accent text-foreground' : 'text-muted-foreground'
              }`}
            >
              <FolderTree className="size-3 shrink-0" />
              <span className="truncate">{name}</span>
            </div>
          ))}
          <div className="ml-4 flex items-center gap-1.5 rounded px-1.5 py-1 text-[11px]">
            <span className="font-mono font-bold text-method-post">POST</span>
            <span className="truncate text-muted-foreground">Send Otp</span>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-border p-2">
            <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] font-bold text-method-post">
              POST
            </span>
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              {'{{gateway}}'}/auth/send-otp
            </span>
            <span className="ml-auto rounded bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              Send
            </span>
          </div>

          <div className="flex items-center gap-1.5 border-b border-border px-2 py-1.5">
            {['200', '401', '422'].map((code) => (
              <span
                key={code}
                className={`rounded border border-border px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                  code === '200' ? 'text-status-success' : 'text-status-error'
                }`}
              >
                {code}
              </span>
            ))}
          </div>

          <pre className="overflow-hidden p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
{`{
  "access_token": "eyJhbGciOi…",
  "expires_in": 3600
}`}
          </pre>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  const t = useT()
  const status = useAuthStore((state) => state.status)
  const signedIn = status === 'authenticated'

  return (
    <div className="h-full overflow-auto">
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-primary)/12,transparent_60%)]"
        />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] text-muted-foreground">
              <Zap className="size-3 text-primary" />
              {t('landing.badge')}
            </span>

            <h1 className="mt-5 text-balance text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              {t('landing.title')}
            </h1>

            <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
              {t('landing.subtitle')}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {signedIn ? (
                <Link
                  to="/workspaces"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  {t('landing.ctaOpen')}
                  <ArrowRight className="size-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    {t('landing.ctaPrimary')}
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-accent"
                  >
                    {t('landing.ctaSecondary')}
                  </Link>
                </>
              )}
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">{t('landing.heroNote')}</p>
          </div>

          <Preview />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold">{t('landing.featuresTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('landing.featuresSubtitle')}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/40"
            >
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="size-4 text-primary" />
              </span>
              <h3 className="mt-3 text-sm font-semibold">
                {t(`landing.${key}.title` as never)}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {t(`landing.${key}.text` as never)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold">{t('landing.howTitle')}</h2>

          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map((key, index) => (
              <li key={key} className="relative">
                <span className="font-mono text-3xl font-bold text-primary/25">
                  0{index + 1}
                </span>
                <h3 className="mt-1 text-sm font-semibold">
                  {t(`landing.${key}.title` as never)}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {t(`landing.${key}.text` as never)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 text-center">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {t('landing.techTitle')}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {STACK.map((item) => (
            <span
              key={item}
              className="rounded-full border border-border px-3 py-1 font-mono text-[11px] text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-8 sm:flex-row sm:justify-between">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="size-3.5 text-primary" />
            {t('landing.footer')}
          </span>

          {!signedIn && (
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              {t('landing.ctaPrimary')}
              <ArrowRight className="size-3" />
            </Link>
          )}
        </div>
      </footer>
    </div>
  )
}
