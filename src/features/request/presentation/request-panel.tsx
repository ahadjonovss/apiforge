import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { xml } from '@codemirror/lang-xml'
import { html } from '@codemirror/lang-html'
import { oneDark } from '@codemirror/theme-one-dark'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { HTTP_METHODS, type HttpMethod } from '@/core/domain/http'
import { KeyValueEditor } from '@/shared/ui/key-value-editor'
import { useTheme } from '@/app/providers/theme-provider'
import { useTabsStore, type Tab } from '@/features/tabs'
import type { BodyMode } from '../domain/request'
import { interpolate } from '../application/interpolate'
import { AuthEditor } from './auth-editor'
import { BinaryEditor } from './binary-editor'
import { FormDataEditor } from './form-data-editor'
import { CaptureEditor } from './capture-editor'
import { InheritedHeaders } from './inherited-headers'
import { useT } from '@/app/providers/i18n-provider'

const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:\/\//i

const SECTIONS = ['Params', 'Headers', 'Body', 'Auth', 'Capture'] as const
type Section = (typeof SECTIONS)[number]

const BODY_MODES: BodyMode[] = ['none', 'json', 'raw', 'urlencoded', 'form-data', 'binary']

const RAW_LANGUAGES = ['json', 'xml', 'html', 'text'] as const
type RawLanguage = (typeof RAW_LANGUAGES)[number]

function languageExtension(language: RawLanguage) {
  if (language === 'json') return [json()]
  if (language === 'xml') return [xml()]
  if (language === 'html') return [html()]
  return []
}

export function RequestPanel({ tab }: { tab: Tab }) {
  const t = useT()
  const [section, setSection] = useState<Section>('Params')
  const patchRequest = useTabsStore((state) => state.patchRequest)
  const send = useTabsStore((state) => state.send)
  const { resolved } = useTheme()

  const { request } = tab
  const scope = tab.inherited?.variables ?? {}
  const resolvedUrl = interpolate(request.url, scope).trim()
  const resolvedBase = interpolate(tab.inherited?.baseUrl ?? '', scope).trim()
  const prefix = resolvedBase && !ABSOLUTE_URL.test(resolvedUrl) ? resolvedBase : ''

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <select
          value={request.method}
          onChange={(event) =>
            patchRequest(tab.id, { method: event.target.value as HttpMethod })
          }
          className="rounded-md border border-border bg-card px-2 py-1.5 font-mono text-xs font-bold outline-none focus:ring-1 focus:ring-ring"
        >
          {HTTP_METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>

        <div className="flex flex-1 items-stretch overflow-hidden rounded-md border border-border bg-card focus-within:ring-1 focus-within:ring-ring">
          {prefix && (
            <span
              title={t('request.baseUrlTitle', { url: prefix })}
              className="flex max-w-[45%] items-center border-r border-border bg-muted px-2 font-mono text-xs text-muted-foreground"
            >
              <span className="truncate">{prefix}</span>
            </span>
          )}
          <input
            value={request.url}
            onChange={(event) => patchRequest(tab.id, { url: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void send(tab.id)
            }}
            placeholder={prefix ? t('request.pathPlaceholder') : t('request.urlPlaceholder')}
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent px-3 py-1.5 font-mono text-xs outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => void send(tab.id)}
          disabled={tab.isSending}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {tab.isSending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          {t('request.send')}
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-border px-3">
        {SECTIONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSection(item)}
            className={cn(
              'border-b-2 px-3 py-2 text-xs font-medium transition',
              section === item
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`request.${item.toLowerCase()}` as never)}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {section === 'Params' && (
          <KeyValueEditor
            rows={request.params}
            onChange={(params) => patchRequest(tab.id, { params })}
          />
        )}

        {section === 'Headers' && (
          <>
            <InheritedHeaders tab={tab} />
            <KeyValueEditor
              rows={request.headers}
              onChange={(headers) => patchRequest(tab.id, { headers })}
            />
          </>
        )}

        {section === 'Body' && (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-1 border-b border-border px-3 py-1.5">
              {BODY_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() =>
                    patchRequest(tab.id, { body: { ...request.body, mode } })
                  }
                  className={cn(
                    'rounded px-2 py-1 font-mono text-[11px] transition',
                    request.body.mode === mode
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>

            {request.body.mode === 'raw' && (
              <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
                <span className="text-[11px] text-muted-foreground">{t('body.language')}</span>
                <select
                  value={request.body.rawLanguage ?? 'text'}
                  onChange={(event) =>
                    patchRequest(tab.id, {
                      body: {
                        ...request.body,
                        rawLanguage: event.target.value as RawLanguage,
                      },
                    })
                  }
                  className="rounded border border-border bg-card px-1.5 py-0.5 text-[11px] outline-none focus:ring-1 focus:ring-ring"
                >
                  {RAW_LANGUAGES.map((language) => (
                    <option key={language} value={language}>
                      {t(`body.lang.${language}` as never)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(request.body.mode === 'json' || request.body.mode === 'raw') && (
              <CodeMirror
                value={request.body.raw ?? ''}
                onChange={(raw) => patchRequest(tab.id, { body: { ...request.body, raw } })}
                extensions={
                  request.body.mode === 'json'
                    ? [json()]
                    : languageExtension(request.body.rawLanguage ?? 'text')
                }
                theme={resolved === 'dark' ? oneDark : 'light'}
                height="100%"
                className="min-h-0 flex-1 text-xs"
                basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: false }}
              />
            )}

            {request.body.mode === 'urlencoded' && (
              <KeyValueEditor
                rows={request.body.urlencoded ?? []}
                onChange={(urlencoded) =>
                  patchRequest(tab.id, { body: { ...request.body, urlencoded } })
                }
              />
            )}

            {request.body.mode === 'form-data' && <FormDataEditor tab={tab} />}

            {request.body.mode === 'binary' && <BinaryEditor tab={tab} />}

            {request.body.mode === 'none' && (
              <div className="p-4 text-xs text-muted-foreground">
                {t('request.noBody')}
              </div>
            )}
          </div>
        )}

        {section === 'Auth' && <AuthEditor tab={tab} />}

        {section === 'Capture' && <CaptureEditor tab={tab} />}
      </div>
    </div>
  )
}
