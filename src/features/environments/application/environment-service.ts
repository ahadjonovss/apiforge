import { DataFailure } from '@/core/domain/data-error'
import { newId } from '@/core/lib/id'
import type { EnvVariable, Environment } from '../domain/environment'
import type { EnvironmentGateway } from '../domain/environment-gateway'
import { environmentSchema } from './schemas'
import { upsertVariable } from './scope'

function assertName(name: string) {
  const result = environmentSchema.safeParse({ name })
  if (!result.success) {
    throw new DataFailure({
      kind: 'validation',
      message: result.error.issues[0]?.message ?? 'data.error.validation',
    })
  }
}

function clean(variables: EnvVariable[]): EnvVariable[] {
  return variables
    .filter((variable) => variable.key.trim() !== '' || variable.value.trim() !== '')
    .map((variable) => ({ ...variable, key: variable.key.trim() }))
}

export function createEnvironmentService(gateway: EnvironmentGateway) {
  return {
    list(workspaceId: string): Promise<Environment[]> {
      return gateway.list(workspaceId)
    },

    create(workspaceId: string, name: string): Promise<Environment> {
      assertName(name)
      return gateway.create(workspaceId, name.trim())
    },

    rename(workspaceId: string, environmentId: string, name: string): Promise<void> {
      assertName(name)
      return gateway.update(workspaceId, environmentId, { name: name.trim() })
    },

    saveVariables(
      workspaceId: string,
      environmentId: string,
      variables: EnvVariable[],
    ): Promise<void> {
      return gateway.update(workspaceId, environmentId, { variables: clean(variables) })
    },

    setVariables(
      workspaceId: string,
      environment: Environment,
      entries: { key: string; value: string }[],
    ): Promise<EnvVariable[]> {
      const variables = entries.reduce(
        (acc, entry) => upsertVariable(acc, entry.key, entry.value, newId),
        environment.variables,
      )
      return gateway
        .update(workspaceId, environment.id, { variables })
        .then(() => variables)
    },

    remove(workspaceId: string, environmentId: string): Promise<void> {
      return gateway.remove(workspaceId, environmentId)
    },
  }
}
