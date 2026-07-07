import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [finance] [A] controller spec 补全
 *
 * 覆盖 FinanceController 的完整路由:
 *   - Ledger：POST/GET ledgers, GET ledgers/:id
 *   - Account：POST/GET accounts, GET balance, freeze, close
 *   - Settlement：POST/GET settlements, GET detail, confirm, dispute
 *   - Invoice：POST/GET invoices, issue, cancel
 *   - Revenue：GET revenue/summary, revenue/daily
 *   - Transaction：POST transactions/revenue, transactions/refund
 *   - 路由元数据 + 边界异常
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { FinanceController } from './finance.controller'
import {
  LedgerType,
  AccountType,
  AccountStatus,
  SettlementStatus,
  InvoiceType,
  InvoiceStatus,
  type Ledger,
  type Account,
  type Settlement,
  type Invoice,
  type RevenueSummary,
  type DailyRevenue
} from './finance.entity'
import {
  CreateLedgerDto,
  LedgerQueryDto,
  CreateAccountDto,
  CreateSettlementDto,
  SettlementQueryDto,
  CreateInvoiceDto,
  InvoiceQueryDto,
  RevenueSummaryQueryDto,
  DailyRevenueQueryDto
} from './finance.dto'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── 辅助工厂 ──

function tenantCtx(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return {
    tenantId: 'tenant-default',
    brandId: 'brand-default',
    storeId: 'store-default',
    marketCode: 'cn',
    ...overrides
  }
}

interface MockFinanceService {
  recordLedger: (ctx: RequestTenantContext, dto: CreateLedgerDto) => Promise<Ledger>
  listLedgers: (ctx: RequestTenantContext, query?: LedgerQueryDto) => Ledger[]
  getLedger: (id: string, ctx: RequestTenantContext) => Ledger
  createAccount: (ctx: RequestTenantContext, dto: CreateAccountDto) => Promise<Account>
  listAccounts: (ctx: RequestTenantContext, storeId?: string) => Account[]
  getAccount: (id: string, ctx: RequestTenantContext) => Account
  getAccountBalance: (id: string, ctx: RequestTenantContext) => Pick<Account, 'id' | 'name' | 'balance' | 'status'>
  freezeAccount: (id: string, ctx: RequestTenantContext) => Account
  closeAccount: (id: string, ctx: RequestTenantContext) => Account
  createSettlement: (ctx: RequestTenantContext, dto: CreateSettlementDto) => Promise<Settlement>
  listSettlements: (ctx: RequestTenantContext, query?: SettlementQueryDto) => Settlement[]
  getSettlement: (id: string, ctx: RequestTenantContext) => Settlement
  getSettlementDetail: (id: string, ctx: RequestTenantContext) => { settlement: Settlement; ledgers: Ledger[] }
  confirmSettlement: (id: string, ctx: RequestTenantContext) => Settlement
  disputeSettlement: (id: string, ctx: RequestTenantContext) => Settlement
  createInvoice: (ctx: RequestTenantContext, dto: CreateInvoiceDto) => Promise<Invoice>
  listInvoices: (ctx: RequestTenantContext, query?: InvoiceQueryDto) => Invoice[]
  getInvoice: (id: string, ctx: RequestTenantContext) => Invoice
  issueInvoice: (id: string, ctx: RequestTenantContext) => Invoice
  cancelInvoice: (id: string, ctx: RequestTenantContext) => Invoice
  getRevenueSummary: (ctx: RequestTenantContext, query?: RevenueSummaryQueryDto) => RevenueSummary
  getDailyRevenue: (ctx: RequestTenantContext, query: DailyRevenueQueryDto) => DailyRevenue
  recordTransactionRevenue: (ctx: RequestTenantContext, params: { orderId: string; transactionId: string; amount: number; description: string; category?: string }) => Promise<Ledger>
  recordTransactionRefund: (ctx: RequestTenantContext, params: { orderId: string; transactionId: string; amount: number; description: string }) => Promise<Ledger>
}

function makeMockService(): MockFinanceService {
  return {
    recordLedger: async (_ctx, dto) => ({
      id: 'ledger-mock-1',
      tenantId: _ctx.tenantId,
      type: dto.type,
      amount: dto.amount,
      balance: dto.type === LedgerType.Revenue ? dto.amount : -dto.amount,
      description: dto.description,
      orderId: dto.orderId,
      transactionId: dto.transactionId,
      category: dto.category,
      recordedAt: dto.recordedAt ?? new Date().toISOString(),
      createdAt: new Date().toISOString()
    }),
    listLedgers: () => [],
    getLedger: (id, ctx) => ({
      id,
      tenantId: ctx.tenantId,
      type: LedgerType.Revenue,
      amount: 100,
      balance: 100,
      description: 'mock',
      createdAt: new Date().toISOString(),
      recordedAt: new Date().toISOString()
    }),
    createAccount: async (_ctx, dto) => ({
      id: 'acct-mock-1',
      tenantId: _ctx.tenantId,
      storeId: dto.storeId ?? _ctx.storeId,
      name: dto.name,
      type: dto.type,
      balance: dto.initialBalance ?? 0,
      status: AccountStatus.Active,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }),
    listAccounts: () => [],
    getAccount: (id, _ctx) => ({
      id,
      tenantId: _ctx.tenantId,
      name: 'Mock Account',
      type: AccountType.Cash,
      balance: 5000,
      status: AccountStatus.Active,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }),
    getAccountBalance: (id, _ctx) => ({ id, name: 'Mock Account', balance: 5000, status: AccountStatus.Active }),
    freezeAccount: (id, _ctx) => ({
      id,
      tenantId: _ctx.tenantId,
      name: 'Frozen',
      type: AccountType.Bank,
      balance: 1000,
      status: AccountStatus.Frozen,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }),
    closeAccount: (id, _ctx) => ({
      id,
      tenantId: _ctx.tenantId,
      name: 'Closed',
      type: AccountType.Bank,
      balance: 0,
      status: AccountStatus.Closed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }),
    createSettlement: async (_ctx, dto) => ({
      id: 'stl-mock-1',
      tenantId: _ctx.tenantId,
      storeId: dto.storeId ?? _ctx.storeId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalRevenue: dto.totalRevenue ?? 1000,
      totalExpense: dto.totalExpense ?? 300,
      netProfit: (dto.totalRevenue ?? 1000) - (dto.totalExpense ?? 300),
      settlementStatus: SettlementStatus.Pending,
      createdAt: new Date().toISOString()
    }),
    listSettlements: () => [],
    getSettlement: (id, _ctx) => ({
      id,
      tenantId: _ctx.tenantId,
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
      totalRevenue: 5000,
      totalExpense: 2000,
      netProfit: 3000,
      settlementStatus: SettlementStatus.Confirmed,
      settledAt: '2026-07-01T00:00:00.000Z',
      createdAt: new Date().toISOString()
    }),
    getSettlementDetail: (id, _ctx) => ({
      settlement: {
        id,
        tenantId: _ctx.tenantId,
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-30T23:59:59.999Z',
        totalRevenue: 5000,
        totalExpense: 2000,
        netProfit: 3000,
        settlementStatus: SettlementStatus.Pending,
        createdAt: new Date().toISOString()
      },
      ledgers: []
    }),
    confirmSettlement: (id, _ctx) => ({
      id,
      tenantId: _ctx.tenantId,
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
      totalRevenue: 5000,
      totalExpense: 2000,
      netProfit: 3000,
      settlementStatus: SettlementStatus.Confirmed,
      settledAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }),
    disputeSettlement: (id, _ctx) => ({
      id,
      tenantId: _ctx.tenantId,
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
      totalRevenue: 5000,
      totalExpense: 2000,
      netProfit: 3000,
      settlementStatus: SettlementStatus.Disputed,
      createdAt: new Date().toISOString()
    }),
    createInvoice: async (_ctx, dto) => ({
      id: 'inv-mock-1',
      tenantId: _ctx.tenantId,
      storeId: _ctx.storeId,
      orderId: dto.orderId,
      invoiceNo: `INV-${Date.now()}-0001`,
      amount: dto.amount,
      taxAmount: dto.taxAmount ?? 0,
      totalAmount: dto.amount + (dto.taxAmount ?? 0),
      type: dto.type,
      status: InvoiceStatus.Draft,
      buyerInfo: dto.buyerInfo,
      createdAt: new Date().toISOString()
    }),
    listInvoices: () => [],
    getInvoice: (id, _ctx) => ({
      id,
      tenantId: _ctx.tenantId,
      storeId: _ctx.storeId,
      orderId: 'order-1',
      invoiceNo: 'INV-001',
      amount: 100,
      taxAmount: 13,
      totalAmount: 113,
      type: InvoiceType.Vat,
      status: InvoiceStatus.Draft,
      buyerInfo: { name: 'Test' },
      createdAt: new Date().toISOString()
    }),
    issueInvoice: (id, _ctx) => ({
      id,
      tenantId: _ctx.tenantId,
      storeId: _ctx.storeId,
      invoiceNo: 'INV-001',
      amount: 100,
      taxAmount: 13,
      totalAmount: 113,
      type: InvoiceType.Vat,
      status: InvoiceStatus.Issued,
      issuedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }),
    cancelInvoice: (id, _ctx) => ({
      id,
      tenantId: _ctx.tenantId,
      storeId: _ctx.storeId,
      invoiceNo: 'INV-001',
      amount: 100,
      taxAmount: 13,
      totalAmount: 113,
      type: InvoiceType.Vat,
      status: InvoiceStatus.Cancelled,
      createdAt: new Date().toISOString()
    }),
    getRevenueSummary: (_ctx, query) => ({
      storeId: query?.storeId ?? _ctx.storeId,
      totalRevenue: 10000,
      totalExpense: 3000,
      totalRefund: 500,
      netRevenue: 6500,
      transactionCount: 42,
      periodStart: query?.startDate ?? '2026-06-01T00:00:00.000Z',
      periodEnd: query?.endDate ?? '2026-06-30T23:59:59.999Z'
    }),
    getDailyRevenue: (_ctx, query) => ({
      date: query.date,
      storeId: _ctx.storeId,
      revenue: 1500,
      expense: 300,
      refund: 100,
      netRevenue: 1100,
      transactionCount: 15
    }),
    recordTransactionRevenue: async (_ctx, params) => ({
      id: 'ledger-rev-1',
      tenantId: _ctx.tenantId,
      type: LedgerType.Revenue,
      amount: params.amount,
      balance: params.amount,
      description: params.description,
      orderId: params.orderId,
      transactionId: params.transactionId,
      category: params.category ?? 'transaction',
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }),
    recordTransactionRefund: async (_ctx, params) => ({
      id: 'ledger-ref-1',
      tenantId: _ctx.tenantId,
      type: LedgerType.Refund,
      amount: params.amount,
      balance: -params.amount,
      description: params.description,
      orderId: params.orderId,
      transactionId: params.transactionId,
      category: 'refund',
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    })
  }
}

function makeController(serviceOverrides?: Partial<MockFinanceService>): FinanceController {
  const base = makeMockService()
  return new FinanceController({ ...base, ...serviceOverrides } as never)
}

const CTX = tenantCtx()

// ── 路由元数据检查 ──

describe('路由元数据验证', () => {
  it('controller path metadata is set to "finance"', () => {
    const path = Reflect.getMetadata('path', FinanceController)
    assert.equal(path, 'finance')
  })
})

// ── GET /finance/ledgers ──

describe('[finance] POST /finance/ledgers — 记账', () => {
  it('记录收入：类型为 Revenue, balance 正确', async () => {
    const ctrl = makeController()
    const dto = Object.assign(new CreateLedgerDto(), {
      type: LedgerType.Revenue,
      amount: 1000,
      description: '台球桌 3 小时'
    })
    const result = await ctrl.recordLedger(CTX, dto)
    assert.equal(result.type, LedgerType.Revenue)
    assert.equal(result.amount, 1000)
    assert.equal(result.description, '台球桌 3 小时')
  })

  it('记录支出：Expense 类型', async () => {
    const ctrl = makeController()
    const dto = Object.assign(new CreateLedgerDto(), {
      type: LedgerType.Expense,
      amount: 200,
      description: '清洁用品采购'
    })
    const result = await ctrl.recordLedger(CTX, dto)
    assert.equal(result.type, LedgerType.Expense)
    assert.equal(result.amount, 200)
  })

  it('记录退款：Refund 类型带 orderId', async () => {
    const ctrl = makeController()
    const dto = Object.assign(new CreateLedgerDto(), {
      type: LedgerType.Refund,
      amount: 50,
      description: '客户退费',
      orderId: 'order-123'
    })
    const result = await ctrl.recordLedger(CTX, dto)
    assert.equal(result.type, LedgerType.Refund)
    assert.equal(result.orderId, 'order-123')
  })

  it('记录调账：Adjustment 类型带 category', async () => {
    const ctrl = makeController()
    const dto = Object.assign(new CreateLedgerDto(), {
      type: LedgerType.Adjustment,
      amount: 150,
      description: '月末调账',
      category: 'adjustment'
    })
    const result = await ctrl.recordLedger(CTX, dto)
    assert.equal(result.type, LedgerType.Adjustment)
    assert.equal(result.category, 'adjustment')
  })
})

// ── GET /finance/ledgers ──

describe('[finance] GET /finance/ledgers — 列表查询', () => {
  it('列出所有记账记录（默认空列表）', async () => {
    const ctrl = makeController()
    const result = ctrl.listLedgers(CTX)
    assert.ok(Array.isArray(result))
  })

  it('按类型过滤', async () => {
    let capturedType: LedgerType | undefined
    const ctrl = makeController({
      listLedgers: (_ctx, query) => {
        capturedType = query?.type
        return []
      }
    })
    ctrl.listLedgers(CTX, { type: LedgerType.Revenue })
    assert.equal(capturedType, LedgerType.Revenue)
  })
})

// ── GET /finance/ledgers/:ledgerId ──

describe('[finance] GET /finance/ledgers/:ledgerId — 单条查询', () => {
  it('按 ID 获取记账记录', () => {
    const ctrl = makeController()
    const result = ctrl.getLedger('ledger-1', CTX)
    assert.equal(result.id, 'ledger-1')
    assert.equal(result.type, LedgerType.Revenue)
  })

  it('不存在的 ledgerId 抛出异常', () => {
    const ctrl = makeController({
      getLedger: () => { throw new Error('Ledger not-found not found') }
    })
    assert.throws(() => ctrl.getLedger('not-found', CTX), /Ledger not-found not found/)
  })
})

// ── Account ──

describe('[finance] POST /finance/accounts — 创建账户', () => {
  it('创建现金账户', async () => {
    const ctrl = makeController()
    const dto = Object.assign(new CreateAccountDto(), {
      name: '门店现金',
      type: AccountType.Cash
    })
    const result = await ctrl.createAccount(CTX, dto)
    assert.equal(result.name, '门店现金')
    assert.equal(result.type, AccountType.Cash)
    assert.equal(result.status, AccountStatus.Active)
  })

  it('创建带初始余额的银行账户', async () => {
    const ctrl = makeController()
    const dto = Object.assign(new CreateAccountDto(), {
      name: '银行账户',
      type: AccountType.Bank,
      initialBalance: 10000
    })
    const result = await ctrl.createAccount(CTX, dto)
    assert.equal(result.balance, 10000)
  })

  it('创建带 storeId 账户', async () => {
    const ctrl = makeController()
    const dto = Object.assign(new CreateAccountDto(), {
      name: '门店专属',
      type: AccountType.Wechat,
      storeId: 'store-2'
    })
    const result = await ctrl.createAccount(CTX, dto)
    assert.equal(result.storeId, 'store-2')
  })
})

describe('[finance] GET /finance/accounts — 账户列表', () => {
  it('无店铺过滤时返回全部', () => {
    const ctrl = makeController()
    const result = ctrl.listAccounts(CTX)
    assert.ok(Array.isArray(result))
  })

  it('带 storeId 过滤', () => {
    let capturedStoreId: string | undefined
    const ctrl = makeController({
      listAccounts: (_ctx, storeId) => {
        capturedStoreId = storeId
        return []
      }
    })
    ctrl.listAccounts(CTX, 'store-1')
    assert.equal(capturedStoreId, 'store-1')
  })
})

describe('[finance] GET /finance/accounts/:accountId — 账户详情', () => {
  it('获取账户详情', () => {
    const ctrl = makeController()
    const result = ctrl.getAccount('acct-1', CTX)
    assert.equal(result.id, 'acct-1')
    assert.equal(result.name, 'Mock Account')
  })

  it('不存在的账户抛出异常', () => {
    const ctrl = makeController({
      getAccount: () => { throw new Error('Account bad not found') }
    })
    assert.throws(() => ctrl.getAccount('bad', CTX), /not found/)
  })
})

describe('[finance] GET /finance/accounts/:accountId/balance — 余额查询', () => {
  it('返回摘要字段', () => {
    const ctrl = makeController()
    const result = ctrl.getAccountBalance('acct-1', CTX)
    assert.equal(result.id, 'acct-1')
    assert.ok('balance' in result)
    assert.ok('status' in result)
  })
})

describe('[finance] POST /finance/accounts/:accountId/freeze — 冻结', () => {
  it('成功冻结变为 Frozen', () => {
    const ctrl = makeController()
    const result = ctrl.freezeAccount('acct-1', CTX)
    assert.equal(result.status, AccountStatus.Frozen)
  })
})

describe('[finance] POST /finance/accounts/:accountId/close — 关闭', () => {
  it('成功关闭变为 Closed', () => {
    const ctrl = makeController()
    const result = ctrl.closeAccount('acct-1', CTX)
    assert.equal(result.status, AccountStatus.Closed)
  })
})

// ── Settlement ──

describe('[finance] POST /finance/settlements — 创建结算', () => {
  it('创建结算（自动计算 revenue/expense）', async () => {
    const ctrl = makeController()
    const dto = Object.assign(new CreateSettlementDto(), {
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z'
    })
    const result = await ctrl.createSettlement(CTX, dto)
    assert.equal(result.startDate, '2026-06-01T00:00:00.000Z')
    assert.equal(result.settlementStatus, SettlementStatus.Pending)
  })

  it('创建带手动值的结算', async () => {
    const ctrl = makeController()
    const dto = Object.assign(new CreateSettlementDto(), {
      storeId: 'store-sz',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
      totalRevenue: 5000,
      totalExpense: 2000
    })
    const result = await ctrl.createSettlement(CTX, dto)
    assert.equal(result.storeId, 'store-sz')
    assert.equal(result.totalRevenue, 5000)
    assert.equal(result.totalExpense, 2000)
    assert.equal(result.netProfit, 3000)
  })
})

describe('[finance] GET /finance/settlements — 结算列表', () => {
  it('按状态过滤结算列表', () => {
    let capturedStatus: SettlementStatus | undefined
    const ctrl = makeController({
      listSettlements: (_ctx, query) => {
        capturedStatus = query?.settlementStatus
        return []
      }
    })
    ctrl.listSettlements(CTX, { settlementStatus: SettlementStatus.Pending })
    assert.equal(capturedStatus, SettlementStatus.Pending)
  })
})

describe('[finance] GET /finance/settlements/:settlementId — 结算详情', () => {
  it('获取结算', () => {
    const ctrl = makeController()
    const result = ctrl.getSettlement('stl-1', CTX)
    assert.equal(result.id, 'stl-1')
    assert.equal(result.settlementStatus, SettlementStatus.Confirmed)
  })

  it('不存在的结算抛出异常', () => {
    const ctrl = makeController({
      getSettlement: () => { throw new Error('Settlement bad not found') }
    })
    assert.throws(() => ctrl.getSettlement('bad', CTX), /not found/)
  })
})

describe('[finance] GET /finance/settlements/:settlementId/detail — 结算明细', () => {
  it('返回 settlement + ledgers', () => {
    const ctrl = makeController()
    const result = ctrl.getSettlementDetail('stl-1', CTX)
    assert.ok(result.settlement)
    assert.ok(Array.isArray(result.ledgers))
  })
})

describe('[finance] POST /finance/settlements/:settlementId/confirm — 确认结算', () => {
  it('Pending → Confirmed', () => {
    const ctrl = makeController()
    const result = ctrl.confirmSettlement('stl-1', CTX)
    assert.equal(result.settlementStatus, SettlementStatus.Confirmed)
  })
})

describe('[finance] POST /finance/settlements/:settlementId/dispute — 争议结算', () => {
  it('Pending → Disputed', () => {
    const ctrl = makeController()
    const result = ctrl.disputeSettlement('stl-1', CTX)
    assert.equal(result.settlementStatus, SettlementStatus.Disputed)
  })
})

// ── Invoice ──

describe('[finance] POST /finance/invoices — 创建发票', () => {
  it('创建普通发票 Draft', async () => {
    const ctrl = makeController()
    const dto = Object.assign(new CreateInvoiceDto(), {
      type: InvoiceType.Regular,
      amount: 500
    })
    const result = await ctrl.createInvoice(CTX, dto)
    assert.equal(result.type, InvoiceType.Regular)
    assert.equal(result.status, InvoiceStatus.Draft)
  })

  it('创建增值税发票含税', async () => {
    const ctrl = makeController()
    const dto = Object.assign(new CreateInvoiceDto(), {
      type: InvoiceType.Vat,
      amount: 1000,
      taxAmount: 130,
      orderId: 'order-inv-1',
      buyerInfo: { name: '客户名' }
    })
    const result = await ctrl.createInvoice(CTX, dto)
    assert.equal(result.totalAmount, 1130)
    assert.equal(result.orderId, 'order-inv-1')
  })
})

describe('[finance] GET /finance/invoices — 发票列表', () => {
  it('按状态过滤', () => {
    let capturedStatus: InvoiceStatus | undefined
    const ctrl = makeController({
      listInvoices: (_ctx, query) => {
        capturedStatus = query?.status
        return []
      }
    })
    ctrl.listInvoices(CTX, { status: InvoiceStatus.Issued })
    assert.equal(capturedStatus, InvoiceStatus.Issued)
  })
})

describe('[finance] GET /finance/invoices/:invoiceId — 单张发票', () => {
  it('获取发票', () => {
    const ctrl = makeController()
    const result = ctrl.getInvoice('inv-1', CTX)
    assert.equal(result.id, 'inv-1')
  })
})

describe('[finance] POST /finance/invoices/:invoiceId/issue — 开票', () => {
  it('Draft → Issued', () => {
    const ctrl = makeController()
    const result = ctrl.issueInvoice('inv-1', CTX)
    assert.equal(result.status, InvoiceStatus.Issued)
    assert.ok(result.issuedAt)
  })
})

describe('[finance] POST /finance/invoices/:invoiceId/cancel — 作废发票', () => {
  it('→ Cancelled', () => {
    const ctrl = makeController()
    const result = ctrl.cancelInvoice('inv-1', CTX)
    assert.equal(result.status, InvoiceStatus.Cancelled)
  })
})

// ── Revenue ──

describe('[finance] GET /finance/revenue/summary — 营收汇总', () => {
  it('默认返回 30 天汇总', () => {
    const ctrl = makeController()
    const result = ctrl.getRevenueSummary(CTX)
    assert.equal(result.totalRevenue, 10000)
    assert.equal(result.netRevenue, 6500)
    assert.equal(result.transactionCount, 42)
  })

  it('按门店 + 时间范围过滤', () => {
    let capturedQuery: RevenueSummaryQueryDto | undefined
    const ctrl = makeController({
      getRevenueSummary: (_ctx, query) => {
        capturedQuery = query
        return { storeId: '', totalRevenue: 0, totalExpense: 0, totalRefund: 0, netRevenue: 0, transactionCount: 0, periodStart: '', periodEnd: '' }
      }
    })
    ctrl.getRevenueSummary(CTX, { storeId: 'store-bj', startDate: '2026-01-01T00:00:00.000Z' })
    assert.equal(capturedQuery?.storeId, 'store-bj')
  })
})

describe('[finance] GET /finance/revenue/daily — 日营收', () => {
  it('按日期查询日营收', () => {
    const ctrl = makeController()
    const dto = Object.assign(new DailyRevenueQueryDto(), { date: '2026-06-15' })
    const result = ctrl.getDailyRevenue(CTX, dto)
    assert.equal(result.date, '2026-06-15')
    assert.equal(result.revenue, 1500)
    assert.equal(result.netRevenue, 1100)
  })
})

// ── Transaction Integration ──

describe('[finance] POST /finance/transactions/revenue — 交易收入', () => {
  it('记录交易收入', async () => {
    const ctrl = makeController()
    const result = await ctrl.recordTransactionRevenue(CTX, {
      orderId: 'O-1',
      transactionId: 'T-1',
      amount: 500,
      description: '订单 O-1 收款'
    })
    assert.equal(result.type, LedgerType.Revenue)
    assert.equal(result.amount, 500)
    assert.equal(result.orderId, 'O-1')
  })
})

describe('[finance] POST /finance/transactions/refund — 交易退款', () => {
  it('记录交易退款', async () => {
    const ctrl = makeController()
    const result = await ctrl.recordTransactionRefund(CTX, {
      orderId: 'O-1',
      transactionId: 'T-2',
      amount: 100,
      description: '部分退款'
    })
    assert.equal(result.type, LedgerType.Refund)
    assert.equal(result.amount, 100)
  })
})

// ── 异常与边界场景 ──

describe('异常与边界场景', () => {
  it('service 抛出异常向上传播到 controller', async () => {
    const ctrl = makeController({
      recordLedger: async () => { throw new Error('Database timeout') }
    })
    const dto = Object.assign(new CreateLedgerDto(), {
      type: LedgerType.Revenue,
      amount: 100,
      description: 'test'
    })
    await assert.rejects(ctrl.recordLedger(CTX, dto), /Database timeout/)
  })

  it('空 tenant 传递时仍能执行', async () => {
    const emptyCtx = {} as RequestTenantContext
    const ctrl = makeController()
    const result = ctrl.getRevenueSummary(emptyCtx)
    assert.ok(typeof result.totalRevenue === 'number')
  })

  it('listLedgers 不带查询参数', () => {
    const ctrl = makeController()
    const result = ctrl.listLedgers(CTX, {} as LedgerQueryDto)
    assert.ok(Array.isArray(result))
  })

  it('listInvoices 不带查询参数', () => {
    const ctrl = makeController()
    const result = ctrl.listInvoices(CTX, {} as InvoiceQueryDto)
    assert.ok(Array.isArray(result))
  })

  it('listAccounts 不带 storeId', () => {
    const ctrl = makeController()
    const result = ctrl.listAccounts(CTX)
    assert.ok(Array.isArray(result))
  })
})
