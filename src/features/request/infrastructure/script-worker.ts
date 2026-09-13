import type { ScriptInput, ScriptLog, ScriptOutcome, ScriptVariable } from '../domain/script'

type WorkerScope = Record<string, unknown> & {
  onmessage: ((event: MessageEvent<ScriptInput>) => void) | null
  postMessage: (message: ScriptOutcome) => void
}

const scope = self as unknown as WorkerScope

const REMOVED_GLOBALS = [
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'importScripts',
  'indexedDB',
  'caches',
  'navigator',
  'Worker',
  'SharedWorker',
  'BroadcastChannel',
]

function strip(name: string) {
  let target: object | null = scope
  while (target) {
    if (Object.prototype.hasOwnProperty.call(target, name)) {
      try {
        Reflect.deleteProperty(target, name)
      } catch {
        try {
          scope[name] = undefined
        } catch {
          return
        }
      }
      return
    }
    target = Object.getPrototypeOf(target) as object | null
  }
}

for (const name of REMOVED_GLOBALS) strip(name)

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
  ...args: string[]
) => (...args: unknown[]) => Promise<unknown>

function text(value: unknown): string {
  if (typeof value === 'string') return value
  if (value instanceof Error) return value.message
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

function format(values: unknown[]): string {
  return values.map(text).join(' ')
}

scope.onmessage = async (event: MessageEvent<ScriptInput>) => {
  const input = event.data
  const logs: ScriptLog[] = []
  const written = new Map<string, string>()

  const sandboxConsole = {
    log: (...values: unknown[]) => logs.push({ level: 'log', text: format(values) }),
    info: (...values: unknown[]) => logs.push({ level: 'log', text: format(values) }),
    warn: (...values: unknown[]) => logs.push({ level: 'warn', text: format(values) }),
    error: (...values: unknown[]) => logs.push({ level: 'error', text: format(values) }),
  }

  const headerValue = (name: string): string | undefined => {
    const wanted = String(name).trim().toLowerCase()
    const found = Object.entries(input.response.headers).find(
      ([key]) => key.toLowerCase() === wanted,
    )
    return found?.[1]
  }

  const af = {
    request: input.request,
    response: {
      status: input.response.status,
      statusText: input.response.statusText,
      ok: input.response.status >= 200 && input.response.status < 300,
      durationMs: input.response.durationMs,
      headers: input.response.headers,
      body: input.response.body,
      header: headerValue,
      json: () => JSON.parse(input.response.body) as unknown,
    },
    vars: {
      get: (key: string) => written.get(String(key)) ?? input.variables[String(key)],
      set: (key: string, value: unknown) => {
        const name = String(key).trim()
        if (!name) throw new Error('af.vars.set: empty variable name')
        written.set(name, value === null || value === undefined ? '' : text(value))
      },
    },
  }

  const variables = (): ScriptVariable[] =>
    [...written].map(([key, value]) => ({ key, value }))

  try {
    const run = new AsyncFunction('af', 'console', input.code)
    await run(af, sandboxConsole)
    scope.postMessage({ logs, variables: variables(), error: null, timedOut: false })
  } catch (error) {
    scope.postMessage({
      logs,
      variables: variables(),
      error: error instanceof Error ? error.message : String(error),
      timedOut: false,
    })
  }
}
