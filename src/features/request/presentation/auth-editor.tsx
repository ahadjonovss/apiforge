import { useTabsStore, type Tab } from '@/features/tabs'
import type { AuthMode } from '../domain/request'
import { AuthFields } from './auth-fields'

const MODES: AuthMode[] = ['inherit', 'none', 'bearer', 'basic', 'apiKey']

export function AuthEditor({ tab }: { tab: Tab }) {
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
            ? `To'plam sozlamasi qo'llanadi: ${inheritedMode}`
            : "Bu so'rov to'plamga bog'lanmagan, shuning uchun meros olinmaydi"}
        </p>
      )}
    </div>
  )
}
