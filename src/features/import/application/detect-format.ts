export type SourceFormat = 'postman' | 'openapi' | 'unknown'

export function detectFormat(parsed: unknown): SourceFormat {
  if (!parsed || typeof parsed !== 'object') return 'unknown'

  const doc = parsed as Record<string, unknown>
  if (typeof doc.openapi === 'string' || typeof doc.swagger === 'string') return 'openapi'
  if (doc.info && Array.isArray(doc.item)) return 'postman'

  return 'unknown'
}
