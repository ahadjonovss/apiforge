const DATE_FORMAT = new Intl.DateTimeFormat('uz-UZ', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateTime(value: number | null): string {
  if (!value) return '—'
  return DATE_FORMAT.format(new Date(value))
}
