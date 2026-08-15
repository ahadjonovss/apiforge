import { useState } from 'react'
import { Eye, Pencil } from 'lucide-react'
import { cn } from '@/core/lib/cn'
import { Markdown } from './markdown'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Markdown yozing…',
  minHeight = '220px',
}: Props) {
  const [preview, setPreview] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={cn(
            'flex items-center gap-1 rounded px-2 py-1 text-[11px] transition',
            preview ? 'text-muted-foreground hover:text-foreground' : 'bg-accent text-foreground',
          )}
        >
          <Pencil className="size-3" />
          Tahrirlash
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={cn(
            'flex items-center gap-1 rounded px-2 py-1 text-[11px] transition',
            preview ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Eye className="size-3" />
          Ko'rinishi
        </button>
      </div>

      {preview ? (
        <div
          className="overflow-auto rounded-md border border-border bg-card p-3"
          style={{ minHeight }}
        >
          {value.trim() ? (
            <Markdown source={value} />
          ) : (
            <p className="text-xs text-muted-foreground">Hozircha bo'sh</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          style={{ minHeight }}
          className="w-full resize-y rounded-md border border-border bg-card p-3 font-mono text-xs outline-none focus:ring-1 focus:ring-ring"
        />
      )}
    </div>
  )
}
