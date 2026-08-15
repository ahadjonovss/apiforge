import { TextField } from '@/shared/ui/text-field'
import type { AuthConfig, AuthMode } from '../domain/request'

const LABELS: Record<AuthMode, string> = {
  inherit: "To'plamdan meros",
  none: 'Yo‘q',
  bearer: 'Bearer token',
  basic: 'Basic',
  apiKey: 'API key',
}

interface Props {
  value: AuthConfig
  onChange: (next: AuthConfig) => void
  modes: AuthMode[]
}

export function AuthFields({ value, onChange, modes }: Props) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Usul</label>
        <select
          value={value.mode}
          onChange={(event) => onChange({ ...value, mode: event.target.value as AuthMode })}
          className="w-56 rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
        >
          {modes.map((mode) => (
            <option key={mode} value={mode}>
              {LABELS[mode]}
            </option>
          ))}
        </select>
      </div>

      {value.mode === 'bearer' && (
        <TextField
          label="Token"
          placeholder="{{authorizationToken}}"
          hint="«Bearer» so'zini yozmang — u avtomatik qo'shiladi"
          value={value.bearer?.token ?? ''}
          onChange={(event) => onChange({ ...value, bearer: { token: event.target.value } })}
        />
      )}

      {value.mode === 'basic' && (
        <>
          <TextField
            label="Foydalanuvchi"
            value={value.basic?.username ?? ''}
            onChange={(event) =>
              onChange({
                ...value,
                basic: { username: event.target.value, password: value.basic?.password ?? '' },
              })
            }
          />
          <TextField
            label="Parol"
            type="password"
            value={value.basic?.password ?? ''}
            onChange={(event) =>
              onChange({
                ...value,
                basic: { username: value.basic?.username ?? '', password: event.target.value },
              })
            }
          />
        </>
      )}

      {value.mode === 'apiKey' && (
        <>
          <TextField
            label="Kalit nomi"
            placeholder="X-API-Key"
            value={value.apiKey?.key ?? ''}
            onChange={(event) =>
              onChange({
                ...value,
                apiKey: {
                  key: event.target.value,
                  value: value.apiKey?.value ?? '',
                  addTo: value.apiKey?.addTo ?? 'header',
                },
              })
            }
          />
          <TextField
            label="Qiymat"
            placeholder="{{apiKey}}"
            value={value.apiKey?.value ?? ''}
            onChange={(event) =>
              onChange({
                ...value,
                apiKey: {
                  key: value.apiKey?.key ?? '',
                  value: event.target.value,
                  addTo: value.apiKey?.addTo ?? 'header',
                },
              })
            }
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Qayerga</label>
            <select
              value={value.apiKey?.addTo ?? 'header'}
              onChange={(event) =>
                onChange({
                  ...value,
                  apiKey: {
                    key: value.apiKey?.key ?? '',
                    value: value.apiKey?.value ?? '',
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
    </>
  )
}
