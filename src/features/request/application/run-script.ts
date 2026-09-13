import type { VariableScope } from '@/core/domain/variables'
import type { RequestDef } from '../domain/request'
import type { ResponseResult } from '../domain/response'
import type { ScriptOutcome, ScriptRunner } from '../domain/script'
import { interpolate } from './interpolate'

const DEFAULT_SCRIPT_TIMEOUT_MS = 2_000

export interface RunScriptOptions {
  variables?: VariableScope
  timeoutMs?: number
}

export function createRunScript(runner: ScriptRunner) {
  return async function runScript(
    request: RequestDef,
    response: ResponseResult,
    options: RunScriptOptions = {},
  ): Promise<ScriptOutcome | null> {
    const code = request.script?.trim() ?? ''
    if (!code) return null

    const variables = options.variables ?? {}

    return runner.run(
      {
        code,
        request: { method: request.method, url: interpolate(request.url, variables) },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          body: response.body,
          durationMs: response.durationMs,
        },
        variables,
      },
      options.timeoutMs ?? DEFAULT_SCRIPT_TIMEOUT_MS,
    )
  }
}
