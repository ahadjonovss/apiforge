import { HTTP_METHODS, type HttpMethod, type KeyValue } from '@/core/domain/http'
import { newId } from '@/core/lib/id'
import type { EnvVariable } from '@/features/environments/domain/environment'
import type { AuthConfig, RequestBody, ResponseDoc } from '@/features/request/domain/request'
import {
  ImportFailure,
  type ImportPlan,
  type PlannedEndpoint,
  type PlannedFolder,
} from '../domain/import-plan'
import type {
  PostmanAuth,
  PostmanResponse,
  PostmanBody,
  PostmanCollection,
  PostmanItem,
  PostmanKeyValue,
  PostmanRequest,
  PostmanUrl,
} from '../domain/postman'

const UNSUPPORTED_AUTH = ['oauth1', 'oauth2', 'awsv4', 'digest', 'ntlm', 'hawk', 'edgegrid']

function text(value: string | { content?: string } | undefined): string {
  if (!value) return ''
  return typeof value === 'string' ? value : (value.content ?? '')
}

function pairs(entries: PostmanKeyValue[] | undefined): KeyValue[] {
  return (entries ?? [])
    .filter((entry) => (entry.key ?? '').trim() !== '')
    .map((entry) => ({
      id: newId(),
      key: entry.key as string,
      value: entry.value ?? '',
      enabled: entry.disabled !== true,
    }))
}

function lookup(entries: PostmanKeyValue[] | undefined, key: string): string {
  return entries?.find((entry) => entry.key === key)?.value ?? ''
}

function toMethod(raw: string | undefined, name: string, warnings: string[]): HttpMethod {
  const method = (raw ?? 'GET').toUpperCase() as HttpMethod
  if (HTTP_METHODS.includes(method)) return method
  warnings.push(`«${name}»: ${raw} metodi qo'llab-quvvatlanmaydi, GET qilib olindi`)
  return 'GET'
}

function toUrl(url: PostmanUrl | string | undefined): { raw: string; params: KeyValue[] } {
  if (!url) return { raw: '', params: [] }
  if (typeof url === 'string') return { raw: url, params: [] }

  if (url.raw) {
    return { raw: url.raw.split('?')[0], params: pairs(url.query) }
  }

  const host = Array.isArray(url.host) ? url.host.join('.') : (url.host ?? '')
  const path = Array.isArray(url.path) ? url.path.join('/') : (url.path ?? '')
  const protocol = url.protocol ? `${url.protocol}://` : ''
  const joined = path ? `${protocol}${host}/${path}` : `${protocol}${host}`

  return { raw: joined, params: pairs(url.query) }
}

function toAuth(
  auth: PostmanAuth | undefined,
  name: string,
  warnings: string[],
  fallback: AuthConfig,
): AuthConfig {
  if (!auth?.type) return fallback

  switch (auth.type) {
    case 'noauth':
      return { mode: 'none' }

    case 'bearer':
      return { mode: 'bearer', bearer: { token: lookup(auth.bearer, 'token') } }

    case 'basic':
      return {
        mode: 'basic',
        basic: {
          username: lookup(auth.basic, 'username'),
          password: lookup(auth.basic, 'password'),
        },
      }

    case 'apikey': {
      const addTo = lookup(auth.apikey, 'in') === 'query' ? 'query' : 'header'
      return {
        mode: 'apiKey',
        apiKey: {
          key: lookup(auth.apikey, 'key'),
          value: lookup(auth.apikey, 'value'),
          addTo,
        },
      }
    }

    default:
      if (UNSUPPORTED_AUTH.includes(auth.type)) {
        warnings.push(`«${name}»: ${auth.type} auth qo'llab-quvvatlanmaydi, o'tkazib yuborildi`)
      } else {
        warnings.push(`«${name}»: notanish auth turi «${auth.type}», o'tkazib yuborildi`)
      }
      return { mode: 'none' }
  }
}

function toBody(body: PostmanBody | undefined, name: string, warnings: string[]): RequestBody {
  const empty: RequestBody = {
    mode: 'none',
    raw: '',
    rawLanguage: 'json',
    formData: [],
    urlencoded: [],
  }

  if (!body?.mode) return empty

  switch (body.mode) {
    case 'raw': {
      const language = body.options?.raw?.language ?? 'text'
      const known = ['json', 'xml', 'html', 'text'].includes(language)
      return {
        ...empty,
        mode: language === 'json' ? 'json' : 'raw',
        raw: body.raw ?? '',
        rawLanguage: known ? (language as 'json' | 'xml' | 'html' | 'text') : 'text',
      }
    }

    case 'urlencoded':
      return { ...empty, mode: 'urlencoded', urlencoded: pairs(body.urlencoded) }

    case 'formdata': {
      const files = (body.formdata ?? []).filter((entry) => entry.type === 'file')
      if (files.length > 0) {
        warnings.push(
          `«${name}»: form-data ichidagi ${files.length} ta fayl maydoni ko'chirilmadi`,
        )
      }
      return {
        ...empty,
        mode: 'form-data',
        formData: (body.formdata ?? [])
          .filter((entry) => entry.type !== 'file' && (entry.key ?? '').trim() !== '')
          .map((entry) => ({
            id: newId(),
            key: entry.key as string,
            value: entry.value ?? '',
            enabled: entry.disabled !== true,
            type: 'text' as const,
          })),
      }
    }

    case 'graphql':
      warnings.push(`«${name}»: GraphQL body JSON ko'rinishiga o'girildi`)
      return {
        ...empty,
        mode: 'json',
        raw: JSON.stringify(
          {
            query: body.graphql?.query ?? '',
            variables: body.graphql?.variables ? JSON.parse(body.graphql.variables || '{}') : {},
          },
          null,
          2,
        ),
      }

    case 'file':
      warnings.push(`«${name}»: fayl body'si ko'chirilmadi`)
      return empty

    default:
      warnings.push(`«${name}»: «${body.mode}» body turi qo'llab-quvvatlanmaydi`)
      return empty
  }
}

function toResponseDocs(responses: PostmanResponse[] | undefined): ResponseDoc[] {
  return (responses ?? [])
    .filter((response) => response.code || response.name)
    .map((response) => ({
      id: newId(),
      status: response.code ? String(response.code) : '200',
      title: (response.name ?? '').trim(),
      body: response.body?.trim()
        ? ['```json', response.body.trim(), '```'].join('\n')
        : '',
    }))
}

function isFolder(item: PostmanItem): boolean {
  return Array.isArray(item.item)
}

const LEADING_VARIABLE = /^\{\{\s*([\w.-]+)\s*\}\}/

function leadingVariable(url: string): string | null {
  return LEADING_VARIABLE.exec(url.trim())?.[1] ?? null
}

function promoteBaseUrl(endpoints: PlannedEndpoint[], warnings: string[]): string {
  if (endpoints.length === 0) return ''

  const candidate = leadingVariable(endpoints[0].url)
  if (!candidate) return ''
  if (!endpoints.every((endpoint) => leadingVariable(endpoint.url) === candidate)) return ''

  for (const endpoint of endpoints) {
    endpoint.url = endpoint.url.trim().replace(LEADING_VARIABLE, '')
  }

  warnings.push(
    `Barcha so'rovlar «{{${candidate}}}» bilan boshlangani uchun u base URL sifatida ajratildi — qiymatini sozlamalardagi o'zgaruvchilardan bering`,
  )

  return `{{${candidate}}}`
}

function hasScript(events: unknown[] | undefined): boolean {
  if (!Array.isArray(events)) return false

  return events.some((event) => {
    const exec = (event as { script?: { exec?: unknown } })?.script?.exec
    if (typeof exec === 'string') return exec.trim() !== ''
    if (Array.isArray(exec)) {
      return exec.some((line) => typeof line === 'string' && line.trim() !== '')
    }
    return false
  })
}

export function parsePostmanCollection(source: string): ImportPlan {
  let parsed: PostmanCollection
  try {
    parsed = JSON.parse(source) as PostmanCollection
  } catch {
    throw new ImportFailure("Fayl JSON emas yoki buzilgan")
  }

  if (!parsed || typeof parsed !== 'object' || !parsed.info) {
    throw new ImportFailure("Bu Postman collection fayliga o'xshamaydi (info bo'limi yo'q)")
  }

  const warnings: string[] = []
  const schema = parsed.info.schema ?? ''
  if (schema && !schema.includes('v2.1') && !schema.includes('v2.0')) {
    warnings.push('Collection formati v2.x emas — ba’zi maydonlar tushib qolishi mumkin')
  }
  if (hasScript(parsed.event)) {
    warnings.push("Collection darajasidagi skriptlar ko'chirilmadi")
  }

  const collectionAuth = toAuth(parsed.auth, parsed.info.name ?? 'collection', warnings, {
    mode: 'none',
  })

  const variables: EnvVariable[] = (parsed.variable ?? [])
    .filter((entry) => (entry.key ?? '').trim() !== '')
    .map((entry) => ({
      id: newId(),
      key: entry.key as string,
      value: entry.value ?? '',
      enabled: entry.disabled !== true,
      secret: false,
    }))

  const folders: PlannedFolder[] = []
  const endpoints: PlannedEndpoint[] = []
  let scriptedRequests = 0

  const scriptedFolders: string[] = []

  const walk = (items: PostmanItem[], parentId: string | null) => {
    items.forEach((item, index) => {
      const name = (item.name ?? '').trim() || 'Nomsiz'

      if (isFolder(item)) {
        const id = newId()
        folders.push({ id, parentId, name, order: index })
        if (hasScript(item.event)) scriptedFolders.push(name)
        walk(item.item ?? [], id)
        return
      }

      if (!item.request) {
        warnings.push(`«${name}» na papka, na so'rov — o'tkazib yuborildi`)
        return
      }

      if (hasScript(item.event)) scriptedRequests += 1

      const request: PostmanRequest =
        typeof item.request === 'string' ? { url: item.request } : item.request

      const { raw, params } = toUrl(request.url)

      endpoints.push({
        id: newId(),
        folderId: parentId,
        order: index,
        name,
        docs: text(item.description) || text(request.description),
        responseDocs: toResponseDocs(item.response),
        method: toMethod(request.method, name, warnings),
        url: raw,
        params,
        headers: Array.isArray(request.header) ? pairs(request.header) : [],
        body: toBody(request.body, name, warnings),
        auth: toAuth(request.auth, name, warnings, { mode: 'inherit' }),
      })
    })
  }

  walk(parsed.item ?? [], null)

  if (scriptedFolders.length > 0) {
    warnings.push(
      `«${scriptedFolders.join('», «')}» papkasidagi skriptlar ko'chirilmadi — agar ular token yoki o'zgaruvchi o'rnatgan bo'lsa, qiymatni qo'lda kiritish kerak`,
    )
  }

  if (scriptedRequests > 0) {
    warnings.push(
      `${scriptedRequests} ta so'rovdagi pre-request/test skriptlari ko'chirilmadi`,
    )
  }

  if (endpoints.length === 0 && folders.length === 0) {
    throw new ImportFailure("Collection bo'sh — ko'chiradigan narsa topilmadi")
  }

  const baseUrl = promoteBaseUrl(endpoints, warnings)

  return {
    collection: {
      name: (parsed.info.name ?? '').trim() || 'Import qilingan collection',
      description: text(parsed.info.description).split('\n')[0].slice(0, 200),
      docs: text(parsed.info.description),
      baseUrl,
      headers: [],
      auth: collectionAuth,
      variables,
    },
    folders,
    endpoints,
    warnings,
  }
}
