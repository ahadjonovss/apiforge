const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/

export function isLocalHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/^\[|\]$/g, '')
  if (!host) return false

  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) return true

  const mapped = host.startsWith('::ffff:') ? host.slice(7) : host
  const v4 = IPV4.exec(mapped)

  if (v4) {
    const parts = v4.slice(1).map(Number)
    if (parts.some((n) => Number.isNaN(n) || n > 255)) return false
    const [a, b] = parts
    if (a === 0 || a === 10 || a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true
    return false
  }

  if (host === '::' || host === '::1') return true
  if (/^f[cd][0-9a-f]{2}:/.test(host)) return true
  if (/^fe[89ab][0-9a-f]:/.test(host)) return true

  return false
}
