import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'
type Resolved = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  resolved: Resolved
  setTheme: (theme: Theme) => void
}

const STORAGE_KEY = 'apiforge.theme'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function systemTheme(): Resolved {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system',
  )
  const [resolved, setResolved] = useState<Resolved>(() =>
    theme === 'system' ? systemTheme() : theme,
  )

  useEffect(() => {
    const next = theme === 'system' ? systemTheme() : theme
    setResolved(next)
    document.documentElement.classList.toggle('dark', next === 'dark')

    if (theme !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const value = systemTheme()
      setResolved(value)
      document.documentElement.classList.toggle('dark', value === 'dark')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolved,
      setTheme: (next) => {
        localStorage.setItem(STORAGE_KEY, next)
        setThemeState(next)
      },
    }),
    [theme, resolved],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
