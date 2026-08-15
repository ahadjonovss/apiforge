export const LOCALES = ['uz', 'ru', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const LOCALE_LABEL: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
  en: 'English',
}

export const LOCALE_SHORT: Record<Locale, string> = {
  uz: 'UZ',
  ru: 'RU',
  en: 'EN',
}

export const DEFAULT_LOCALE: Locale = 'uz'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

export function detectLocale(candidates: readonly string[]): Locale {
  for (const candidate of candidates) {
    const base = candidate.toLowerCase().split('-')[0]
    if (isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}
