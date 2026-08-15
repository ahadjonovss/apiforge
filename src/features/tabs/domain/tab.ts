import type { RequestDef } from '@/features/request/domain/request'
import type { RequestError, ResponseResult } from '@/features/request/domain/response'

export interface Tab {
  id: string
  request: RequestDef
  response: ResponseResult | null
  error: RequestError | null
  isSending: boolean
  dirty: boolean
}
