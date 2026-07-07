const DEFAULT_API_ORIGIN = 'http://localhost:3001'
const CONTEXT_HEADERS = [
  'authorization',
  'x-tenant-id',
  'x-brand-id',
  'x-store-id',
  'x-market-code'
] as const

export { CONTEXT_HEADERS }

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

export function resolveCampaignApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) {
    return `${DEFAULT_API_ORIGIN}/api/v1/`
  }
  if (normalized.endsWith('/api/v1') || normalized.endsWith('/api/v1/')) {
    return ensureTrailingSlash(normalized)
  }
  if (normalized.endsWith('/api') || normalized.endsWith('/api/')) {
    return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/v1`)
  }
  return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/api/v1`)
}

export function buildCampaignListUpstreamUrl(requestUrl: string): string {
  const request = new URL(requestUrl)
  return new URL(`campaigns${request.search}`, resolveCampaignApiBaseUrl()).toString()
}

export function unwrapResponseData(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    return payload
  }
  const data = (payload as { data?: unknown }).data
  return data === undefined ? payload : data
}

export function buildForwardHeaders(request: Request): Headers {
  const headers = new Headers()
  for (const headerName of CONTEXT_HEADERS) {
    const value = request.headers.get(headerName)
    if (value) {
      headers.set(headerName, value)
    }
  }
  return headers
}
