import { buildActorHeaders } from '@m5/sdk'

export const FORWARDED_CONTEXT_HEADER_NAMES = [
  'authorization',
  'x-request-id',
  'x-correlation-id',
  'x-tenant-id',
  'x-brand-id',
  'x-store-id',
  'x-market-code',
  'x-actor-id',
  'x-actor-type',
  'x-actor-name',
  'x-actor-tenant-id',
  'x-actor-brand-id',
  'x-actor-store-id',
  'x-actor-roles',
  'x-roles',
  'x-actor-permissions',
  'x-permissions',
  'x-actor-authenticated',
] as const

type HeaderValue = string | string[] | undefined
type HeaderRecordLike = Record<string, HeaderValue>

export interface ServerRequestScopeFallback {
  tenantId: string
  brandId?: string
  storeId?: string
  marketCode?: string
}

export interface ServerRequestActorFallback {
  actorId: string
  actorName: string
  actorType?: string
  roles: readonly string[]
  permissions: readonly string[]
}

export interface ServerRequestContextEvidence {
  tenantId: string
  brandId?: string
  storeId?: string
  marketCode?: string
  requestId?: string
  forwardedHeaders: string[]
  actorHeadersMode: 'forwarded' | 'workspace-fallback'
}

export interface ResolvedServerRequestContext {
  scope: ServerRequestScopeFallback
  headers: Record<string, string>
  evidence: ServerRequestContextEvidence
}

function normalizeHeaderName(name: string): string {
  return name.trim().toLowerCase()
}

function readHeaderValue(source: Headers | HeaderRecordLike, name: string): string | undefined {
  const normalized = normalizeHeaderName(name)

  if (source instanceof Headers) {
    const value = source.get(normalized)
    return value && value.trim().length > 0 ? value : undefined
  }

  const direct = source[normalized] ?? source[name]
  if (Array.isArray(direct)) {
    const joined = direct.join(',').trim()
    return joined.length > 0 ? joined : undefined
  }
  if (typeof direct === 'string') {
    const trimmed = direct.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  return undefined
}

export function headersToRecord(
  source?: Headers | HeadersInit | HeaderRecordLike | null
): Record<string, string> {
  if (!source) {
    return {}
  }

  if (source instanceof Headers) {
    return Object.fromEntries((source as Headers).entries())
  }

  if (Array.isArray(source)) {
    const headers = new Headers(source)
    return Object.fromEntries((headers as Headers).entries())
  }

  const record = source as HeaderRecordLike
  return Object.fromEntries(
    Object.entries(record)
      .map(([name, value]) => {
        if (Array.isArray(value)) {
          return [normalizeHeaderName(name), value.join(',').trim()] as const
        }
        if (typeof value === 'string') {
          return [normalizeHeaderName(name), value.trim()] as const
        }
        return [normalizeHeaderName(name), ''] as const
      })
      .filter(([, value]) => value.length > 0)
  )
}

export function pickForwardedRequestHeaders(
  source?: Headers | HeadersInit | HeaderRecordLike | null
): Record<string, string> {
  const record = headersToRecord(source)
  const forwarded = new Headers()

  for (const name of FORWARDED_CONTEXT_HEADER_NAMES) {
    const value = readHeaderValue(record, name)
    if (value) {
      forwarded.set(name, value)
    }
  }

  return Object.fromEntries((forwarded as Headers).entries())
}

function hasForwardedActorHeaders(headers: Record<string, string>): boolean {
  return Boolean(headers['x-actor-id'] && headers['x-actor-authenticated'])
}

export function summarizeForwardedHeaders(headers: Record<string, string>): string {
  const names = Object.keys(headers).sort()
  return names.length > 0 ? names.join(', ') : 'none'
}

export function summarizeRequestScope(scope: ServerRequestScopeFallback): string {
  return [
    `tenant=${scope.tenantId}`,
    scope.brandId ? `brand=${scope.brandId}` : null,
    scope.storeId ? `store=${scope.storeId}` : null,
    scope.marketCode ? `market=${scope.marketCode}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

export function resolveServerRequestContext(options: {
  requestHeaders?: Headers | HeadersInit | HeaderRecordLike | null
  fallbackScope: ServerRequestScopeFallback
  actorFallback: ServerRequestActorFallback
}): ResolvedServerRequestContext {
  const forwardedHeaders = pickForwardedRequestHeaders(options.requestHeaders)
  const scope = {
    tenantId: forwardedHeaders['x-tenant-id'] ?? options.fallbackScope.tenantId,
    brandId: forwardedHeaders['x-brand-id'] ?? options.fallbackScope.brandId,
    storeId: forwardedHeaders['x-store-id'] ?? options.fallbackScope.storeId,
    marketCode: forwardedHeaders['x-market-code'] ?? options.fallbackScope.marketCode,
  }

  const actorHeadersMode = hasForwardedActorHeaders(forwardedHeaders)
    ? 'forwarded'
    : 'workspace-fallback'

  const actorHeaders =
    actorHeadersMode === 'forwarded'
      ? {}
      : buildActorHeaders({
          actorId: options.actorFallback.actorId,
          actorName: options.actorFallback.actorName,
          actorType: options.actorFallback.actorType ?? 'employee-user',
          tenantId: scope.tenantId,
          brandId: scope.brandId,
          storeId: scope.storeId,
          roles: options.actorFallback.roles,
          permissions: options.actorFallback.permissions,
          authenticated: true,
        })

  const headers = {
    ...actorHeaders,
    ...forwardedHeaders,
  }

  return {
    scope,
    headers,
    evidence: {
      tenantId: scope.tenantId,
      brandId: scope.brandId,
      storeId: scope.storeId,
      marketCode: scope.marketCode,
      requestId: headers['x-request-id'] ?? headers['x-correlation-id'],
      forwardedHeaders: Object.keys(forwardedHeaders).sort(),
      actorHeadersMode,
    },
  }
}
