import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
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

describe('finance.entity enums', () => {
  test('LedgerType 包含 Revenue / Expense / Refund / Adjustment', () => {
    assert.equal(LedgerType.Revenue, 'REVENUE')
    assert.equal(LedgerType.Expense, 'EXPENSE')
    assert.equal(LedgerType.Refund, 'REFUND')
    assert.equal(LedgerType.Adjustment, 'ADJUSTMENT')
  })

  test('AccountType 包含 Cash / Wechat / Alipay / Bank / Other', () => {
    assert.equal(AccountType.Cash, 'CASH')
    assert.equal(AccountType.Wechat, 'WECHAT')
    assert.equal(AccountType.Alipay, 'ALIPAY')
    assert.equal(AccountType.Bank, 'BANK')
    assert.equal(AccountType.Other, 'OTHER')
  })

  test('AccountStatus 包含 Active / Frozen / Closed', () => {
    assert.equal(AccountStatus.Active, 'ACTIVE')
    assert.equal(AccountStatus.Frozen, 'FROZEN')
    assert.equal(AccountStatus.Closed, 'CLOSED')
  })

  test('SettlementStatus 包含 Pending / Confirmed / Disputed', () => {
    assert.equal(SettlementStatus.Pending, 'PENDING')
    assert.equal(SettlementStatus.Confirmed, 'CONFIRMED')
    assert.equal(SettlementStatus.Disputed, 'DISPUTED')
  })

  test('InvoiceType 包含 Regular / Vat', () => {
    assert.equal(InvoiceType.Regular, 'REGULAR')
    assert.equal(InvoiceType.Vat, 'VAT')
  })

  test('InvoiceStatus 包含 Draft / Issued / Cancelled', () => {
    assert.equal(InvoiceStatus.Draft, 'DRAFT')
    assert.equal(InvoiceStatus.Issued, 'ISSUED')
    assert.equal(InvoiceStatus.Cancelled, 'CANCELLED')
  })
})

describe('finance.entity interfaces', () => {
  test('Ledger 接口包含所有必填字段', () => {
    const ledger: Ledger = {
      id: 'ledger-1',
      tenantId: 'tenant-1',
      brandId: 'brand-1',
      storeId: 'store-1',
      type: LedgerType.Revenue,
      amount: 100,
      balance: 100,
      orderId: 'order-1',
      transactionId: 'txn-1',
      description: 'Test ledger',
      category: 'sales',
      recordedAt: '2026-06-23T12:00:00.000Z',
      createdAt: '2026-06-23T12:00:00.000Z'
    }

    assert.equal(ledger.id, 'ledger-1')
    assert.equal(ledger.type, LedgerType.Revenue)
    assert.equal(ledger.amount, 100)
    assert.equal(ledger.balance, 100)
    assert.equal(ledger.description, 'Test ledger')
  })

  test('Account 接口包含所有必填字段', () => {
    const account: Account = {
      id: 'acct-1',
      tenantId: 'tenant-1',
      storeId: 'store-1',
      name: 'WeChat Pay Account',
      type: AccountType.Wechat,
      balance: 5000,
      status: AccountStatus.Active,
      createdAt: '2026-06-23T12:00:00.000Z',
      updatedAt: '2026-06-23T12:00:00.000Z'
    }

    assert.equal(account.name, 'WeChat Pay Account')
    assert.equal(account.type, AccountType.Wechat)
    assert.equal(account.balance, 5000)
    assert.equal(account.status, AccountStatus.Active)
  })

  test('Account 已冻结状态', () => {
    const account: Account = {
      id: 'acct-frozen',
      tenantId: 'tenant-1',
      name: 'Frozen Account',
      type: AccountType.Bank,
      balance: 1000,
      status: AccountStatus.Frozen,
      createdAt: '2026-06-23T00:00:00.000Z',
      updatedAt: '2026-06-23T12:00:00.000Z'
    }

    assert.equal(account.status, AccountStatus.Frozen)
  })

  test('Settlement 接口包含所有字段', () => {
    const settlement: Settlement = {
      id: 'stl-1',
      tenantId: 'tenant-1',
      storeId: 'store-1',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
      totalRevenue: 10000,
      totalExpense: 3000,
      netProfit: 7000,
      settlementStatus: SettlementStatus.Pending,
      createdAt: '2026-06-30T23:59:59.999Z'
    }

    assert.equal(settlement.totalRevenue, 10000)
    assert.equal(settlement.totalExpense, 3000)
    assert.equal(settlement.netProfit, 7000)
    assert.equal(settlement.settlementStatus, SettlementStatus.Pending)
  })

  test('Settlement 已确认带 settledAt', () => {
    const settlement: Settlement = {
      id: 'stl-confirmed',
      tenantId: 'tenant-1',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
      totalRevenue: 5000,
      totalExpense: 2000,
      netProfit: 3000,
      settlementStatus: SettlementStatus.Confirmed,
      settledAt: '2026-07-01T10:00:00.000Z',
      createdAt: '2026-06-30T23:59:59.999Z'
    }

    assert.equal(settlement.settlementStatus, SettlementStatus.Confirmed)
    assert.equal(settlement.settledAt, '2026-07-01T10:00:00.000Z')
  })

  test('Invoice 接口包含所有字段', () => {
    const invoice: Invoice = {
      id: 'inv-1',
      tenantId: 'tenant-1',
      storeId: 'store-1',
      orderId: 'order-1',
      invoiceNo: 'INV-001',
      amount: 100,
      taxAmount: 13,
      totalAmount: 113,
      type: InvoiceType.Vat,
      status: InvoiceStatus.Draft,
      buyerInfo: { name: 'Test Co' },
      createdAt: '2026-06-23T12:00:00.000Z'
    }

    assert.equal(invoice.invoiceNo, 'INV-001')
    assert.equal(invoice.amount, 100)
    assert.equal(invoice.taxAmount, 13)
    assert.equal(invoice.totalAmount, 113)
    assert.equal(invoice.type, InvoiceType.Vat)
    assert.equal(invoice.status, InvoiceStatus.Draft)
    assert.deepEqual(invoice.buyerInfo, { name: 'Test Co' })
  })

  test('RevenueSummary 接口形状', () => {
    const summary: RevenueSummary = {
      storeId: 'store-1',
      totalRevenue: 10000,
      totalExpense: 3000,
      totalRefund: 500,
      netRevenue: 6500,
      transactionCount: 42,
      periodStart: '2026-06-01T00:00:00.000Z',
      periodEnd: '2026-06-30T23:59:59.999Z'
    }

    assert.equal(summary.totalRevenue, 10000)
    assert.equal(summary.totalRefund, 500)
    assert.equal(summary.netRevenue, 6500)
    assert.equal(summary.transactionCount, 42)
  })

  test('DailyRevenue 接口形状', () => {
    const daily: DailyRevenue = {
      date: '2026-06-23',
      storeId: 'store-1',
      revenue: 1500,
      expense: 300,
      refund: 100,
      netRevenue: 1100,
      transactionCount: 15
    }

    assert.equal(daily.date, '2026-06-23')
    assert.equal(daily.revenue, 1500)
    assert.equal(daily.expense, 300)
    assert.equal(daily.netRevenue, 1100)
  })
})
