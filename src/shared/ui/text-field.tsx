import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/core/lib/cn'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, error, hint, className, ...rest },
  ref,
) {
  const id = useId()

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          'rounded-md border bg-card px-3 py-2 text-xs outline-none transition focus:ring-1',
          error
            ? 'border-destructive focus:ring-destructive'
            : 'border-border focus:ring-ring',
          className,
        )}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="text-[11px] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
})
