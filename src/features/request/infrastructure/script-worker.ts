import type { ScriptInput, ScriptOutcome } from '../domain/script'
import { createScriptSandbox } from './script-api'

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

scope.onmessage = async (event: MessageEvent<ScriptInput>) => {
  const input = event.data
  const sandbox = createScriptSandbox(input)

  try {
    const run = new AsyncFunction('af', 'pm', 'console', input.code)
    await run(sandbox.af, sandbox.pm, sandbox.console)
    scope.postMessage({
      logs: sandbox.logs,
      variables: sandbox.variables(),
      error: null,
      timedOut: false,
    })
  } catch (error) {
    scope.postMessage({
      logs: sandbox.logs,
      variables: sandbox.variables(),
      error: error instanceof Error ? error.message : String(error),
      timedOut: false,
    })
  }
}
