import { useState } from 'react'
import { Check, Copy, KeyRound, ShieldAlert } from 'lucide-react'
import { DataFailure, type DataErrorDetail } from '@/core/domain/data-error'
import { Button } from '@/shared/ui/button'
import { DataErrorNote } from '@/shared/ui/data-error-note'
import { useT } from '@/app/providers/i18n-provider'
import { mcpGateway } from '../composition'

function CopyRow({ value, label }: { value: string; label: string }) {
  const t = useT()
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex items-stretch gap-2">
      <pre className="min-w-0 flex-1 overflow-x-auto rounded-md border border-border bg-muted p-3 font-mono text-[11px] leading-5">
        {value}
      </pre>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => {
          void navigator.clipboard.writeText(value).then(() => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
          })
        }}
        className="shrink-0 self-start rounded-md border border-border p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        {copied ? (
          <Check className="size-3.5 text-status-success" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
      <span className="sr-only">{copied ? t('common.done') : ''}</span>
    </div>
  )
}

export function McpSection() {
  const t = useT()
  const [token, setToken] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<DataErrorDetail | null>(null)

  const url = `${window.location.origin}/api/mcp`

  const issue = async () => {
    setPending(true)
    setError(null)
    try {
      setToken(await mcpGateway.issueToken())
    } catch (failure) {
      setError(
        failure instanceof DataFailure
          ? failure.detail
          : { kind: 'unknown', message: 'data.error.unknown' },
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">{t('mcp.title')}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{t('mcp.hint')}</p>

      <div className="mt-4 flex flex-col gap-3">
        {token ? (
          <>
            <div className="flex items-start gap-2 rounded-md border border-status-redirect/40 bg-status-redirect/5 p-3">
              <ShieldAlert className="mt-px size-4 shrink-0 text-status-redirect" />
              <p className="text-[11px] text-muted-foreground">{t('mcp.warning')}</p>
            </div>

            <div>
              <p className="mb-1 text-[11px] font-medium">{t('mcp.commandLabel')}</p>
              <CopyRow
                label={t('mcp.copy')}
                value={`claude mcp add --transport http apiforge ${url} --header "Authorization: Bearer ${token}"`}
              />
            </div>

            <Button size="sm" variant="ghost" className="w-fit" onClick={() => setToken(null)}>
              {t('common.done')}
            </Button>
          </>
        ) : (
          <>
            <div className="text-[11px] text-muted-foreground">
              <p className="font-medium text-foreground">{t('mcp.urlLabel')}</p>
              <p className="mt-1 font-mono">{url}</p>
            </div>

            <Button size="sm" variant="outline" className="w-fit" loading={pending} onClick={() => void issue()}>
              <KeyRound className="size-3.5" />
              {t('mcp.create')}
            </Button>
          </>
        )}

        <DataErrorNote error={error} />

        <div className="rounded-md border border-dashed border-border p-3">
          <p className="mb-1.5 text-[11px] font-medium">{t('mcp.toolsTitle')}</p>
          <p className="text-[11px] leading-5 text-muted-foreground">{t('mcp.toolsList')}</p>
          <p className="mt-1.5 text-[11px] text-muted-foreground">{t('mcp.noDelete')}</p>
        </div>
      </div>
    </section>
  )
}
