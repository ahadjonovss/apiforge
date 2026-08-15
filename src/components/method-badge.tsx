import { cn } from '@/lib/utils'
import type { HttpMethod } from '@/types/http'

const METHOD_CLASS: Record<HttpMethod, string> = {
  GET: 'text-method-get',
  POST: 'text-method-post',
  PUT: 'text-method-put',
  PATCH: 'text-method-patch',
  DELETE: 'text-method-delete',
  HEAD: 'text-method-head',
  OPTIONS: 'text-method-options',
}

export function MethodBadge({ method, className }: { method: HttpMethod; className?: string }) {
  return (
    <span className={cn('font-mono text-[11px] font-bold', METHOD_CLASS[method], className)}>
      {method}
    </span>
  )
}
