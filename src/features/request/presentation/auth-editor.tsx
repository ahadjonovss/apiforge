import { useTabsStore, type Tab } from '@/features/tabs'
import type { AuthMode } from '../domain/request'
import { AuthFields } from './auth-fields'
import { useT } from '@/app/providers/i18n-provider'

const MODES: AuthMode[] = ['inherit', 'none', 'bearer', 'basic', 'apiKey']

export function AuthEditor({ tab }: { tab: Tab }) {
  const t = useT()
  const patchRequest = useTabsStore((state) => state.patchRequest)
  const auth = tab.request.auth
  const inheritedMode = tab.inherited?.auth.mode ?? 'none'

  return (
    <div className="flex flex-col gap-3 p-4">
      <AuthFields
        value={auth}
        modes={MODES}
        onChange={(next) => patchRequest(tab.id, { auth: next })}
      />

      {auth.mode === 'inherit' && (
        <p className="text-xs text-muted-foreground">
          {tab.inherited
            ? t('auth.inheritedApplies', { mode: inheritedMode })
            : t('auth.notInCollection')}
        </p>
      )}
    </div>
  )
}
