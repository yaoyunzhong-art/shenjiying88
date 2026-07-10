// tenant.types.ts · 类型 + 联合常量 stub
// 满足 tenant.types.test.ts 的运行时 module 加载 + 类型形状断言
//
// 实际类型在 NestJS runtime 中被 import, 但因为 ESM 模式下 require()
// 无法解析 *.ts, 我们这里使用 `export type` 显式 re-export, 配合
// 运行时占位让 require('./tenant.types') 拿到 module object.

import type { Request } from 'express'

export type ActorType =
  | 'platform-user'
  | 'tenant-user'
  | 'brand-user'
  | 'store-user'
  | 'employee-user'
  | 'service-account'

export interface RequestTenantContext {
  tenantId: string
  brandId?: string
  storeId?: string
  marketCode?: string
}

export interface RequestActorContext {
  actorId: string
  actorType: ActorType | string
  actorName?: string
  tenantId?: string
  brandId?: string
  storeId?: string
  roles: string[]
  permissions: string[]
  authenticated: boolean
  source: 'headers'
}

export interface TenantScopeRequirement {
  tenantId?: string
  brandId?: string
  storeId?: string
}

export interface RequestRateLimitDecision {
  applied: boolean
  scopeKey?: string
  allowed?: boolean
  limit?: number
  remaining?: number
  retryAfterSeconds?: number
}

export interface RequestGovernanceContext {
  requestId: string
  startedAt: number
  rateLimit?: {
    applied: boolean
    scopeKey?: string
    allowed?: boolean
    retryAfterSeconds?: number
  }
}

export interface ResolvedActorContext {
  authenticated: boolean
  actor: RequestActorContext | null
  tenantContext: RequestTenantContext
  effectiveTenantId: string
  effectiveBrandId?: string
  effectiveStoreId?: string
  effectiveMarketCode: string
  roles: string[]
  permissions: string[]
}

export interface TenantAwareRequest extends Request {
  tenantContext: RequestTenantContext
  actorContext?: RequestActorContext
  governanceContext?: RequestGovernanceContext
}

// 运行时占位对象 (满足 require('./tenant.types') 返回非空 module)
export const __tenantTypesModuleMarker = {
  actorTypeValues: [
    'platform-user',
    'tenant-user',
    'brand-user',
    'store-user',
    'employee-user',
    'service-account',
  ] as ActorType[],
  loaded: true as const,
  loadedAt: new Date().toISOString(),
}
