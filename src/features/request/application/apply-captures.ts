import type { CaptureRule } from '../domain/request'
import type { ResponseResult } from '../domain/response'

export interface CapturedValue {
  key: string
  value: string
}

export interface CaptureOutcome {
  captured: CapturedValue[]
  missed: { target: string; reason: string }[]
}

function pick(root: unknown, path: string): unknown {
  const segments = path
    .replace(/^\$\.?/, '')
    .split(/[.[\]]/)
    .map((segment) => segment.trim())
    .filter(Boolean)

  let cursor: unknown = root

  for (const segment of segments) {
    if (cursor === null || cursor === undefined) return undefined

    if (Array.isArray(cursor)) {
      const index = Number(segment)
      if (!Number.isInteger(index)) return undefined
      cursor = cursor[index]
      continue
    }

    if (typeof cursor === 'object') {
      cursor = (cursor as Record<string, unknown>)[segment]
      continue
    }

    return undefined
  }

  return cursor
}

function stringify(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

function headerValue(headers: Record<string, string>, name: string): string | undefined {
  const wanted = name.trim().toLowerCase()
  const found = Object.entries(headers).find(([key]) => key.toLowerCase() === wanted)
  return found?.[1]
}

export function applyCaptures(
  rules: CaptureRule[],
  response: ResponseResult,
): CaptureOutcome {
  const active = rules.filter(
    (rule) => rule.enabled && rule.target.trim() !== '' && rule.path.trim() !== '',
  )

  if (active.length === 0) return { captured: [], missed: [] }

  let body: unknown
  let bodyParsed = false
  const needsBody = active.some((rule) => rule.source === 'body')

  if (needsBody) {
    try {
      body = JSON.parse(response.body)
      bodyParsed = true
    } catch {
      bodyParsed = false
    }
  }

  const captured: CapturedValue[] = []
  const missed: { target: string; reason: string }[] = []

  for (const rule of active) {
    const target = rule.target.trim()

    if (rule.source === 'header') {
      const value = headerValue(response.headers, rule.path)
      if (value === undefined) {
        missed.push({ target, reason: `«${rule.path}» headeri javobda yo'q` })
        continue
      }
      captured.push({ key: target, value })
      continue
    }

    if (!bodyParsed) {
      missed.push({ target, reason: 'Javob JSON emas' })
      continue
    }

    const value = stringify(pick(body, rule.path))
    if (value === null) {
      missed.push({ target, reason: `«${rule.path}» javobda topilmadi` })
      continue
    }

    captured.push({ key: target, value })
  }

  return { captured, missed }
}
