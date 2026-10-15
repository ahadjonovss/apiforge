import { auth } from '@/core/config/firebase'
import { firebaseConfig } from '@/core/config/firebase-config'
import { DataFailure } from '@/core/domain/data-error'
import type { McpGateway } from '../domain/mcp-gateway'

const ENDPOINT = '/api/mcp-token'

function fail(message: string): never {
  throw new DataFailure({ kind: 'unknown', message })
}

export const firebaseMcpGateway: McpGateway = {
  async issueToken() {
    const user = auth.currentUser
    if (!user) fail('mcp.error.signedOut')

    const idToken = await user.getIdToken()
    const refreshToken = user.refreshToken
    if (!refreshToken) fail('mcp.error.noSession')

    let response: Response
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${idToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ refreshToken, apiKey: firebaseConfig.apiKey }),
      })
    } catch {
      fail('mcp.error.unreachable')
    }

    if (!response.ok) {
      fail(response.status === 500 ? 'mcp.error.notConfigured' : 'mcp.error.failed')
    }

    const payload = (await response.json()) as { token?: string }
    if (!payload.token) fail('mcp.error.failed')
    return payload.token
  },
}
