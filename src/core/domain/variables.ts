export type VariableScope = Record<string, string>

export type VariableSource = 'environment' | 'collection'

export interface VariableOrigin {
  value: string
  source: VariableSource
}
