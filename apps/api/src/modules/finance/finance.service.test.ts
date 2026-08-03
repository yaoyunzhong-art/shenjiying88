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
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
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

  it('listLedgersResolved 在无 Prisma 时回退到当前内存账本', async () => {
    const svc = makeService()
    await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 120, description: 'real-ledger' })
    await svc.recordLedger(CTX_A, { type: LedgerType.Expense, amount: 20, description: 'cost-ledger' })

    const resolved = await svc.listLedgersResolved(CTX_A, { type: LedgerType.Revenue })

    assert.equal(resolved.length, 1)
    assert.equal(resolved[0].type, LedgerType.Revenue)
    assert.equal(resolved[0].amount, 120)
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

  it('listAccountsResolved 在无 Prisma 时回退到当前内存账户', async () => {
    const svc = makeService()
    await svc.createAccount(CTX_A, {
      name: '微信账户',
      type: AccountType.Wechat,
      storeId: 'store-A'
    })
    await svc.createAccount(CTX_B, {
      name: '其他租户账户',
      type: AccountType.Cash,
      storeId: 'store-B'
    })

    const accounts = await svc.listAccountsResolved(CTX_A, 'store-A')

    assert.equal(accounts.length, 1)
    assert.equal(accounts[0].tenantId, CTX_A.tenantId)
    assert.equal(accounts[0].name, '微信账户')
  })

  it('getAccountBalanceResolved 在无 Prisma 时沿用当前账户摘要口径', async () => {
    const svc = makeService()
    const account = await svc.createAccount(CTX_A, {
      name: '银行账户',
      type: AccountType.Bank,
      initialBalance: 880
    })

    const balance = await svc.getAccountBalanceResolved(account.id, CTX_A)

    assert.equal(balance.id, account.id)
    assert.equal(balance.balance, 880)
    assert.equal(balance.status, AccountStatus.Active)
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

  it('listSettlementsResolved 在无 Prisma 时回退到当前内存结算', async () => {
    const svc = makeService()
    await svc.createSettlement(CTX_A, {
      storeId: 'store-A',
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2030-01-01T00:00:00Z'
    })
    await svc.createSettlement(CTX_B, {
      storeId: 'store-B',
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2030-01-01T00:00:00Z'
    })

    const settlements = await svc.listSettlementsResolved(CTX_A, { storeId: 'store-A' })

    assert.equal(settlements.length, 1)
    assert.equal(settlements[0].tenantId, CTX_A.tenantId)
    assert.equal(settlements[0].storeId, 'store-A')
  })

  it('confirmSettlementResolved 在无 Prisma 时沿用当前状态流转', async () => {
    const svc = makeService()
    const settlement = await svc.createSettlement(CTX_A, {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2030-01-01T00:00:00Z'
    })

    const confirmed = await svc.confirmSettlementResolved(settlement.id, CTX_A)

    assert.equal(confirmed.settlementStatus, SettlementStatus.Confirmed)
    assert.ok(confirmed.settledAt)
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

  it('listInvoicesResolved 在无 Prisma 时回退到当前内存发票', async () => {
    const svc = makeService()
    await svc.createInvoice(CTX_A, {
      amount: 100,
      type: InvoiceType.Regular,
      orderId: 'O-1'
    })
    await svc.createInvoice(CTX_B, {
      amount: 200,
      type: InvoiceType.Vat,
      orderId: 'O-2'
    })

    const invoices = await svc.listInvoicesResolved(CTX_A, {})

    assert.equal(invoices.length, 1)
    assert.equal(invoices[0].tenantId, CTX_A.tenantId)
  })

  it('getInvoiceResolved 在无 Prisma 时沿用当前查询口径', async () => {
    const svc = makeService()
    const inv = await svc.createInvoice(CTX_A, {
      amount: 880,
      taxAmount: 114.4,
      type: InvoiceType.Vat,
      orderId: 'O-3'
    })

    const invoice = await svc.getInvoiceResolved(inv.id, CTX_A)

    assert.equal(invoice.id, inv.id)
    assert.equal(invoice.totalAmount, 994.4)
    assert.equal(invoice.status, InvoiceStatus.Draft)
  })

  it('issueInvoiceResolved 在无 Prisma 时沿用当前状态流转', async () => {
    const svc = makeService()
    const inv = await svc.createInvoice(CTX_A, {
      amount: 100,
      type: InvoiceType.Regular,
      orderId: 'O-4'
    })

    const issued = await svc.issueInvoiceResolved(inv.id, CTX_A)

    assert.equal(issued.status, InvoiceStatus.Issued)
    assert.ok(issued.issuedAt)
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

  it('getRevenueSummaryResolved 在无 Prisma 时沿用当前 ledger 汇总口径', async () => {
    const svc = makeService()
    await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 900, description: 'summary-revenue' })
    await svc.recordLedger(CTX_A, { type: LedgerType.Refund, amount: 100, description: 'summary-refund' })

    const summary = await svc.getRevenueSummaryResolved(CTX_A, {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2030-01-01T00:00:00Z'
    })

    assert.equal(summary.totalRevenue, 900)
    assert.equal(summary.totalRefund, 100)
    assert.equal(summary.netRevenue, 800)
    assert.equal(summary.transactionCount, 2)
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
    await assert.rejects(
      () => svc.createSettlement(CTX_A, {
        startDate: '2030-01-01T00:00:00Z',
        endDate: '2020-01-01T00:00:00Z'
      }),
      /start date must be before/
    )
  })
})

// ─── Invoice 查询合约 ────────────────────────────────────

describe('[finance] 合约: Invoice 查询 (listInvoices / getInvoice)', () => {
  it('getInvoice 返回创建的发票', async () => {
    const svc = makeService()
    const inv = await svc.createInvoice(CTX_A, {
      amount: 666,
      type: InvoiceType.Regular,
      orderId: 'O-1'
    })
    const fetched = svc.getInvoice(inv.id, CTX_A)
    assert.equal(fetched.id, inv.id)
    assert.equal(fetched.amount, 666)
  })

  it('getInvoice 不存在抛出异常', async () => {
    const svc = makeService()
    assert.throws(() => svc.getInvoice('non-existent-invoice', CTX_A))
  })

  it('getInvoice 跨租户隔离', async () => {
    const svc = makeService()
    const inv = await svc.createInvoice(CTX_A, {
      amount: 100,
      type: InvoiceType.Regular,
      orderId: 'O-1'
    })
    assert.throws(() => svc.getInvoice(inv.id, CTX_B))
  })

  it('listInvoices 列出所有发票', async () => {
    const svc = makeService()
    await svc.createInvoice(CTX_A, { amount: 100, type: InvoiceType.Regular, orderId: 'O-1' })
    await svc.createInvoice(CTX_A, { amount: 200, type: InvoiceType.Vat, orderId: 'O-2' })
    const list = svc.listInvoices(CTX_A)
    assert.equal(list.length, 2)
  })

  it('listInvoices 按 type 过滤', async () => {
    const svc = makeService()
    let inv = await svc.createInvoice(CTX_A, { amount: 100, type: InvoiceType.Regular, orderId: 'O-1' })
    svc.issueInvoice(inv.id, CTX_A)
    await svc.createInvoice(CTX_A, { amount: 200, type: InvoiceType.Vat, orderId: 'O-2' })
    const list = svc.listInvoices(CTX_A, { type: InvoiceType.Vat })
    assert.equal(list.length, 1)
    assert.equal(list[0].type, InvoiceType.Vat)
  })

  it('listInvoices 按 status 过滤', async () => {
    const svc = makeService()
    let inv = await svc.createInvoice(CTX_A, { amount: 100, type: InvoiceType.Regular, orderId: 'O-1' })
    svc.issueInvoice(inv.id, CTX_A)
    await svc.createInvoice(CTX_A, { amount: 200, type: InvoiceType.Vat, orderId: 'O-2' })
    const list = svc.listInvoices(CTX_A, { status: InvoiceStatus.Issued })
    assert.equal(list.length, 1)
    assert.equal(list[0].status, InvoiceStatus.Issued)
  })

  it('listInvoices 按 orderId 过滤', async () => {
    const svc = makeService()
    await svc.createInvoice(CTX_A, { amount: 100, type: InvoiceType.Regular, orderId: 'O-1' })
    await svc.createInvoice(CTX_A, { amount: 200, type: InvoiceType.Vat, orderId: 'O-2' })
    const list = svc.listInvoices(CTX_A, { orderId: 'O-1' })
    assert.equal(list.length, 1)
  })

  it('listInvoices limit 限制', async () => {
    const svc = makeService()
    for (let i = 0; i < 5; i++) {
      await svc.createInvoice(CTX_A, {
        amount: 100 + i,
        type: InvoiceType.Regular,
        orderId: `O-${i}`
      })
    }
    const list = svc.listInvoices(CTX_A, { limit: 3 })
    assert.equal(list.length, 3)
  })

  it('listInvoices 跨租户隔离', async () => {
    const svc = makeService()
    await svc.createInvoice(CTX_A, { amount: 100, type: InvoiceType.Regular, orderId: 'O-1' })
    const list = svc.listInvoices(CTX_B)
    assert.equal(list.length, 0)
  })

  it('listInvoices 按 storeId 过滤', async () => {
    const svc = makeService()
    // 通过 CTX_A 创建发票 (storeId = store-A)，模拟不同 storeId
    await svc.createInvoice(CTX_A, { amount: 100, type: InvoiceType.Regular, orderId: 'O-1' })
    // CTX_A.storeId is 'store-A', so filtering by different storeId yields 0
    const list = svc.listInvoices(CTX_A, { storeId: 'other-store' })
    assert.equal(list.length, 0)
  })
})

// ───deleteLedger 合约 ────────────────────────────────────

describe('[finance] 合约: deleteLedger', () => {
  it('deleteLedger 删除成功', async () => {
    const svc = makeService()
    const l = await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 100, description: 'del-test' })
    const result = svc.deleteLedger(l.id, CTX_A)
    assert.equal(result.success, true)
    assert.throws(() => svc.getLedger(l.id, CTX_A))
  })

  it('deleteLedger 不存在的 ID 抛出异常', async () => {
    const svc = makeService()
    assert.throws(() => svc.deleteLedger('non-existent', CTX_A))
  })

  it('deleteLedger 跨租户隔离', async () => {
    const svc = makeService()
    const l = await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 100, description: 'del-test' })
    assert.throws(() => svc.deleteLedger(l.id, CTX_B))
  })
})

// ─── Resolved 方法补全合约 ──────────────────────────────

describe('[finance] 合约: *Resolved 方法补全 (无 Prisma 回退)', () => {
  it('getLedgerResolved 无 Prisma 时回退到 getLedger', async () => {
    const svc = makeService()
    const l = await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 500, description: 'resolved-test' })
    const resolved = await svc.getLedgerResolved(l.id, CTX_A)
    assert.equal(resolved.id, l.id)
    assert.equal(resolved.amount, 500)
  })

  it('getLedgerResolved 不存在的 ID 抛出异常', async () => {
    const svc = makeService()
    await assert.rejects(
      () => svc.getLedgerResolved('non-existent', CTX_A),
      /not found/
    )
  })

  it('getAccountResolved 无 Prisma 时回退到 getAccount', async () => {
    const svc = makeService()
    const a = await svc.createAccount(CTX_A, { name: 'Resolved Account', type: AccountType.Cash })
    const resolved = await svc.getAccountResolved(a.id, CTX_A)
    assert.equal(resolved.id, a.id)
    assert.equal(resolved.name, 'Resolved Account')
  })

  it('getAccountResolved 不存在的 ID 抛出异常', async () => {
    const svc = makeService()
    await assert.rejects(
      () => svc.getAccountResolved('non-existent', CTX_A),
      /not found/
    )
  })

  it('getSettlementResolved 无 Prisma 时回退到 getSettlement', async () => {
    const svc = makeService()
    const s = await svc.createSettlement(CTX_A, {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2030-01-01T00:00:00Z'
    })
    const resolved = await svc.getSettlementResolved(s.id, CTX_A)
    assert.equal(resolved.id, s.id)
    assert.equal(resolved.settlementStatus, SettlementStatus.Pending)
  })

  it('getSettlementResolved 不存在的 ID 抛出异常', async () => {
    const svc = makeService()
    await assert.rejects(
      () => svc.getSettlementResolved('non-existent', CTX_A),
      /not found/
    )
  })

  it('freezeAccountResolved 无 Prisma 时回退到 freezeAccount', async () => {
    const svc = makeService()
    const a = await svc.createAccount(CTX_A, { name: 'Frozen Resolved', type: AccountType.Cash })
    const frozen = await svc.freezeAccountResolved(a.id, CTX_A)
    assert.equal(frozen.status, AccountStatus.Frozen)
  })

  it('closeAccountResolved 无 Prisma 时回退到 closeAccount', async () => {
    const svc = makeService()
    const a = await svc.createAccount(CTX_A, { name: 'Closed Resolved', type: AccountType.Cash })
    const closed = await svc.closeAccountResolved(a.id, CTX_A)
    assert.equal(closed.status, AccountStatus.Closed)
  })

  it('disputeSettlementResolved 无 Prisma 时回退到 disputeSettlement', async () => {
    const svc = makeService()
    const s = await svc.createSettlement(CTX_A, {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2030-01-01T00:00:00Z'
    })
    const disputed = await svc.disputeSettlementResolved(s.id, CTX_A)
    assert.equal(disputed.settlementStatus, SettlementStatus.Disputed)
  })

  it('getAccountBalanceResolved 无 Prisma 时回退到 getAccountBalance 口径', async () => {
    const svc = makeService()
    const a = await svc.createAccount(CTX_A, { name: 'Bal', type: AccountType.Cash, initialBalance: 999 })
    const bal = await svc.getAccountBalanceResolved(a.id, CTX_A)
    assert.equal(bal.balance, 999)
    assert.equal(bal.name, 'Bal')
  })

  it('getSettlementDetailResolved 无 Prisma 时回退', async () => {
    const svc = makeService()
    await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 100, description: 'detail-test' })
    const s = await svc.createSettlement(CTX_A, {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2030-01-01T00:00:00Z'
    })
    const detail = await svc.getSettlementDetailResolved(s.id, CTX_A)
    assert.ok(detail.settlement)
    assert.ok(Array.isArray(detail.ledgers))
  })
})

// ═══════════════════════════════════════════════════════
// 异常类型护栏 (Service 层标准异常收口)
// ═══════════════════════════════════════════════════════

describe('[finance] 异常类型护栏', () => {
  it('getLedger 不存在的 ID → NotFoundException', () => {
    const svc = makeService()
    try {
      svc.getLedger('non-existent', CTX_A)
      assert.fail('should throw')
    } catch (e) {
      assert.ok(e instanceof NotFoundException)
    }
  })

  it('getAccount 不存在的 ID → NotFoundException', () => {
    const svc = makeService()
    try {
      svc.getAccount('non-existent', CTX_A)
      assert.fail('should throw')
    } catch (e) {
      assert.ok(e instanceof NotFoundException)
    }
  })

  it('getSettlement 不存在的 ID → NotFoundException', () => {
    const svc = makeService()
    try {
      svc.getSettlement('non-existent', CTX_A)
      assert.fail('should throw')
    } catch (e) {
      assert.ok(e instanceof NotFoundException)
    }
  })

  it('getInvoice 不存在的 ID → NotFoundException', () => {
    const svc = makeService()
    try {
      svc.getInvoice('non-existent', CTX_A)
      assert.fail('should throw')
    } catch (e) {
      assert.ok(e instanceof NotFoundException)
    }
  })

  it('freezeAccount 非 Active → ConflictException', async () => {
    const svc = makeService()
    const a = await svc.createAccount(CTX_A, { name: 'X', type: AccountType.Cash })
    svc.freezeAccount(a.id, CTX_A)
    try {
      svc.freezeAccount(a.id, CTX_A)
      assert.fail('should throw')
    } catch (e) {
      assert.ok(e instanceof ConflictException)
    }
  })

  it('closeAccount 已关闭 → ConflictException', async () => {
    const svc = makeService()
    const a = await svc.createAccount(CTX_A, { name: 'X', type: AccountType.Cash })
    svc.closeAccount(a.id, CTX_A)
    try {
      svc.closeAccount(a.id, CTX_A)
      assert.fail('should throw')
    } catch (e) {
      assert.ok(e instanceof ConflictException)
    }
  })

  it('confirmSettlement 已确认 → ConflictException', async () => {
    const svc = makeService()
    const s = await svc.createSettlement(CTX_A, {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2030-01-01T00:00:00Z'
    })
    svc.confirmSettlement(s.id, CTX_A)
    try {
      svc.confirmSettlement(s.id, CTX_A)
      assert.fail('should throw')
    } catch (e) {
      assert.ok(e instanceof ConflictException)
    }
  })

  it('issueInvoice 非 Draft → ConflictException', async () => {
    const svc = makeService()
    const inv = await svc.createInvoice(CTX_A, { amount: 100, type: InvoiceType.Regular, orderId: 'O-1' })
    svc.issueInvoice(inv.id, CTX_A)
    try {
      svc.issueInvoice(inv.id, CTX_A)
      assert.fail('should throw')
    } catch (e) {
      assert.ok(e instanceof ConflictException)
    }
  })

  it('cancelInvoice 已取消 → ConflictException', async () => {
    const svc = makeService()
    const inv = await svc.createInvoice(CTX_A, { amount: 100, type: InvoiceType.Regular, orderId: 'O-1' })
    svc.cancelInvoice(inv.id, CTX_A)
    try {
      svc.cancelInvoice(inv.id, CTX_A)
      assert.fail('should throw')
    } catch (e) {
      assert.ok(e instanceof ConflictException)
    }
  })

  it('createSettlement 起始>结束 → BadRequestException', async () => {
    const svc = makeService()
    try {
      await svc.createSettlement(CTX_A, {
        startDate: '2030-01-01T00:00:00Z',
        endDate: '2020-01-01T00:00:00Z'
      })
      assert.fail('should throw')
    } catch (e) {
      assert.ok(e instanceof BadRequestException)
    }
  })

  // ── Resolved methods ──

  it('getLedgerResolved 不存在的 ID → NotFoundException', async () => {
    const svc = makeService()
    try {
      await svc.getLedgerResolved('non-existent', CTX_A)
      assert.fail('should throw')
    } catch (e) {
      assert.ok(e instanceof NotFoundException)
    }
  })

  it('freezeAccountResolved 非 Active → ConflictException', async () => {
    const svc = makeService()
    const a = await svc.createAccount(CTX_A, { name: 'X', type: AccountType.Cash })
    await svc.freezeAccountResolved(a.id, CTX_A)
    try {
      await svc.freezeAccountResolved(a.id, CTX_A)
      assert.fail('should throw')
    } catch (e) {
      assert.ok(e instanceof ConflictException)
    }
  })

  it('confirmSettlementResolved 已确认 → ConflictException', async () => {
    const svc = makeService()
    const s = await svc.createSettlement(CTX_A, {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2030-01-01T00:00:00Z'
    })
    await svc.confirmSettlementResolved(s.id, CTX_A)
    try {
      await svc.confirmSettlementResolved(s.id, CTX_A)
      assert.fail('should throw')
    } catch (e) {
      assert.ok(e instanceof ConflictException)
    }
  })
})
