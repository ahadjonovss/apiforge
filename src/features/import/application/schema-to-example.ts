import type { OpenApiSchema } from '../domain/openapi'
import { deref } from './resolve-refs'

const MAX_DEPTH = 6

function primitiveExample(schema: OpenApiSchema): unknown {
  switch (schema.type) {
    case 'string':
      if (schema.format === 'date-time') return '2024-01-01T00:00:00Z'
      if (schema.format === 'date') return '2024-01-01'
      if (schema.format === 'email') return 'user@example.com'
      if (schema.format === 'uuid') return '00000000-0000-0000-0000-000000000000'
      return 'string'
    case 'integer':
      return 0
    case 'number':
      return 0
    case 'boolean':
      return true
    default:
      return null
  }
}

export function schemaToExample(
  doc: unknown,
  schema: OpenApiSchema | undefined,
  depth = 0,
): unknown {
  if (!schema || depth > MAX_DEPTH) return null

  const resolved = deref(doc, schema)
  if (resolved.example !== undefined) return resolved.example
  if (resolved.default !== undefined) return resolved.default
  if (resolved.enum && resolved.enum.length > 0) return resolved.enum[0]

  if (resolved.allOf?.length) {
    return resolved.allOf.reduce<Record<string, unknown>>((acc, part) => {
      const value = schemaToExample(doc, part, depth + 1)
      return value && typeof value === 'object' ? { ...acc, ...value } : acc
    }, {})
  }
  if (resolved.oneOf?.length) return schemaToExample(doc, resolved.oneOf[0], depth + 1)
  if (resolved.anyOf?.length) return schemaToExample(doc, resolved.anyOf[0], depth + 1)

  if (resolved.type === 'array' || resolved.items) {
    return [schemaToExample(doc, resolved.items, depth + 1)]
  }

  if (resolved.type === 'object' || resolved.properties) {
    const result: Record<string, unknown> = {}
    for (const [key, propSchema] of Object.entries(resolved.properties ?? {})) {
      result[key] = schemaToExample(doc, propSchema, depth + 1)
    }
    return result
  }

  return primitiveExample(resolved)
}
