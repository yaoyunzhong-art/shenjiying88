/**
 * tenant.service.spec.ts — 多租户上下文解析 Service 纯函数式内联测试
 *
 * 覆盖：TenantService.resolveTenantContext 的全部合并规则
 *   - 正例: 完整的 tenant + actor + governance 合并
 *   - 正例: actor 优先于 tenant 覆盖 tenantId/brandId/storeId
 *   - 边界: 无 actor 时返回 null actor
 *   - 边界: 无 tenant 时回退默认 tenant-demo
 *   - 边界: 无 marketCode 时回退 default
 *   - 边界: actor 不携带 roles/permissions 时空数组
 *   - 边界: actor 只携带部分字段
 *   - 反例: tenantContext 为 undefined 时使用默认
 *
 * 策略：直接 new TenantService，纯函数内联。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TenantService } from './tenant.service'
import type { RequestTenantContext, RequestActorContext, RequestGovernanceContext } from './tenant.types'

// ═══════════════════════════════════════════════════════════════
// Mock 数据工厂
// ═══════════════════════════════════════════════════════════════

function makeService(): TenantService {
  return new TenantService()
}

function makeTenantCtx(overrides: Partial<RequestTenantContext> = {}): RequestTenantContext {
  return { tenantId: 't-1', marketCode: 'cn-mainland', ...overrides }
}

function makeActorCtx(overrides: Partial<RequestActorContext> = {}): RequestActorContext {
  return {
    actorId: 'user-1', actorType: 'tenant-user', actorName: 'TestUser',
    roles: ['admin'], permissions: ['read'], authenticated: true, source: 'headers',
    ...overrides,
  }
}

function makeGovernanceCtx(overrides: Partial<RequestGovernanceContext> = {}): RequestGovernanceContext {
  return { requestId: 'req-1', startedAt: Date.now(), ...overrides }
}

// ═══════════════════════════════════════════════════════════════
// 测试套件
// ═══════════════════════════════════════════════════════════════

describe('TenantService.resolveTenantContext', () => {
  let svc: TenantService

  beforeEach(() => { svc = makeService() })

  it('[C1] 完整合并 tenant + actor + governance', () => {
    const result = svc.resolveTenantContext(
      makeTenantCtx({ tenantId: 't-1', brandId: undefined, storeId: undefined }),
      makeActorCtx({ tenantId: undefined, brandId: 'b-1', storeId: undefined }),
      makeGovernanceCtx({ requestId: 'req-1' }),
    )
    expect(result.authenticated).toBe(true)
    expect(result.effectiveTenantId).toBe('t-1')
    expect(result.effectiveBrandId).toBe('b-1')
    expect(result.effectiveMarketCode).toBe('cn-mainland')
    expect(result.actor?.actorId).toBe('user-1')
    expect(result.roles).toEqual(['admin'])
    expect(result.permissions).toEqual(['read'])
  })

  it('[C2] 无 actor 时返回 null actor 且未认证', () => {
    const result = svc.resolveTenantContext(makeTenantCtx({ tenantId: 't-2', marketCode: 'us-default' }))
    expect(result.authenticated).toBe(false)
    expect(result.actor).toBeNull()
    expect(result.roles).toEqual([])
    expect(result.permissions).toEqual([])
  })

  it('[C3] 无 tenantId 时回退 tenant-demo', () => {
    const result = svc.resolveTenantContext(makeTenantCtx({ tenantId: undefined }))
    expect(result.effectiveTenantId).toBe('tenant-demo')
  })

  it('[C4] 无 marketCode 时回退 default', () => {
    const result = svc.resolveTenantContext({ tenantId: 't-3' } as RequestTenantContext)
    expect(result.effectiveMarketCode).toBe('default')
  })

  it('[C5] actor.tenantId 优先于 tenantContext.tenantId', () => {
    const result = svc.resolveTenantContext(makeTenantCtx({ tenantId: 't-ctx' }), makeActorCtx({ tenantId: 't-actor' }))
    expect(result.effectiveTenantId).toBe('t-actor')
  })

  it('[C6] actor.brandId 和 actor.storeId 覆盖 tenant 的值', () => {
    const result = svc.resolveTenantContext(makeTenantCtx({ brandId: 'b-ctx', storeId: 's-ctx' }), makeActorCtx({ brandId: 'b-actor', storeId: 's-actor' }))
    expect(result.effectiveBrandId).toBe('b-actor')
    expect(result.effectiveStoreId).toBe('s-actor')
  })

  it('[C7] actor 不携带 roles/permissions 时默认为空数组', () => {
    const result = svc.resolveTenantContext(
      makeTenantCtx(),
      makeActorCtx({ roles: undefined as unknown as string[], permissions: undefined as unknown as string[] }),
    )
    expect(result.roles).toEqual([])
    expect(result.permissions).toEqual([])
  })

  it('[C8] actor 携带 tenantId 和 storeId 时 actor 对象中保留', () => {
    const result = svc.resolveTenantContext(makeTenantCtx(), makeActorCtx({ tenantId: 't-x', storeId: 's-5' }))
    expect(result.effectiveTenantId).toBe('t-x')
    expect(result.effectiveStoreId).toBe('s-5')
    expect(result.actor?.storeId).toBe('s-5')
    expect(result.actor?.tenantId).toBe('t-x')
  })

  it('[C9] actor 有 actorName 时在 actor 对象中保留', () => {
    const result = svc.resolveTenantContext(makeTenantCtx(), makeActorCtx({ actorName: 'Alice' }))
    expect(result.actor?.actorName).toBe('Alice')
  })

  it('[C10] actor 无 actorName 时 actor 对象 actorName 为 undefined', () => {
    const result = svc.resolveTenantContext(makeTenantCtx(), makeActorCtx({ actorName: undefined }))
    expect(result.actor?.actorName).toBeUndefined()
  })

  it('[C11] tenantContext 包含 brandId 但 actor 未携带时使用 tenant 值', () => {
    const result = svc.resolveTenantContext(makeTenantCtx({ brandId: 'b-from-tenant' }))
    expect(result.effectiveBrandId).toBe('b-from-tenant')
  })

  it('[C12] tenantContext 包含 storeId 但 actor 未携带时使用 tenant 值', () => {
    const result = svc.resolveTenantContext(makeTenantCtx({ storeId: 's-from-tenant' }))
    expect(result.effectiveStoreId).toBe('s-from-tenant')
  })

  it('[C13] actor.authenticated=false 时认证状态同步', () => {
    const result = svc.resolveTenantContext(makeTenantCtx(), makeActorCtx({ authenticated: false }))
    expect(result.authenticated).toBe(false)
  })

  it('[C14] 仅 tenantContext 时 actor 为 null', () => {
    const result = svc.resolveTenantContext(makeTenantCtx({ tenantId: 'standalone' }))
    expect(result.actor).toBeNull()
    expect(result.effectiveTenantId).toBe('standalone')
  })

  it('[C15] 空的 tenantContext（全 undefined）全部回退默认', () => {
    const result = svc.resolveTenantContext({} as RequestTenantContext)
    expect(result.effectiveTenantId).toBe('tenant-demo')
    expect(result.effectiveMarketCode).toBe('default')
    expect(result.effectiveBrandId).toBeUndefined()
    expect(result.effectiveStoreId).toBeUndefined()
  })

  it('[C16] actor 的 roles/permissions 精确传递', () => {
    const result = svc.resolveTenantContext(makeTenantCtx(), makeActorCtx({ roles: ['super_admin'], permissions: ['read', 'write', 'delete'] }))
    expect(result.roles).toEqual(['super_admin'])
    expect(result.permissions).toEqual(['read', 'write', 'delete'])
  })

  it('[C17] governanceContext 参数不影响结果（仅预留）', () => {
    const withGov = svc.resolveTenantContext(makeTenantCtx({ tenantId: 't-gov' }), undefined, makeGovernanceCtx({ requestId: 'req-gov-1' }))
    const withoutGov = svc.resolveTenantContext(makeTenantCtx({ tenantId: 't-gov' }))
    expect(withGov.effectiveTenantId).toBe(withoutGov.effectiveTenantId)
    expect(withGov.authenticated).toBe(withoutGov.authenticated)
  })

  it('[C18] actor 携带 source 字段保留', () => {
    const result = svc.resolveTenantContext(makeTenantCtx(), makeActorCtx({ source: 'headers' }))
    expect(result.actor?.source).toBe('headers')
  })
})
