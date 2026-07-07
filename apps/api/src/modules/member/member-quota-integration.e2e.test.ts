import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: MemberService.register + TenantQuota + Lifecycle 集成 (Phase-15D)
 *
 * 验证:
 *   - reserveQuotaAndCreateSync 包装 register 时, quota/lifecycle guard 生效
 *   - tenant suspend → 抛 TenantLifecycleBlockedException
 *   - 配额超限 → 抛 QuotaExceededException
 *   - tenant reactivate 后 register 恢复
 *   - 重复 memberId → 业务异常时 quota 回滚
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
import { MemberService, resetMemberServiceTestState } from './member.service'
import type { RequestTenantContext } from '../tenant/tenant.types'

/**
 * 模拟 member service 调用 reserveQuotaAndCreateSync 集成模式
 */
function registerWithQuota(
  member: MemberService,
  tenantId: string,
  input: ReturnType<typeof makeRegisterInput>,
  lifecycle: TenantLifecycleService,
  quota: TenantQuotaService
) {
  return reserveQuotaAndCreateSync(tenantId, lifecycle, quota, QuotaResourceKind.Member, () =>
    member.register(input)
  )
}

function makeRegisterInput(tenantId: string, memberId: string) {
  return {
    memberId,
    tenantContext: { tenantId } as RequestTenantContext,
    nickname: `Test-${memberId}`
  }
}

it('e2e: register 正常路径创建 member + quota +1', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetMemberServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const member = new MemberService()
  const profile = registerWithQuota(
    member,
    'tenant-test',
    makeRegisterInput('tenant-test', 'm-1'),
    lifecycle,
    quota
  )
  assert.equal(profile.memberId, 'm-1')
  assert.equal(profile.tenantContext.tenantId, 'tenant-test')
  const usage = quota.getUsage('tenant-test')
  assert.equal(usage.members, 1, `quota usage should be 1, got ${JSON.stringify(usage)}`)
})

it('e2e: tenant suspend 后 register 抛 TenantLifecycleBlockedException', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetMemberServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const member = new MemberService()
  lifecycle.suspend('tenant-test', TenantStatusReason.BillingOverdue, 'billing')
  try {
    registerWithQuota(
      member,
      'tenant-test',
      makeRegisterInput('tenant-test', 'm-1'),
      lifecycle,
      quota
    )
    assert.fail('应抛 TenantLifecycleBlockedException')
  } catch (err) {
    assert.ok(err instanceof TenantLifecycleBlockedException)
    assert.equal((err as TenantLifecycleBlockedException).currentStatus, TenantLifecycleStatus.Suspended)
  }
  assert.equal(quota.getUsage('tenant-test').members, 0)
})

it('e2e: 配额超限时 register 抛 QuotaExceededException', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetMemberServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const member = new MemberService()

  // Free maxMembers=100, override 到 1
  quota.overrideQuota('tenant-test', { maxMembers: 1 })
  registerWithQuota(
    member,
    'tenant-test',
    makeRegisterInput('tenant-test', 'm-1'),
    lifecycle,
    quota
  )
  assert.equal(quota.getUsage('tenant-test').members, 1)

  try {
    registerWithQuota(
      member,
      'tenant-test',
      makeRegisterInput('tenant-test', 'm-2'),
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
    assert.equal(response.resource, 'MEMBER')
    assert.equal(response.limit, 1)
  }
  assert.equal(quota.getUsage('tenant-test').members, 1)
})

it('e2e: tenant reactivate 后 register 恢复', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetMemberServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const member = new MemberService()
  lifecycle.suspend('tenant-test')
  assert.throws(() =>
    registerWithQuota(
      member,
      'tenant-test',
      makeRegisterInput('tenant-test', 'm-1'),
      lifecycle,
      quota
    )
  )
  lifecycle.reactivate('tenant-test', 'admin')
  const profile = registerWithQuota(
    member,
    'tenant-test',
    makeRegisterInput('tenant-test', 'm-1'),
    lifecycle,
    quota
  )
  assert.ok(profile.memberId)
})

it('e2e: 重复 memberId → 业务异常时 quota 回滚', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetMemberServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const member = new MemberService()
  quota.overrideQuota('tenant-test', { maxMembers: 10 })
  registerWithQuota(
    member,
    'tenant-test',
    makeRegisterInput('tenant-test', 'dup-1'),
    lifecycle,
    quota
  )
  assert.equal(quota.getUsage('tenant-test').members, 1)

  // 重复注册 → 业务校验失败
  try {
    registerWithQuota(
      member,
      'tenant-test',
      makeRegisterInput('tenant-test', 'dup-1'),
      lifecycle,
      quota
    )
    assert.fail('应抛错')
  } catch (err) {
    assert.ok(err instanceof Error)
    assert.match((err as Error).message, /already exists/)
  }
  // reserveQuotaAndCreateSync 在业务回调失败时自动 decrement 回滚
  assert.equal(quota.getUsage('tenant-test').members, 1)
})

it('e2e: tenant softDelete 后 register 被拒', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetMemberServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const member = new MemberService()
  lifecycle.softDelete('tenant-test', TenantStatusReason.AdminDelete, 'admin')
  try {
    registerWithQuota(
      member,
      'tenant-test',
      makeRegisterInput('tenant-test', 'm-1'),
      lifecycle,
      quota
    )
    assert.fail('应抛错')
  } catch (err) {
    assert.ok(err instanceof TenantLifecycleBlockedException)
    assert.equal((err as TenantLifecycleBlockedException).currentStatus, TenantLifecycleStatus.Deleted)
  }
})

it('e2e: 多 tenant 隔离 - tenant-A suspend 不影响 tenant-B', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetMemberServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')
  quota.initialize('tenant-B', TenantTier.Free)
  lifecycle.initialize('tenant-B')

  const member = new MemberService()

  lifecycle.suspend('tenant-test')
  assert.throws(() =>
    registerWithQuota(
      member,
      'tenant-test',
      makeRegisterInput('tenant-test', 'm-A'),
      lifecycle,
      quota
    )
  )
  const profileB = registerWithQuota(
    member,
    'tenant-B',
    makeRegisterInput('tenant-B', 'm-B'),
    lifecycle,
    quota
  )
  assert.equal(profileB.memberId, 'm-B')
  assert.equal(quota.getUsage('tenant-test').members, 0)
  assert.equal(quota.getUsage('tenant-B').members, 1)
})

it('e2e: 批量 register 累计 quota', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetMemberServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const member = new MemberService()
  quota.setTier('tenant-test', TenantTier.Pro)
  for (let i = 0; i < 5; i++) {
    registerWithQuota(
      member,
      'tenant-test',
      makeRegisterInput('tenant-test', `m-${i}`),
      lifecycle,
      quota
    )
  }
  assert.equal(quota.getUsage('tenant-test').members, 5)
})

it('e2e: quota 超限 + suspend 同时存在时 lifecycle 先抛错', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetMemberServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const member = new MemberService()

  quota.overrideQuota('tenant-test', { maxMembers: 1 })
  registerWithQuota(
    member,
    'tenant-test',
    makeRegisterInput('tenant-test', 'm-1'),
    lifecycle,
    quota
  )
  assert.equal(quota.getUsage('tenant-test').members, 1)

  lifecycle.suspend('tenant-test', TenantStatusReason.QuotaExceeded, 'system')

  // lifecycle 先抛错
  try {
    registerWithQuota(
      member,
      'tenant-test',
      makeRegisterInput('tenant-test', 'm-2'),
      lifecycle,
      quota
    )
    assert.fail('应抛错')
  } catch (err) {
    assert.ok(err instanceof TenantLifecycleBlockedException)
  }

  // reactivate 后 quota 仍满
  lifecycle.reactivate('tenant-test', 'admin')
  try {
    registerWithQuota(
      member,
      'tenant-test',
      makeRegisterInput('tenant-test', 'm-2'),
      lifecycle,
      quota
    )
    assert.fail('应抛错')
  } catch (err) {
    assert.ok(err instanceof QuotaExceededException)
  }

  // 升级 tier 恢复
  quota.setTier('tenant-test', TenantTier.Pro)
  const profile = registerWithQuota(
    member,
    'tenant-test',
    makeRegisterInput('tenant-test', 'm-2'),
    lifecycle,
    quota
  )
  assert.ok(profile.memberId)
})

it('e2e: register 不改变 profile 业务字段', () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetMemberServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const member = new MemberService()
  const input = makeRegisterInput('tenant-test', 'm-fidelity')
  const profile = registerWithQuota(
    member,
    'tenant-test',
    input,
    lifecycle,
    quota
  )
  assert.equal(profile.nickname, input.nickname)
  assert.equal(profile.level, 'BRONZE')
  assert.equal(profile.status, 'ACTIVE')
  assert.equal(profile.points, 0)
})
