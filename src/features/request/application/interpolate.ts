import type { VariableScope } from '@/core/domain/variables'

const VARIABLE_PATTERN = /\{\{\s*([\w.-]+)\s*\}\}/g

export function interpolate(input: string, scope: VariableScope): string {
  if (!input) return input
  return input.replace(VARIABLE_PATTERN, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(scope, name) ? scope[name] : match,
  )
}

export function findUnresolved(input: string, scope: VariableScope): string[] {
  const missing = new Set<string>()
  for (const match of input.matchAll(VARIABLE_PATTERN)) {
    const name = match[1]
    if (!Object.prototype.hasOwnProperty.call(scope, name)) missing.add(name)
  }
  return [...missing]
}
