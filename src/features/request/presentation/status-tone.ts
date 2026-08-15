export function statusTone(status: string | number): string {
  const code = Number(String(status).replace(/x/gi, '0'))
  if (code >= 200 && code < 300) return 'text-status-success'
  if (code >= 300 && code < 400) return 'text-status-redirect'
  if (code >= 400) return 'text-status-error'
  return 'text-muted-foreground'
}
