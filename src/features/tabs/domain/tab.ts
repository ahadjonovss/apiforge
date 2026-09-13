import type { CaptureMiss, CapturedValue } from '@/features/request/application/apply-captures'
import type { InheritedConfig, RequestDef } from '@/features/request/domain/request'
import type { RequestError, ResponseResult } from '@/features/request/domain/response'
import type { ScriptOutcome } from '@/features/request/domain/script'

export interface Tab {
  id: string
  request: RequestDef
  inherited: InheritedConfig | null
  response: ResponseResult | null
  error: RequestError | null
  isSending: boolean
  dirty: boolean
  revision: number
  captures: CapturedValue[] | null
  captureMisses: CaptureMiss[]
  script: ScriptOutcome | null
  files: Record<string, File>
}
