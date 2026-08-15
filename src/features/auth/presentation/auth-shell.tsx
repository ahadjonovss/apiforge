import { Zap } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="flex h-full items-center justify-center overflow-auto p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-primary" />
            <span className="text-base font-semibold">APIForge</span>
          </div>
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">{children}</div>

        <div className="mt-4 text-center text-xs text-muted-foreground">{footer}</div>
      </div>
    </div>
  )
}
