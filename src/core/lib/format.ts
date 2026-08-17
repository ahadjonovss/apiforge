function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value)
}

export function formatTime(value: number | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDate(value: number | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`
}

export function formatDateTime(value: number | null): string {
  if (!value) return '—'
  return `${formatDate(value)} ${formatTime(value)}`
}
