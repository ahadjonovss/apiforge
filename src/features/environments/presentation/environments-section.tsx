import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useT } from '@/app/providers/i18n-provider'
import { EnvironmentsManager } from './environments-manager'
import { useEnvironmentsStore } from './environments-store'

export function EnvironmentsSection({ workspaceId }: { workspaceId: string }) {
  const t = useT()
  const ensure = useEnvironmentsStore((state) => state.ensure)
  const loading = useEnvironmentsStore((state) => state.loading)
  const loaded = useEnvironmentsStore((state) => state.workspaceId === workspaceId)

  useEffect(() => {
    void ensure(workspaceId)
  }, [workspaceId, ensure])

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">{t('environment.section')}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{t('environment.sectionHint')}</p>

      <div
        className="mt-4"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
            event.preventDefault()
          }
        }}
      >
        {!loaded && loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <EnvironmentsManager workspaceId={workspaceId} />
        )}
      </div>
    </section>
  )
}
