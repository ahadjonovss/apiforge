import type { EnvVariable, Environment } from './environment'

export interface EnvironmentPatch {
  name?: string
  variables?: EnvVariable[]
}

export interface EnvironmentGateway {
  list(workspaceId: string): Promise<Environment[]>
  create(workspaceId: string, name: string): Promise<Environment>
  update(workspaceId: string, environmentId: string, patch: EnvironmentPatch): Promise<void>
  remove(workspaceId: string, environmentId: string): Promise<void>
}
