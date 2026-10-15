import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'node:path'

export const DEV_PROXY_PATH = '/__apiforge_proxy'

const STRIPPED_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'origin',
  'referer',
  'accept-encoding',
  'content-length',
  'x-apiforge-token',
])

const STRIPPED_RESPONSE_HEADERS = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'keep-alive',
  'set-cookie',
  'set-cookie2',
  'strict-transport-security',
  'clear-site-data',
  'content-security-policy',
  'content-security-policy-report-only',
])

const CONTENT_TYPE_HEADER = 'x-apiforge-content-type'

function devProxy(): Plugin {
  return {
    name: 'apiforge-dev-proxy',
    config: (_config, { command }) => ({
      define: { __DEV_PROXY__: JSON.stringify(command === 'serve') },
    }),
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith(DEV_PROXY_PATH)) return next()

        const target = new URL(req.url, 'http://localhost').searchParams.get('target')

        const fail = (status: number, message: string, code = '') => {
          res.statusCode = status
          res.setHeader('x-apiforge-proxy-error', '1')
          if (code) res.setHeader('x-apiforge-error-code', code)
          res.setHeader('content-type', 'text/plain; charset=utf-8')
          res.end(message)
        }

        if (!target) return fail(400, 'target parametri yo‘q')

        let targetUrl: URL
        try {
          targetUrl = new URL(target)
        } catch {
          return fail(400, `URL noto‘g‘ri: ${target}`)
        }

        if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
          return fail(400, `Qo‘llab-quvvatlanmaydigan protokol: ${targetUrl.protocol}`)
        }

        const headers = new Headers()
        for (const [key, value] of Object.entries(req.headers)) {
          if (STRIPPED_REQUEST_HEADERS.has(key) || key.startsWith('sec-')) continue
          if (Array.isArray(value)) for (const item of value) headers.append(key, item)
          else if (value !== undefined) headers.set(key, value)
        }

        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined

        let upstream: Response
        try {
          upstream = await fetch(targetUrl, {
            method: req.method,
            headers,
            body,
            redirect: 'follow',
          })
        } catch (error) {
          const cause = error instanceof Error && error.cause instanceof Error ? error.cause : null
          const carrier = cause ?? error
          const detail = carrier instanceof Error ? carrier.message : String(error)
          const code =
            typeof carrier === 'object' && carrier !== null && 'code' in carrier
              ? String((carrier as { code: unknown }).code)
              : ''
          return fail(502, detail, code)
        }

        res.statusCode = upstream.status
        res.statusMessage = upstream.statusText

        upstream.headers.forEach((value, key) => {
          if (STRIPPED_RESPONSE_HEADERS.has(key)) return
          res.setHeader(key, value)
        })

        const upstreamType = upstream.headers.get('content-type')
        if (upstreamType) res.setHeader(CONTENT_TYPE_HEADER, upstreamType)
        res.setHeader('content-type', 'application/octet-stream')
        res.setHeader('x-content-type-options', 'nosniff')
        res.setHeader('content-security-policy', "sandbox; default-src 'none'")

        res.end(Buffer.from(await upstream.arrayBuffer()))
      })
    },
  }
}

const DEV_API_ROUTES: Record<string, string> = {
  '/api/mcp': '/api/mcp.ts',
  '/api/mcp-token': '/api/mcp-token.ts',
}

/**
 * Vercel serves `api/*.ts` as functions; the dev server does not. This mounts the
 * same handlers so the MCP endpoint can be exercised locally instead of only
 * after a deploy.
 */
function devApi(): Plugin {
  return {
    name: 'apiforge-dev-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      process.env.APIFORGE_FIREBASE_API_KEY ||= env.VITE_FIREBASE_API_KEY ?? ''
      process.env.APIFORGE_MCP_SECRET ||= 'apiforge-local-dev-secret-not-for-production'

      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0] ?? ''
        const file = DEV_API_ROUTES[path]
        if (!file) return next()

        try {
          const module = await server.ssrLoadModule(file)
          const handler = module.default as (
            request: typeof req,
            response: typeof res,
          ) => Promise<void>
          await handler(req, res)
        } catch (error) {
          res.statusCode = 500
          res.setHeader('content-type', 'text/plain; charset=utf-8')
          res.end(error instanceof Error ? error.stack ?? error.message : String(error))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: 'src/app/routes',
      generatedRouteTree: 'src/app/route-tree.gen.ts',
    }),
    react(),
    tailwindcss(),
    devProxy(),
    devApi(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
