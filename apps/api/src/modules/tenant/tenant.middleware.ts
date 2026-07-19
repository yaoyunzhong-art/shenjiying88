// tenant.middleware.ts · NestJS middleware stub
// 满足 tenant.middleware.test.ts 的 24 项期望:
//   - use() 默认挂 tenantContext (tenant-demo / us-default)
//   - 从 x-tenant-id / x-brand-id / x-store-id / x-market-code 头读取
//   - 去空白字符
//   - 空白 header 值视为 undefined
//   - governanceContext.requestId 从 x-request-id 头读取, 缺省 randomUUID()
//   - governanceContext.startedAt 为 number
//   - actorContext 从 x-actor (JSON 或 plain id) / x-actor-id + x-actor-type / 等头组装
//   - x-roles / x-permissions 数组, 去重
//   - x-actor-id 优先级高于 JSON actorId
//   - x-actor JSON 支持 { id, type, name } fallback 字段
//   - 缺省 actor headers 时 actorContext = undefined
//   - x-role / x-permission 单数别名支持

import { Injectable, Optional } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { DomainResolutionService } from '../saas-advanced/domain-resolution.service'

const DEFAULT_TENANT_ID = 'tenant-demo'
const DEFAULT_MARKET = 'us-default'

function readHeader(req: any, name: string): string | undefined {
  const raw = req.header?.(name)
  if (raw === undefined || raw === null) return undefined
  const trimmed = String(raw).trim()
  return trimmed === '' ? undefined : trimmed
}

function parseActorHeader(value: string): Record<string, any> | string {
  if (!value) return ''
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    /* not JSON, treat as plain id */
  }
  return value
}

function readRequestHost(req: any): string | undefined {
  return readHeader(req, 'x-forwarded-host') ?? readHeader(req, 'host')
}

@Injectable()
export class TenantMiddleware {
  constructor(@Optional() private readonly domainResolution?: DomainResolutionService) {}

  use(req: any, _res: any, next: () => void): void {
    const resolvedByHost = this.domainResolution?.resolveHost(readRequestHost(req) ?? '')

    // tenantContext
    const tenantId = resolvedByHost?.tenantId ?? readHeader(req, 'x-tenant-id') ?? DEFAULT_TENANT_ID
    const brandId = resolvedByHost?.brandId ?? readHeader(req, 'x-brand-id')
    const storeId = resolvedByHost?.storeId ?? readHeader(req, 'x-store-id')
    const marketCode = readHeader(req, 'x-market-code') ?? DEFAULT_MARKET
    req.tenantContext = { tenantId, brandId, storeId, marketCode }

    // governanceContext
    const requestId = readHeader(req, 'x-request-id') ?? randomUUID()
    req.governanceContext = { requestId, startedAt: Date.now() }

    // actorContext (optional)
    const actor = this.buildActorContext(req)
    if (actor) {
      req.actorContext = actor
    } else {
      // 测试期望: 当 no identity headers 时, actorContext === undefined
      delete req.actorContext
    }

    next()
  }

  private buildActorContext(req: any): any | undefined {
    const headerActor = readHeader(req, 'x-actor')
    const directId = readHeader(req, 'x-actor-id')
    const directType = readHeader(req, 'x-actor-type')
    const directName = readHeader(req, 'x-actor-name')
    const directTenantId = readHeader(req, 'x-actor-tenant-id')
    const directBrandId = readHeader(req, 'x-actor-brand-id')
    const directStoreId = readHeader(req, 'x-actor-store-id')
    const directAuthenticated = readHeader(req, 'x-actor-authenticated')
    const rolesCsv =
      readHeader(req, 'x-actor-roles') ?? readHeader(req, 'x-roles') ?? readHeader(req, 'x-role')
    const permsCsv =
      readHeader(req, 'x-actor-permissions') ??
      readHeader(req, 'x-permissions') ??
      readHeader(req, 'x-permission')

    let jsonActor: Record<string, any> | null = null
    let plainActorId: string | null = null
    if (headerActor !== undefined) {
      const parsed = parseActorHeader(headerActor)
      if (typeof parsed === 'string') {
        plainActorId = parsed
      } else {
        jsonActor = parsed
      }
    }

    const hasAnyIdentity =
      directId !== undefined ||
      directType !== undefined ||
      directName !== undefined ||
      directTenantId !== undefined ||
      directBrandId !== undefined ||
      directStoreId !== undefined ||
      directAuthenticated !== undefined ||
      headerActor !== undefined ||
      rolesCsv !== undefined ||
      permsCsv !== undefined

    if (!hasAnyIdentity) return undefined

    // 解析 x-actor JSON / plain id, 支持 { id, type, name } 字段 fallback
    const jsonActorId = jsonActor?.actorId ?? jsonActor?.id
    const jsonActorType = jsonActor?.actorType ?? jsonActor?.type
    const jsonActorName = jsonActor?.actorName ?? jsonActor?.name
    const jsonActorTenantId = jsonActor?.tenantId
    const jsonActorBrandId = jsonActor?.brandId
    const jsonActorStoreId = jsonActor?.storeId
    const jsonAuthenticated = jsonActor?.authenticated

    // 优先级: x-actor-id (direct header) > x-actor JSON actorId > x-actor plain id > x-actor JSON id
    const actorId = directId ?? jsonActorId ?? plainActorId
    const actorType = directType ?? jsonActorType ?? (plainActorId ? 'tenant-user' : undefined)
    const actorName = directName ?? jsonActorName
    const tenantId = directTenantId ?? jsonActorTenantId
    const brandId = directBrandId ?? jsonActorBrandId
    const storeId = directStoreId ?? jsonActorStoreId
    const authenticated =
      directAuthenticated !== undefined
        ? directAuthenticated.toLowerCase() === 'true'
        : jsonAuthenticated !== undefined
          ? Boolean(jsonAuthenticated)
          : true

    const roles = rolesCsv ? Array.from(new Set(rolesCsv.split(',').map(s => s.trim()).filter(Boolean))) : []
    const permissions = permsCsv ? Array.from(new Set(permsCsv.split(',').map(s => s.trim()).filter(Boolean))) : []

    return {
      actorId,
      actorType,
      actorName,
      tenantId,
      brandId,
      storeId,
      roles,
      permissions,
      authenticated,
      source: 'headers',
    }
  }
}
