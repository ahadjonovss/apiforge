import { AlertCircle, Check, Loader2 } from 'lucide-react'
import type { Tab } from '@/features/tabs'
import { useCollectionsStore } from './collections-store'
import { useT } from '@/app/providers/i18n-provider'

function clock(value: number): string {
  return new Date(value).toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SaveStatus({ tab }: { tab: Tab }) {
  const t = useT()
  const saving = useCollectionsStore((state) => state.saving)
  const savedAt = useCollectionsStore((state) => state.savedAt)
  const saveError = useCollectionsStore((state) => state.saveError)

  if (saveError) {
    return (
      <span
        title={saveError.message}
        className="flex items-center gap-1 text-[11px] text-destructive"
      >
        <AlertCircle className="size-3" />
        {t('save.failed')}
      </span>
    )
  }

  if (saving) {
    return (
      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        {t('save.saving')}
      </span>
    )
  }

  if (tab.dirty) {
    return (
      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <span className="size-1.5 rounded-full bg-primary" />
        {t('save.unsaved')}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <Check className="size-3 text-status-success" />
      {savedAt ? t('save.saved', { time: clock(savedAt) }) : t('save.savedPlain')}
    </span>
  )
}
