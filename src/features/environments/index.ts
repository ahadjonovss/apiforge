export { EnvironmentSelector } from './presentation/environment-selector'
export {
  useEnvironmentsStore,
  useActiveEnvironment,
} from './presentation/environments-store'
export { describeScope, mergeScopes, toScope, upsertVariable } from './application/scope'
export type { Environment, EnvVariable } from './domain/environment'
