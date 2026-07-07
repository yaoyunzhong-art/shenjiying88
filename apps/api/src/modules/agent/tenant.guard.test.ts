import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [agent] [D] tenant.guard 测试补全
 *
 * 覆盖:
 * - x-tenant-id header 正常流程
 * - X-Tenant-Id header (大小写)
 * - query tenantId 参数
 * - 缺失 header → 401
 * - 空 header → 401
 * - request.tenantId 注入
 */

import assert from 'node:assert/strict'
import { UnauthorizedException } from '@nestjs/common'
import { TenantGuard } from './tenant.guard'

describe('TenantGuard', () => {
  let guard: TenantGuard

  const createMockContext = (headers: Record<string, string> = {}, query: Record<string, string> = {}) => {
    const request = { headers, query }
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any
  }

  beforeEach(() => {
    guard = new TenantGuard()
  })

  // ── 正常流程 ──

  it('should allow with x-tenant-id header (lowercase)', () => {
    const context = createMockContext({ 'x-tenant-id': 't-001' })
    assert.equal(guard.canActivate(context), true)
    const req = context.switchToHttp().getRequest()
    assert.equal(req.tenantId, 't-001')
  })

  it('should allow with X-Tenant-Id header (mixed case)', () => {
    const context = createMockContext({ 'X-Tenant-Id': 't-002' })
    assert.equal(guard.canActivate(context), true)
    const req = context.switchToHttp().getRequest()
    assert.equal(req.tenantId, 't-002')
  })

  it('should allow with query tenantId parameter', () => {
    const context = createMockContext({}, { tenantId: 't-003' })
    assert.equal(guard.canActivate(context), true)
    const req = context.switchToHttp().getRequest()
    assert.equal(req.tenantId, 't-003')
  })

  it('should trim whitespace from tenantId', () => {
    const context = createMockContext({ 'x-tenant-id': '  t-001  ' })
    assert.equal(guard.canActivate(context), true)
    const req = context.switchToHttp().getRequest()
    assert.equal(req.tenantId, 't-001')
  })

  // ── 异常边界 ──

  it('should throw 401 when x-tenant-id is missing', () => {
    const context = createMockContext({})
    assert.throws(
      () => guard.canActivate(context),
      (err: unknown) => {
        assert.ok(err instanceof UnauthorizedException)
        assert.equal((err as UnauthorizedException).message, 'Missing x-tenant-id header')
        return true
      }
    )
  })

  it('should throw 401 when x-tenant-id is empty string', () => {
    const context = createMockContext({ 'x-tenant-id': '' })
    assert.throws(
      () => guard.canActivate(context),
      (err: unknown) => {
        assert.ok(err instanceof UnauthorizedException)
        assert.equal((err as UnauthorizedException).message, 'Missing x-tenant-id header')
        return true
      }
    )
  })

  it('should throw 401 when x-tenant-id is whitespace only', () => {
    const context = createMockContext({ 'x-tenant-id': '   ' })
    assert.throws(
      () => guard.canActivate(context),
      (err: unknown) => {
        assert.ok(err instanceof UnauthorizedException)
        return true
      }
    )
  })

  it('should throw 401 when x-tenant-id is non-string (number)', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-tenant-id': 12345 },
          query: {},
        }),
      }),
    } as any

    assert.throws(
      () => guard.canActivate(context),
      (err: unknown) => {
        assert.ok(err instanceof UnauthorizedException)
        return true
      }
    )
  })

  // ── 复杂场景 ──

  it('should prefer x-tenant-id header over query tenantId', () => {
    const context = createMockContext(
      { 'x-tenant-id': 't-from-header' },
      { tenantId: 't-from-query' }
    )
    guard.canActivate(context)
    const req = context.switchToHttp().getRequest()
    assert.equal(req.tenantId, 't-from-header')
  })
})
