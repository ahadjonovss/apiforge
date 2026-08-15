import { useTabsStore, type Tab } from '@/features/tabs'
import { TextField } from '@/shared/ui/text-field'
import type { AuthConfig, AuthMode } from '../domain/request'

const MODES: { value: AuthMode; label: string }[] = [
  { value: 'inherit', label: "To'plamdan meros" },
  { value: 'none', label: 'Yo‘q' },
  { value: 'bearer', label: 'Bearer token' },
  { value: 'basic', label: 'Basic' },
  { value: 'apiKey', label: 'API key' },
]

export function AuthEditor({ tab }: { tab: Tab }) {
  const patchRequest = useTabsStore((state) => state.patchRequest)
  const auth = tab.request.auth
  const inheritedMode = tab.inherited?.auth.mode ?? 'none'

  const patch = (next: AuthConfig) => patchRequest(tab.id, { auth: next })

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Usul</label>
        <select
          value={auth.mode}
          onChange={(event) => patch({ ...auth, mode: event.target.value as AuthMode })}
          className="w-56 rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
        >
          {MODES.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </div>

      {auth.mode === 'inherit' && (
        <p className="text-xs text-muted-foreground">
          {tab.inherited
            ? `To'plam sozlamasi qo'llanadi: ${inheritedMode}`
            : "Bu so'rov to'plamga bog'lanmagan, shuning uchun meros olinmaydi"}
        </p>
      )}

      {auth.mode === 'bearer' && (
        <TextField
          label="Token"
          placeholder="{{token}}"
          value={auth.bearer?.token ?? ''}
          onChange={(event) => patch({ ...auth, bearer: { token: event.target.value } })}
        />
      )}

      {auth.mode === 'basic' && (
        <>
          <TextField
            label="Foydalanuvchi"
            value={auth.basic?.username ?? ''}
            onChange={(event) =>
              patch({
                ...auth,
                basic: { username: event.target.value, password: auth.basic?.password ?? '' },
              })
            }
          />
          <TextField
            label="Parol"
            type="password"
            value={auth.basic?.password ?? ''}
            onChange={(event) =>
              patch({
                ...auth,
                basic: { username: auth.basic?.username ?? '', password: event.target.value },
              })
            }
          />
        </>
      )}

      {auth.mode === 'apiKey' && (
        <>
          <TextField
            label="Kalit nomi"
            placeholder="X-API-Key"
            value={auth.apiKey?.key ?? ''}
            onChange={(event) =>
              patch({
                ...auth,
                apiKey: {
                  key: event.target.value,
                  value: auth.apiKey?.value ?? '',
                  addTo: auth.apiKey?.addTo ?? 'header',
                },
              })
            }
          />
          <TextField
            label="Qiymat"
            placeholder="{{apiKey}}"
            value={auth.apiKey?.value ?? ''}
            onChange={(event) =>
              patch({
                ...auth,
                apiKey: {
                  key: auth.apiKey?.key ?? '',
                  value: event.target.value,
                  addTo: auth.apiKey?.addTo ?? 'header',
                },
              })
            }
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Qayerga</label>
            <select
              value={auth.apiKey?.addTo ?? 'header'}
              onChange={(event) =>
                patch({
                  ...auth,
                  apiKey: {
                    key: auth.apiKey?.key ?? '',
                    value: auth.apiKey?.value ?? '',
                    addTo: event.target.value as 'header' | 'query',
                  },
                })
              }
              className="w-56 rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="header">Header</option>
              <option value="query">Query parametr</option>
            </select>
          </div>
        </>
      )}
    </div>
  )
}
