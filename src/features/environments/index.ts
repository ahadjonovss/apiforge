export { EnvironmentSelector } from './presentation/environment-selector'
export { EnvironmentPicker } from './presentation/environment-picker'
export { EnvironmentsSection } from './presentation/environments-section'
export {
  useEnvironmentsStore,
  useActiveEnvironment,
} from './presentation/environments-store'
export { describeScope, mergeScopes, toScope, upsertVariable } from './application/scope'
export type { Environment, EnvVariable } from './domain/environment'
