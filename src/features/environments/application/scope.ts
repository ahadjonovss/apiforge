import type { VariableOrigin, VariableScope } from '@/core/domain/variables'
import type { EnvVariable } from '../domain/environment'

export function toScope(variables: EnvVariable[]): VariableScope {
  const scope: VariableScope = {}
  for (const variable of variables) {
    const key = variable.key.trim()
    if (!variable.enabled || !key) continue
    scope[key] = variable.value
  }
  return scope
}

export function mergeScopes(collection: VariableScope, environment: VariableScope): VariableScope {
  return { ...collection, ...environment }
}

export function describeScope(
  collection: VariableScope,
  environment: VariableScope,
): Record<string, VariableOrigin> {
  const origins: Record<string, VariableOrigin> = {}
  for (const [key, value] of Object.entries(collection)) {
    origins[key] = { value, source: 'collection' }
  }
  for (const [key, value] of Object.entries(environment)) {
    origins[key] = { value, source: 'environment' }
  }
  return origins
}

export function upsertVariable(
  variables: EnvVariable[],
  key: string,
  value: string,
  makeId: () => string,
): EnvVariable[] {
  const name = key.trim()
  if (!name) return variables

  let found = false
  const next = variables.map((variable) => {
    if (variable.key.trim() !== name) return variable
    found = true
    return { ...variable, value, enabled: true }
  })

  return found
    ? next
    : [...next, { id: makeId(), key: name, value, enabled: true, secret: false }]
}
