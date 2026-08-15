export const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const

export type HttpMethod = (typeof HTTP_METHODS)[number]

export interface KeyValue {
  id: string
  key: string
  value: string
  enabled: boolean
  description?: string
}
