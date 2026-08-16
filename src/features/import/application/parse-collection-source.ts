import { ImportFailure, type ImportPlan } from '../domain/import-plan'
import { detectFormat } from './detect-format'
import { parseOpenApiDocument } from './parse-openapi'
import { parsePostmanCollection } from './parse-postman'
import { parseStructuredText } from './parse-source'

export function parseCollectionSource(source: string): ImportPlan {
  const parsed = parseStructuredText(source)
  const format = detectFormat(parsed)

  if (format === 'openapi') return parseOpenApiDocument(parsed)
  if (format === 'postman') return parsePostmanCollection(source)

  throw new ImportFailure('import.error.unknownFormat')
}
