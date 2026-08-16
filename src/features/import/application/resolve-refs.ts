function decodeSegment(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~')
}

export function resolveJsonPointer(doc: unknown, ref: string): unknown {
  if (!ref.startsWith('#/')) return undefined

  let node: unknown = doc
  for (const segment of ref.slice(2).split('/').map(decodeSegment)) {
    if (node == null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[segment]
  }

  return node
}

export function deref<T>(doc: unknown, node: T, seen: Set<string> = new Set()): T {
  if (!node || typeof node !== 'object' || !('$ref' in node)) return node

  const ref = (node as { $ref?: unknown }).$ref
  if (typeof ref !== 'string' || seen.has(ref)) return node

  const resolved = resolveJsonPointer(doc, ref)
  if (resolved === undefined) return node

  seen.add(ref)
  return deref(doc, resolved as T, seen)
}
