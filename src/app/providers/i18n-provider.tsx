import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_LOCALE,
  detectLocale,
  isLocale,
  type Locale,
} from '@/core/i18n/locales'
import { translate, type TranslateParams } from '@/core/i18n/translate'
import { uz, type MessageKey } from '@/core/i18n/messages/uz'
import { ru } from '@/core/i18n/messages/ru'
import { en } from '@/core/i18n/messages/en'

const DICTIONARIES: Record<Locale, Record<string, string>> = { uz, ru, en }
const STORAGE_KEY = 'apiforge.locale'

export type Translate = (key: MessageKey, params?: TranslateParams) => string

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translate
}

const I18nContext = createContext<I18nContextValue | null>(null)

function initialLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (isLocale(stored)) return stored
  return detectLocale(navigator.languages ?? [navigator.language])
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const value = useMemo<I18nContextValue>(() => {
    const messages = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE]

    return {
      locale,
      setLocale: (next) => {
        localStorage.setItem(STORAGE_KEY, next)
        document.documentElement.lang = next
        setLocaleState(next)
      },
      t: (key, params) => translate(messages, uz, key, params),
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside I18nProvider')
  return context
}

export function useT(): Translate {
  return useI18n().t
}
