import { randomUUID } from 'node:crypto'
import type { Firestore } from './_firestore.js'

export interface ToolDefinition {
  name: string
  title: string
  description: string
  inputSchema: Record<string, unknown>
}

type Json = Record<string, unknown>

const str = (description: string) => ({ type: 'string', description })
const optional = (description: string) => ({ type: 'string', description })

const KEY_VALUES = {
  type: 'array',
  description: 'Name/value pairs. Values may contain {{variable}} placeholders.',
  items: {
    type: 'object',
    properties: { key: { type: 'string' }, value: { type: 'string' } },
    required: ['key', 'value'],
  },
}

const RESPONSE_DOCS = {
  type: 'array',
  description:
    'Saved response examples, shown in the endpoint Responses panel. ' +
    'The whole list is replaced; omit the field to keep the current one, ' +
    'pass [] to clear it.',
  items: {
    type: 'object',
    properties: {
      status: { type: 'string', description: 'HTTP status, e.g. 200, 400 or 4xx' },
      title: { type: 'string', description: 'Short label, e.g. "cnic already used"' },
      body: { type: 'string', description: 'Example body, usually a JSON string' },
    },
    required: ['status', 'body'],
  },
}

export const TOOLS: ToolDefinition[] = [
  {
    name: 'list_workspaces',
    title: 'List workspaces',
    description: 'Every APIForge workspace the signed-in user belongs to.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_collections',
    title: 'List collections',
    description: 'Collections inside a workspace, with their base URL.',
    inputSchema: {
      type: 'object',
      properties: { workspaceId: str('Workspace id from list_workspaces') },
      required: ['workspaceId'],
    },
  },
  {
    name: 'get_collection',
    title: 'Get collection',
    description:
      'Collection settings: base URL, shared headers, auth mode, variables and docs. ' +
      'These are applied to every request in the collection, they are not copied into endpoints.',
    inputSchema: {
      type: 'object',
      properties: { workspaceId: str(''), collectionId: str('') },
      required: ['workspaceId', 'collectionId'],
    },
  },
  {
    name: 'list_endpoints',
    title: 'List endpoints',
    description: 'Endpoints and folders of a collection. Folders are a flat list with parentId.',
    inputSchema: {
      type: 'object',
      properties: { workspaceId: str(''), collectionId: str('') },
      required: ['workspaceId', 'collectionId'],
    },
  },
  {
    name: 'get_endpoint',
    title: 'Get endpoint',
    description: 'Full definition of one endpoint: method, url, params, headers, body, auth, docs.',
    inputSchema: {
      type: 'object',
      properties: { workspaceId: str(''), collectionId: str(''), endpointId: str('') },
      required: ['workspaceId', 'collectionId', 'endpointId'],
    },
  },
  {
    name: 'create_endpoint',
    title: 'Create endpoint',
    description:
      'Add an endpoint to a collection. The url is relative to the collection base URL; ' +
      'an absolute url (https://…) ignores the base URL.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: str(''),
        collectionId: str(''),
        name: str('Human readable name'),
        method: optional('GET, POST, PUT, PATCH, DELETE, HEAD or OPTIONS. Defaults to GET.'),
        url: optional('Path such as /auth/login, or an absolute URL'),
        folderId: optional('Folder id, omit for the collection root'),
        docs: optional('Markdown documentation'),
        headers: KEY_VALUES,
        params: KEY_VALUES,
        jsonBody: optional('Request body as a JSON string. Sets the body mode to json.'),
        responseDocs: RESPONSE_DOCS,
      },
      required: ['workspaceId', 'collectionId', 'name'],
    },
  },
  {
    name: 'update_endpoint',
    title: 'Update endpoint',
    description: 'Change one or more fields of an endpoint. Omitted fields keep their value.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: str(''),
        collectionId: str(''),
        endpointId: str(''),
        name: optional(''),
        method: optional(''),
        url: optional(''),
        folderId: optional(''),
        docs: optional('Markdown documentation'),
        headers: KEY_VALUES,
        params: KEY_VALUES,
        jsonBody: optional('Request body as a JSON string'),
        responseDocs: RESPONSE_DOCS,
        script: optional('Post-response JavaScript, af.* API'),
      },
      required: ['workspaceId', 'collectionId', 'endpointId'],
    },
  },
  {
    name: 'create_folder',
    title: 'Create folder',
    description: 'Add a folder to a collection. Folders can nest through parentId.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: str(''),
        collectionId: str(''),
        name: str(''),
        parentId: optional('Parent folder id, omit for the collection root'),
      },
      required: ['workspaceId', 'collectionId', 'name'],
    },
  },
  {
    name: 'set_collection_variables',
    title: 'Set collection variables',
    description:
      'Create or update {{variable}} values on the collection. Existing names are overwritten, ' +
      'others are left alone.',
    inputSchema: {
      type: 'object',
      properties: { workspaceId: str(''), collectionId: str(''), variables: KEY_VALUES },
      required: ['workspaceId', 'collectionId', 'variables'],
    },
  },
  {
    name: 'list_environments',
    title: 'List environments',
    description: 'Environments of a workspace with their variables.',
    inputSchema: {
      type: 'object',
      properties: { workspaceId: str('') },
      required: ['workspaceId'],
    },
  },
  {
    name: 'set_environment_variables',
    title: 'Set environment variables',
    description: 'Create or update variables inside one environment.',
    inputSchema: {
      type: 'object',
      properties: { workspaceId: str(''), environmentId: str(''), variables: KEY_VALUES },
      required: ['workspaceId', 'environmentId', 'variables'],
    },
  },
]

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

function text(args: Json, key: string): string | undefined {
  const value = args[key]
  return typeof value === 'string' ? value : undefined
}

function required(args: Json, key: string): string {
  const value = text(args, key)
  if (!value) throw new Error(`${key} is required`)
  return value
}

function pairs(args: Json, key: string): { id: string; key: string; value: string; enabled: boolean }[] | undefined {
  const value = args[key]
  if (!Array.isArray(value)) return undefined
  return value
    .filter((row): row is Json => typeof row === 'object' && row !== null)
    .map((row) => ({
      id: randomUUID(),
      key: String(row.key ?? ''),
      value: String(row.value ?? ''),
      enabled: true,
    }))
    .filter((row) => row.key !== '')
}

function examples(
  args: Json,
  key: string,
): { id: string; status: string; title: string; body: string }[] | undefined {
  const value = args[key]
  if (!Array.isArray(value)) return undefined
  return value
    .filter((row): row is Json => typeof row === 'object' && row !== null)
    .map((row) => ({
      id: randomUUID(),
      status: String(row.status ?? '').trim(),
      title: String(row.title ?? ''),
      body: String(row.body ?? ''),
    }))
    .filter((row) => row.status !== '')
}

function bodyFrom(json: string | undefined): Json | undefined {
  if (json === undefined) return undefined
  return {
    mode: json.trim() ? 'json' : 'none',
    raw: json,
    rawLanguage: 'json',
    formData: [],
    urlencoded: [],
  }
}

function mergeVariables(existing: unknown, incoming: { key: string; value: string }[]) {
  const rows = Array.isArray(existing) ? (existing as Json[]) : []
  const next = rows.map((row) => ({ ...row }))

  for (const entry of incoming) {
    const found = next.find((row) => String(row.key ?? '').trim() === entry.key.trim())
    if (found) {
      found.value = entry.value
      found.enabled = true
      continue
    }
    next.push({
      id: randomUUID(),
      key: entry.key,
      value: entry.value,
      enabled: true,
      secret: false,
    })
  }

  return next
}

async function assertMember(db: Firestore, workspaceId: string, uid: string) {
  const workspace = await db.get(`workspaces/${workspaceId}`)
  if (!workspace) throw new Error('workspace not found, or you are not a member of it')
  const members = workspace.data.memberIds
  if (!Array.isArray(members) || !members.includes(uid)) {
    throw new Error('you are not a member of this workspace')
  }
  return workspace
}

export async function callTool(
  db: Firestore,
  uid: string,
  name: string,
  args: Json,
): Promise<unknown> {
  switch (name) {
    case 'list_workspaces': {
      const docs = await db.query('', 'workspaces', {
        fieldFilter: {
          field: { fieldPath: 'memberIds' },
          op: 'ARRAY_CONTAINS',
          value: { stringValue: uid },
        },
      })
      return docs.map((doc) => ({
        id: doc.id,
        name: doc.data.name,
        description: doc.data.description,
        ownerId: doc.data.ownerId,
      }))
    }

    case 'list_collections': {
      const workspaceId = required(args, 'workspaceId')
      await assertMember(db, workspaceId, uid)
      const docs = await db.list(`workspaces/${workspaceId}/collections`)
      return docs.map((doc) => ({
        id: doc.id,
        name: doc.data.name,
        description: doc.data.description,
        baseUrl: doc.data.baseUrl,
      }))
    }

    case 'get_collection': {
      const workspaceId = required(args, 'workspaceId')
      const collectionId = required(args, 'collectionId')
      await assertMember(db, workspaceId, uid)
      const doc = await db.get(`workspaces/${workspaceId}/collections/${collectionId}`)
      if (!doc) throw new Error('collection not found')
      return { id: doc.id, ...doc.data }
    }

    case 'list_endpoints': {
      const workspaceId = required(args, 'workspaceId')
      const collectionId = required(args, 'collectionId')
      await assertMember(db, workspaceId, uid)

      const base = `workspaces/${workspaceId}/collections/${collectionId}`
      const [endpoints, folders] = await Promise.all([
        db.list(`${base}/endpoints`),
        db.list(`${base}/folders`),
      ])

      return {
        folders: folders.map((doc) => ({
          id: doc.id,
          name: doc.data.name,
          parentId: doc.data.parentId ?? null,
        })),
        endpoints: endpoints.map((doc) => ({
          id: doc.id,
          name: doc.data.name,
          method: doc.data.method,
          url: doc.data.url,
          folderId: doc.data.folderId ?? null,
        })),
      }
    }

    case 'get_endpoint': {
      const workspaceId = required(args, 'workspaceId')
      const collectionId = required(args, 'collectionId')
      const endpointId = required(args, 'endpointId')
      await assertMember(db, workspaceId, uid)

      const doc = await db.get(
        `workspaces/${workspaceId}/collections/${collectionId}/endpoints/${endpointId}`,
      )
      if (!doc) throw new Error('endpoint not found')
      return { id: doc.id, ...doc.data }
    }

    case 'create_endpoint': {
      const workspaceId = required(args, 'workspaceId')
      const collectionId = required(args, 'collectionId')
      const name = required(args, 'name')
      await assertMember(db, workspaceId, uid)

      const method = (text(args, 'method') ?? 'GET').toUpperCase()
      if (!METHODS.includes(method)) throw new Error(`unsupported method ${method}`)

      const id = randomUUID()
      const now = Date.now()

      await db.write(
        `workspaces/${workspaceId}/collections/${collectionId}/endpoints/${id}`,
        {
          id,
          name,
          method,
          url: text(args, 'url') ?? '',
          docs: text(args, 'docs') ?? '',
          responseDocs: examples(args, 'responseDocs') ?? [],
          captures: [],
          script: '',
          params: pairs(args, 'params') ?? [],
          headers: pairs(args, 'headers') ?? [],
          body: bodyFrom(text(args, 'jsonBody')) ?? bodyFrom('')!,
          auth: { mode: 'inherit' },
          collectionId,
          folderId: text(args, 'folderId') ?? null,
          order: now,
          createdAt: now,
          updatedAt: now,
        },
      )

      return { id, name, method, created: true }
    }

    case 'update_endpoint': {
      const workspaceId = required(args, 'workspaceId')
      const collectionId = required(args, 'collectionId')
      const endpointId = required(args, 'endpointId')
      await assertMember(db, workspaceId, uid)

      const path = `workspaces/${workspaceId}/collections/${collectionId}/endpoints/${endpointId}`
      const existing = await db.get(path)
      if (!existing) throw new Error('endpoint not found')

      const patch: Json = { updatedAt: Date.now() }

      const name = text(args, 'name')
      if (name) patch.name = name

      const method = text(args, 'method')
      if (method) {
        const upper = method.toUpperCase()
        if (!METHODS.includes(upper)) throw new Error(`unsupported method ${upper}`)
        patch.method = upper
      }

      const url = text(args, 'url')
      if (url !== undefined) patch.url = url

      const docs = text(args, 'docs')
      if (docs !== undefined) patch.docs = docs

      const script = text(args, 'script')
      if (script !== undefined) patch.script = script

      if ('folderId' in args) patch.folderId = text(args, 'folderId') ?? null

      const headers = pairs(args, 'headers')
      if (headers) patch.headers = headers

      const params = pairs(args, 'params')
      if (params) patch.params = params

      const body = bodyFrom(text(args, 'jsonBody'))
      if (body) patch.body = body

      const responseDocs = examples(args, 'responseDocs')
      if (responseDocs) patch.responseDocs = responseDocs

      await db.write(path, patch)
      return { id: endpointId, updated: Object.keys(patch).filter((key) => key !== 'updatedAt') }
    }

    case 'create_folder': {
      const workspaceId = required(args, 'workspaceId')
      const collectionId = required(args, 'collectionId')
      const name = required(args, 'name')
      await assertMember(db, workspaceId, uid)

      const id = randomUUID()
      await db.write(`workspaces/${workspaceId}/collections/${collectionId}/folders/${id}`, {
        id,
        name,
        parentId: text(args, 'parentId') ?? null,
        collectionId,
        order: Date.now(),
        createdAt: Date.now(),
      })

      return { id, name, created: true }
    }

    case 'set_collection_variables': {
      const workspaceId = required(args, 'workspaceId')
      const collectionId = required(args, 'collectionId')
      const incoming = pairs(args, 'variables')
      if (!incoming || incoming.length === 0) throw new Error('variables is required')
      await assertMember(db, workspaceId, uid)

      const path = `workspaces/${workspaceId}/collections/${collectionId}`
      const doc = await db.get(path)
      if (!doc) throw new Error('collection not found')

      const variables = mergeVariables(doc.data.variables, incoming)
      await db.write(path, { variables, updatedAt: Date.now() })
      return { collectionId, variables: variables.length }
    }

    case 'list_environments': {
      const workspaceId = required(args, 'workspaceId')
      await assertMember(db, workspaceId, uid)
      const docs = await db.list(`workspaces/${workspaceId}/environments`)
      return docs.map((doc) => ({
        id: doc.id,
        name: doc.data.name,
        variables: doc.data.variables,
      }))
    }

    case 'set_environment_variables': {
      const workspaceId = required(args, 'workspaceId')
      const environmentId = required(args, 'environmentId')
      const incoming = pairs(args, 'variables')
      if (!incoming || incoming.length === 0) throw new Error('variables is required')
      await assertMember(db, workspaceId, uid)

      const path = `workspaces/${workspaceId}/environments/${environmentId}`
      const doc = await db.get(path)
      if (!doc) throw new Error('environment not found')

      const variables = mergeVariables(doc.data.variables, incoming)
      await db.write(path, { variables, updatedAt: Date.now() })
      return { environmentId, variables: variables.length }
    }

    default:
      throw new Error(`unknown tool ${name}`)
  }
}
