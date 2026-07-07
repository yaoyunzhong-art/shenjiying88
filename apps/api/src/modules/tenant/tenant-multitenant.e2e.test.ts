import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Tenant 多租户 SaaS 基础设施 (Phase-15 task 5)
 *
 * 跨服务场景:
 *   - 多 tenant 配额隔离 (每个 tenant 独立 quota + usage)
 *   - 跨租户访问被 TenantIsolationViolation 拒绝
 *   - tenant suspend 时 quota 检查仍工作但 assertWriteAllowed 失败
 *   - tenant reactivate 后恢复正常
 *   - quota 超限时 reserve 拒绝,usage 不变
 *   - platform admin 跨 tenant 可访问,quota 各 tenant 独立计数
 *
 * 覆盖:
 *   - tenant A 升级到 Pro / B 保持 Free
 *   - 跨 tenant reserve 不污染
 *   - suspend + write rejection
 *   - lifecycle history 累积
 */

import assert from 'node:assert/strict'
import {
  assertIsolation,
  canAccessTenant,
  PLATFORM_ADMIN_PERMISSION,
  TenantIsolationViolation
} from './tenant-isolation.util'
import { TenantLifecycleService } from './tenant-lifecycle.service'
import { TenantQuotaService } from './tenant-quota.service'
import { TenantLifecycleStatus, TenantStatusReason } from './tenant-lifecycle.entity'
import { QuotaResourceKind, TenantTier } from './tenant-quota.entity'

let quotaSvc: TenantQuotaService
let lifecycleSvc: TenantLifecycleService

beforeEach(() => {
  quotaSvc = new TenantQuotaService()
  lifecycleSvc = new TenantLifecycleService()
})

it('e2e: 多 tenant 独立配额 - A 用尽 Free quota 不影响 B', () => {
  quotaSvc.initialize('tenant-A', TenantTier.Free)
  quotaSvc.initialize('tenant-B', TenantTier.Free)

  // A 用尽 Free maxBrands=1
  assert.equal(quotaSvc.reserve('tenant-A', QuotaResourceKind.Brand).allowed, true)
  assert.equal(quotaSvc.check('tenant-A', QuotaResourceKind.Brand).allowed, false)

  // B 仍可创建
  assert.equal(quotaSvc.reserve('tenant-B', QuotaResourceKind.Brand).allowed, true)
  assert.equal(quotaSvc.getUsage('tenant-A').brands, 1)
  assert.equal(quotaSvc.getUsage('tenant-B').brands, 1)
})

it('e2e: tier 升级 - Pro tenant 比 Free 有更多配额', () => {
  quotaSvc.initialize('tenant-A', TenantTier.Free)
  quotaSvc.initialize('tenant-B', TenantTier.Pro)

  // A Free maxBrands=1
  assert.equal(quotaSvc.getQuota('tenant-A')?.maxBrands, 1)
  // B Pro maxBrands=10
  assert.ok((quotaSvc.getQuota('tenant-B')?.maxBrands ?? 0) > 1)
  assert.ok((quotaSvc.getQuota('tenant-B')?.maxMembers ?? 0) > (quotaSvc.getQuota('tenant-A')?.maxMembers ?? 0))
})

it('e2e: overrideQuota - 单租户提升不影响其他 tenant', () => {
  quotaSvc.initialize('tenant-A', TenantTier.Free)
  quotaSvc.initialize('tenant-B', TenantTier.Free)

  quotaSvc.overrideQuota('tenant-A', { maxStores: 999 })

  assert.equal(quotaSvc.getQuota('tenant-A')?.maxStores, 999)
  assert.equal(quotaSvc.getQuota('tenant-B')?.maxStores, 5, 'B 未受 A 的 override 影响')
})

it('e2e: 跨租户访问被 assertIsolation 拒绝', () => {
  const actor = { tenantId: 'tenant-A', permissions: [] as string[] }
  const resource = { tenantId: 'tenant-B', kind: 'brand', id: 'b-1' }

  try {
    assertIsolation(actor, resource)
    assert.fail('应该抛 TenantIsolationViolation')
  } catch (err) {
    assert.ok(err instanceof TenantIsolationViolation)
    assert.equal((err as TenantIsolationViolation).actorTenantId, 'tenant-A')
    assert.equal((err as TenantIsolationViolation).resourceTenantId, 'tenant-B')
  }
})

it('e2e: platform admin 可跨 tenant', () => {
  const platformAdmin = {
    tenantId: 'platform',
    permissions: [PLATFORM_ADMIN_PERMISSION] as string[]
  }
  const resources = [
    { tenantId: 'tenant-A', kind: 'platform-report' },
    { tenantId: 'tenant-B', kind: 'platform-report' },
    { tenantId: 'tenant-C', kind: 'platform-report' }
  ]
  for (const r of resources) {
    assert.doesNotThrow(() => assertIsolation(platformAdmin, r))
  }
})

it('e2e: canAccessTenant 跨租户 false,同租户 true', () => {
  assert.equal(canAccessTenant('A', 'A'), true)
  assert.equal(canAccessTenant('A', 'B'), false)
  assert.equal(canAccessTenant('A', 'B', [PLATFORM_ADMIN_PERMISSION]), true)
})

it('e2e: lifecycle suspend → write 被 assertWriteAllowed 拒绝,但 quota 可查', () => {
  lifecycleSvc.initialize('tenant-A')
  quotaSvc.initialize('tenant-A', TenantTier.Free)

  // Active 状态写 OK
  lifecycleSvc.assertWriteAllowed('tenant-A')
  quotaSvc.reserve('tenant-A', QuotaResourceKind.Brand)

  // 暂停
  lifecycleSvc.suspend('tenant-A', TenantStatusReason.BillingOverdue, 'billing-svc')
  assert.equal(lifecycleSvc.getStatus('tenant-A'), TenantLifecycleStatus.Suspended)

  // 写操作被拒
  assert.throws(() => lifecycleSvc.assertWriteAllowed('tenant-A'))

  // quota check 仍工作 (suspend 不影响 quota 状态)
  const check = quotaSvc.check('tenant-A', QuotaResourceKind.Brand)
  assert.equal(check.allowed, false, 'quota 已用尽')
})

it('e2e: lifecycle suspend → reactivate → write 恢复', () => {
  lifecycleSvc.initialize('tenant-A')
  lifecycleSvc.suspend('tenant-A')
  assert.throws(() => lifecycleSvc.assertWriteAllowed('tenant-A'))

  lifecycleSvc.reactivate('tenant-A', 'admin-1')
  lifecycleSvc.assertWriteAllowed('tenant-A')
})

it('e2e: lifecycle softDelete 后 read/write 都失败', () => {
  lifecycleSvc.initialize('tenant-A')
  lifecycleSvc.softDelete('tenant-A', TenantStatusReason.UserRequest, 'user-1')

  assert.throws(() => lifecycleSvc.assertReadAllowed('tenant-A'))
  assert.throws(() => lifecycleSvc.assertWriteAllowed('tenant-A'))
})

it('e2e: lifecycle history 累积 suspend→reactivate→suspend', () => {
  lifecycleSvc.initialize('tenant-A')
  lifecycleSvc.suspend('tenant-A', TenantStatusReason.BillingOverdue, 'billing')
  lifecycleSvc.reactivate('tenant-A', 'admin')
  lifecycleSvc.suspend('tenant-A', TenantStatusReason.PolicyViolation, 'compliance')

  const history = lifecycleSvc.getHistory('tenant-A')
  // Created + Suspend + Reactivate + Suspend = 4
  assert.ok(history.length >= 4)
  assert.equal(history[0]!.reason, TenantStatusReason.PolicyViolation)
  assert.equal(history[0]!.from, TenantLifecycleStatus.Active)
  assert.equal(history[0]!.to, TenantLifecycleStatus.Suspended)
})

it('e2e: quota reserve 失败时不增加 usage', () => {
  quotaSvc.initialize('tenant-A', TenantTier.Free)

  // Free maxStores=5
  quotaSvc.reserve('tenant-A', QuotaResourceKind.Store) // success
  quotaSvc.reserve('tenant-A', QuotaResourceKind.Store) // success
  for (let i = 0; i < 3; i++) quotaSvc.reserve('tenant-A', QuotaResourceKind.Store)
  // 现在 5/5
  assert.equal(quotaSvc.getUsage('tenant-A').stores, 5)
  // 第 6 次 reserve 失败
  const r = quotaSvc.reserve('tenant-A', QuotaResourceKind.Store)
  assert.equal(r.allowed, false)
  assert.equal(quotaSvc.getUsage('tenant-A').stores, 5, 'usage 不变')
})

it('e2e: 完整 SaaS 场景 - 升级 tier → quota 增加 → reserve 成功', () => {
  quotaSvc.initialize('tenant-A', TenantTier.Free)
  lifecycleSvc.initialize('tenant-A')

  // Free 时只允许 1 brand
  assert.equal(quotaSvc.reserve('tenant-A', QuotaResourceKind.Brand).allowed, true)
  assert.equal(quotaSvc.reserve('tenant-A', QuotaResourceKind.Brand).allowed, false)

  // 升级到 Pro (admin 操作,不影响 lifecycle)
  quotaSvc.setTier('tenant-A', TenantTier.Pro)
  // usage 仍为 1,但 Pro maxBrands=10,允许继续 reserve
  assert.equal(quotaSvc.check('tenant-A', QuotaResourceKind.Brand).allowed, true)
  assert.equal(quotaSvc.reserve('tenant-A', QuotaResourceKind.Brand).allowed, true)
  assert.equal(quotaSvc.getUsage('tenant-A').brands, 2)
})

it('e2e: 跨服务组合 - suspend + quota 超限同时存在', () => {
  lifecycleSvc.initialize('tenant-A')
  quotaSvc.initialize('tenant-A', TenantTier.Free)

  // 用尽 quota
  quotaSvc.reserve('tenant-A', QuotaResourceKind.Brand)
  assert.equal(quotaSvc.check('tenant-A', QuotaResourceKind.Brand).allowed, false)

  // suspend
  lifecycleSvc.suspend('tenant-A', TenantStatusReason.QuotaExceeded, 'system')

  // 两个限制同时存在
  assert.throws(() => lifecycleSvc.assertWriteAllowed('tenant-A'))
  assert.equal(quotaSvc.check('tenant-A', QuotaResourceKind.Brand).allowed, false)

  // reactivate + 升级 tier → 恢复
  lifecycleSvc.reactivate('tenant-A', 'admin')
  quotaSvc.setTier('tenant-A', TenantTier.Pro)
  assert.doesNotThrow(() => lifecycleSvc.assertWriteAllowed('tenant-A'))
  assert.equal(quotaSvc.reserve('tenant-A', QuotaResourceKind.Brand).allowed, true)
})

it('e2e: 多 tenant lifecycle 独立 - 暂停 A 不影响 B', () => {
  lifecycleSvc.initialize('tenant-A')
  lifecycleSvc.initialize('tenant-B')

  lifecycleSvc.suspend('tenant-A')
  assert.equal(lifecycleSvc.getStatus('tenant-A'), TenantLifecycleStatus.Suspended)
  assert.equal(lifecycleSvc.getStatus('tenant-B'), TenantLifecycleStatus.Active)
  assert.doesNotThrow(() => lifecycleSvc.assertWriteAllowed('tenant-B'))
})

it('e2e: apiCallsToday 跨服务累加 + 日切重置', () => {
  quotaSvc.initialize('tenant-A', TenantTier.Pro)
  for (let i = 0; i < 50; i++) {
    quotaSvc.increment('tenant-A', QuotaResourceKind.ApiCall)
  }
  assert.equal(quotaSvc.getUsage('tenant-A').apiCallsToday, 50)

  // 模拟跨天:修改内部 reset date
  const internal = quotaSvc as unknown as { apiCallResetDate: Map<string, string> }
  internal.apiCallResetDate.set('tenant-A', '2020-01-01') // 远古日期
  // 重新获取 usage 应触发 reset
  const usage = quotaSvc.getUsage('tenant-A')
  assert.equal(usage.apiCallsToday, 0, '跨天后重置')
})

it('e2e: isolation + quota 联合 - 跨 tenant 过滤资源列表', () => {
  quotaSvc.initialize('tenant-A', TenantTier.Pro)
  quotaSvc.initialize('tenant-B', TenantTier.Pro)
  quotaSvc.initialize('tenant-C', TenantTier.Pro)

  // 模拟资源列表(每个资源带 tenantId)
  const allBrands = [
    { id: 'a1', tenantId: 'tenant-A' },
    { id: 'a2', tenantId: 'tenant-A' },
    { id: 'b1', tenantId: 'tenant-B' },
    { id: 'c1', tenantId: 'tenant-C' }
  ]

  // tenant-A 视角:只看 A 的资源
  const filteredForA = allBrands.filter(r => canAccessTenant('tenant-A', r.tenantId))
  assert.equal(filteredForA.length, 2)
  assert.deepEqual(filteredForA.map(r => r.id).sort(), ['a1', 'a2'])

  // platform admin 视角:全部
  const filteredForAdmin = allBrands.filter(r =>
    canAccessTenant('platform', r.tenantId, [PLATFORM_ADMIN_PERMISSION])
  )
  assert.equal(filteredForAdmin.length, 4)
})