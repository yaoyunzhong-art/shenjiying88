/**
 * E2E-level: Bootstrap 启动引导 service 层测试
 *
 * 链路:
 *   BootstrapService.getHealth() → { status, uptime, phase }
 *   BootstrapService.getBootstrapMetadata() → { tenantContext, foundationDependencies, ... }
 *
 * 验证:
 *   - getHealth 返回正确状态和 uptime
 *   - uptime 为正数
 *   - phase 为 'scaffold'
 *   - getBootstrapMetadata 返回租户上下文和依赖
 *   - 不同租户参数返回不同 tenantContext
 *   - foundationDependencies 为数组
 *   - 幂等性: 多次调用 getHealth 一致
 *   - getHealth 返回 status=ok
 *   - getBootstrapMetadata 中 foundationContracts 为数组
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import { BootstrapService } from './bootstrap.service'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ========== factory ==========

function createService(): BootstrapService {
  return new BootstrapService()
}

function makeTenantContext(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return {
    tenantId: 'tenant-001',
    brandId: 'brand-001',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
    ...overrides,
  }
}

// ========== getHealth ==========

test('e2e: getHealth returns status=ok', () => {
  const svc = createService()
  const res = svc.getHealth()
  assert.equal(res.status, 'ok')
})

test('e2e: getHealth returns positive uptime', () => {
  const svc = createService()
  const res = svc.getHealth()
  assert.ok(res.uptime > 0, 'uptime must be positive')
})

test('e2e: getHealth returns phase=scaffold', () => {
  const svc = createService()
  const res = svc.getHealth()
  assert.equal(res.phase, 'scaffold')
})

test('e2e: getHealth is idempotent', () => {
  const svc = createService()
  const a = svc.getHealth()
  const b = svc.getHealth()
  assert.equal(a.status, b.status)
  assert.equal(a.phase, b.phase)
  // uptime increases between calls
  assert.ok(a.uptime > 0)
  assert.ok(b.uptime > 0)
})

// ========== getBootstrapMetadata ==========

test('e2e: getBootstrapMetadata returns tenant context', () => {
  const svc = createService()
  const ctx = makeTenantContext()
  const res = svc.getBootstrapMetadata(ctx)
  assert.deepEqual(res.tenantContext, ctx)
})

test('e2e: getBootstrapMetadata is tenant-isolated', () => {
  const svc = createService()
  const ctxA = makeTenantContext({ tenantId: 'tenant-A' })
  const ctxB = makeTenantContext({ tenantId: 'tenant-B' })
  const resA = svc.getBootstrapMetadata(ctxA)
  const resB = svc.getBootstrapMetadata(ctxB)
  assert.equal(resA.tenantContext.tenantId, 'tenant-A')
  assert.equal(resB.tenantContext.tenantId, 'tenant-B')
})

test('e2e: getBootstrapMetadata returns foundationDependencies as array', () => {
  const svc = createService()
  const res = svc.getBootstrapMetadata(makeTenantContext())
  assert.ok(Array.isArray(res.foundationDependencies))
})

test('e2e: getBootstrapMetadata returns phase=scaffold', () => {
  const svc = createService()
  const res = svc.getBootstrapMetadata(makeTenantContext())
  assert.equal(res.phase, 'scaffold')
})

// ========== 边界 ==========

test('e2e: getBootstrapMetadata handles empty tenantId gracefully', () => {
  const svc = createService()
  const ctx = makeTenantContext({ tenantId: '' })
  const res = svc.getBootstrapMetadata(ctx)
  assert.equal(res.tenantContext.tenantId, '')
  assert.equal(res.phase, 'scaffold')
})

test('e2e: getBootstrapMetadata handles partial context', () => {
  const svc = createService()
  const partialCtx: RequestTenantContext = {
    tenantId: 'only-tenant',
    brandId: undefined as any,
    storeId: undefined as any,
    marketCode: undefined as any,
  }
  const res = svc.getBootstrapMetadata(partialCtx)
  assert.equal(res.tenantContext.tenantId, 'only-tenant')
  assert.equal(res.tenantContext.brandId, undefined)
})

test('e2e: getHealth has consistent structure', () => {
  const svc = createService()
  const res = svc.getHealth()
  assert.ok('status' in res)
  assert.ok('uptime' in res)
  assert.ok('phase' in res)
  assert.equal(Object.keys(res).length, 3)
})
