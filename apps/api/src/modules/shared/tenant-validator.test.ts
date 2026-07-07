import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [shared] [D] tenant-validator 测试补全
 * 覆盖 assertTenantId + isCrossTenant 正例/反例/边界
 */
import assert from 'node:assert/strict'

describe('tenant-validator', () => {
  // ── assertTenantId ──
  describe('assertTenantId', async () => {
    const { assertTenantId } = await import('./tenant-validator')

    it('正常 tenantId — 不抛异常', () => {
      assert.doesNotThrow(() => assertTenantId('tenant-abc'))
    })

    it('带数字 tenantId — 不抛异常', () => {
      assert.doesNotThrow(() => assertTenantId('t123'))
    })

    it('null — 抛 ForbiddenException', () => {
      assert.throws(
        () => assertTenantId(null as unknown as string),
        (err: any) => err.response?.error === 'missing_tenant_id'
      )
    })

    it('undefined — 抛 ForbiddenException', () => {
      assert.throws(
        () => assertTenantId(undefined),
        (err: any) => err.response?.error === 'missing_tenant_id'
      )
    })

    it('空字符串 — 抛 ForbiddenException', () => {
      assert.throws(
        () => assertTenantId(''),
        (err: any) => err.response?.error === 'missing_tenant_id'
      )
    })

    it('空白字符串 — 抛 ForbiddenException', () => {
      assert.throws(
        () => assertTenantId('   '),
        (err: any) => err.response?.error === 'missing_tenant_id'
      )
    })
  })

  // ── isCrossTenant ──
  describe('isCrossTenant', async () => {
    const { isCrossTenant } = await import('./tenant-validator')

    it('同租户 — 返回 false', () => {
      assert.equal(isCrossTenant('tenant-a', 'tenant-a'), false)
    })

    it('不同租户 — 返回 true', () => {
      assert.equal(isCrossTenant('tenant-a', 'tenant-b'), true)
    })

    it('实体 tenantId 为 null — 返回 false（孤儿实体不算跨租户）', () => {
      assert.equal(isCrossTenant(null, 'tenant-a'), false)
    })

    it('实体 tenantId 为 undefined — 返回 false', () => {
      assert.equal(isCrossTenant(undefined, 'tenant-a'), false)
    })

    it('请求 tenantId 为空字符串且实体有值 — 返回 true', () => {
      assert.equal(isCrossTenant('tenant-a', ''), true)
    })

    it('大小写敏感 — 相同字母不同大小写视为不同租户', () => {
      assert.equal(isCrossTenant('Tenant-A', 'tenant-a'), true)
    })
  })
})
