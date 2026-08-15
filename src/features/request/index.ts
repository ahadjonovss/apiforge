import { createSendRequest } from './application/send-request'
import { fetchRequestGateway } from './infrastructure/fetch-request-gateway'

export const sendRequest = createSendRequest(fetchRequestGateway)

export { createRequest } from './application/request-factory'
export { HttpRequestFailure } from './domain/response'
export type { RequestDef } from './domain/request'
export type { RequestError, ResponseResult } from './domain/response'
