import type { ScriptInput, ScriptOutcome, ScriptRunner } from '../domain/script'

export const workerScriptRunner: ScriptRunner = {
  run(input: ScriptInput, timeoutMs: number): Promise<ScriptOutcome> {
    return new Promise((resolve) => {
      const worker = new Worker(new URL('./script-worker.ts', import.meta.url), {
        type: 'module',
      })

      let settled = false

      const finish = (outcome: ScriptOutcome) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        worker.terminate()
        resolve(outcome)
      }

      const timer = setTimeout(
        () => finish({ logs: [], variables: [], error: null, timedOut: true }),
        timeoutMs,
      )

      worker.onmessage = (event: MessageEvent<ScriptOutcome>) => finish(event.data)
      worker.onerror = (event) =>
        finish({
          logs: [],
          variables: [],
          error: event.message || 'script failed to start',
          timedOut: false,
        })

      worker.postMessage(input)
    })
  },
}
