import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: LoyaltyService.registerCouponPlan + TenantQuota + Lifecycle 集成 (Phase-15C)
 *
 * 验证:
 *   - reserveQuotaAndCreateSync 包装 registerCouponPlan 时, quota/lifecycle guard 生效
 *   - tenant suspend → 抛 TenantLifecycleBlockedException
 *   - 配额超限 → 抛 QuotaExceededException
 *   - 正常情况 → plan 创建成功 + quota increment
 *   - 输入校验失败 → quota 回滚
 *   - 多 tenant 隔离
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  QuotaExceededException,
  TenantLifecycleBlockedException,
  reserveQuotaAndCreateSync
} from '../tenant/tenant-quota-enforcement.util'
import { TenantLifecycleService } from '../tenant/tenant-lifecycle.service'
import { TenantQuotaService } from '../tenant/tenant-quota.service'
import { TenantLifecycleStatus, TenantStatusReason } from '../tenant/tenant-lifecycle.entity'
import { QuotaResourceKind, TenantTier } from '../tenant/tenant-quota.entity'
import { MemberService } from '../member/member.service'
import { LoyaltyService } from './loyalty.service'
import { CouponDiscountType, LoyaltyPlanStatus, type CouponPlan } from './loyalty.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

/**
 * 模拟 loyalty service 调用 reserveQuotaAndCreateSync 集成模式
 */
function registerCouponPlanWithQuota(
  loyalty: LoyaltyService,
  tenantId: string,
  input: ReturnType<typeof makeValidPlanInput>,
  lifecycle: TenantLifecycleService,
  quota: TenantQuotaService
) {
  return reserveQuotaAndCreateSync(tenantId, lifecycle, quota, QuotaResourceKind.Campaign, () =>
    loyalty.registerCouponPlan(input)
  )
}

function makeTenantContext(tenantId: string): RequestTenantContext {
  return { tenantId } as RequestTenantContext
}

function makeValidPlanInput(tenantId: string) {
  return {
    tenantContext: makeTenantContext(tenantId),
    code: 'TEST-PLAN-001',
    title: 'Test Plan',
    discountType: CouponDiscountType.Percentage,
    discountValue: 10,
    minOrderAmount: 100,
    totalQuota: 100,
    perMemberLimit: 1,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
  }
}

it('e2e: registerCouponPlan 正常路径创建 plan + quota increment', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const memberSvc = new MemberService()
  const loyalty = new LoyaltyService(memberSvc)

  const plan = registerCouponPlanWithQuota(
    loyalty,
    'tenant-test',
    makeValidPlanInput('tenant-test'),
    lifecycle,
    quota
  )
  assert.ok(plan.planId.startsWith('coupon-plan-'))
  assert.equal(plan.status, LoyaltyPlanStatus.Draft)
  assert.equal(plan.tenantContext.tenantId, 'tenant-test')
  // quota 应已 +1
  assert.equal(quota.getUsage('tenant-test').campaigns, 1)
})

it('e2e: tenant suspend 后 registerCouponPlan 抛 TenantLifecycleBlockedException', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const memberSvc = new MemberService()
  const loyalty = new LoyaltyService(memberSvc)

  lifecycle.suspend('tenant-test', TenantStatusReason.BillingOverdue, 'billing')
  try {
    registerCouponPlanWithQuota(
      loyalty,
      'tenant-test',
      makeValidPlanInput('tenant-test'),
      lifecycle,
      quota
    )
    assert.fail('应抛 TenantLifecycleBlockedException')
  } catch (err) {
    assert.ok(err instanceof TenantLifecycleBlockedException)
    assert.equal((err as TenantLifecycleBlockedException).currentStatus, TenantLifecycleStatus.Suspended)
  }
  // quota usage 不变
  assert.equal(quota.getUsage('tenant-test').campaigns, 0)
})

it('e2e: 配额超限时 registerCouponPlan 抛 QuotaExceededException', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const memberSvc = new MemberService()
  const loyalty = new LoyaltyService(memberSvc)

  // Free maxCampaigns=10, override 到 1 让其快速超限
  quota.overrideQuota('tenant-test', { maxCampaigns: 1 })
  registerCouponPlanWithQuota(
    loyalty,
    'tenant-test',
    makeValidPlanInput('tenant-test'),
    lifecycle,
    quota
  )
  assert.equal(quota.getUsage('tenant-test').campaigns, 1)

  try {
    registerCouponPlanWithQuota(
      loyalty,
      'tenant-test',
      makeValidPlanInput('tenant-test'),
      lifecycle,
      quota
    )
    assert.fail('应抛 QuotaExceededException')
  } catch (err) {
    assert.ok(err instanceof QuotaExceededException)
    const response = (err as QuotaExceededException).getResponse() as {
      resource: string
      limit: number
    }
    assert.equal(response.resource, 'CAMPAIGN')
    assert.equal(response.limit, 1)
  }
  // 第二次失败时 usage 不变
  assert.equal(quota.getUsage('tenant-test').campaigns, 1)
})

it('e2e: tenant reactivate 后 registerCouponPlan 恢复', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const memberSvc = new MemberService()
  const loyalty = new LoyaltyService(memberSvc)

  lifecycle.suspend('tenant-test')
  assert.throws(() =>
    registerCouponPlanWithQuota(
      loyalty,
      'tenant-test',
      makeValidPlanInput('tenant-test'),
      lifecycle,
      quota
    )
  )
  lifecycle.reactivate('tenant-test', 'admin')
  const plan = registerCouponPlanWithQuota(
    loyalty,
    'tenant-test',
    makeValidPlanInput('tenant-test'),
    lifecycle,
    quota
  )
  assert.ok(plan.planId)
})

it('e2e: 输入校验失败时不消耗 quota', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const memberSvc = new MemberService()
  const loyalty = new LoyaltyService(memberSvc)

  const badInput = makeValidPlanInput('tenant-test')
  badInput.discountValue = -10 // invalid

  try {
    registerCouponPlanWithQuota(
      loyalty,
      'tenant-test',
      badInput,
      lifecycle,
      quota
    )
    assert.fail('应抛错')
  } catch (err) {
    assert.ok(err instanceof Error)
    assert.match((err as Error).message, /discountValue must be positive/)
  }
  // reserve 已占位,但 reserveQuotaAndCreateSync 的 catch 分支 decrement 回滚了
  assert.equal(quota.getUsage('tenant-test').campaigns, 0)
})

it('e2e: tenant softDelete 后 registerCouponPlan 被拒', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const memberSvc = new MemberService()
  const loyalty = new LoyaltyService(memberSvc)

  lifecycle.softDelete('tenant-test', TenantStatusReason.AdminDelete, 'admin')
  try {
    registerCouponPlanWithQuota(
      loyalty,
      'tenant-test',
      makeValidPlanInput('tenant-test'),
      lifecycle,
      quota
    )
    assert.fail('应抛错')
  } catch (err) {
    assert.ok(err instanceof TenantLifecycleBlockedException)
    assert.equal((err as TenantLifecycleBlockedException).currentStatus, TenantLifecycleStatus.Deleted)
  }
})

it('e2e: 多次 registerCouponPlan 配额累计', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const memberSvc = new MemberService()
  const loyalty = new LoyaltyService(memberSvc)

  // 升级 Pro 让 5 次都能成功
  quota.setTier('tenant-test', TenantTier.Pro)
  const plans: CouponPlan[] = []
  for (let i = 0; i < 5; i++) {
    const input = makeValidPlanInput('tenant-test')
    input.code = `P-${i}`
    plans.push(registerCouponPlanWithQuota(loyalty, 'tenant-test', input, lifecycle, quota))
  }
  assert.equal(plans.length, 5)
  assert.equal(quota.getUsage('tenant-test').campaigns, 5)
})

it('e2e: quota 集成不影响 plan 业务字段', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const memberSvc = new MemberService()
  const loyalty = new LoyaltyService(memberSvc)

  const input = makeValidPlanInput('tenant-test')
  const plan = registerCouponPlanWithQuota(loyalty, 'tenant-test', input, lifecycle, quota)
  // 业务字段保持完整
  assert.equal(plan.code, input.code)
  assert.equal(plan.title, input.title)
  assert.equal(plan.discountType, input.discountType)
  assert.equal(plan.discountValue, input.discountValue)
  assert.equal(plan.totalQuota, input.totalQuota)
  assert.equal(plan.perMemberLimit, input.perMemberLimit)
  assert.equal(plan.remainingQuota, input.totalQuota)
})

it('e2e: 多 tenant 隔离 - tenant-A suspend 不影响 tenant-B', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')
  quota.initialize('tenant-B', TenantTier.Free)
  lifecycle.initialize('tenant-B')

  const memberSvc = new MemberService()
  const loyalty = new LoyaltyService(memberSvc)

  lifecycle.suspend('tenant-test')
  assert.throws(() =>
    registerCouponPlanWithQuota(
      loyalty,
      'tenant-test',
      makeValidPlanInput('tenant-test'),
      lifecycle,
      quota
    )
  )
  // tenant-B 仍可创建
  const planB = registerCouponPlanWithQuota(
    loyalty,
    'tenant-B',
    makeValidPlanInput('tenant-B'),
    lifecycle,
    quota
  )
  assert.ok(planB.planId)
  assert.equal(quota.getUsage('tenant-test').campaigns, 0)
  assert.equal(quota.getUsage('tenant-B').campaigns, 1)
})

it('e2e: 配额超限 + suspend 同时存在时 lifecycle 先抛错', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const memberSvc = new MemberService()
  const loyalty = new LoyaltyService(memberSvc)

  // 用尽 quota
  quota.overrideQuota('tenant-test', { maxCampaigns: 1 })
  registerCouponPlanWithQuota(
    loyalty,
    'tenant-test',
    makeValidPlanInput('tenant-test'),
    lifecycle,
    quota
  )
  assert.equal(quota.getUsage('tenant-test').campaigns, 1)
  // suspend
  lifecycle.suspend('tenant-test', TenantStatusReason.QuotaExceeded, 'system')

  // lifecycle 先抛错(quota 仍满但 lifecycle 先检查)
  try {
    registerCouponPlanWithQuota(
      loyalty,
      'tenant-test',
      makeValidPlanInput('tenant-test'),
      lifecycle,
      quota
    )
    assert.fail('应抛错')
  } catch (err) {
    assert.ok(err instanceof TenantLifecycleBlockedException)
  }

  // reactivate 后 quota 仍满,继续抛 QuotaExceeded
  lifecycle.reactivate('tenant-test', 'admin')
  try {
    registerCouponPlanWithQuota(
      loyalty,
      'tenant-test',
      makeValidPlanInput('tenant-test'),
      lifecycle,
      quota
    )
    assert.fail('应抛错')
  } catch (err) {
    assert.ok(err instanceof QuotaExceededException)
  }

  // 升级 tier,quota 恢复
  quota.setTier('tenant-test', TenantTier.Pro)
  const plan = registerCouponPlanWithQuota(
    loyalty,
    'tenant-test',
    makeValidPlanInput('tenant-test'),
    lifecycle,
    quota
  )
  assert.ok(plan.planId)
})
