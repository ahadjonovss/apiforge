import type { ResponseDoc } from '../domain/request'

const FENCE = /^```[a-z]*\s*\n([\s\S]*?)\n?```\s*$/i

export function stripFence(body: string): string {
  const match = FENCE.exec(body.trim())
  return match ? match[1] : body
}

export function isJson(body: string): boolean {
  const text = body.trim()
  if (!text) return false
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

export function formatJson(body: string): string {
  const text = stripFence(body).trim()
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

export function hasExampleData(doc: ResponseDoc): boolean {
  return doc.body.trim() !== ''
}

export function visibleExamples(docs: ResponseDoc[], openId: string | null): ResponseDoc[] {
  return docs
    .filter((doc) => hasExampleData(doc) || doc.id === openId)
    .slice()
    .sort((a, b) => a.status.localeCompare(b.status))
}

export function pruneEmptyExample(docs: ResponseDoc[], id: string): ResponseDoc[] {
  const doc = docs.find((item) => item.id === id)
  if (!doc || hasExampleData(doc) || doc.title.trim() !== '') return docs
  return docs.filter((item) => item.id !== id)
}
