import { useEffect, useRef, useState } from 'react'
import { Check, Languages } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { LOCALES, LOCALE_LABEL, LOCALE_SHORT } from '@/core/i18n/locales'
import { useI18n } from '@/app/providers/i18n-provider'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()
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

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('lang.label')}
        className="flex items-center gap-1 rounded-md px-1.5 py-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        <Languages className="size-4" />
        <span className="text-[11px] font-medium">{LOCALE_SHORT[locale]}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-md border border-border bg-popover shadow-lg"
        >
          {LOCALES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setLocale(option)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-xs transition hover:bg-accent',
                option === locale ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {LOCALE_LABEL[option]}
              {option === locale && <Check className="size-3 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
