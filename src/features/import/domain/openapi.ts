export interface OpenApiRef {
  $ref?: string
}

export interface OpenApiSchema extends OpenApiRef {
  type?: string
  format?: string
  enum?: unknown[]
  example?: unknown
  default?: unknown
  properties?: Record<string, OpenApiSchema>
  items?: OpenApiSchema
  required?: string[]
  allOf?: OpenApiSchema[]
  oneOf?: OpenApiSchema[]
  anyOf?: OpenApiSchema[]
}

export interface OpenApiParameter extends OpenApiRef {
  name?: string
  in?: string
  required?: boolean
  schema?: OpenApiSchema
  example?: unknown
  type?: string
  default?: unknown
}

export interface OpenApiMediaType {
  schema?: OpenApiSchema
  example?: unknown
  examples?: Record<string, { value?: unknown }>
}

export interface OpenApiRequestBody extends OpenApiRef {
  required?: boolean
  content?: Record<string, OpenApiMediaType>
}

export interface OpenApiResponse extends OpenApiRef {
  description?: string
  content?: Record<string, OpenApiMediaType>
  schema?: OpenApiSchema
}

export interface OpenApiOperation {
  summary?: string
  description?: string
  operationId?: string
  tags?: string[]
  parameters?: OpenApiParameter[]
  requestBody?: OpenApiRequestBody
  responses?: Record<string, OpenApiResponse>
  security?: Record<string, string[]>[]
}

export interface OpenApiPathItem {
  parameters?: OpenApiParameter[]
  get?: OpenApiOperation
  put?: OpenApiOperation
  post?: OpenApiOperation
  delete?: OpenApiOperation
  options?: OpenApiOperation
  head?: OpenApiOperation
  patch?: OpenApiOperation
  trace?: OpenApiOperation
}

export interface OpenApiServerVariable {
  default?: string
}

export interface OpenApiServer {
  url?: string
  variables?: Record<string, OpenApiServerVariable>
}

export interface OpenApiSecurityScheme {
  type?: string
  scheme?: string
  in?: string
  name?: string
}

export interface OpenApiComponents {
  schemas?: Record<string, OpenApiSchema>
  securitySchemes?: Record<string, OpenApiSecurityScheme>
  parameters?: Record<string, OpenApiParameter>
  requestBodies?: Record<string, OpenApiRequestBody>
  responses?: Record<string, OpenApiResponse>
}

export interface OpenApiDocument {
  openapi?: string
  swagger?: string
  info?: { title?: string; description?: string }
  servers?: OpenApiServer[]
  host?: string
  basePath?: string
  schemes?: string[]
  paths?: Record<string, OpenApiPathItem>
  components?: OpenApiComponents
  definitions?: Record<string, OpenApiSchema>
  securityDefinitions?: Record<string, OpenApiSecurityScheme>
  security?: Record<string, string[]>[]
}
