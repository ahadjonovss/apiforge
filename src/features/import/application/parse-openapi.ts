import { HTTP_METHODS, type HttpMethod, type KeyValue } from '@/core/domain/http'
import { newId } from '@/core/lib/id'
import type { EnvVariable } from '@/features/environments/domain/environment'
import type { AuthConfig, FormField, RequestBody, ResponseDoc } from '@/features/request/domain/request'
import {
  ImportFailure,
  type ImportMessage,
  type ImportPlan,
  type PlannedEndpoint,
  type PlannedFolder,
} from '../domain/import-plan'
import type {
  OpenApiDocument,
  OpenApiParameter,
  OpenApiRequestBody,
  OpenApiResponse,
  OpenApiSchema,
  OpenApiSecurityScheme,
} from '../domain/openapi'
import { deref } from './resolve-refs'
import { schemaToExample } from './schema-to-example'

const OPENAPI_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const

function templatePath(path: string): string {
  return path.replace(/\{(\w+)\}/g, '{{$1}}')
}

function toHttpMethod(method: string, path: string, warnings: ImportMessage[]): HttpMethod {
  const upper = method.toUpperCase() as HttpMethod
  if (HTTP_METHODS.includes(upper)) return upper
  warnings.push({ key: 'import.warning.unsupportedMethod', params: { name: path, method: upper } })
  return 'GET'
}

function serverBaseUrl(doc: OpenApiDocument): { baseUrl: string; variables: EnvVariable[] } {
  const server = doc.servers?.[0]
  if (server?.url) {
    const variables: EnvVariable[] = Object.entries(server.variables ?? {}).map(([key, variable]) => ({
      id: newId(),
      key,
      value: variable.default ?? '',
      enabled: true,
      secret: false,
    }))
    return { baseUrl: server.url.replace(/\{(\w+)\}/g, '{{$1}}'), variables }
  }

  if (doc.host) {
    const scheme = doc.schemes?.[0] ?? 'https'
    return { baseUrl: `${scheme}://${doc.host}${doc.basePath ?? ''}`, variables: [] }
  }

  return { baseUrl: '', variables: [] }
}

function schemeToAuth(
  scheme: OpenApiSecurityScheme | undefined,
  name: string,
  warnings: ImportMessage[],
): AuthConfig {
  if (!scheme) return { mode: 'none' }

  switch (scheme.type) {
    case 'apiKey':
      return {
        mode: 'apiKey',
        apiKey: { key: scheme.name ?? '', value: '', addTo: scheme.in === 'query' ? 'query' : 'header' },
      }

    case 'basic':
      return { mode: 'basic', basic: { username: '', password: '' } }

    case 'http':
      if (scheme.scheme === 'bearer') return { mode: 'bearer', bearer: { token: '' } }
      if (scheme.scheme === 'basic') return { mode: 'basic', basic: { username: '', password: '' } }
      warnings.push({
        key: 'import.warning.unsupportedAuth',
        params: { name, type: `http/${scheme.scheme ?? '?'}` },
      })
      return { mode: 'none' }

    case 'oauth2':
    case 'openIdConnect':
      warnings.push({ key: 'import.warning.unsupportedAuth', params: { name, type: scheme.type } })
      return { mode: 'none' }

    default:
      warnings.push({ key: 'import.warning.unknownAuth', params: { name, type: scheme.type ?? '?' } })
      return { mode: 'none' }
  }
}

function resolveSecurity(
  requirements: Record<string, string[]>[] | undefined,
  schemes: Record<string, OpenApiSecurityScheme>,
  name: string,
  warnings: ImportMessage[],
): AuthConfig {
  if (!requirements || requirements.length === 0) return { mode: 'none' }

  const schemeName = Object.keys(requirements[0])[0]
  if (!schemeName) return { mode: 'none' }

  return schemeToAuth(schemes[schemeName], name, warnings)
}

function mergeParameters(
  doc: unknown,
  pathParams: OpenApiParameter[],
  opParams: OpenApiParameter[],
): OpenApiParameter[] {
  const resolved = [...pathParams, ...opParams].map((parameter) => deref(doc, parameter))
  const merged = new Map<string, OpenApiParameter>()
  for (const parameter of resolved) {
    merged.set(`${parameter.in ?? ''}:${parameter.name ?? ''}`, parameter)
  }
  return [...merged.values()]
}

function collectParams(parameters: OpenApiParameter[]): { params: KeyValue[]; headers: KeyValue[] } {
  const params: KeyValue[] = []
  const headers: KeyValue[] = []

  for (const parameter of parameters) {
    if (parameter.in !== 'query' && parameter.in !== 'header') continue
    const key = (parameter.name ?? '').trim()
    if (!key) continue

    const value = parameter.example ?? parameter.schema?.example ?? parameter.schema?.default ?? parameter.default
    const entry: KeyValue = {
      id: newId(),
      key,
      value: value !== undefined ? String(value) : '',
      enabled: true,
    }

    if (parameter.in === 'header') headers.push(entry)
    else params.push(entry)
  }

  return { params, headers }
}

function firstExample(examples: Record<string, { value?: unknown }> | undefined): unknown {
  if (!examples) return undefined
  return Object.values(examples)[0]?.value
}

function schemaToKeyValues(doc: unknown, schema: OpenApiSchema | undefined): KeyValue[] {
  const resolved = deref(doc, schema)
  if (!resolved?.properties) return []

  return Object.entries(resolved.properties).map(([key, propSchema]) => ({
    id: newId(),
    key,
    value: String(schemaToExample(doc, propSchema) ?? ''),
    enabled: true,
  }))
}

function schemaToFormFields(
  doc: unknown,
  schema: OpenApiSchema | undefined,
  name: string,
  warnings: ImportMessage[],
): FormField[] {
  const resolved = deref(doc, schema)
  if (!resolved?.properties) return []

  const fields: FormField[] = []
  let fileCount = 0

  for (const [key, propSchema] of Object.entries(resolved.properties)) {
    const prop = deref(doc, propSchema)
    if (prop.type === 'string' && prop.format === 'binary') {
      fileCount += 1
      continue
    }
    fields.push({
      id: newId(),
      key,
      value: String(schemaToExample(doc, prop) ?? ''),
      enabled: true,
      type: 'text',
    })
  }

  if (fileCount > 0) {
    warnings.push({ key: 'import.warning.formDataFiles', params: { name, count: fileCount } })
  }

  return fields
}

const EMPTY_BODY: RequestBody = { mode: 'none', raw: '', rawLanguage: 'json', formData: [], urlencoded: [] }

function toBody3(
  doc: unknown,
  rawRequestBody: OpenApiRequestBody | undefined,
  name: string,
  warnings: ImportMessage[],
): RequestBody {
  const requestBody = deref(doc, rawRequestBody)
  if (!requestBody?.content) return EMPTY_BODY

  const content = requestBody.content

  if (content['application/json']) {
    const media = content['application/json']
    const example = media.example ?? firstExample(media.examples) ?? schemaToExample(doc, media.schema)
    return { ...EMPTY_BODY, mode: 'json', raw: JSON.stringify(example ?? {}, null, 2) }
  }

  if (content['application/x-www-form-urlencoded']) {
    return {
      ...EMPTY_BODY,
      mode: 'urlencoded',
      urlencoded: schemaToKeyValues(doc, content['application/x-www-form-urlencoded'].schema),
    }
  }

  if (content['multipart/form-data']) {
    return {
      ...EMPTY_BODY,
      mode: 'form-data',
      formData: schemaToFormFields(doc, content['multipart/form-data'].schema, name, warnings),
    }
  }

  const [contentType, media] = Object.entries(content)[0] ?? []
  if (!media) return EMPTY_BODY

  if (contentType.includes('xml')) {
    return { ...EMPTY_BODY, mode: 'raw', rawLanguage: 'xml', raw: typeof media.example === 'string' ? media.example : '' }
  }
  if (contentType.startsWith('text/')) {
    return { ...EMPTY_BODY, mode: 'raw', rawLanguage: 'text', raw: typeof media.example === 'string' ? media.example : '' }
  }

  warnings.push({ key: 'import.warning.unsupportedBodyMode', params: { name, mode: contentType } })
  return EMPTY_BODY
}

function toBody2(
  doc: unknown,
  parameters: OpenApiParameter[],
  name: string,
  warnings: ImportMessage[],
): RequestBody {
  const bodyParam = parameters.find((parameter) => parameter.in === 'body')
  if (bodyParam) {
    const example = schemaToExample(doc, bodyParam.schema)
    return { ...EMPTY_BODY, mode: 'json', raw: JSON.stringify(example ?? {}, null, 2) }
  }

  const formParams = parameters.filter((parameter) => parameter.in === 'formData')
  if (formParams.length > 0) {
    const files = formParams.filter((parameter) => parameter.type === 'file')
    if (files.length > 0) {
      warnings.push({ key: 'import.warning.formDataFiles', params: { name, count: files.length } })
    }
    return {
      ...EMPTY_BODY,
      mode: 'form-data',
      formData: formParams
        .filter((parameter) => parameter.type !== 'file')
        .map((parameter) => ({
          id: newId(),
          key: parameter.name ?? '',
          value: parameter.default !== undefined ? String(parameter.default) : '',
          enabled: true,
          type: 'text' as const,
        })),
    }
  }

  return EMPTY_BODY
}

function toResponseDocs(doc: unknown, responses: Record<string, OpenApiResponse> | undefined): ResponseDoc[] {
  if (!responses) return []

  return Object.entries(responses).map(([status, rawResponse]) => {
    const response = deref(doc, rawResponse)
    const media = response.content?.['application/json'] ?? Object.values(response.content ?? {})[0]
    const schema = media?.schema ?? response.schema
    const example = media?.example ?? firstExample(media?.examples) ?? schemaToExample(doc, schema)
    const body = example !== undefined && example !== null ? JSON.stringify(example, null, 2) : ''

    return { id: newId(), status, title: response.description ?? '', body }
  })
}

export function parseOpenApiDocument(input: unknown): ImportPlan {
  if (!input || typeof input !== 'object') {
    throw new ImportFailure('import.error.notOpenApi')
  }

  const doc = input as OpenApiDocument
  if (!doc.paths || typeof doc.paths !== 'object') {
    throw new ImportFailure('import.error.notOpenApi')
  }

  const warnings: ImportMessage[] = []
  const isSwagger2 = typeof doc.swagger === 'string'

  if (!isSwagger2 && typeof doc.openapi !== 'string') {
    warnings.push({ key: 'import.warning.schemaVersion' })
  }

  const { baseUrl, variables } = serverBaseUrl(doc)
  const schemes = doc.components?.securitySchemes ?? doc.securityDefinitions ?? {}
  const collectionName = doc.info?.title ?? 'collection'
  const collectionAuth = resolveSecurity(doc.security, schemes, collectionName, warnings)

  const folders: PlannedFolder[] = []
  const folderByTag = new Map<string, string>()
  const endpoints: PlannedEndpoint[] = []
  const orderByBucket = new Map<string | null, number>()

  const nextOrder = (bucket: string | null): number => {
    const order = orderByBucket.get(bucket) ?? 0
    orderByBucket.set(bucket, order + 1)
    return order
  }

  const folderFor = (tag: string): string => {
    const existing = folderByTag.get(tag)
    if (existing) return existing
    const id = newId()
    folderByTag.set(tag, id)
    folders.push({ id, parentId: null, name: tag, order: folders.length })
    return id
  }

  for (const [path, pathItem] of Object.entries(doc.paths)) {
    for (const method of OPENAPI_METHODS) {
      const operation = pathItem[method]
      if (!operation) continue

      const httpMethod = toHttpMethod(method, path, warnings)
      const parameters = mergeParameters(doc, pathItem.parameters ?? [], operation.parameters ?? [])
      const { params, headers } = collectParams(parameters)

      const tags = operation.tags ?? []
      const name = (operation.summary ?? operation.operationId ?? `${method.toUpperCase()} ${path}`).trim()
      if (tags.length > 1) {
        warnings.push({ key: 'import.warning.multipleTags', params: { name, tags: tags.join(', ') } })
      }
      const folderId = tags.length > 0 ? folderFor(tags[0]) : null

      const body = isSwagger2
        ? toBody2(doc, parameters, name, warnings)
        : toBody3(doc, operation.requestBody, name, warnings)

      const auth = operation.security
        ? resolveSecurity(operation.security, schemes, name, warnings)
        : ({ mode: 'inherit' } as const)

      endpoints.push({
        id: newId(),
        folderId,
        order: nextOrder(folderId),
        name: name || `${method.toUpperCase()} ${path}`,
        docs: operation.description ?? '',
        responseDocs: toResponseDocs(doc, operation.responses),
        method: httpMethod,
        url: templatePath(path),
        params,
        headers,
        body,
        auth,
      })
    }
  }

  if (endpoints.length === 0) {
    throw new ImportFailure('import.error.emptyOpenApi')
  }

  const description = (doc.info?.description ?? '').split('\n')[0].slice(0, 200)

  return {
    collection: {
      name: (doc.info?.title ?? '').trim() || 'Import qilingan collection',
      description,
      docs: doc.info?.description ?? '',
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
