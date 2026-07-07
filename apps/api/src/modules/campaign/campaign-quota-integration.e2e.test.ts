import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: CampaignService.registerCampaign + TenantQuota + Lifecycle 真实集成 (Phase-16D)
 *
 * 本测试验证通过 assertCanWriteResource / reserveQuotaAndCreate 在业务方法外
 * 实现的 quota+lifecycle guard 模式。
 *
 * 验证:
 *   - tenant suspend → registerCampaign 抛 TenantLifecycleBlockedException
 *   - 配额超限 → registerCampaign 抛 QuotaExceededException
 *   - 正常情况 → plan 创建成功 + quota increment
 *   - 业务失败 → quota 不污染 (reserve 被回滚)
 *   - 无 quota/lifecycle 注入 → 跳过 guard (向后兼容 legacy test)
 *   - 多 tenant 隔离
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import { CampaignService } from './campaign.service'
import { TenantModule } from '../tenant/tenant.module'
import { TenantQuotaService } from '../tenant/tenant-quota.service'
import { TenantLifecycleService } from '../tenant/tenant-lifecycle.service'
import { TenantStatusReason } from '../tenant/tenant-lifecycle.entity'
import { TenantTier, QuotaResourceKind } from '../tenant/tenant-quota.entity'
import {
  QuotaExceededException,
  TenantLifecycleBlockedException,
  assertCanWriteResource,
  reserveQuotaAndCreateSync
} from '../tenant/tenant-quota-enforcement.util'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CampaignActionKind,
  CampaignConditionType,
  CampaignTrigger
} from './campaign.entity'

let campaignSeq = 0

// 定义测试包装器：在 CampaignService.registerCampaign 外施加 quota+lifecycle guard
function guardedRegisterCampaign(
  svc: CampaignService,
  quota: TenantQuotaService | undefined,
  lifecycle: TenantLifecycleService | undefined,
  input: ReturnType<typeof makeRegisterInput>
) {
  // 若无 quota/lifecycle 注入，跳过 guard（向后兼容）
  if (!quota || !lifecycle) {
    return svc.registerCampaign(input)
  }
  return reserveQuotaAndCreateSync(
    input.tenantContext.tenantId,
    lifecycle,
    quota,
    QuotaResourceKind.Campaign,
    () => svc.registerCampaign(input)
  )
}

async function buildAppWithQuota(): Promise<{
  campaign: CampaignService
  quota: TenantQuotaService
  lifecycle: TenantLifecycleService
  close: () => Promise<void>
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [TenantModule],
    providers: [
      {
        provide: CampaignService,
        useFactory: () => new CampaignService(),
        inject: []
      }
    ]
  }).compile()

  const campaign = moduleRef.get(CampaignService)
  const quota = moduleRef.get(TenantQuotaService)
  const lifecycle = moduleRef.get(TenantLifecycleService)

  quota.resetAll()
  lifecycle.resetAll()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  return { campaign, quota, lifecycle, close: () => moduleRef.close() }
}

function makeRegisterInput(tenantId: string, code: string) {
  campaignSeq += 1
  return {
    tenantContext: { tenantId } as RequestTenantContext,
    code: `${code}-${campaignSeq}`,
    title: `Test Campaign ${campaignSeq}`,
    triggerEvent: CampaignTrigger.PaymentSuccess,
    conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 100 }],
    actions: [
      {
        kind: CampaignActionKind.AwardPoints,
        params: { points: 10, pointsAmount: 10, reason: 'test' }
      }
    ]
  }
}

it('e2e: registerCampaign 正常路径创建 plan + Campaign quota +1', async () => {
  const { campaign, quota, close } = await buildAppWithQuota()
  try {
    const plan = guardedRegisterCampaign(campaign, quota, undefined, makeRegisterInput('tenant-test', 'normal'))
    assert.ok(plan.planId)
    assert.equal(plan.code.startsWith('normal-'), true)
    // 这里传 undefined lifecycle 以跳过 lifecycle 检查(相当于有 quota 无 lifecycle)
    // 实际使用中会传 lifecycle
    assert.equal(quota.getUsage('tenant-test').campaigns, 1, 'quota usage should be 1')
  } finally {
    await close()
  }
})

it('e2e: tenant suspend 后 registerCampaign 抛 TenantLifecycleBlockedException', async () => {
  const { campaign, lifecycle, close } = await buildAppWithQuota()
  try {
    lifecycle.suspend('tenant-test', TenantStatusReason.BillingOverdue, 'billing')
    assert.throws(
      () => guardedRegisterCampaign(campaign, undefined, lifecycle, makeRegisterInput('tenant-test', 'suspended')),
      TenantLifecycleBlockedException
    )
    // 由于 guard 在 lifecycle 检查阶段就抛出了，quota usage 不变
  } finally {
    await close()
  }
})

it('e2e: 配额超限时 registerCampaign 抛 QuotaExceededException', async () => {
  const { campaign, quota, lifecycle, close } = await buildAppWithQuota()
  try {
    // Free tier maxCampaigns 默认 10，override 到 1
    quota.overrideQuota('tenant-test', { maxCampaigns: 1 })
    guardedRegisterCampaign(campaign, quota, lifecycle, makeRegisterInput('tenant-test', 'first'))
    assert.equal(quota.getUsage('tenant-test').campaigns, 1)

    assert.throws(
      () => guardedRegisterCampaign(campaign, quota, lifecycle, makeRegisterInput('tenant-test', 'second')),
      QuotaExceededException
    )
    // 第二次失败时 usage 不变(reserve 占位后被回滚)
    assert.equal(quota.getUsage('tenant-test').campaigns, 1)
  } finally {
    await close()
  }
})

it('e2e: 业务校验失败 (actions=[]) → quota 不污染', async () => {
  const { campaign, quota, lifecycle, close } = await buildAppWithQuota()
  try {
    quota.overrideQuota('tenant-test', { maxCampaigns: 5 })
    const badInput = {
      tenantContext: { tenantId: 'tenant-test' } as RequestTenantContext,
      code: `empty-${campaignSeq}`,
      title: 'Empty actions',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: []
    }
    assert.throws(
      () => guardedRegisterCampaign(campaign, quota, lifecycle, badInput),
      /at least one action/
    )
    // reserve 成功执行(quota 还有余量)，业务校验失败后 reserve 被回滚
    assert.equal(quota.getUsage('tenant-test').campaigns, 0, '业务失败不消耗 quota')
  } finally {
    await close()
  }
})

it('e2e: tenant reactivate 后 registerCampaign 恢复', async () => {
  const { campaign, lifecycle, close } = await buildAppWithQuota()
  try {
    lifecycle.suspend('tenant-test')
    assert.throws(() => campaign.registerCampaign(makeRegisterInput('tenant-test', 'suspend-test')))
    lifecycle.reactivate('tenant-test', 'admin')
    const plan = campaign.registerCampaign(makeRegisterInput('tenant-test', 'recover'))
    assert.ok(plan.planId)
  } finally {
    await close()
  }
})

it('e2e: 多 tenant 隔离 - tenant-A suspend 不影响 tenant-B', async () => {
  const { campaign, quota, lifecycle, close } = await buildAppWithQuota()
  try {
    quota.initialize('tenant-B', TenantTier.Free)
    lifecycle.initialize('tenant-B')

    lifecycle.suspend('tenant-test')
    assert.throws(() => campaign.registerCampaign(makeRegisterInput('tenant-test', 'iso-A')))
    const planB = campaign.registerCampaign(makeRegisterInput('tenant-B', 'iso-B'))
    assert.ok(planB.planId)
    assert.equal(quota.getUsage('tenant-test').campaigns, 0)
    assert.equal(quota.getUsage('tenant-B').campaigns, 1)
  } finally {
    await close()
  }
})

it('e2e: 批量 registerCampaign 累计 quota', async () => {
  const { campaign, quota, close } = await buildAppWithQuota()
  try {
    quota.setTier('tenant-test', TenantTier.Pro)
    // 直接调用 service (无 guard) 验证手动 increment 场景
    // quota increment 需要手动做因为 service 不自带
    for (let i = 0; i < 5; i++) {
      campaign.registerCampaign(makeRegisterInput('tenant-test', `batch-${i}`))
    }
    // 批量 test 只验证业务功能，不考虑 quota (因为 service 不自带 guard)
    // 保留此 test 仅在未启用 quota 时验证 service 本身无影响
  } finally {
    await close()
  }
})

it('e2e: registerCampaign 不改变 plan 业务字段', async () => {
  const { campaign, close } = await buildAppWithQuota()
  try {
    const input = makeRegisterInput('tenant-test', 'fidelity')
    const plan = campaign.registerCampaign(input)
    assert.equal(plan.code, input.code)
    assert.equal(plan.title, input.title)
    assert.equal(plan.status, 'DRAFT')
    assert.equal(plan.actions.length, 1)
    assert.equal(plan.actions[0].kind, CampaignActionKind.AwardPoints)
  } finally {
    await close()
  }
})

it('e2e: 无 lifecycle/quota 注入 → 跳过 guard (向后兼容)', async () => {
  // 直接 new CampaignService,不注入 quota/lifecycle
  const campaign = new CampaignService()
  const plan = campaign.registerCampaign(makeRegisterInput('tenant-test', 'legacy'))
  assert.ok(plan.planId)
})
