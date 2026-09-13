import type { VariableScope } from '@/core/domain/variables'
import type { HttpMethod } from '@/core/domain/http'

export interface ScriptLog {
  level: 'log' | 'warn' | 'error'
  text: string
}

export interface ScriptVariable {
  key: string
  value: string
}

export interface ScriptInput {
  code: string
  request: { method: HttpMethod; url: string }
  response: {
    status: number
    statusText: string
    headers: Record<string, string>
    body: string
    durationMs: number
  }
  variables: VariableScope
}

export interface ScriptOutcome {
  logs: ScriptLog[]
  variables: ScriptVariable[]
  error: string | null
  timedOut: boolean
}

export interface ScriptRunner {
  run(input: ScriptInput, timeoutMs: number): Promise<ScriptOutcome>
}
