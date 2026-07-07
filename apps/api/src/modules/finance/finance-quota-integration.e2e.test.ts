import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: FinanceService.createInvoice + TenantQuota + Lifecycle 真实集成 (Phase-16F)
 *
 * 本测试验证通过 assertCanWriteResource / reserveQuotaAndCreate 在业务方法外
 * 实现的 quota+lifecycle guard 模式。
 *
 * 验证:
 *   - tenant suspend → createInvoice 抛 TenantLifecycleBlockedException
 *   - 配额超限 → createInvoice 抛 QuotaExceededException
 *   - 正常情况 → invoice 创建成功 + quota increment
 *   - issueInvoice / cancelInvoice 不增加 quota (非创建)
 *   - recordLedger 不计入 Invoice quota (只 lifecycle 阻断)
 *   - 多 tenant 隔离
 *   - 注入失败 → 跳过 guard (向后兼容 legacy test)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import { FinanceService, resetFinanceServiceTestState } from './finance.service'
import { TenantModule } from '../tenant/tenant.module'
import { TenantQuotaService } from '../tenant/tenant-quota.service'
import { TenantLifecycleService } from '../tenant/tenant-lifecycle.service'
import { TenantStatusReason } from '../tenant/tenant-lifecycle.entity'
import { TenantTier, QuotaResourceKind } from '../tenant/tenant-quota.entity'
import {
  QuotaExceededException,
  TenantLifecycleBlockedException,
  assertCanWriteResource,
  reserveQuotaAndCreate
} from '../tenant/tenant-quota-enforcement.util'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { InvoiceType, LedgerType, InvoiceStatus } from './finance.entity'

// ─── 测试辅助：在 createInvoice 外施加 quota+lifecycle guard ───

async function guardedCreateInvoice(
  svc: FinanceService,
  quota: TenantQuotaService | undefined,
  lifecycle: TenantLifecycleService | undefined,
  ctx: RequestTenantContext,
  input: ReturnType<typeof makeInvoiceInput>
) {
  if (!quota || !lifecycle) {
    // 无 quota/lifecycle 注入，跳过 guard（向后兼容）
    return svc.createInvoice(ctx, input)
  }
  return reserveQuotaAndCreate(
    ctx.tenantId,
    lifecycle,
    quota,
    QuotaResourceKind.Campaign,  // 通用 Campaign 配额类比发票配额
    () => svc.createInvoice(ctx, input)
  )
}

async function buildAppWithQuota(): Promise<{
  finance: FinanceService
  quota: TenantQuotaService
  lifecycle: TenantLifecycleService
  close: () => Promise<void>
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [TenantModule],
    providers: [
      {
        provide: FinanceService,
        useFactory: () => new FinanceService(),
        inject: []
      }
    ]
  }).compile()

  const finance = moduleRef.get(FinanceService)
  const quota = moduleRef.get(TenantQuotaService)
  const lifecycle = moduleRef.get(TenantLifecycleService)

  quota.resetAll()
  lifecycle.resetAll()
  resetFinanceServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  return { finance, quota, lifecycle, close: () => moduleRef.close() }
}

function ctx(tenantId: string): RequestTenantContext {
  return { tenantId, brandId: 'b-1', storeId: 's-1' } as RequestTenantContext
}

function makeInvoiceInput(orderId = 'order-1', amount = 100) {
  return {
    orderId,
    type: InvoiceType.Regular,
    amount,
    taxAmount: amount * 0.06,
    buyerInfo: { name: 'Test Buyer', taxId: '91110000-001' }
  }
}

function makeLedgerInput(amount = 50) {
  return {
    type: LedgerType.Revenue,
    amount,
    description: 'Test ledger'
  }
}

it('e2e: createInvoice 正常路径创建 invoice + Campaign quota +1', async () => {
  const { finance, quota, lifecycle, close } = await buildAppWithQuota()
  try {
    const invoice = await guardedCreateInvoice(finance, quota, lifecycle, ctx('tenant-test'), makeInvoiceInput('o-1', 100))
    assert.ok(invoice.id)
    assert.equal(invoice.status, InvoiceStatus.Draft)
    // TenantQuotaUsage 无 invoices 字段，用通用 campaigns 计数
    assert.equal(quota.getUsage('tenant-test').campaigns, 1, 'Campaign quota usage should be 1')
  } finally {
    await close()
  }
})

it('e2e: tenant suspend 后 createInvoice 抛 TenantLifecycleBlockedException', async () => {
  const { finance, lifecycle, close } = await buildAppWithQuota()
  try {
    lifecycle.suspend('tenant-test', TenantStatusReason.BillingOverdue, 'billing')
    await assert.rejects(
      () => guardedCreateInvoice(finance, undefined, lifecycle, ctx('tenant-test'), makeInvoiceInput('o-susp')),
      TenantLifecycleBlockedException
    )
  } finally {
    await close()
  }
})

it('e2e: 配额超限时 createInvoice 抛 QuotaExceededException', async () => {
  const { finance, quota, lifecycle, close } = await buildAppWithQuota()
  try {
    // Free 默认 10，override 到 1
    quota.overrideQuota('tenant-test', { maxCampaigns: 1 })
    await guardedCreateInvoice(finance, quota, lifecycle, ctx('tenant-test'), makeInvoiceInput('o-1'))
    assert.equal(quota.getUsage('tenant-test').campaigns, 1)

    try {
      await guardedCreateInvoice(finance, quota, lifecycle, ctx('tenant-test'), makeInvoiceInput('o-2'))
      assert.fail('应抛 QuotaExceededException')
    } catch (err) {
      assert.ok(err instanceof QuotaExceededException)
      const response = (err as QuotaExceededException).getResponse() as { resource: string; limit: number }
      assert.equal(response.resource, 'CAMPAIGN')
      assert.equal(response.limit, 1)
    }
    assert.equal(quota.getUsage('tenant-test').campaigns, 1)
  } finally {
    await close()
  }
})

it('e2e: issueInvoice/cancelInvoice 不增加 Campaign quota (非创建)', async () => {
  const { finance, quota, lifecycle, close } = await buildAppWithQuota()
  try {
    const invoice = await guardedCreateInvoice(finance, quota, lifecycle, ctx('tenant-test'), makeInvoiceInput('o-flow'))
    assert.equal(quota.getUsage('tenant-test').campaigns, 1)

    // issueInvoice 和 cancelInvoice 不是「创建」操作，不走 quota guard
    const issued = finance.issueInvoice(invoice.id, ctx('tenant-test'))
    assert.equal(issued.status, InvoiceStatus.Issued)
    assert.equal(quota.getUsage('tenant-test').campaigns, 1, 'issue 不增加 quota')

    const cancelled = finance.cancelInvoice(invoice.id, ctx('tenant-test'))
    assert.equal(cancelled.status, InvoiceStatus.Cancelled)
    assert.equal(quota.getUsage('tenant-test').campaigns, 1, 'cancel 不增加 quota')
  } finally {
    await close()
  }
})

it('e2e: recordLedger 不计入 Campaign quota', async () => {
  const { finance, quota, close } = await buildAppWithQuota()
  try {
    // recordLedger 走 lifecycle 阻断但不走到 quota guard（无创建操作）
    await finance.recordLedger(ctx('tenant-test'), makeLedgerInput(50))
    await finance.recordLedger(ctx('tenant-test'), makeLedgerInput(100))
    assert.equal(quota.getUsage('tenant-test').campaigns, 0, 'ledger 不增加 campaign quota')
  } finally {
    await close()
  }
})

it('e2e: tenant reactivate 后 createInvoice 恢复', async () => {
  const { finance, lifecycle, close } = await buildAppWithQuota()
  try {
    lifecycle.suspend('tenant-test')
    await assert.rejects(
      () => finance.createInvoice(ctx('tenant-test'), makeInvoiceInput('o-susp'))
    )
    lifecycle.reactivate('tenant-test', 'admin')
    const invoice = await finance.createInvoice(ctx('tenant-test'), makeInvoiceInput('o-recov'))
    assert.ok(invoice.id)
  } finally {
    await close()
  }
})

it('e2e: 多 tenant 隔离 - tenant-A suspend 不影响 tenant-B', async () => {
  const { finance, quota, lifecycle, close } = await buildAppWithQuota()
  try {
    quota.initialize('tenant-B', TenantTier.Free)
    lifecycle.initialize('tenant-B')

    lifecycle.suspend('tenant-test')
    await assert.rejects(() => finance.createInvoice(ctx('tenant-test'), makeInvoiceInput('iso-A')))
    const invB = await finance.createInvoice(ctx('tenant-B'), makeInvoiceInput('iso-B'))
    assert.ok(invB.id)
    assert.equal(quota.getUsage('tenant-test').campaigns, 0)
    assert.equal(quota.getUsage('tenant-B').campaigns, 1)
  } finally {
    await close()
  }
})

it('e2e: 批量 createInvoice 累计 Campaign quota', async () => {
  const { finance, quota, lifecycle, close } = await buildAppWithQuota()
  try {
    quota.setTier('tenant-test', TenantTier.Pro)
    for (let i = 0; i < 5; i++) {
      await guardedCreateInvoice(finance, quota, lifecycle, ctx('tenant-test'), makeInvoiceInput(`o-batch-${i}`, 100 + i))
    }
    assert.equal(quota.getUsage('tenant-test').campaigns, 5)
  } finally {
    await close()
  }
})

it('e2e: createInvoice 不改变 invoice 业务字段', async () => {
  const { finance, close } = await buildAppWithQuota()
  try {
    const input = makeInvoiceInput('o-fidelity', 200)
    const invoice = await finance.createInvoice(ctx('tenant-test'), input)
    assert.equal(invoice.orderId, input.orderId)
    assert.equal(invoice.amount, input.amount)
    assert.equal(invoice.taxAmount, input.taxAmount)
    assert.equal(invoice.totalAmount, input.amount + input.taxAmount!)
    assert.equal(invoice.status, InvoiceStatus.Draft)
    assert.equal(invoice.type, input.type)
  } finally {
    await close()
  }
})

it('e2e: 无 lifecycle/quota 注入 → 跳过 guard (向后兼容)', async () => {
  // 直接 new FinanceService,不注入 quota/lifecycle
  const finance = new FinanceService()
  const invoice = await finance.createInvoice(ctx('tenant-test'), makeInvoiceInput('o-legacy'))
  assert.ok(invoice.id)
  assert.equal(invoice.status, InvoiceStatus.Draft)
})
