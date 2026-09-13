import type { VariableScope } from '@/core/domain/variables'

const VARIABLE_PATTERN = /\{\{\s*([\w.-]+)\s*\}\}/g

function has(scope: VariableScope, name: string): boolean {
  return Object.prototype.hasOwnProperty.call(scope, name)
}

function expand(input: string, scope: VariableScope, resolving: Set<string>): string {
  return input.replace(VARIABLE_PATTERN, (match, name: string) => {
    if (!has(scope, name) || resolving.has(name)) return match
    resolving.add(name)
    const value = expand(scope[name] ?? '', scope, resolving)
    resolving.delete(name)
    return value
  })
}

function collectUnresolved(
  input: string,
  scope: VariableScope,
  resolving: Set<string>,
  missing: Set<string>,
): void {
  for (const match of input.matchAll(VARIABLE_PATTERN)) {
    const name = match[1]
    if (!has(scope, name) || resolving.has(name)) {
      missing.add(name)
      continue
    }
    resolving.add(name)
    collectUnresolved(scope[name] ?? '', scope, resolving, missing)
    resolving.delete(name)
  }
}

export function interpolate(input: string, scope: VariableScope): string {
  if (!input) return input
  return expand(input, scope, new Set())
}

export function findUnresolved(input: string, scope: VariableScope): string[] {
  const missing = new Set<string>()
  if (input) collectUnresolved(input, scope, new Set(), missing)
  return [...missing]
}
