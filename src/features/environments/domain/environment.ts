export interface EnvVariable {
  id: string
  key: string
  value: string
  enabled: boolean
  secret: boolean
}

export interface Environment {
  id: string
  name: string
  variables: EnvVariable[]
  workspaceId: string
  updatedAt: number
}
