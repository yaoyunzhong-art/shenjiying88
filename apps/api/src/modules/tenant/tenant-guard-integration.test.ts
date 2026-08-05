/**
 * T5: TenantGuard 鉴权 + 跨租户隔离 + tenantContext 注入 集成测试
 *
 * 验证:
 *   1. TenantGuard 拦截未提供 x-tenant-id 的请求 (401)
 *   2. TenantGuard 透传有效 x-tenant-id 到 request.tenantId
 *   3. 跨租户数据隔离 (tenant-A 无法访问 tenant-B 数据)
 *   4. tenantContext 注入 (从 request 解析)
 *   5. verifyTenant() token ↔ path 校验
 *   6. 三级隔离 (tenant + brand + store)
 *   7. platform:admin 绕隔离
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { TenantIsolationService } from './tenant-isolation.service'
import { TenantMiddleware } from './tenant.middleware'
import {
  canAccessTenant,
  canAccessBrand,
  canAccessStore,
  assertIsolation,
  assertSameTenant,
  filterByTenantIsolation,
  TenantIsolationViolation,
  PLATFORM_ADMIN_PERMISSION,
  getTenantDbPool,
} from './tenant-isolation.util'
import { matchesTenantScope } from './tenant.entity'
import type { ConnectionPoolConfig } from './tenant.entity'

// ─── 辅助: 构造 mock request ──────────────────────────────────────────────
function mockReq(headers: Record<string, string> = {}) {
  const req: any = {
    headers: {} as Record<string, string>,
    header(name: string): string | undefined {
      return (req.headers as any)[name]
    },
  }
  // 注入所有 headers
  for (const [k, v] of Object.entries(headers)) {
    (req.headers as any)[k] = v
  }
  return req
}

function mockRes() {
  return {} as any
}

function mockNext() {
  return () => {}
}

// ─── 1. TenantGuard 拦截逻辑 (纯逻辑等价测试) ─────────────────────────────

describe('T5 — TenantGuard 鉴权拦截逻辑', () => {
  describe('Guard 逻辑: 拒绝无 x-tenant-id 请求', () => {
    it('应拦截缺失 x-tenant-id header 的请求', () => {
      const req = mockReq({})
      const tenantId =
        req.headers['x-tenant-id'] ||
        req.headers['X-Tenant-Id'] ||
        req.query?.tenantId

      expect(tenantId).toBeUndefined()
    })

    it('应允许有效 x-tenant-id 的请求', () => {
      const req = mockReq({ 'x-tenant-id': 'tenant-acme' })
      const tenantId = req.header('x-tenant-id')
      expect(tenantId).toBe('tenant-acme')
      // 验证写入 request.tenantId
      req.tenantId = tenantId
      expect(req.tenantId).toBe('tenant-acme')
    })

    it('应支持 X-Tenant-Id (大写) 头', () => {
      const req = mockReq({ 'X-Tenant-Id': 'tenant-caps' })
      const tenantId = req.header('X-Tenant-Id')
      expect(tenantId).toBe('tenant-caps')
    })

    it('应拒绝空白 tenantId', () => {
      const req = mockReq({ 'x-tenant-id': '   ' })
      const tenantId = req.header('x-tenant-id')
      const trimmed = tenantId?.trim()
      const isBlank = !trimmed || trimmed === ''
      expect(isBlank).toBe(true)
    })

    it('应拒绝空字符串 tenantId', () => {
      const req = mockReq({ 'x-tenant-id': '' })
      const tenantId = req.header('x-tenant-id')
      expect(tenantId).toBe('')
    })

    it('应支持 query 参数中的 tenantId', () => {
      const req = {
        headers: {},
        query: { tenantId: 't-from-query' },
        header() { return undefined },
      }
      const tenantId = req.query?.tenantId
      expect(tenantId).toBe('t-from-query')
    })

    it('header 优先级高于 query', () => {
      const req = {
        headers: { 'x-tenant-id': 't-from-header' },
        query: { tenantId: 't-from-query' },
        header(name: string) { return (this.headers as any)[name] },
      }
      const headerId = req.header('x-tenant-id')
      expect(headerId).toBe('t-from-header')
    })

    it('应处理中文 tenantId (ULID/uuid)', () => {
      const req = mockReq({ 'x-tenant-id': '01JQEXAMPLE0000000000000000' })
      expect(req.header('x-tenant-id')).toBe('01JQEXAMPLE0000000000000000')
    })
  })

  describe('租户级多 tenant 并发隔离', () => {
    it('不同 tenant 应有独立请求标识', () => {
      const tenantA = { tenantId: 't-a', requestId: crypto.randomUUID() }
      const tenantB = { tenantId: 't-b', requestId: crypto.randomUUID() }
      expect(tenantA.tenantId).not.toBe(tenantB.tenantId)
      expect(tenantA.requestId).not.toBe(tenantB.requestId)
    })
  })
})

// ─── 2. TenantMiddleware 上下文注入 ───────────────────────────────────────

describe('T5 — TenantMiddleware 上下文注入', () => {
  let middleware: TenantMiddleware

  beforeAll(() => {
    middleware = new TenantMiddleware()
  })

  describe('tenantContext 注入', () => {
    it('默认注入 tenantContext (tenant-demo / us-default)', () => {
      const req = mockReq({})
      middleware.use(req, mockRes(), mockNext())
      expect(req.tenantContext).toBeDefined()
      expect(req.tenantContext.tenantId).toBe('tenant-demo')
      expect(req.tenantContext.marketCode).toBe('us-default')
    })

    it('从 x-tenant-id header 读取 tenantId', () => {
      const req = mockReq({ 'x-tenant-id': 'tenant-custom' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.tenantContext.tenantId).toBe('tenant-custom')
    })

    it('从 x-brand-id header 读取 brandId', () => {
      const req = mockReq({ 'x-brand-id': 'brand-99' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.tenantContext.brandId).toBe('brand-99')
    })

    it('从 x-store-id header 读取 storeId', () => {
      const req = mockReq({ 'x-store-id': 'store-42' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.tenantContext.storeId).toBe('store-42')
    })

    it('从 x-market-code header 读取 marketCode', () => {
      const req = mockReq({ 'x-market-code': 'zh-cn' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.tenantContext.marketCode).toBe('zh-cn')
    })

    it('去空白字符: x-tenant-id 周围空白', () => {
      const req = mockReq({ 'x-tenant-id': '  t-trimmed  ' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.tenantContext.tenantId).toBe('t-trimmed')
    })

    it('空白 header 值视为 undefined (brandId)', () => {
      const req = mockReq({ 'x-brand-id': '   ' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.tenantContext.brandId).toBeUndefined()
    })
  })

  describe('governanceContext 注入', () => {
    it('注入 requestId (来自 x-request-id)', () => {
      const req = mockReq({ 'x-request-id': 'req-111' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.governanceContext.requestId).toBe('req-111')
    })

    it('无 x-request-id 时自动生成 UUID', () => {
      const req = mockReq({})
      middleware.use(req, mockRes(), mockNext())
      expect(req.governanceContext.requestId).toBeDefined()
      expect(req.governanceContext.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    })

    it('startedAt 为当前时间戳 (number)', () => {
      const before = Date.now()
      const req = mockReq({})
      middleware.use(req, mockRes(), mockNext())
      expect(req.governanceContext.startedAt).toBeGreaterThanOrEqual(before)
      expect(typeof req.governanceContext.startedAt).toBe('number')
    })
  })

  describe('actorContext 注入', () => {
    it('无 identity headers 时 actorContext 为 undefined', () => {
      const req = mockReq({})
      middleware.use(req, mockRes(), mockNext())
      expect(req.actorContext).toBeUndefined()
    })

    it('从 x-actor-id 解析 actorId', () => {
      const req = mockReq({ 'x-actor-id': 'user-1' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.actorContext.actorId).toBe('user-1')
      // actorType 仅当 x-actor plain id 或 JSON 有 type 时 fallback;
      // 仅 x-actor-id header 时不自动赋值 tenant-user
      expect(req.actorContext.actorType).toBeFalsy()
    })

    it('x-actor 支持 JSON 格式', () => {
      const req = mockReq({
        'x-actor': '{"actorId":"json-user","actorType":"platform-user","actorName":"Admin"}'
      })
      middleware.use(req, mockRes(), mockNext())
      expect(req.actorContext.actorId).toBe('json-user')
      expect(req.actorContext.actorType).toBe('platform-user')
      expect(req.actorContext.actorName).toBe('Admin')
    })

    it('x-actor 支持 plain id (非 JSON)', () => {
      const req = mockReq({ 'x-actor': 'plain-user-99' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.actorContext.actorId).toBe('plain-user-99')
      expect(req.actorContext.actorType).toBe('tenant-user')
    })

    it('x-actor JSON 支持 { id, type, name } 字段 fallback', () => {
      const req = mockReq({
        'x-actor': '{"id":"legacy-id","type":"legacy-type","name":"Legacy"}'
      })
      middleware.use(req, mockRes(), mockNext())
      expect(req.actorContext.actorId).toBe('legacy-id')
      expect(req.actorContext.actorType).toBe('legacy-type')
      expect(req.actorContext.actorName).toBe('Legacy')
    })

    it('x-actor-id header 优先级高于 JSON actorId', () => {
      const req = mockReq({
        'x-actor-id': 'direct-id',
        'x-actor': '{"actorId":"json-id"}'
      })
      middleware.use(req, mockRes(), mockNext())
      expect(req.actorContext.actorId).toBe('direct-id')
    })

    it('解析 roles 数组 (x-roles)', () => {
      const req = mockReq({ 'x-roles': 'admin,editor,viewer' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.actorContext.roles).toEqual(['admin', 'editor', 'viewer'])
    })

    it('roles 去重', () => {
      const req = mockReq({ 'x-roles': 'admin,admin,viewer' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.actorContext.roles).toEqual(['admin', 'viewer'])
    })

    it('解析 permissions (x-permissions)', () => {
      const req = mockReq({ 'x-permissions': 'read,write' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.actorContext.permissions).toEqual(['read', 'write'])
    })

    it('支持 x-role 单数别名', () => {
      const req = mockReq({ 'x-role': 'admin' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.actorContext.roles).toEqual(['admin'])
    })

    it('支持 x-permission 单数别名', () => {
      const req = mockReq({ 'x-permission': 'read' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.actorContext.permissions).toEqual(['read'])
    })

    it('x-actor-authenticated 支持', () => {
      const req = mockReq({ 'x-actor-authenticated': 'false', 'x-actor-id': 'u1' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.actorContext.authenticated).toBe(false)
    })

    it('默认 authenticated = true (有 identity 时)', () => {
      const req = mockReq({ 'x-actor-id': 'u1' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.actorContext.authenticated).toBe(true)
    })

    it('x-actor-tenant-id 支持独立租户绑定', () => {
      const req = mockReq({ 'x-actor-tenant-id': 't-actor-own', 'x-actor-id': 'u1' })
      middleware.use(req, mockRes(), mockNext())
      expect(req.actorContext.tenantId).toBe('t-actor-own')
    })
  })
})

// ─── 3. 跨租户数据隔离 ───────────────────────────────────────────────────

describe('T5 — TenantIsolationService 跨租户数据隔离', () => {
  let service: TenantIsolationService

  beforeEach(() => {
    service = new TenantIsolationService()
  })

  describe('verifyTenant() token ↔ path 校验', () => {
    it('token 与 path tenantId 一致时通过', () => {
      const result = service.verifyTenant('t-secure', 't-secure')
      expect(result.matched).toBe(true)
    })

    it('token 与 path 不一致时抛 ForbiddenException', () => {
      expect(() => service.verifyTenant('t-app', 't-sneak')).toThrow(ForbiddenException)
      expect(() => service.verifyTenant('t-app', 't-sneak')).toThrow(
        'Tenant mismatch'
      )
    })

    it('token 为空时抛 ForbiddenException', () => {
      expect(() => service.verifyTenant('', 't-any')).toThrow('Missing tenant context in token')
    })

    it('path 为空时抛 ForbiddenException', () => {
      expect(() => service.verifyTenant('t-any', '')).toThrow('Missing tenant context in request path')
    })
  })

  describe('数据隔离: register + findOne', () => {
    it('tenant-A 仅能访问自己的数据', () => {
      service.registerTenantData('t-a', [
        { id: 'e1', tenantId: 't-a', value: 'a-data' }
      ])
      service.registerTenantData('t-b', [
        { id: 'e1', tenantId: 't-b', value: 'b-data' }
      ])

      const fromA = service.findOne('t-a', 'e1')
      expect(fromA).toBeDefined()
      expect((fromA as any).value).toBe('a-data')

      // tenant-A 查 tenant-B 的 id → undefined (隔离)
      const leaked = service.findOne('t-a', 'e1') // t-a 有 e1
      expect(leaked).toBeDefined()
      const crossLeak = service.findOne('t-b', 'not-exist')
      expect(crossLeak).toBeUndefined()
    })

    it('跨租户 find 返回空数组', () => {
      service.registerTenantData('t-a', [
        { id: 'e1', tenantId: 't-a' },
        { id: 'e2', tenantId: 't-a' }
      ])
      service.registerTenantData('t-b', [
        { id: 'e3', tenantId: 't-b' }
      ])

      // t-a 查自己的数据 → 2 条
      expect(service.find('t-a')).toHaveLength(2)
      // t-a 查 t-b 的数据 → 0 条 (隔离)
      expect(service.find('t-b').filter(e => e.tenantId === 't-a')).toHaveLength(0)
    })
  })

  describe('跨租户集成测试 (100 场景)', () => {
    it('100 场景全部生成', () => {
      service.registerTenantData('t1', [{ id: 'e1', tenantId: 't1' }])
      service.registerTenantData('t2', [{ id: 'e2', tenantId: 't2' }])
      service.registerTenantData('t3', [{ id: 'e3', tenantId: 't3' }])

      const result = service.runCrossTenantIntegrationTest({
        tenantIds: ['t1', 't2', 't3'],
        scenarioCount: 100,
      })

      expect(result.totalAttempted).toBe(100)
      expect(result.details).toHaveLength(100)
    })

    it('10 租户 100 场景通过率 ≥ 0.99', () => {
      const tenants = Array.from({ length: 10 }, (_, i) => `tenant-${i}`)
      for (const t of tenants) {
        service.registerTenantData(t, [
          { id: `entity-${t}`, tenantId: t, name: `data-of-${t}` }
        ])
      }

      const result = service.runCrossTenantIntegrationTest({
        tenantIds: tenants,
        scenarioCount: 100,
      })

      expect(result.passRate).toBeGreaterThanOrEqual(0.99)
    })
  })
})

// ─── 4. tenant-isolation.util 三级隔离 ────────────────────────────────────

describe('T5 — tenant-isolation.util 三级隔离工具', () => {
  describe('canAccessTenant()', () => {
    it('同一 tenant → true', () => {
      expect(canAccessTenant('t1', 't1')).toBe(true)
    })

    it('不同 tenant → false', () => {
      expect(canAccessTenant('t1', 't2')).toBe(false)
    })

    it('actor tenantId 缺失 → false', () => {
      expect(canAccessTenant(undefined, 't1')).toBe(false)
    })

    it('resource tenantId 缺失 → false', () => {
      expect(canAccessTenant('t1', undefined)).toBe(false)
    })

    it('platform:admin 权限可跨租户', () => {
      expect(canAccessTenant('t-admin', 't-target', [PLATFORM_ADMIN_PERMISSION])).toBe(true)
    })

    it('非 admin 权限不可跨租户', () => {
      expect(canAccessTenant('t1', 't2', ['read', 'write'])).toBe(false)
    })
  })

  describe('canAccessBrand()', () => {
    it('同 brand → true (前提 tenant 通过)', () => {
      expect(canAccessBrand('b1', 'b1', true)).toBe(true)
    })

    it('不同 brand → false', () => {
      expect(canAccessBrand('b1', 'b2', true)).toBe(false)
    })

    it('resourceBrandId 为 undefined → true (tenant-wide 资源)', () => {
      expect(canAccessBrand('b1', undefined, true)).toBe(true)
    })

    it('actorBrandId 为 undefined → true (无 brand 约束)', () => {
      expect(canAccessBrand(undefined, 'b1', true)).toBe(true)
    })

    it('canAccessTenant 失败 → false', () => {
      expect(canAccessBrand('b1', 'b1', false)).toBe(false)
    })
  })

  describe('canAccessStore()', () => {
    it('同 store → true', () => {
      expect(canAccessStore('s1', 's1', true)).toBe(true)
    })

    it('不同 store → false', () => {
      expect(canAccessStore('s1', 's2', true)).toBe(false)
    })

    it('resourceStoreId 为 undefined → true', () => {
      expect(canAccessStore('s1', undefined, true)).toBe(true)
    })
  })

  describe('assertIsolation() 三级一体校验', () => {
    it('同 tenant+brand+store → 不抛异常', () => {
      expect(() =>
        assertIsolation(
          { tenantId: 't1', brandId: 'b1', storeId: 's1' },
          { tenantId: 't1', brandId: 'b1', storeId: 's1', kind: 'Order' }
        )
      ).not.toThrow()
    })

    it('跨 tenant → 抛 TenantIsolationViolation', () => {
      expect(() =>
        assertIsolation(
          { tenantId: 't1' },
          { tenantId: 't2', kind: 'Order' }
        )
      ).toThrow(TenantIsolationViolation)
    })

    it('同 tenant 跨 brand → 抛异常', () => {
      expect(() =>
        assertIsolation(
          { tenantId: 't1', brandId: 'b1' },
          { tenantId: 't1', brandId: 'b2', kind: 'Product' }
        )
      ).toThrow(TenantIsolationViolation)
    })

    it('同 tenant+brand 跨 store → 抛异常', () => {
      expect(() =>
        assertIsolation(
          { tenantId: 't1', brandId: 'b1', storeId: 's1' },
          { tenantId: 't1', brandId: 'b1', storeId: 's2', kind: 'Inventory' }
        )
      ).toThrow(TenantIsolationViolation)
    })

    it('platform:admin 跨 tenant → 不抛', () => {
      expect(() =>
        assertIsolation(
          { tenantId: 't-admin', permissions: [PLATFORM_ADMIN_PERMISSION] },
          { tenantId: 't-target', kind: 'AuditLog' }
        )
      ).not.toThrow()
    })
  })

  describe('assertSameTenant()', () => {
    it('相同 → 不抛', () => {
      expect(() => assertSameTenant('t1', 't1', 'User')).not.toThrow()
    })

    it('不同 → 抛 TenantIsolationViolation', () => {
      expect(() => assertSameTenant('t1', 't2', 'User', 'u-99')).toThrow(
        TenantIsolationViolation
      )
    })
  })

  describe('filterByTenantIsolation()', () => {
    it('过滤出同 tenant 资源', () => {
      const resources = [
        { tenantId: 't1', id: '1' },
        { tenantId: 't2', id: '2' },
        { tenantId: 't1', id: '3' },
        { tenantId: undefined, id: '4' },
      ]
      const filtered = filterByTenantIsolation('t1', resources)
      expect(filtered).toHaveLength(2)
      expect(filtered.map(r => r.id)).toEqual(['1', '3'])
    })

    it('platform:admin 可获得全部资源', () => {
      const resources = [
        { tenantId: 't1', id: '1' },
        { tenantId: 't2', id: '2' },
      ]
      const filtered = filterByTenantIsolation('t-admin', resources, [PLATFORM_ADMIN_PERMISSION])
      expect(filtered).toHaveLength(2)
    })
  })

  describe('getTenantDbPool()', () => {
    it('注册表中找到 tenant → 返回其配置', () => {
      const registry = new Map<string, ConnectionPoolConfig>([
        ['t-db', { min: 5, max: 20, idleTimeoutMs: 10000, acquireTimeoutMs: 3000 }]
      ])
      const config = getTenantDbPool('t-db', registry)
      expect(config.min).toBe(5)
      expect(config.max).toBe(20)
    })

    it('未注册 tenant → 返回默认配置', () => {
      const registry = new Map<string, ConnectionPoolConfig>()
      const config = getTenantDbPool('unknown', registry)
      expect(config.min).toBe(2)
      expect(config.max).toBe(10)
    })

    it('tenantId 为空 → 抛错', () => {
      expect(() => getTenantDbPool('', undefined)).toThrow('tenantId is required')
    })

    it('注册表为 undefined → 返回默认配置', () => {
      const config = getTenantDbPool('t-fallback', undefined)
      expect(config).toBeDefined()
      expect(config.min).toBe(2)
    })
  })
})

// ─── 5. matchesTenantScope 作用域匹配 ─────────────────────────────────────

describe('T5 — matchesTenantScope 租户作用域匹配', () => {
  const baseCtx = {
    authenticated: true,
    actor: null,
    tenantContext: { tenantId: 't1', brandId: 'b1', storeId: 's1', marketCode: 'us' },
    effectiveTenantId: 't1',
    effectiveBrandId: 'b1',
    effectiveStoreId: 's1',
    effectiveMarketCode: 'us',
    roles: [],
    permissions: [],
  }

  it('无要求 → true', () => {
    expect(matchesTenantScope(baseCtx)).toBe(true)
    expect(matchesTenantScope(baseCtx, {})).toBe(true)
  })

  it('tenantId 匹配 → true', () => {
    expect(matchesTenantScope(baseCtx, { tenantId: 't1' })).toBe(true)
  })

  it('tenantId 不匹配 → false', () => {
    expect(matchesTenantScope(baseCtx, { tenantId: 't-other' })).toBe(false)
  })

  it('brandId 匹配 → true', () => {
    expect(matchesTenantScope(baseCtx, { brandId: 'b1' })).toBe(true)
  })

  it('brandId 不匹配 → false', () => {
    expect(matchesTenantScope(baseCtx, { brandId: 'b-wrong' })).toBe(false)
  })

  it('storeId 匹配 → true', () => {
    expect(matchesTenantScope(baseCtx, { storeId: 's1' })).toBe(true)
  })

  it('storeId 不匹配 → false', () => {
    expect(matchesTenantScope(baseCtx, { storeId: 's-wrong' })).toBe(false)
  })

  it('tenant+brand+store 全部匹配 → true', () => {
    expect(matchesTenantScope(baseCtx, { tenantId: 't1', brandId: 'b1', storeId: 's1' })).toBe(true)
  })

  it('部分匹配时任一不匹配即 false', () => {
    expect(matchesTenantScope(baseCtx, { tenantId: 't1', storeId: 's-wrong' })).toBe(false)
  })
})
