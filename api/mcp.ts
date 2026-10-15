import type { IncomingMessage, ServerResponse } from 'node:http'
import { createFirestore, FirestoreError } from './_firestore.js'
import { apiKeyFor, idTokenFor, openToken } from './_mcp-auth.js'
import { callTool, TOOLS } from './_mcp-tools.js'

const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']
const MAX_BODY_BYTES = 1024 * 1024

interface RpcRequest {
  jsonrpc?: string
  id?: string | number | null
  method?: string
  params?: Record<string, unknown>
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0

    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('request body is too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

function bearer(req: IncomingMessage): string | undefined {
  const header = req.headers.authorization
  const value = Array.isArray(header) ? header[0] : header
  if (!value) return undefined
  return value.startsWith('Bearer ') ? value.slice(7).trim() : value.trim()
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const send = (status: number, payload: unknown) => {
    res.statusCode = status
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(payload))
  }

  const rpcError = (id: RpcRequest['id'], code: number, message: string, status = 200) =>
    send(status, { jsonrpc: '2.0', id: id ?? null, error: { code, message } })

  if (req.method === 'GET' || req.method === 'DELETE') {
    // Streamable HTTP allows a server to decline the optional SSE stream.
    res.statusCode = 405
    res.setHeader('allow', 'POST')
    res.end()
    return
  }

  if (req.method !== 'POST') return send(405, { error: 'method not allowed' })

  const identity = openToken(bearer(req))
  if (!identity) {
    res.setHeader('www-authenticate', 'Bearer realm="apiforge"')
    return rpcError(null, -32001, 'missing or invalid APIForge token', 401)
  }

  let request: RpcRequest
  try {
    request = JSON.parse(await readBody(req)) as RpcRequest
  } catch {
    return rpcError(null, -32700, 'parse error', 400)
  }

  const { id = null, method } = request
  const params = request.params ?? {}

  if (!method) return rpcError(id, -32600, 'invalid request')

  if (method === 'initialize') {
    const asked = typeof params.protocolVersion === 'string' ? params.protocolVersion : ''
    return send(200, {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'apiforge', version: '1.0.0' },
        instructions:
          'APIForge collections for this account. Endpoint urls are relative to the ' +
          'collection base URL, and {{variable}} placeholders are resolved from collection ' +
          'and environment variables when a request is sent.',
      },
    })
  }

  if (method.startsWith('notifications/')) {
    res.statusCode = 202
    res.end()
    return
  }

  if (method === 'ping') return send(200, { jsonrpc: '2.0', id, result: {} })

  if (method === 'tools/list') {
    return send(200, { jsonrpc: '2.0', id, result: { tools: TOOLS } })
  }

  if (method !== 'tools/call') return rpcError(id, -32601, `unknown method ${method}`)

  const apiKey = apiKeyFor(identity.pid)
  if (!apiKey) return rpcError(id, -32603, 'server is missing a Firebase API key')

  const idToken = await idTokenFor(identity.rt, apiKey)
  if (!idToken) {
    return rpcError(id, -32001, 'this token no longer works — sign in again and make a new one', 401)
  }

  const name = typeof params.name === 'string' ? params.name : ''
  const args = (params.arguments ?? {}) as Record<string, unknown>

  try {
    const result = await callTool(createFirestore(identity.pid, idToken), identity.uid, name, args)
    return send(200, {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: { result },
      },
    })
  } catch (error) {
    const message =
      error instanceof FirestoreError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'tool failed'

    return send(200, {
      jsonrpc: '2.0',
      id,
      result: { content: [{ type: 'text', text: message }], isError: true },
    })
  }
}
