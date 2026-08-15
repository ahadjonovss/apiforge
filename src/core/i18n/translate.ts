export type Messages = Record<string, string>

export type TranslateParams = Record<string, string | number>

const PLACEHOLDER = /\{(\w+)\}/g

export function fill(template: string, params?: TranslateParams): string {
  if (!params) return template
  return template.replace(PLACEHOLDER, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  )
}

export function translate(
  messages: Messages,
  fallback: Messages,
  key: string,
  params?: TranslateParams,
): string {
  const template = messages[key] ?? fallback[key]
  if (template === undefined) return key
  return fill(template, params)
}
