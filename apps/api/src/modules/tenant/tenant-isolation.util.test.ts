import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 单元测试: tenant-isolation.util (Phase-15 task 3)
 *
 * 覆盖:
 *   - canAccessTenant 同 tenant 允许,跨 tenant 拒绝
 *   - platform admin 可跨 tenant
 *   - undefined tenantId 拒绝
 *   - canAccessBrand: brand 范围 + tenant 范围
 *   - canAccessStore: store 范围 + brand 范围 + tenant 范围
 *   - assertSameTenant / assertIsolation 抛 TenantIsolationViolation
 *   - filterByTenantIsolation 过滤
 */

import assert from 'node:assert/strict'
import {
  assertIsolation,
  assertSameTenant,
  canAccessBrand,
  canAccessStore,
  canAccessTenant,
  filterByTenantIsolation,
  PLATFORM_ADMIN_PERMISSION,
  TenantIsolationViolation
} from './tenant-isolation.util'

it('canAccessTenant: 同 tenant 允许', () => {
  assert.equal(canAccessTenant('t1', 't1'), true)
})

it('canAccessTenant: 跨 tenant 拒绝', () => {
  assert.equal(canAccessTenant('t1', 't2'), false)
})

it('canAccessTenant: undefined 拒绝', () => {
  assert.equal(canAccessTenant(undefined, 't1'), false)
  assert.equal(canAccessTenant('t1', undefined), false)
  assert.equal(canAccessTenant(undefined, undefined), false)
})

it('canAccessTenant: platform admin 可跨 tenant', () => {
  assert.equal(canAccessTenant('t1', 't2', [PLATFORM_ADMIN_PERMISSION]), true)
})

it('canAccessTenant: 非 platform admin 即使有其他权限也不能跨', () => {
  assert.equal(canAccessTenant('t1', 't2', ['campaign:create', 'brand:read']), false)
})

it('assertSameTenant: 同 tenant 不抛', () => {
  assert.doesNotThrow(() => assertSameTenant('t1', 't1', 'brand'))
})

it('assertSameTenant: 跨 tenant 抛 TenantIsolationViolation', () => {
  try {
    assertSameTenant('t1', 't2', 'brand', 'b-1')
    assert.fail('应该抛错')
  } catch (err) {
    assert.ok(err instanceof TenantIsolationViolation)
    assert.equal((err as TenantIsolationViolation).actorTenantId, 't1')
    assert.equal((err as TenantIsolationViolation).resourceTenantId, 't2')
    assert.equal((err as TenantIsolationViolation).resourceKind, 'brand')
    assert.equal((err as TenantIsolationViolation).resourceId, 'b-1')
    assert.ok(err.message.includes('Cross-tenant'))
  }
})

it('canAccessBrand: brand 相同允许', () => {
  assert.equal(canAccessBrand('b1', 'b1', true), true)
})

it('canAccessBrand: brand 不同 + tenant 范围资源允许', () => {
  // resource.brandId undefined 表示 tenant 范围,任何 brand 都能访问
  assert.equal(canAccessBrand('b1', undefined, true), true)
  assert.equal(canAccessBrand(undefined, 'b1', true), true)
})

it('canAccessBrand: brand 不同拒绝', () => {
  assert.equal(canAccessBrand('b1', 'b2', true), false)
})

it('canAccessBrand: 前置 tenant 失败直接拒绝', () => {
  assert.equal(canAccessBrand('b1', 'b1', false), false)
})

it('canAccessStore: store 相同允许', () => {
  assert.equal(canAccessStore('s1', 's1', true), true)
})

it('canAccessStore: store 不同 + tenant 范围允许', () => {
  assert.equal(canAccessStore('s1', undefined, true), true)
  assert.equal(canAccessStore(undefined, 's1', true), true)
})

it('canAccessStore: store 不同拒绝', () => {
  assert.equal(canAccessStore('s1', 's2', true), false)
})

it('assertIsolation: 三级全通过不抛', () => {
  assert.doesNotThrow(() =>
    assertIsolation(
      { tenantId: 't1', brandId: 'b1', storeId: 's1' },
      { tenantId: 't1', brandId: 'b1', storeId: 's1', kind: 'member', id: 'm1' }
    )
  )
})

it('assertIsolation: tenant 不匹配抛错', () => {
  try {
    assertIsolation(
      { tenantId: 't1' },
      { tenantId: 't2', kind: 'campaign' }
    )
    assert.fail('应该抛错')
  } catch (err) {
    assert.ok(err instanceof TenantIsolationViolation)
    assert.equal((err as TenantIsolationViolation).resourceKind, 'campaign')
  }
})

it('assertIsolation: brand 不匹配抛错 (tenant 通过)', () => {
  try {
    assertIsolation(
      { tenantId: 't1', brandId: 'b1' },
      { tenantId: 't1', brandId: 'b2', kind: 'store' }
    )
    assert.fail('应该抛错')
  } catch (err) {
    assert.ok(err instanceof TenantIsolationViolation)
    assert.equal((err as TenantIsolationViolation).resourceKind, 'store.brand')
  }
})

it('assertIsolation: store 不匹配抛错', () => {
  try {
    assertIsolation(
      { tenantId: 't1', brandId: 'b1', storeId: 's1' },
      { tenantId: 't1', brandId: 'b1', storeId: 's2', kind: 'order' }
    )
    assert.fail('应该抛错')
  } catch (err) {
    assert.ok(err instanceof TenantIsolationViolation)
    assert.equal((err as TenantIsolationViolation).resourceKind, 'order.store')
  }
})

it('assertIsolation: platform admin 可跨 tenant', () => {
  assert.doesNotThrow(() =>
    assertIsolation(
      { tenantId: 't1', permissions: [PLATFORM_ADMIN_PERMISSION] },
      { tenantId: 't2', kind: 'platform-report' }
    )
  )
})

it('filterByTenantIsolation: 仅保留同 tenant 资源', () => {
  const resources = [
    { id: 'a', tenantId: 't1' },
    { id: 'b', tenantId: 't2' },
    { id: 'c', tenantId: 't1' },
    { id: 'd', tenantId: 't3' }
  ]
  const filtered = filterByTenantIsolation('t1', resources)
  assert.equal(filtered.length, 2)
  assert.deepEqual(filtered.map(r => r.id), ['a', 'c'])
})

it('filterByTenantIsolation: platform admin 看到全部', () => {
  const resources = [
    { id: 'a', tenantId: 't1' },
    { id: 'b', tenantId: 't2' }
  ]
  const filtered = filterByTenantIsolation('t1', resources, [PLATFORM_ADMIN_PERMISSION])
  assert.equal(filtered.length, 2)
})

it('filterByTenantIsolation: undefined tenant 返回空', () => {
  const resources = [{ id: 'a', tenantId: 't1' }]
  const filtered = filterByTenantIsolation(undefined, resources)
  assert.equal(filtered.length, 0)
})

it('TenantIsolationViolation: name + message 结构', () => {
  const err = new TenantIsolationViolation('a', 'b', 'brand', 'b1')
  assert.equal(err.name, 'TenantIsolationViolation')
  assert.ok(err.message.includes('a'))
  assert.ok(err.message.includes('b'))
  assert.ok(err.message.includes('brand'))
  assert.ok(err.message.includes('b1'))
})