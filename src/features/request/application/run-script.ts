import type { VariableScope } from '@/core/domain/variables'
import type { RequestDef } from '../domain/request'
import type { ResponseResult } from '../domain/response'
import type { ScriptOutcome, ScriptRunner, ScriptVariable } from '../domain/script'
import { interpolate } from './interpolate'

const DEFAULT_SCRIPT_TIMEOUT_MS = 2_000

export interface RunScriptOptions {
  variables?: VariableScope
  timeoutMs?: number
  environmentActive?: boolean
}

export function mergeScriptOutcomes(
  ...outcomes: (ScriptOutcome | null)[]
): ScriptOutcome | null {
  const present = outcomes.filter((outcome): outcome is ScriptOutcome => outcome !== null)
  if (present.length === 0) return null
  if (present.length === 1) return present[0]

  const variables = new Map<string, ScriptVariable>()
  for (const outcome of present) {
    for (const variable of outcome.variables) variables.set(variable.key, variable)
  }

  return {
    logs: present.flatMap((outcome) => outcome.logs),
    variables: [...variables.values()],
    error: present.find((outcome) => outcome.error)?.error ?? null,
    timedOut: present.some((outcome) => outcome.timedOut),
  }
}

export function createRunScript(runner: ScriptRunner) {
  return async function runScript(
    source: string,
    request: RequestDef,
    response: ResponseResult,
    options: RunScriptOptions = {},
  ): Promise<ScriptOutcome | null> {
    const code = source.trim()
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
        environmentActive: options.environmentActive ?? false,
      },
      options.timeoutMs ?? DEFAULT_SCRIPT_TIMEOUT_MS,
    )
  }
}
