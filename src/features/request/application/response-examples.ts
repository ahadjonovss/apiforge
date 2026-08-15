import type { ResponseDoc } from '../domain/request'

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
