import { AlertCircle } from 'lucide-react'
import type { DataErrorDetail } from '@/core/domain/data-error'

export function DataErrorNote({ error }: { error: DataErrorDetail | null }) {
  if (!error) return null

  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
      <AlertCircle className="mt-px size-3.5 shrink-0 text-destructive" />
      <p className="text-[11px] text-destructive">{error.message}</p>
    </div>
  )
}
