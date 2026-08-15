export interface PostmanKeyValue {
  key?: string
  value?: string
  disabled?: boolean
  type?: string
  src?: string | string[]
}

export interface PostmanAuth {
  type?: string
  bearer?: PostmanKeyValue[]
  basic?: PostmanKeyValue[]
  apikey?: PostmanKeyValue[]
}

export interface PostmanUrl {
  raw?: string
  protocol?: string
  host?: string[] | string
  path?: string[] | string
  query?: PostmanKeyValue[]
}

export interface PostmanBody {
  mode?: string
  raw?: string
  options?: { raw?: { language?: string } }
  urlencoded?: PostmanKeyValue[]
  formdata?: PostmanKeyValue[]
  graphql?: { query?: string; variables?: string }
}

export interface PostmanRequest {
  method?: string
  header?: PostmanKeyValue[] | string
  url?: PostmanUrl | string
  body?: PostmanBody
  auth?: PostmanAuth
}

export interface PostmanItem {
  name?: string
  item?: PostmanItem[]
  request?: PostmanRequest | string
  event?: unknown[]
}

export interface PostmanCollection {
  info?: {
    name?: string
    description?: string | { content?: string }
    schema?: string
  }
  item?: PostmanItem[]
  auth?: PostmanAuth
  variable?: PostmanKeyValue[]
  event?: unknown[]
}
