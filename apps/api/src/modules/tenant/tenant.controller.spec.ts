/**
 * TenantController 单元测试 (node:test)
 *
 * 策略：用内联 Controller（模拟 NestJS 装饰器行为）测试 resolveTenant 核心业务逻辑。
 */

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

// ── Type mirror ─────────────────────────────────────────────────
interface TenantAwareRequest {
  tenantContext?: {
    tenantId?: string
    brandId?: string
    storeId?: string
    marketCode?: string
  }
  actorContext?: {
    actorId?: string
    actorType?: string
    actorName?: string
    tenantId?: string
    brandId?: string
    storeId?: string
    roles?: string[]
    permissions?: string[]
    authenticated?: boolean
  }
  governanceContext?: {
    requestId?: string
    startedAt?: number
  }
}

// ── Inline Controller (mirrors source: tenant.controller.ts) ────
class TenantController {
  resolveTenant(req: TenantAwareRequest) {
    const { tenantContext, actorContext, governanceContext } = req

    const effectiveTenantId =
      actorContext?.tenantId ?? tenantContext?.tenantId ?? 'tenant-demo'

    return {
      requestId: governanceContext?.requestId,
      effectiveTenantId,
      effectiveBrandId: actorContext?.brandId ?? tenantContext?.brandId,
      effectiveStoreId: actorContext?.storeId ?? tenantContext?.storeId,
      effectiveMarketCode: tenantContext?.marketCode,
      actor: actorContext
        ? {
            actorId: actorContext.actorId,
            actorType: actorContext.actorType,
            actorName: actorContext.actorName,
            roles: actorContext.roles,
            permissions: actorContext.permissions,
            authenticated: actorContext.authenticated,
          }
        : null,
      source: 'tenant-module',
    }
  }
}

// ── Helper ──────────────────────────────────────────────────────
function buildReq(overrides: Record<string, any> = {}) {
  return {
    tenantContext: {},
    actorContext: undefined,
    governanceContext: {},
    ...overrides,
  }
}

// ── Tests ───────────────────────────────────────────────────────
describe('TenantController', () => {
  const controller = new TenantController()

  describe('resolveTenant()', () => {
    test('returns source "tenant-module"', () => {
      const req = buildReq()
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.source, 'tenant-module')
    })

    test('uses tenantContext.tenantId when no actorContext.tenantId', () => {
      const req = buildReq({
        tenantContext: { tenantId: 't-ctx' },
      })
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.effectiveTenantId, 't-ctx')
    })

    test('prefers actorContext.tenantId over tenantContext.tenantId', () => {
      const req = buildReq({
        actorContext: { tenantId: 't-actor' },
        tenantContext: { tenantId: 't-ctx' },
      })
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.effectiveTenantId, 't-actor')
    })

    test('falls back to "tenant-demo" when no tenantId is set anywhere', () => {
      const req = buildReq()
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.effectiveTenantId, 'tenant-demo')
    })

    test('forwards governanceContext.requestId', () => {
      const req = buildReq({
        governanceContext: { requestId: 'req-123' },
      })
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.requestId, 'req-123')
    })

    test('prefers actorContext.brandId over tenantContext.brandId', () => {
      const req = buildReq({
        actorContext: { brandId: 'b-actor' },
        tenantContext: { brandId: 'b-ctx' },
      })
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.effectiveBrandId, 'b-actor')
    })

    test('effectiveBrandId is undefined when neither context provides it', () => {
      const req = buildReq()
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.effectiveBrandId, undefined)
    })

    test('prefers actorContext.storeId over tenantContext.storeId', () => {
      const req = buildReq({
        actorContext: { storeId: 's-actor' },
        tenantContext: { storeId: 's-ctx' },
      })
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.effectiveStoreId, 's-actor')
    })

    test('effectiveMarketCode comes from tenantContext', () => {
      const req = buildReq({
        tenantContext: { marketCode: 'zh-cn' },
      })
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.effectiveMarketCode, 'zh-cn')
    })

    test('returns full actor details when actorContext is present', () => {
      const req = buildReq({
        actorContext: {
          actorId: 'u-1',
          actorType: 'member',
          actorName: 'Alice',
          roles: ['admin'],
          permissions: ['read', 'write'],
          authenticated: true,
        },
      })
      const result = controller.resolveTenant(req as any)
      assert.deepStrictEqual(result.actor, {
        actorId: 'u-1',
        actorType: 'member',
        actorName: 'Alice',
        roles: ['admin'],
        permissions: ['read', 'write'],
        authenticated: true,
      })
    })

    test('returns null actor when actorContext is undefined', () => {
      const req = buildReq()
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.actor, null)
    })

    test('returns undefined requestId when governanceContext is empty', () => {
      const req = buildReq()
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.requestId, undefined)
    })
  })
})
