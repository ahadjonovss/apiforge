import { createRunScript } from './application/run-script'
import { createSendRequest } from './application/send-request'
import { fetchRequestGateway } from './infrastructure/fetch-request-gateway'
import { workerScriptRunner } from './infrastructure/worker-script-runner'

export const sendRequest = createSendRequest(fetchRequestGateway)
export const runScript = createRunScript(workerScriptRunner)

export { createRequest } from './application/request-factory'
export { describeRawError } from './application/describe-error'
export { HttpRequestFailure } from './domain/response'
export type { RequestDef } from './domain/request'
export type { RequestError, ResponseResult } from './domain/response'
export type { ScriptOutcome } from './domain/script'
