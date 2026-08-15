import type { RequestDef } from '../domain/request'
import type { RequestGateway, SendOptions } from '../domain/request-gateway'
import { HttpRequestFailure, type ResponseResult } from '../domain/response'
import { buildHttpCall } from './build-http-call'

const DEFAULT_TIMEOUT_MS = 30_000

export function createSendRequest(gateway: RequestGateway) {
  return async function sendRequest(
    request: RequestDef,
    options: SendOptions = {},
  ): Promise<ResponseResult> {
    const scope = { ...(options.inherited?.variables ?? {}), ...(options.scope ?? {}) }
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

    const call = buildHttpCall(request, scope, options.inherited)

    const timeoutSignal = AbortSignal.timeout(timeoutMs)
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeoutSignal])
      : timeoutSignal

    try {
      return await gateway.send(call, signal)
    } catch (error) {
      if (timeoutSignal.aborted) {
        throw new HttpRequestFailure({
          kind: 'timeout',
          title: 'error.title.timeout',
          message: 'error.msg.timeoutMs',
          hint: 'error.hint.timeout',
          params: { ms: timeoutMs },
        })
      }
      throw error
    }
  }
}
