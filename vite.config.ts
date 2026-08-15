import { defineConfig, type Plugin } from 'vite'
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
])

const STRIPPED_RESPONSE_HEADERS = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'keep-alive',
])

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
          if (STRIPPED_RESPONSE_HEADERS.has(key) || key === 'set-cookie') return
          res.setHeader(key, value)
        })

        const setCookie = upstream.headers.getSetCookie()
        if (setCookie.length > 0) res.setHeader('set-cookie', setCookie)

        res.end(Buffer.from(await upstream.arrayBuffer()))
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
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
