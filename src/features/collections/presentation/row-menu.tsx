import type { MouseEvent, ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { MENU_WIDTH } from './use-row-menu'
import { useT } from '@/app/providers/i18n-provider'

export interface MenuItem {
  label: string
  icon: ReactNode
  onClick: () => void
  danger?: boolean
  separated?: boolean
}

export function MenuTrigger({ onOpen, label }: { onOpen: (event: MouseEvent<HTMLElement>) => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onOpen}
      className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
    >
      <MoreHorizontal className="size-3.5" />
    </button>
  )
}

export function RowMenu({
  at,
  items,
  onClose,
}: {
  at: { x: number; y: number } | null
  items: MenuItem[]
  onClose: () => void
}) {
  const t = useT()
  if (!at) return null

  const left = Math.max(8, Math.min(at.x, window.innerWidth - MENU_WIDTH - 8))
  const top = Math.min(at.y, window.innerHeight - items.length * 32 - 16)

  return (
    <>
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
        onContextMenu={(event) => {
          event.preventDefault()
          onClose()
        }}
        className="fixed inset-0 z-40 cursor-default"
      />
      <div
        role="menu"
        style={{ left, top, width: MENU_WIDTH }}
        className="fixed z-50 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-lg"
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            onClick={(event) => {
              event.stopPropagation()
              onClose()
              item.onClick()
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition hover:bg-accent',
              item.separated && 'mt-1 border-t border-border pt-2',
              item.danger ? 'text-destructive' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}
