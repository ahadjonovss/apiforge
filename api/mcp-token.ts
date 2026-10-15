import type { IncomingMessage, ServerResponse } from 'node:http'
import { verifyIdToken } from './_auth.js'
import { sealToken } from './_mcp-auth.js'

const MAX_BODY_BYTES = 16 * 1024

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0

    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body is too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const send = (status: number, payload: unknown) => {
    res.statusCode = status
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(payload))
  }

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('allow', 'POST')
    res.end()
    return
  }

  const header = req.headers.authorization
  const value = Array.isArray(header) ? header[0] : header
  const idToken = value?.startsWith('Bearer ') ? value.slice(7).trim() : value?.trim()

  const user = await verifyIdToken(idToken)
  if (!user) return send(401, { error: 'sign in first' })

  let body: { refreshToken?: unknown }
  try {
    body = JSON.parse(await readBody(req)) as { refreshToken?: unknown }
  } catch {
    return send(400, { error: 'invalid body' })
  }

  const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : ''
  if (!refreshToken) return send(400, { error: 'refreshToken is required' })

  const token = sealToken({ rt: refreshToken, uid: user.uid, pid: user.projectId })
  if (!token) return send(500, { error: 'server is missing APIFORGE_MCP_SECRET' })

  return send(200, { token })
}
