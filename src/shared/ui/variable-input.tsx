import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
} from 'react'
import { cn } from '@/core/lib/cn'
import { VARIABLE_PATTERN, type VariableLabels, type VariableLookup } from './variable-highlight'

interface Segment {
  text: string
  name: string | null
  end: number
}

function split(value: string): Segment[] {
  const segments: Segment[] = []
  let last = 0
  VARIABLE_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = VARIABLE_PATTERN.exec(value)) !== null) {
    if (match.index > last) {
      segments.push({ text: value.slice(last, match.index), name: null, end: match.index })
    }
    last = match.index + match[0].length
    segments.push({ text: match[0], name: match[1], end: last })
  }

  if (last < value.length) segments.push({ text: value.slice(last), name: null, end: value.length })
  return segments
}

interface HoverState {
  name: string
  x: number
  y: number
}

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: string
  onValueChange: (value: string) => void
  lookup: VariableLookup
  labels: VariableLabels
  onEditVariable?: (name: string) => void
  wrapperClassName?: string
}

export function VariableInput({
  value,
  onValueChange,
  lookup,
  labels,
  onEditVariable,
  className,
  wrapperClassName,
  placeholder,
  ...rest
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<HoverState | null>(null)
  const closeTimer = useRef<number | null>(null)

  const segments = split(value)

  const syncScroll = useCallback(() => {
    const input = inputRef.current
    const mirror = mirrorRef.current
    if (input && mirror) mirror.scrollLeft = input.scrollLeft
  }, [])

  useEffect(() => {
    syncScroll()
  }, [value, syncScroll])

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
  }, [])

  useEffect(() => {
    if (!hover) return
    const close = () => setHover(null)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [hover])

  const openHover = (name: string, element: HTMLElement) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    const rect = element.getBoundingClientRect()
    setHover({ name, x: rect.left, y: rect.bottom + 4 })
  }

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setHover(null), 120)
  }

  const focusAt = (position: number) => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    input.setSelectionRange(position, position)
  }

  const info = hover ? lookup(hover.name) : null

  return (
    <div className={cn('relative min-w-0', wrapperClassName)}>
      <input
        {...rest}
        ref={inputRef}
        value={value}
        onChange={(event) => {
          setHover(null)
          onValueChange(event.target.value)
        }}
        onScroll={() => {
          setHover(null)
          syncScroll()
        }}
        placeholder={placeholder}
        spellCheck={false}
        className={cn(
          'w-full bg-transparent text-transparent caret-foreground outline-none placeholder:text-transparent',
          className,
        )}
      />

      <div
        ref={mirrorRef}
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 overflow-hidden whitespace-pre text-foreground',
          className,
        )}
      >
        {value === '' && placeholder && (
          <span className="text-muted-foreground/60">{placeholder}</span>
        )}

        {segments.map((segment, index) =>
          segment.name === null ? (
            <span key={`text-${index}`}>{segment.text}</span>
          ) : (
            <span
              key={`var-${index}`}
              className={cn(
                'pointer-events-auto cursor-pointer rounded-[3px]',
                lookup(segment.name).known
                  ? 'bg-status-success/15 text-status-success'
                  : 'bg-destructive/15 text-destructive',
              )}
              onMouseEnter={(event) => openHover(segment.name!, event.currentTarget)}
              onMouseLeave={scheduleClose}
              onMouseDown={(event) => {
                event.preventDefault()
                focusAt(segment.end)
              }}
            >
              {segment.text}
            </span>
          ),
        )}
      </div>

      {hover && info && (
        <div
          className="fixed z-50 flex max-w-80 flex-col items-start gap-0.5 rounded-md border border-border bg-popover px-2 py-1.5 shadow-lg"
          style={{ left: hover.x, top: hover.y }}
          onMouseEnter={() => {
            if (closeTimer.current) window.clearTimeout(closeTimer.current)
          }}
          onMouseLeave={scheduleClose}
        >
          <span className="font-mono text-[11px] text-muted-foreground">{hover.name}</span>
          <span
            className={cn(
              'font-mono text-xs break-all',
              info.known ? 'text-popover-foreground' : 'text-destructive',
            )}
          >
            {info.known ? info.value || labels.empty : labels.unset}
          </span>
          {info.known && info.source && (
            <span className="text-[11px] text-muted-foreground">{info.source}</span>
          )}
          {onEditVariable && (
            <button
              type="button"
              onClick={() => {
                setHover(null)
                onEditVariable(hover.name)
              }}
              className="mt-0.5 text-[11px] text-primary hover:underline"
            >
              {info.known ? labels.edit : labels.add}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
