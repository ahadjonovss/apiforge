import { TextField } from '@/shared/ui/text-field'
import type { AuthConfig, AuthMode } from '../domain/request'
import { useT } from '@/app/providers/i18n-provider'

interface Props {
  value: AuthConfig
  onChange: (next: AuthConfig) => void
  modes: AuthMode[]
}

export function AuthFields({ value, onChange, modes }: Props) {
  const t = useT()
  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">{t('auth.field.method')}</label>
        <select
          value={value.mode}
          onChange={(event) => onChange({ ...value, mode: event.target.value as AuthMode })}
          className="w-56 rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
        >
          {modes.map((mode) => (
            <option key={mode} value={mode}>
              {t(`auth.mode.${mode}` as never)}
            </option>
          ))}
        </select>
      </div>

      {value.mode === 'bearer' && (
        <TextField
          label={t('auth.field.token')}
          placeholder="{{authorizationToken}}"
          hint={t('auth.field.tokenHint')}
          value={value.bearer?.token ?? ''}
          onChange={(event) => onChange({ ...value, bearer: { token: event.target.value } })}
        />
      )}

      {value.mode === 'basic' && (
        <>
          <TextField
            label={t('auth.field.username')}
            value={value.basic?.username ?? ''}
            onChange={(event) =>
              onChange({
                ...value,
                basic: { username: event.target.value, password: value.basic?.password ?? '' },
              })
            }
          />
          <TextField
            label={t('common.password')}
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
            label={t('auth.field.keyName')}
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
            label={t('auth.field.value')}
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
            <label className="text-xs font-medium">{t('auth.field.addTo')}</label>
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
              <option value="header">{t('auth.field.header')}</option>
              <option value="query">{t('auth.field.query')}</option>
            </select>
          </div>
        </>
      )}
    </>
  )
}
