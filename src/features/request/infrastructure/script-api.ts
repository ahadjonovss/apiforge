import type { VariableSource } from '@/core/domain/variables'
import type { ScriptInput, ScriptLog, ScriptVariable } from '../domain/script'

export function toText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value instanceof Error) return value.message
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

function preview(value: unknown): string {
  const raw = toText(value)
  return raw.length > 80 ? `${raw.slice(0, 80)}…` : raw
}

function kindOf(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

type Assertion = Record<string, unknown>

const CHAIN_WORDS = [
  'to',
  'be',
  'been',
  'is',
  'that',
  'which',
  'and',
  'has',
  'have',
  'with',
  'at',
  'of',
  'does',
  'but',
  'still',
  'also',
]

function chain(node: Assertion, factory: () => Assertion) {
  for (const word of CHAIN_WORDS) {
    Object.defineProperty(node, word, { get: () => node, configurable: true })
  }
  Object.defineProperty(node, 'not', { get: factory, configurable: true })
}

function assertion(actual: unknown, negated = false): Assertion {
  const check = (pass: boolean, described: string) => {
    if (negated ? !pass : pass) return
    throw new Error(`expected ${preview(actual)} ${negated ? 'not ' : ''}to ${described}`)
  }

  const includes = (expected: unknown): boolean => {
    if (typeof actual === 'string') return actual.includes(String(expected))
    if (Array.isArray(actual)) return actual.some((item) => deepEqual(item, expected))
    if (actual && typeof actual === 'object' && expected && typeof expected === 'object') {
      return Object.entries(expected as Record<string, unknown>).every(([key, value]) =>
        deepEqual((actual as Record<string, unknown>)[key], value),
      )
    }
    return false
  }

  const sizeOf = (): number => {
    if (typeof actual === 'string' || Array.isArray(actual)) return actual.length
    if (actual && typeof actual === 'object') return Object.keys(actual).length
    return 0
  }

  const equal = (expected: unknown) => check(actual === expected, `equal ${preview(expected)}`)
  const eql = (expected: unknown) =>
    check(deepEqual(actual, expected), `deeply equal ${preview(expected)}`)
  const type = (name: unknown) =>
    check(kindOf(actual) === String(name).toLowerCase(), `be a ${String(name)}`)
  const include = (expected: unknown) => check(includes(expected), `include ${preview(expected)}`)
  const property = (...args: unknown[]) => {
    const name = String(args[0])
    const owns =
      Boolean(actual) && typeof actual === 'object' && name in (actual as Record<string, unknown>)
    check(owns, `have property ${name}`)
    if (args.length > 1) {
      const value = (actual as Record<string, unknown>)[name]
      check(deepEqual(value, args[1]), `have property ${name} equal to ${preview(args[1])}`)
    }
  }
  const lengthOf = (expected: unknown) =>
    check(sizeOf() === Number(expected), `have length ${String(expected)}`)

  const node: Assertion = {
    equal,
    equals: equal,
    eq: equal,
    eql,
    eqls: eql,
    a: type,
    an: type,
    include,
    includes: include,
    contain: include,
    contains: include,
    property,
    lengthOf,
    length: lengthOf,
    match: (expected: unknown) =>
      check(new RegExp(String(expected)).test(String(actual)), `match ${String(expected)}`),
    above: (expected: unknown) =>
      check(Number(actual) > Number(expected), `be above ${String(expected)}`),
    below: (expected: unknown) =>
      check(Number(actual) < Number(expected), `be below ${String(expected)}`),
    least: (expected: unknown) =>
      check(Number(actual) >= Number(expected), `be at least ${String(expected)}`),
    most: (expected: unknown) =>
      check(Number(actual) <= Number(expected), `be at most ${String(expected)}`),
    oneOf: (expected: unknown) =>
      check(
        Array.isArray(expected) && expected.some((item) => deepEqual(item, actual)),
        `be one of ${preview(expected)}`,
      ),
  }

  Object.defineProperty(node, 'deep', {
    get: () => ({ equal: eql, equals: eql, eql, include, property }),
    configurable: true,
  })

  const getters: Record<string, () => void> = {
    ok: () => check(Boolean(actual), 'be truthy'),
    true: () => check(actual === true, 'be true'),
    false: () => check(actual === false, 'be false'),
    null: () => check(actual === null, 'be null'),
    undefined: () => check(actual === undefined, 'be undefined'),
    exist: () => check(actual !== null && actual !== undefined, 'exist'),
    empty: () => check(sizeOf() === 0, 'be empty'),
  }

  for (const [name, run] of Object.entries(getters)) {
    Object.defineProperty(node, name, { get: run, configurable: true })
  }

  chain(node, () => assertion(actual, !negated))
  return node
}

function responseAssertion(status: number, negated = false): Assertion {
  const check = (pass: boolean, described: string) => {
    if (negated ? !pass : pass) return
    throw new Error(`expected response ${negated ? 'not ' : ''}to ${described}, got ${status}`)
  }

  const node: Assertion = {
    status: (expected: unknown) =>
      check(status === Number(expected), `have status ${String(expected)}`),
  }

  Object.defineProperty(node, 'ok', {
    get: () => check(status >= 200 && status < 300, 'be ok'),
    configurable: true,
  })
  Object.defineProperty(node, 'success', {
    get: () => check(status >= 200 && status < 300, 'be successful'),
    configurable: true,
  })
  Object.defineProperty(node, 'error', {
    get: () => check(status >= 400, 'be an error'),
    configurable: true,
  })

  chain(node, () => responseAssertion(status, !negated))
  return node
}

export interface ScriptSandbox {
  af: unknown
  pm: unknown
  console: unknown
  logs: ScriptLog[]
  variables: () => ScriptVariable[]
}

export function createScriptSandbox(input: ScriptInput): ScriptSandbox {
  const logs: ScriptLog[] = []
  const written = new Map<string, { value: string; target: VariableSource }>()

  const record = (level: ScriptLog['level'], values: unknown[]) =>
    logs.push({ level, text: values.map(toText).join(' ') })

  const sandboxConsole = {
    log: (...values: unknown[]) => record('log', values),
    info: (...values: unknown[]) => record('log', values),
    debug: (...values: unknown[]) => record('log', values),
    warn: (...values: unknown[]) => record('warn', values),
    error: (...values: unknown[]) => record('error', values),
  }

  const headerValue = (name: unknown): string | undefined => {
    const wanted = String(name).trim().toLowerCase()
    const found = Object.entries(input.response.headers).find(
      ([key]) => key.toLowerCase() === wanted,
    )
    return found?.[1]
  }

  const readVar = (key: unknown): string | undefined =>
    written.get(String(key))?.value ?? input.variables[String(key)]

  const writeVar = (target: VariableSource) => (key: unknown, value: unknown) => {
    const name = String(key).trim()
    if (!name) throw new Error('vars.set: empty variable name')
    written.set(name, {
      value: value === null || value === undefined ? '' : toText(value),
      target,
    })
  }

  const writeCollection = writeVar('collection')
  const writeEnvironment = writeVar('environment')

  const parseBody = () => JSON.parse(input.response.body) as unknown

  const af = {
    request: input.request,
    response: {
      status: input.response.status,
      statusText: input.response.statusText,
      ok: input.response.status >= 200 && input.response.status < 300,
      durationMs: input.response.durationMs,
      headers: input.response.headers,
      body: input.response.body,
      header: headerValue,
      json: parseBody,
    },
    vars: {
      get: readVar,
      set: writeCollection,
    },
  }

  const makeStore = (write: (key: unknown, value: unknown) => void) => ({
    get: readVar,
    set: write,
    has: (key: unknown) => readVar(key) !== undefined,
    unset: (key: unknown) => write(key, ''),
    toObject: () => ({
      ...input.variables,
      ...Object.fromEntries([...written].map(([key, entry]) => [key, entry.value])),
    }),
    replaceIn: (template: unknown) =>
      String(template).replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, name: string) => {
        const value = readVar(name)
        return value === undefined ? match : value
      }),
  })

  const environmentStore = makeStore(writeEnvironment)
  const collectionStore = makeStore(writeCollection)

  const test = (name: unknown, fn: unknown) => {
    const label = String(name)
    if (typeof fn !== 'function') {
      logs.push({ level: 'error', text: `✗ ${label}: pm.test requires a function` })
      return
    }
    try {
      const result = (fn as () => unknown)()
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        logs.push({ level: 'warn', text: `${label}: async pm.test is not awaited` })
        return
      }
      logs.push({ level: 'log', text: `✓ ${label}` })
    } catch (error) {
      logs.push({ level: 'error', text: `✗ ${label}: ${toText(error)}` })
    }
  }

  const pm = {
    environment: environmentStore,
    collectionVariables: collectionStore,
    globals: environmentStore,
    variables: environmentStore,
    iterationData: { get: () => undefined, has: () => false, toObject: () => ({}) },
    request: {
      method: input.request.method,
      url: input.request.url,
      headers: { get: () => undefined, has: () => false },
    },
    response: {
      code: input.response.status,
      status: input.response.statusText,
      responseTime: input.response.durationMs,
      responseSize: input.response.body.length,
      headers: {
        get: headerValue,
        has: (name: unknown) => headerValue(name) !== undefined,
        all: () => input.response.headers,
      },
      text: () => input.response.body,
      json: parseBody,
      get to() {
        return responseAssertion(input.response.status)
      },
    },
    expect: (actual: unknown) => assertion(actual),
    test,
    info: { requestName: '', requestId: '' },
    sendRequest: () => {
      throw new Error('pm.sendRequest is not available in the sandbox')
    },
  }

  return {
    af,
    pm,
    console: sandboxConsole,
    logs,
    variables: (): ScriptVariable[] =>
      [...written].map(([key, entry]) => ({ key, value: entry.value, target: entry.target })),
  }
}
