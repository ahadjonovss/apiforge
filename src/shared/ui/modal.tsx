import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ open, title, description, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Yopish"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
