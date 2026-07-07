import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { LedgerType, AccountType, SettlementStatus, InvoiceType, InvoiceStatus } from './finance.entity'
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

// ── CreateLedgerDto ──
describe('CreateLedgerDto', () => {
  it('标准记账 DTO：必填 type + amount + description', () => {
    const dto = Object.assign(new CreateLedgerDto(), {
      type: LedgerType.Revenue,
      amount: 100,
      description: '台球桌费'
    })

    assert.equal(dto.type, LedgerType.Revenue)
    assert.equal(dto.amount, 100)
    assert.equal(dto.description, '台球桌费')
  })

  it('支出记账 DTO', () => {
    const dto = Object.assign(new CreateLedgerDto(), {
      type: LedgerType.Expense,
      amount: 50,
      description: '清洁用品采购'
    })

    assert.equal(dto.type, LedgerType.Expense)
    assert.equal(dto.amount, 50)
  })

  it('退款记账 DTO', () => {
    const dto = Object.assign(new CreateLedgerDto(), {
      type: LedgerType.Refund,
      amount: 30,
      description: '客户退费'
    })

    assert.equal(dto.type, LedgerType.Refund)
  })

  it('调账记账 DTO', () => {
    const dto = Object.assign(new CreateLedgerDto(), {
      type: LedgerType.Adjustment,
      amount: 200,
      description: '月末调账',
      category: 'adjustment'
    })

    assert.equal(dto.type, LedgerType.Adjustment)
    assert.equal(dto.category, 'adjustment')
  })

  it('带可选字段 orderId + transactionId', () => {
    const dto = Object.assign(new CreateLedgerDto(), {
      type: LedgerType.Revenue,
      amount: 88,
      description: '订单收入',
      orderId: 'order-123',
      transactionId: 'txn-456'
    })

    assert.equal(dto.orderId, 'order-123')
    assert.equal(dto.transactionId, 'txn-456')
  })

  it('带 recordedAt 自定义记账日期', () => {
    const dto = Object.assign(new CreateLedgerDto(), {
      type: LedgerType.Revenue,
      amount: 200,
      description: '历史补录',
      recordedAt: '2026-06-01T10:00:00.000Z'
    })

    assert.equal(dto.recordedAt, '2026-06-01T10:00:00.000Z')
  })
})

// ── LedgerQueryDto ──
describe('LedgerQueryDto', () => {
  it('空查询 DTO', () => {
    const dto = Object.assign(new LedgerQueryDto(), {})
    assert.equal(dto.type, undefined)
    assert.equal(dto.limit, undefined)
  })

  it('按类型过滤', () => {
    const dto = Object.assign(new LedgerQueryDto(), {
      type: LedgerType.Revenue
    })
    assert.equal(dto.type, LedgerType.Revenue)
  })

  it('按门店过滤', () => {
    const dto = Object.assign(new LedgerQueryDto(), {
      storeId: 'store-1'
    })
    assert.equal(dto.storeId, 'store-1')
  })

  it('按时间范围 + 分页', () => {
    const dto = Object.assign(new LedgerQueryDto(), {
      recordedAfter: '2026-06-01T00:00:00.000Z',
      recordedBefore: '2026-06-30T23:59:59.999Z',
      limit: 20
    })

    assert.equal(dto.recordedAfter, '2026-06-01T00:00:00.000Z')
    assert.equal(dto.recordedBefore, '2026-06-30T23:59:59.999Z')
    assert.equal(dto.limit, 20)
  })
})

// ── CreateAccountDto ──
describe('CreateAccountDto', () => {
  it('标准创建账户 DTO', () => {
    const dto = Object.assign(new CreateAccountDto(), {
      name: '微信支付账户',
      type: AccountType.Wechat
    })

    assert.equal(dto.name, '微信支付账户')
    assert.equal(dto.type, AccountType.Wechat)
  })

  it('带初始余额', () => {
    const dto = Object.assign(new CreateAccountDto(), {
      name: '银行账户',
      type: AccountType.Bank,
      initialBalance: 10000
    })

    assert.equal(dto.initialBalance, 10000)
  })

  it('带门店 ID', () => {
    const dto = Object.assign(new CreateAccountDto(), {
      name: '门店现金账户',
      type: AccountType.Cash,
      storeId: 'store-2'
    })

    assert.equal(dto.storeId, 'store-2')
  })

  it('现金账户初始余额为 0', () => {
    const dto = Object.assign(new CreateAccountDto(), {
      name: '零钱账户',
      type: AccountType.Cash,
      initialBalance: 0
    })

    assert.equal(dto.initialBalance, 0)
  })
})

// ── CreateSettlementDto ──
describe('CreateSettlementDto', () => {
  it('标准结算 DTO：必填 startDate + endDate', () => {
    const dto = Object.assign(new CreateSettlementDto(), {
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z'
    })

    assert.equal(dto.startDate, '2026-06-01T00:00:00.000Z')
    assert.equal(dto.endDate, '2026-06-30T23:59:59.999Z')
  })

  it('手动指定 totalRevenue + totalExpense', () => {
    const dto = Object.assign(new CreateSettlementDto(), {
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
      totalRevenue: 5000,
      totalExpense: 2000
    })

    assert.equal(dto.totalRevenue, 5000)
    assert.equal(dto.totalExpense, 2000)
  })

  it('带门店 ID 的结算', () => {
    const dto = Object.assign(new CreateSettlementDto(), {
      storeId: 'store-3',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z'
    })

    assert.equal(dto.storeId, 'store-3')
  })
})

// ── SettlementQueryDto ──
describe('SettlementQueryDto', () => {
  it('按状态过滤', () => {
    const dto = Object.assign(new SettlementQueryDto(), {
      settlementStatus: SettlementStatus.Pending
    })
    assert.equal(dto.settlementStatus, SettlementStatus.Pending)
  })

  it('按时间范围过滤', () => {
    const dto = Object.assign(new SettlementQueryDto(), {
      startAfter: '2026-06-01T00:00:00.000Z',
      endBefore: '2026-07-01T00:00:00.000Z',
      limit: 10
    })
    assert.equal(dto.startAfter, '2026-06-01T00:00:00.000Z')
    assert.equal(dto.endBefore, '2026-07-01T00:00:00.000Z')
    assert.equal(dto.limit, 10)
  })
})

// ── CreateInvoiceDto ──
describe('CreateInvoiceDto', () => {
  it('标准发票 DTO：必填 type + amount', () => {
    const dto = Object.assign(new CreateInvoiceDto(), {
      type: InvoiceType.Regular,
      amount: 500
    })

    assert.equal(dto.type, InvoiceType.Regular)
    assert.equal(dto.amount, 500)
  })

  it('增值税发票', () => {
    const dto = Object.assign(new CreateInvoiceDto(), {
      type: InvoiceType.Vat,
      amount: 1000,
      taxAmount: 130
    })

    assert.equal(dto.type, InvoiceType.Vat)
    assert.equal(dto.amount, 1000)
    assert.equal(dto.taxAmount, 130)
  })

  it('带 orderId + buyerInfo', () => {
    const dto = Object.assign(new CreateInvoiceDto(), {
      type: InvoiceType.Regular,
      amount: 300,
      orderId: 'order-abc',
      buyerInfo: { name: '张三', taxId: '91110000' }
    })

    assert.equal(dto.orderId, 'order-abc')
    assert.deepEqual(dto.buyerInfo, { name: '张三', taxId: '91110000' })
  })

  it('不含税金的发票', () => {
    const dto = Object.assign(new CreateInvoiceDto(), {
      type: InvoiceType.Regular,
      amount: 200
    })

    assert.equal(dto.taxAmount, undefined)
  })
})

// ── InvoiceQueryDto ──
describe('InvoiceQueryDto', () => {
  it('按类型过滤', () => {
    const dto = Object.assign(new InvoiceQueryDto(), {
      type: InvoiceType.Vat
    })
    assert.equal(dto.type, InvoiceType.Vat)
  })

  it('按状态 + 时间范围过滤', () => {
    const dto = Object.assign(new InvoiceQueryDto(), {
      status: InvoiceStatus.Issued,
      issuedAfter: '2026-06-01T00:00:00.000Z',
      limit: 50
    })
    assert.equal(dto.status, InvoiceStatus.Issued)
    assert.equal(dto.issuedAfter, '2026-06-01T00:00:00.000Z')
    assert.equal(dto.limit, 50)
  })
})

// ── RevenueSummaryQueryDto ──
describe('RevenueSummaryQueryDto', () => {
  it('空查询', () => {
    const dto = Object.assign(new RevenueSummaryQueryDto(), {})
    assert.equal(dto.storeId, undefined)
    assert.equal(dto.startDate, undefined)
  })

  it('按门店 + 时间范围查询', () => {
    const dto = Object.assign(new RevenueSummaryQueryDto(), {
      storeId: 'store-1',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z'
    })
    assert.equal(dto.storeId, 'store-1')
    assert.equal(dto.startDate, '2026-06-01T00:00:00.000Z')
  })
})

// ── DailyRevenueQueryDto ──
describe('DailyRevenueQueryDto', () => {
  it('必填 date', () => {
    const dto = Object.assign(new DailyRevenueQueryDto(), {
      date: '2026-06-23'
    })
    assert.equal(dto.date, '2026-06-23')
  })

  it('带门店 ID + date', () => {
    const dto = Object.assign(new DailyRevenueQueryDto(), {
      date: '2026-06-23',
      storeId: 'store-2'
    })
    assert.equal(dto.date, '2026-06-23')
    assert.equal(dto.storeId, 'store-2')
  })
})
