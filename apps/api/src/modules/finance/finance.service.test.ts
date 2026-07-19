import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [finance] [C] 合约 + service 测试
 *
 * 覆盖 FinanceService 的核心 API:
 *   - Ledger 记账 (revenue/expense/refund/adjustment) + balance 计算
 *   - Account 账户管理 (active/frozen/closed)
 *   - Settlement 结算 (Pending → Confirmed/Disputed)
 *   - Invoice 发票 (Draft → Issued/Cancelled)
 *   - Revenue Summary / Daily Revenue 汇总
 *   - 跨租户隔离
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { FinanceService, resetFinanceServiceTestState } from './finance.service'
import {
  LedgerType,
  AccountType,
  AccountStatus,
  SettlementStatus,
  InvoiceStatus,
  InvoiceType
} from './finance.entity'

function makeService(): FinanceService {
  resetFinanceServiceTestState()
  return new FinanceService()
}

const CTX_A = { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn' }
const CTX_B = { tenantId: 'tenant-B', brandId: 'brand-B', storeId: 'store-B', marketCode: 'cn' }

// ─── Ledger 合约 ───────────────────────────────────────

describe('[finance] 合约: Ledger 记账', () => {
  it('Revenue 类型增加 balance', async () => {
    const svc = makeService()
    const l = await svc.recordLedger(CTX_A, {
      type: LedgerType.Revenue,
      amount: 1000,
      description: '订单收入'
    })
    assert.equal(l.balance, 1000)
  })

  it('Expense 类型减少 balance', async () => {
    const svc = makeService()
    await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 1000, description: 'init' })
    const l = await svc.recordLedger(CTX_A, {
      type: LedgerType.Expense,
      amount: 300,
      description: '水电费'
    })
    assert.equal(l.balance, 700)
  })

  it('Refund 类型减少 balance', async () => {
    const svc = makeService()
    await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 1000, description: 'init' })
    const l = await svc.recordLedger(CTX_A, {
      type: LedgerType.Refund,
      amount: 200,
      description: '退款'
    })
    assert.equal(l.balance, 800)
  })

  it('Adjustment 类型增加 balance', async () => {
    const svc = makeService()
    await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 1000, description: 'init' })
    const l = await svc.recordLedger(CTX_A, {
      type: LedgerType.Adjustment,
      amount: 50,
      description: '调账'
    })
    assert.equal(l.balance, 1050)
  })

  it('recordTransactionRevenue 联动写 Ledger', async () => {
    const svc = makeService()
    const l = await svc.recordTransactionRevenue(CTX_A, {
      orderId: 'O-1',
      transactionId: 'T-1',
      amount: 500,
      description: '订单 O-1 收款'
    })
    assert.equal(l.type, LedgerType.Revenue)
    assert.equal(l.orderId, 'O-1')
    assert.equal(l.category, 'transaction')
    assert.equal(l.balance, 500)
  })

  it('recordTransactionRefund 联动写 Ledger', async () => {
    const svc = makeService()
    await svc.recordTransactionRevenue(CTX_A, { orderId: 'O', transactionId: 'T', amount: 500, description: 'x' })
    const l = await svc.recordTransactionRefund(CTX_A, {
      orderId: 'O',
      transactionId: 'T-2',
      amount: 100,
      description: '部分退款'
    })
    assert.equal(l.type, LedgerType.Refund)
    assert.equal(l.balance, 400)
  })

  it('listLedgers 按 type 过滤', async () => {
    const svc = makeService()
    await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 100, description: "test" })
    await svc.recordLedger(CTX_A, { type: LedgerType.Expense, amount: 30, description: "test" })
    const revs = svc.listLedgers(CTX_A, { type: LedgerType.Revenue })
    assert.equal(revs.length, 1)
    assert.equal(revs[0].type, LedgerType.Revenue)
  })

  it('listLedgers limit 限制', async () => {
    const svc = makeService()
    for (let i = 0; i < 5; i++) {
      await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 10, description: "test" })
    }
    assert.equal(svc.listLedgers(CTX_A, { limit: 3 }).length, 3)
  })

  it('listLedgers 按日期范围', async () => {
    const svc = makeService()
    await svc.recordLedger(CTX_A, {
      type: LedgerType.Revenue,
      amount: 100,
      recordedAt: '2026-06-01T00:00:00Z',
      description: 'a'
    })
    await svc.recordLedger(CTX_A, {
      type: LedgerType.Revenue,
      amount: 200,
      recordedAt: '2026-06-15T00:00:00Z',
      description: 'b'
    })
    const result = svc.listLedgers(CTX_A, {
      recordedAfter: '2026-06-10T00:00:00Z',
      recordedBefore: '2026-06-30T00:00:00Z'
    })
    assert.equal(result.length, 1)
    assert.equal(result[0].amount, 200)
  })

  it('getLedger 不存在 → throw', async () => {
    const svc = makeService()
    assert.throws(() => svc.getLedger('non-existent', CTX_A))
  })
})

// ─── Account 合约 ──────────────────────────────────────

describe('[finance] 合约: Account 账户', () => {
  it('createAccount → getAccount', async () => {
    const svc = makeService()
    const a = await svc.createAccount(CTX_A, {
      name: '现金账户',
      type: AccountType.Cash,
      initialBalance: 1000
    })
    assert.equal(a.balance, 1000)
    assert.equal(a.status, AccountStatus.Active)

    const fetched = svc.getAccount(a.id, CTX_A)
    assert.equal(fetched.id, a.id)
  })

  it('freezeAccount Active → Frozen', async () => {
    const svc = makeService()
    const a = await svc.createAccount(CTX_A, { name: 'X', type: AccountType.Cash })
    const frozen = svc.freezeAccount(a.id, CTX_A)
    assert.equal(frozen.status, AccountStatus.Frozen)
  })

  it('freezeAccount 非 Active 状态报错', async () => {
    const svc = makeService()
    const a = await svc.createAccount(CTX_A, { name: 'X', type: AccountType.Cash })
    svc.freezeAccount(a.id, CTX_A)
    assert.throws(() => svc.freezeAccount(a.id, CTX_A))
  })

  it('closeAccount → Closed, 重复 close 报错', async () => {
    const svc = makeService()
    const a = await svc.createAccount(CTX_A, { name: 'X', type: AccountType.Cash })
    const closed = svc.closeAccount(a.id, CTX_A)
    assert.equal(closed.status, AccountStatus.Closed)
    assert.throws(() => svc.closeAccount(a.id, CTX_A))
  })

  it('getAccountBalance 摘要字段', async () => {
    const svc = makeService()
    const a = await svc.createAccount(CTX_A, {
      name: '现金',
      type: AccountType.Cash,
      initialBalance: 500
    })
    const bal = svc.getAccountBalance(a.id, CTX_A)
    assert.equal(bal.balance, 500)
    assert.equal(bal.status, AccountStatus.Active)
    assert.equal(bal.name, '现金')
  })
})

// ─── Settlement 合约 ───────────────────────────────────

describe('[finance] 合约: Settlement 结算', () => {
  it('createSettlement 自动计算 revenue/expense', async () => {
    const svc = makeService()
    await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 1000, description: "test" })
    await svc.recordLedger(CTX_A, { type: LedgerType.Expense, amount: 300, description: "test" })

    const s = await svc.createSettlement(CTX_A, {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2030-01-01T00:00:00Z'
    })
    assert.equal(s.totalRevenue, 1000)
    assert.equal(s.totalExpense, 300)
    assert.equal(s.netProfit, 700)
    assert.equal(s.settlementStatus, SettlementStatus.Pending)
  })

  it('confirmSettlement Pending → Confirmed', async () => {
    const svc = makeService()
    const s = await svc.createSettlement(CTX_A, {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2030-01-01T00:00:00Z'
    })
    const c = svc.confirmSettlement(s.id, CTX_A)
    assert.equal(c.settlementStatus, SettlementStatus.Confirmed)
  })

  it('disputeSettlement Pending → Disputed', async () => {
    const svc = makeService()
    const s = await svc.createSettlement(CTX_A, {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2030-01-01T00:00:00Z'
    })
    const d = svc.disputeSettlement(s.id, CTX_A)
    assert.equal(d.settlementStatus, SettlementStatus.Disputed)
  })

  it('Confirmed 状态不能再次 confirm', async () => {
    const svc = makeService()
    const s = await svc.createSettlement(CTX_A, {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2030-01-01T00:00:00Z'
    })
    svc.confirmSettlement(s.id, CTX_A)
    assert.throws(() => svc.confirmSettlement(s.id, CTX_A))
  })

  it('getSettlementDetail 包含 ledgers', async () => {
    const svc = makeService()
    await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 100, description: "test" })
    const s = await svc.createSettlement(CTX_A, {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2030-01-01T00:00:00Z'
    })
    const detail = svc.getSettlementDetail(s.id, CTX_A)
    assert.ok(detail.settlement)
    assert.ok(Array.isArray(detail.ledgers))
    assert.ok(detail.ledgers.length >= 1)
  })
})

// ─── Invoice 合约 ──────────────────────────────────────

describe('[finance] 合约: Invoice 发票', () => {
  it('createInvoice Draft + taxAmount 自动加总', async () => {
    const svc = makeService()
    const inv = await svc.createInvoice(CTX_A, {
      amount: 1000,
      taxAmount: 130,
      type: InvoiceType.Vat,
      orderId: 'O-1',
      buyerInfo: { name: '客户A', taxNo: '123' }
    })
    assert.equal(inv.totalAmount, 1130)
    assert.equal(inv.status, InvoiceStatus.Draft)
    assert.match(inv.invoiceNo, /^INV-/)
  })

  it('issueInvoice Draft → Issued', async () => {
    const svc = makeService()
    const inv = await svc.createInvoice(CTX_A, {
      amount: 100, type: InvoiceType.Regular, orderId: 'O-1'
    })
    const issued = svc.issueInvoice(inv.id, CTX_A)
    assert.equal(issued.status, InvoiceStatus.Issued)
    assert.ok(issued.issuedAt)
  })

  it('issueInvoice 非 Draft 报错', async () => {
    const svc = makeService()
    const inv = await svc.createInvoice(CTX_A, {
      amount: 100, type: InvoiceType.Regular, orderId: 'O-1'
    })
    svc.issueInvoice(inv.id, CTX_A)
    assert.throws(() => svc.issueInvoice(inv.id, CTX_A))
  })

  it('cancelInvoice → Cancelled', async () => {
    const svc = makeService()
    const inv = await svc.createInvoice(CTX_A, {
      amount: 100, type: InvoiceType.Regular, orderId: 'O-1'
    })
    const c = svc.cancelInvoice(inv.id, CTX_A)
    assert.equal(c.status, InvoiceStatus.Cancelled)
  })

  it('cancelInvoice 已取消报错', async () => {
    const svc = makeService()
    const inv = await svc.createInvoice(CTX_A, {
      amount: 100, type: InvoiceType.Regular, orderId: 'O-1'
    })
    svc.cancelInvoice(inv.id, CTX_A)
    assert.throws(() => svc.cancelInvoice(inv.id, CTX_A))
  })
})

// ─── Revenue Summary 合约 ──────────────────────────────

describe('[finance] 合约: 营收汇总', () => {
  it('getRevenueSummary 聚合 revenue/expense/refund', async () => {
    const svc = makeService()
    await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 1000, description: "test" })
    await svc.recordLedger(CTX_A, { type: LedgerType.Expense, amount: 300, description: "test" })
    await svc.recordLedger(CTX_A, { type: LedgerType.Refund, amount: 50, description: "test" })

    const summary = svc.getRevenueSummary(CTX_A, {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2030-01-01T00:00:00Z'
    })
    assert.equal(summary.totalRevenue, 1000)
    assert.equal(summary.totalExpense, 300)
    assert.equal(summary.totalRefund, 50)
    assert.equal(summary.netRevenue, 650)
    assert.equal(summary.transactionCount, 3)
  })

  it('getDailyRevenue 按日期过滤', async () => {
    const svc = makeService()
    await svc.recordLedger(CTX_A, {
      type: LedgerType.Revenue,
      amount: 500,
      recordedAt: '2026-06-15T10:00:00Z',
      description: 'a'
    })
    await svc.recordLedger(CTX_A, {
      type: LedgerType.Revenue,
      amount: 300,
      recordedAt: '2026-06-16T10:00:00Z',
      description: 'b'
    })
    const daily = svc.getDailyRevenue(CTX_A, { date: '2026-06-15' })
    assert.equal(daily.revenue, 500)
    assert.equal(daily.transactionCount, 1)
  })
})

// ─── 跨租户隔离合约 ────────────────────────────────────

describe('[finance] 合约: 跨租户隔离', () => {
  it('tenant-B 看不到 tenant-A 的 ledger', async () => {
    const svc = makeService()
    await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 100, description: "test" })
    const all = svc.listLedgers(CTX_B)
    assert.equal(all.length, 0)
  })

  it('tenant-B 不能 getLedger tenant-A 的 entry', async () => {
    const svc = makeService()
    const l = await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 100, description: "test" })
    assert.throws(() => svc.getLedger(l.id, CTX_B))
  })

  it('tenant-B 不能 getAccount tenant-A 的账户', async () => {
    const svc = makeService()
    const a = await svc.createAccount(CTX_A, { name: 'X', type: AccountType.Cash })
    assert.throws(() => svc.getAccount(a.id, CTX_B))
  })

  it('tenant-B 不能 confirmSettlement tenant-A 的结算', async () => {
    const svc = makeService()
    const s = await svc.createSettlement(CTX_A, {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2030-01-01T00:00:00Z'
    })
    assert.throws(() => svc.confirmSettlement(s.id, CTX_B))
  })

  // === 边界: 金额/日期极限 ===

  it('recordLedger 零金额', async () => {
    const svc = makeService()
    const id = await svc.recordLedger(CTX_A, {
      type: LedgerType.Revenue,
      amount: 0,
      description: 'zero-amount-test',
      category: 'other'
    })
    assert.ok(id)
  })

  it('recordLedger 大金额不溢出', async () => {
    const svc = makeService()
    const id = await svc.recordLedger(CTX_A, {
      type: LedgerType.Revenue,
      amount: 999999999.99,
      description: 'large-amount-test',
      category: 'other'
    })
    assert.ok(id)
  })

  it('recordLedger 未来日期', async () => {
    const svc = makeService()
    const futureDate = new Date('2099-12-31T00:00:00Z').toISOString()
    const id = await svc.recordLedger(CTX_A, {
      type: LedgerType.Revenue,
      amount: 100,
      description: 'future-date-test',
      category: 'other'
    })
    assert.ok(id)
  })

  it('getLedger 不存在的ID抛出异常', async () => {
    const svc = makeService()
    assert.throws(() => svc.getLedger('non-existent-id', CTX_A))
  })

  it('getRevenueSummary 空期间返回零值', async () => {
    const svc = makeService()
    const summary = svc.getRevenueSummary(CTX_A, { startDate: '2020-01-01', endDate: '2020-01-02' })
    assert.ok(summary)
    assert.equal(summary.totalRevenue, 0)
    assert.equal(summary.totalExpense, 0)
    assert.equal(summary.totalRefund, 0)
  })

  it('createSettlement 起始>结束报错', async () => {
    const svc = makeService()
    assert.throws(() => svc.createSettlement(CTX_A, {
      startDate: '2030-01-01T00:00:00Z',
      endDate: '2020-01-01T00:00:00Z'
    }))
  })
})
