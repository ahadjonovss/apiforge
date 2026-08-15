import { useMemo, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { AlertCircle, Clock, HardDrive } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { useTheme } from '@/app/providers/theme-provider'
import type { Tab } from '@/features/tabs'

const VIEWS = ['Body', 'Headers'] as const
type View = (typeof VIEWS)[number]

function statusClass(status: number) {
  if (status >= 200 && status < 300) return 'text-status-success'
  if (status >= 300 && status < 400) return 'text-status-redirect'
  return 'text-status-error'
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export function ResponsePanel({ tab }: { tab: Tab }) {
  const [view, setView] = useState<View>('Body')
  const { resolved } = useTheme()
  const { response, error } = tab

  const isJson = response?.contentType?.includes('json') ?? false

  const prettyBody = useMemo(() => {
    if (!response) return ''
    if (!isJson) return response.body
    try {
      return JSON.stringify(JSON.parse(response.body), null, 2)
    } catch {
      return response.body
    }
  }, [response, isJson])

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <AlertCircle className="size-6 text-destructive" />
        <p className="text-sm font-medium text-destructive">So'rov bajarilmadi</p>
        <p className="max-w-md text-xs text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  if (!response) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-xs text-muted-foreground">
          So'rov yuboring — javob shu yerda ko'rinadi
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b border-border px-3 py-2">
        <span className={cn('font-mono text-xs font-bold', statusClass(response.status))}>
          {response.status} {response.statusText}
        </span>
        <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
          <Clock className="size-3" />
          {response.durationMs} ms
        </span>
        <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
          <HardDrive className="size-3" />
          {formatSize(response.sizeBytes)}
        </span>
      </div>

      <div className="flex items-center gap-1 border-b border-border px-3">
        {VIEWS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setView(item)}
            className={cn(
              'border-b-2 px-3 py-2 text-xs font-medium transition',
              view === item
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {item}
            {item === 'Headers' && (
              <span className="ml-1 text-muted-foreground">
                ({Object.keys(response.headers).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {view === 'Body' ? (
          <CodeMirror
            value={prettyBody}
            editable={false}
            extensions={isJson ? [json()] : []}
            theme={resolved === 'dark' ? oneDark : 'light'}
            className="text-xs"
            basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: false }}
          />
        ) : (
          <div className="divide-y divide-border">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[240px_1fr] gap-3 px-3 py-1.5">
                <span className="truncate font-mono text-xs text-muted-foreground">{key}</span>
                <span className="break-all font-mono text-xs">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
