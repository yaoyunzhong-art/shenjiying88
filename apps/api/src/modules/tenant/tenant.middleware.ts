import { randomUUID } from 'node:crypto'
import { Injectable, NestMiddleware } from '@nestjs/common'
import type { NextFunction, Response } from 'express'
import type { RequestActorContext, TenantAwareRequest } from './tenant.types'

const DEFAULT_ACTOR_TYPE: RequestActorContext['actorType'] = 'tenant-user'

function normalizeValue(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function parseListHeader(value?: string | null) {
  return Array.from(
    new Set(
      (value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

function parseActorHeader(value?: string | null) {
  const normalized = normalizeValue(value)

  if (!normalized) {
    return {}
  }

  if (normalized.startsWith('{')) {
    try {
      const parsed = JSON.parse(normalized) as Partial<RequestActorContext> & {
        id?: string
        type?: RequestActorContext['actorType']
        name?: string
      }

      return {
        actorId: normalizeValue(parsed.actorId ?? parsed.id),
        actorType: parsed.actorType ?? parsed.type,
        actorName: normalizeValue(parsed.actorName ?? parsed.name),
        tenantId: normalizeValue(parsed.tenantId),
        brandId: normalizeValue(parsed.brandId),
        storeId: normalizeValue(parsed.storeId)
      }
    } catch {
      return {
        actorId: normalized
      }
    }
  }

  return {
    actorId: normalized
  }
}

function buildActorContext(req: TenantAwareRequest): RequestActorContext | undefined {
  const actorFromHeader = parseActorHeader(req.header('x-actor'))
  const roles = parseListHeader(req.header('x-roles') ?? req.header('x-role'))
  const permissions = parseListHeader(req.header('x-permissions') ?? req.header('x-permission'))
  const actorId = normalizeValue(req.header('x-actor-id')) ?? actorFromHeader.actorId

  if (!actorId && roles.length === 0 && permissions.length === 0) {
    return undefined
  }

  return {
    actorId: actorId ?? 'header-actor',
    actorType:
      (normalizeValue(req.header('x-actor-type')) as RequestActorContext['actorType'] | undefined) ??
      actorFromHeader.actorType ??
      DEFAULT_ACTOR_TYPE,
    actorName: normalizeValue(req.header('x-actor-name')) ?? actorFromHeader.actorName,
    tenantId: normalizeValue(req.header('x-actor-tenant-id')) ?? actorFromHeader.tenantId,
    brandId: normalizeValue(req.header('x-actor-brand-id')) ?? actorFromHeader.brandId,
    storeId: normalizeValue(req.header('x-actor-store-id')) ?? actorFromHeader.storeId,
    roles,
    permissions,
    authenticated: Boolean(actorId),
    source: 'headers'
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: TenantAwareRequest, _res: Response, next: NextFunction) {
    req.tenantContext = {
      tenantId: normalizeValue(req.header('x-tenant-id')) ?? 'tenant-demo',
      brandId: normalizeValue(req.header('x-brand-id')),
      storeId: normalizeValue(req.header('x-store-id')),
      marketCode: normalizeValue(req.header('x-market-code')) ?? 'us-default'
    }
    req.actorContext = buildActorContext(req)
    req.governanceContext = {
      requestId: normalizeValue(req.header('x-request-id')) ?? randomUUID(),
      startedAt: Date.now()
    }
    next()
  }
}
