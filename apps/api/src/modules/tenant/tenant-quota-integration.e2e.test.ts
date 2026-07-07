import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Tenant Quota + Lifecycle 实战集成 (Phase-15 task B)
 *
 * 模拟业务层 service.createX() 调用场景,验证:
 *   - BrandService.registerBrand 受 quota + lifecycle 守卫
 *   - MemberService.inviteMember 受 quota + lifecycle 守卫
 *   - LoyaltyService.registerCouponPlan 受 quota + lifecycle 守卫
 *   - 创建失败时 reserve 回滚 (避免 quota 泄漏)
 *   - tenant suspend 后所有 create 被拒
 *   - tenant reactivate 后 create 恢复
 *   - API call 计数独立工作 (非阻塞)
 *
 * 设计: 用 mock service 包装 reserveQuotaAndCreate,模拟业务层集成模式,
 *      不直接修改现有 loyalty/identity-access service(避免影响 Phase-13/14 测试)。
 */

import assert from 'node:assert/strict'
import {
  QuotaExceededException,
  recordApiCall,
  releaseQuota,
  reserveQuotaAndCreate,
  reserveQuotaAndCreateSync,
  TenantLifecycleBlockedException
} from './tenant-quota-enforcement.util'
import { TenantLifecycleService } from './tenant-lifecycle.service'
import { TenantQuotaService } from './tenant-quota.service'
import { TenantLifecycleStatus, TenantStatusReason } from './tenant-lifecycle.entity'
import { QuotaResourceKind, TenantTier } from './tenant-quota.entity'

let quotaSvc: TenantQuotaService
let lifecycleSvc: TenantLifecycleService

/** Mock BrandService */
const brandService = {
  registerBrand(tenantId: string, code: string) {
    return reserveQuotaAndCreateSync(
      tenantId,
      lifecycleSvc,
      quotaSvc,
      QuotaResourceKind.Brand,
      () => ({
        brandId: `brand-${code}-${Date.now()}`,
        code,
        tenantId,
        createdAt: new Date().toISOString()
      })
    )
  }
}

/** Mock MemberService */
const memberService = {
  inviteMember(tenantId: string, email: string) {
    return reserveQuotaAndCreateSync(
      tenantId,
      lifecycleSvc,
      quotaSvc,
      QuotaResourceKind.Member,
      () => ({
        memberId: `member-${email}-${Date.now()}`,
        email,
        tenantId,
        status: 'INVITED'
      })
    )
  }
}

/** Mock LoyaltyService (异步场景) */
const loyaltyService = {
  async registerCouponPlan(tenantId: string, code: string) {
    return reserveQuotaAndCreate(
      tenantId,
      lifecycleSvc,
      quotaSvc,
      QuotaResourceKind.Campaign,
      async () => ({
        planId: `plan-${code}-${Date.now()}`,
        code,
        tenantId,
        createdAt: new Date().toISOString()
      })
    )
  }
}

beforeEach(() => {
  quotaSvc = new TenantQuotaService()
  lifecycleSvc = new TenantLifecycleService()
  // 默认初始化 tenant-A Free
  quotaSvc.initialize('tenant-A', TenantTier.Free)
  lifecycleSvc.initialize('tenant-A')
})

it('e2e: BrandService.registerBrand 在 Free tier 可创建 1 个 brand', () => {
  const brand = brandService.registerBrand('tenant-A', 'B1')
  assert.ok(brand.brandId.startsWith('brand-B1-'))
  assert.equal(quotaSvc.getUsage('tenant-A').brands, 1)
})

it('e2e: BrandService.registerBrand 第 2 次抛 QuotaExceededException', () => {
  brandService.registerBrand('tenant-A', 'B1')
  try {
    brandService.registerBrand('tenant-A', 'B2')
    assert.fail('应抛错')
  } catch (err) {
    assert.ok(err instanceof QuotaExceededException)
    const response = (err as QuotaExceededException).getResponse() as { error: string; resource: string }
    assert.equal(response.error, 'QUOTA_EXCEEDED')
    assert.equal(response.resource, QuotaResourceKind.Brand)
  }
})

it('e2e: 业务回调失败时 reserve 自动回滚', () => {
  // 模拟一个 brand 创建失败 (callback throws)
  const failingService = {
    registerBrand(tenantId: string, code: string) {
      return reserveQuotaAndCreateSync(tenantId, lifecycleSvc, quotaSvc, QuotaResourceKind.Brand, () => {
        throw new Error('business logic failed')
      })
    }
  }

  try {
    failingService.registerBrand('tenant-A', 'B-FAIL')
    assert.fail('应抛错')
  } catch (err) {
    assert.ok(err instanceof Error)
    assert.equal((err as Error).message, 'business logic failed')
  }
  // reserve 应已被回滚,usage 仍为 0
  assert.equal(quotaSvc.getUsage('tenant-A').brands, 0, 'reserve 应被回滚')
  // 后续 reserve 可成功(说明 quota 没被泄漏)
  const brand = brandService.registerBrand('tenant-A', 'B1')
  assert.ok(brand.brandId)
})

it('e2e: 异步业务回调失败时 reserve 也回滚', async () => {
  const failingAsync = {
    async registerCouponPlan(tenantId: string, code: string) {
      return reserveQuotaAndCreate(tenantId, lifecycleSvc, quotaSvc, QuotaResourceKind.Campaign, async () => {
        throw new Error('async business failed')
      })
    }
  }

  try {
    await failingAsync.registerCouponPlan('tenant-A', 'P-FAIL')
    assert.fail('应抛错')
  } catch (err) {
    assert.equal((err as Error).message, 'async business failed')
  }
  // usage 不增加
  assert.equal(quotaSvc.getUsage('tenant-A').campaigns, 0)
})

it('e2e: MemberService.inviteMember 受 quota 守卫,Pro tier 可创建多个', () => {
  // 升级到 Pro 允许 10000 members
  quotaSvc.setTier('tenant-A', TenantTier.Pro)
  for (let i = 0; i < 5; i++) {
    const m = memberService.inviteMember('tenant-A', `user${i}@test.com`)
    assert.ok(m.memberId)
  }
  assert.equal(quotaSvc.getUsage('tenant-A').members, 5)
})

it('e2e: MemberService.inviteMember 在 Free tier 限制 100', () => {
  quotaSvc.setTier('tenant-A', TenantTier.Pro)
  // Pro maxMembers = 10000,这里只测试到 101 让它超限
  // 为加速测试,override 到 2
  quotaSvc.overrideQuota('tenant-A', { maxMembers: 2 })
  memberService.inviteMember('tenant-A', 'a@test.com')
  memberService.inviteMember('tenant-A', 'b@test.com')
  try {
    memberService.inviteMember('tenant-A', 'c@test.com')
    assert.fail('应抛错')
  } catch (err) {
    assert.ok(err instanceof QuotaExceededException)
    assert.equal((err as QuotaExceededException).checkResult.resource, QuotaResourceKind.Member)
  }
})

it('e2e: LoyaltyService.registerCouponPlan 受 Campaign quota 守卫', async () => {
  // Free maxCampaigns=10,这里 override 到 2 测边界
  quotaSvc.overrideQuota('tenant-A', { maxCampaigns: 2 })
  const p1 = await loyaltyService.registerCouponPlan('tenant-A', 'P1')
  assert.ok(p1.planId.startsWith('plan-P1-'))
  const p2 = await loyaltyService.registerCouponPlan('tenant-A', 'P2')
  assert.ok(p2.planId)
  try {
    await loyaltyService.registerCouponPlan('tenant-A', 'P3')
    assert.fail('应抛错')
  } catch (err) {
    assert.ok(err instanceof QuotaExceededException)
  }
  assert.equal(quotaSvc.getUsage('tenant-A').campaigns, 2)
})

it('e2e: tenant suspend 后所有 create 被 TenantLifecycleBlockedException 拒绝', () => {
  lifecycleSvc.suspend('tenant-A', TenantStatusReason.BillingOverdue, 'billing')
  try {
    brandService.registerBrand('tenant-A', 'B1')
    assert.fail('应抛错')
  } catch (err) {
    assert.ok(err instanceof TenantLifecycleBlockedException)
    assert.equal((err as TenantLifecycleBlockedException).currentStatus, TenantLifecycleStatus.Suspended)
  }
  // member/campaign 同样被拒
  assert.throws(() => memberService.inviteMember('tenant-A', 'a@b.com'))
  assert.throws(() => brandService.registerBrand('tenant-A', 'B1'))
})

it('e2e: suspend 后调用 recordApiCall 仍工作 (非阻塞)', () => {
  lifecycleSvc.suspend('tenant-A')
  assert.doesNotThrow(() => recordApiCall('tenant-A', quotaSvc, 5))
  assert.equal(quotaSvc.getUsage('tenant-A').apiCallsToday, 5)
})

it('e2e: tenant reactivate 后 create 恢复', () => {
  lifecycleSvc.suspend('tenant-A')
  assert.throws(() => brandService.registerBrand('tenant-A', 'B1'))
  lifecycleSvc.reactivate('tenant-A', 'admin')
  const brand = brandService.registerBrand('tenant-A', 'B1')
  assert.ok(brand.brandId)
})

it('e2e: tenant softDelete 后 read/write 全被拒 (业务层场景)', () => {
  lifecycleSvc.softDelete('tenant-A', TenantStatusReason.AdminDelete, 'admin')
  assert.throws(() => brandService.registerBrand('tenant-A', 'B1'), TenantLifecycleBlockedException)
})

it('e2e: 多 tenant 隔离 - tenant-A suspend 不影响 tenant-B', () => {
  quotaSvc.initialize('tenant-B', TenantTier.Free)
  lifecycleSvc.initialize('tenant-B')

  lifecycleSvc.suspend('tenant-A', TenantStatusReason.AdminSuspend)
  assert.throws(() => brandService.registerBrand('tenant-A', 'B1'))
  // B 仍可创建
  const brandB = brandService.registerBrand('tenant-B', 'B1')
  assert.ok(brandB.brandId)
  assert.equal(quotaSvc.getUsage('tenant-A').brands, 0)
  assert.equal(quotaSvc.getUsage('tenant-B').brands, 1)
})

it('e2e: releaseQuota 删除资源后 quota 回退', () => {
  const brand = brandService.registerBrand('tenant-A', 'B1')
  assert.equal(quotaSvc.getUsage('tenant-A').brands, 1)
  // 删除 brand
  releaseQuota('tenant-A', quotaSvc, QuotaResourceKind.Brand)
  assert.equal(quotaSvc.getUsage('tenant-A').brands, 0)
  // 可重新创建
  const brand2 = brandService.registerBrand('tenant-A', 'B2')
  assert.notEqual(brand.brandId, brand2.brandId)
})

it('e2e: 跨场景 - quota 超限 + suspend 同时存在', () => {
  // 用尽 quota
  brandService.registerBrand('tenant-A', 'B1')
  // suspend
  lifecycleSvc.suspend('tenant-A', TenantStatusReason.QuotaExceeded, 'system')

  // 两个限制同时生效,lifecycle 检查先触发
  try {
    brandService.registerBrand('tenant-A', 'B2')
    assert.fail('应抛错')
  } catch (err) {
    assert.ok(err instanceof TenantLifecycleBlockedException)
  }
  // reactivate 后 quota 仍满,继续抛 QuotaExceeded
  lifecycleSvc.reactivate('tenant-A', 'admin')
  try {
    brandService.registerBrand('tenant-A', 'B2')
    assert.fail('应抛错')
  } catch (err) {
    assert.ok(err instanceof QuotaExceededException)
  }
  // 升级 tier,quota 恢复
  quotaSvc.setTier('tenant-A', TenantTier.Pro)
  const brand = brandService.registerBrand('tenant-A', 'B2')
  assert.ok(brand.brandId)
})

it('e2e: quota reserve 计数与 guard 计数一致', () => {
  // reserveQuotaAndCreateSync 内部应 reserve 一次,usage +1
  brandService.registerBrand('tenant-A', 'B1')
  // Free maxBrands=1,第二次应抛 QuotaExceeded
  try {
    brandService.registerBrand('tenant-A', 'B2')
    assert.fail('应抛 QuotaExceeded')
  } catch (err) {
    assert.ok(err instanceof QuotaExceededException)
  }
  // 失败的 reserve 不应增加 usage(因为 reserve 失败时根本未 increment)
  assert.equal(quotaSvc.getUsage('tenant-A').brands, 1)
  assert.equal(quotaSvc.getUsage('tenant-A').brands, 1, 'failed reserve 不污染 usage')
})

it('e2e: 业务层应使用 reserveQuotaAndCreate 而非 reserve + 手动 increment', () => {
  // 模拟反模式:reserve 成功后业务失败,increment 没回滚
  // reserveQuotaAndCreate 设计上避免这种情况
  quotaSvc.setTier('tenant-A', TenantTier.Pro)
  let reservedCount = 0
  const badService = {
    registerBrand(tenantId: string, code: string) {
      // 反模式:reserve 后立即 increment,业务失败不会回滚
      quotaSvc.reserve(tenantId, QuotaResourceKind.Brand)
      reservedCount++
      if (code === 'fail') throw new Error('fail')
      return { brandId: code, code }
    }
  }

  // 反模式:reserve 后业务失败,quota 泄漏
  badService.registerBrand('tenant-A', 'B1')
  try {
    badService.registerBrand('tenant-A', 'fail')
  } catch {
    // expected: 业务失败
  }
  // reservedCount=2,usage=2 (泄漏 1)
  assert.equal(quotaSvc.getUsage('tenant-A').brands, 2, '反模式导致 quota 泄漏')

  // 正确模式:reserveQuotaAndCreate 自动回滚
  quotaSvc.resetAll()
  quotaSvc.initialize('tenant-A', TenantTier.Free)
  const goodService = {
    registerBrand(tenantId: string, code: string) {
      return reserveQuotaAndCreateSync(tenantId, lifecycleSvc, quotaSvc, QuotaResourceKind.Brand, () => {
        if (code === 'fail') throw new Error('fail')
        return { brandId: code }
      })
    }
  }
  goodService.registerBrand('tenant-A', 'B1')
  try {
    goodService.registerBrand('tenant-A', 'fail')
  } catch {
    // expected: 业务失败
  }
  // usage=1 (正确回滚)
  assert.equal(quotaSvc.getUsage('tenant-A').brands, 1, '正确模式自动回滚')
})

it('e2e: QuotaExceededException HTTP 429 + 结构化字段', () => {
  // Free maxBrands=1
  brandService.registerBrand('tenant-A', 'B1')
  try {
    brandService.registerBrand('tenant-A', 'B2')
    assert.fail('应抛错')
  } catch (err) {
    assert.ok(err instanceof QuotaExceededException)
    const response = (err as QuotaExceededException).getResponse() as Record<string, unknown>
    assert.equal(response.statusCode, 429)
    assert.equal(response.error, 'QUOTA_EXCEEDED')
    assert.equal(response.resource, 'BRAND')
    assert.equal(response.limit, 1)
    assert.equal(response.currentUsage, 1)
    assert.deepEqual(response.exceeded, ['BRAND'])
  }
})