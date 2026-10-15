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
