import { parse as parseYaml } from 'yaml'
import { ImportFailure } from '../domain/import-plan'

export function parseStructuredText(source: string): unknown {
  try {
    return JSON.parse(source)
  } catch {
    try {
      return parseYaml(source)
    } catch {
      throw new ImportFailure('import.error.notStructured')
    }
  }
}
