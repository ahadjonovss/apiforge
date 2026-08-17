import { useRef } from 'react'
import { FileUp, X } from 'lucide-react'
import { useT } from '@/app/providers/i18n-provider'
import { useTabsStore, type Tab } from '@/features/tabs'
import { BINARY_FILE_KEY } from '../application/build-http-call'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function BinaryEditor({ tab }: { tab: Tab }) {
  const t = useT()
  const setFile = useTabsStore((state) => state.setFile)
  const patchRequest = useTabsStore((state) => state.patchRequest)
  const input = useRef<HTMLInputElement>(null)

  const file = tab.files[BINARY_FILE_KEY]
  const remembered = tab.request.body.binaryName

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-[11px] text-muted-foreground">{t('body.binaryHint')}</p>

      <input
        ref={input}
        type="file"
        className="hidden"
        onChange={(event) => {
          const picked = event.target.files?.[0]
          if (!picked) return
          setFile(tab.id, BINARY_FILE_KEY, picked)
          patchRequest(tab.id, { body: { ...tab.request.body, binaryName: picked.name } })
          event.target.value = ''
        }}
      />

      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{file.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {formatSize(file.size)} · {file.type || 'application/octet-stream'}
            </p>
          </div>
          <button
            type="button"
            aria-label={t('common.delete')}
            onClick={() => {
              setFile(tab.id, BINARY_FILE_KEY, null)
              patchRequest(tab.id, { body: { ...tab.request.body, binaryName: undefined } })
            }}
            className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-destructive"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border p-8 text-center transition hover:border-primary/60"
        >
          <FileUp className="size-6 text-muted-foreground/50" />
          <span className="text-xs font-medium">{t('body.pickFile')}</span>
          {remembered && (
            <span className="text-[11px] text-status-redirect">
              {remembered} · {t('body.reselect')}
            </span>
          )}
        </button>
      )}
    </div>
  )
}
