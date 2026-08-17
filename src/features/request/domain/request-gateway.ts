import type { HttpMethod } from '@/core/domain/http'
import type { VariableScope } from '@/core/domain/variables'
import type { InheritedConfig } from './request'
import type { ResponseResult } from './response'

export interface HttpCall {
  method: HttpMethod
  url: URL
  headers: Headers
  body: BodyInit | null
}

export interface SendOptions {
  scope?: VariableScope
  timeoutMs?: number
  signal?: AbortSignal
  inherited?: InheritedConfig
  files?: Record<string, File>
}

export interface RequestGateway {
  send(call: HttpCall, signal: AbortSignal): Promise<ResponseResult>
}
