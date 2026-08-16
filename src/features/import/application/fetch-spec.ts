import { ImportFailure } from '../domain/import-plan'

const DEV_PROXY_PATH = '/__apiforge_proxy'

function proxyEnabled(): boolean {
  return __DEV_PROXY__ && import.meta.env.VITE_DEV_PROXY !== 'false'
}

function resolveTarget(url: string): string {
  return proxyEnabled() ? `${DEV_PROXY_PATH}?target=${encodeURIComponent(url)}` : url
}

export async function fetchSpecSource(url: string): Promise<string> {
  let response: Response
  try {
    response = await fetch(resolveTarget(url))
  } catch {
    throw new ImportFailure('import.error.fetchFailed', { url })
  }

  if (!response.ok) {
    throw new ImportFailure('import.error.fetchFailed', { url })
  }

  return response.text()
}
