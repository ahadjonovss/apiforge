import { useEffect, useState, type MouseEvent } from 'react'

export const MENU_WIDTH = 184

export function useRowMenu() {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!at) return
    const close = () => setAt(null)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [at])

  return {
    at,
    close: () => setAt(null),
    openAtCursor: (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      setAt({ x: event.clientX, y: event.clientY })
    },
    openAtTrigger: (event: MouseEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const rect = event.currentTarget.getBoundingClientRect()
      setAt({ x: rect.right - MENU_WIDTH, y: rect.bottom + 4 })
    },
  }
}
