import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * finance.contract.test.ts — Contract mapper unit tests
 *
 * 正例: 完整字段映射 / 边界: 可选字段缺失 / 反例: 未定义字段过滤
 */

import assert from 'node:assert/strict'
import {
  LedgerType,
  AccountStatus,
  SettlementStatus,
  InvoiceStatus,
  InvoiceType,
  AccountType,
} from './finance.entity'

import {
  toLedgerContract,
  toAccountContract,
  toSettlementContract,
  toInvoiceContract,
  toRevenueSummaryContract,
  toDailyRevenueContract,
} from './finance.contract'

// ── Ledger ──

it('toLedgerContract: maps all fields (正例)', () => {
  const input = {
    id: 'ledger-001',
    tenantId: 't-finance',
    brandId: 'b-retail',
    storeId: 's-downtown',
    type: LedgerType.Revenue,
    amount: 15000,
    balance: 50000,
    orderId: 'order-abc',
    transactionId: 'tx-def',
    description: '门店营收',
    category: '销售',
    recordedAt: '2026-06-25T00:00:00Z',
    createdAt: '2026-06-25T00:00:00Z',
  }
  const result = toLedgerContract(input)
  assert.equal(result.id, 'ledger-001')
  assert.equal(result.type, LedgerType.Revenue)
  assert.equal(result.amount, 15000)
  assert.equal(result.balance, 50000)
  assert.equal(result.orderId, 'order-abc')
  assert.equal(result.description, '门店营收')
  assert.equal(result.category, '销售')
})

it('toLedgerContract: handles optional fields (边界)', () => {
  // Refund ledger — no orderId / transactionId
  const input = {
    id: 'ledger-002',
    tenantId: 't-finance',
    type: LedgerType.Refund,
    amount: 5000,
    balance: 45000,
    description: '退款',
    recordedAt: '2026-06-25T01:00:00Z',
    createdAt: '2026-06-25T01:00:00Z',
  }
  const result = toLedgerContract(input)
  assert.equal(result.orderId, undefined)
  assert.equal(result.transactionId, undefined)
  assert.equal(result.category, undefined)
  assert.equal(result.brandId, undefined)
  assert.equal(result.storeId, undefined)
})

it('toLedgerContract: amount/balance are numbers (类型边界)', () => {
  const input = {
    id: 'ledger-0',
    tenantId: 't',
    type: LedgerType.Adjustment,
    amount: 0,
    balance: -100,
    description: '调账',
    recordedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
  }
  const result = toLedgerContract(input)
  assert.equal(typeof result.amount, 'number')
  assert.equal(typeof result.balance, 'number')
  assert.equal(result.amount, 0)
  assert.equal(result.balance, -100)
})

// ── Account ──

it('toAccountContract: maps all fields', () => {
  const input = {
    id: 'acct-001',
    tenantId: 't-finance',
    storeId: 's-downtown',
    name: '主账户',
    type: AccountType.Cash,
    balance: 100000,
    status: AccountStatus.Active,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-25T00:00:00Z',
  }
  const result = toAccountContract(input)
  assert.equal(result.id, 'acct-001')
  assert.equal(result.name, '主账户')
  assert.equal(result.type, AccountType.Cash)
  assert.equal(result.status, AccountStatus.Active)
  assert.equal(result.balance, 100000)
  assert.equal(result.storeId, 's-downtown')
})

it('toAccountContract: storeId optional (边界)', () => {
  const input = {
    id: 'acct-002',
    tenantId: 't',
    name: '平台账户',
    type: AccountType.Bank,
    balance: 0,
    status: AccountStatus.Closed,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  }
  const result = toAccountContract(input)
  assert.equal(result.storeId, undefined)
  assert.equal(result.status, AccountStatus.Closed)
})

// ── Settlement ──

it('toSettlementContract: maps all fields', () => {
  const input = {
    id: 'settle-001',
    tenantId: 't-finance',
    storeId: 's-downtown',
    startDate: '2026-06-01T00:00:00Z',
    endDate: '2026-06-30T23:59:59Z',
    totalRevenue: 500000,
    totalExpense: 320000,
    netProfit: 180000,
    settlementStatus: SettlementStatus.Confirmed,
    settledAt: '2026-07-01T00:00:00Z',
    createdAt: '2026-07-01T00:00:00Z',
  }
  const result = toSettlementContract(input)
  assert.equal(result.totalRevenue, 500000)
  assert.equal(result.totalExpense, 320000)
  assert.equal(result.netProfit, 180000)
  assert.equal(result.settlementStatus, SettlementStatus.Confirmed)
  assert.ok(result.settledAt)
})

it('toSettlementContract: pending settlement has no settledAt (边界)', () => {
  const input = {
    id: 'settle-002',
    tenantId: 't',
    startDate: '2026-06-01T00:00:00Z',
    endDate: '2026-06-30T23:59:59Z',
    totalRevenue: 0,
    totalExpense: 0,
    netProfit: 0,
    settlementStatus: SettlementStatus.Pending,
    createdAt: '2026-07-01T00:00:00Z',
  }
  const result = toSettlementContract(input)
  assert.equal(result.settlementStatus, SettlementStatus.Pending)
  assert.equal(result.settledAt, undefined)
  assert.equal(result.storeId, undefined)
})

it('toSettlementContract: disputed netProfit may be negative (反例)', () => {
  const input = {
    id: 'settle-003',
    tenantId: 't',
    startDate: '2026-06-01T00:00:00Z',
    endDate: '2026-06-30T23:59:59Z',
    totalRevenue: 0,
    totalExpense: 50000,
    netProfit: -50000,
    settlementStatus: SettlementStatus.Disputed,
    createdAt: '2026-07-01T00:00:00Z',
  }
  const result = toSettlementContract(input)
  assert.equal(result.netProfit, -50000)
  assert.equal(result.settlementStatus, SettlementStatus.Disputed)
})

// ── Invoice ──

it('toInvoiceContract: maps all fields', () => {
  const input = {
    id: 'inv-001',
    tenantId: 't-finance',
    storeId: 's-downtown',
    orderId: 'order-xyz',
    invoiceNo: 'INV-2026-0001',
    amount: 15000,
    taxAmount: 1500,
    totalAmount: 16500,
    type: InvoiceType.Vat,
    status: InvoiceStatus.Issued,
    issuedAt: '2026-06-25T00:00:00Z',
    buyerInfo: { company: '测试公司', taxId: '91110108MA' },
    createdAt: '2026-06-25T00:00:00Z',
  }
  const result = toInvoiceContract(input)
  assert.equal(result.invoiceNo, 'INV-2026-0001')
  assert.equal(result.totalAmount, 16500)
  assert.equal(result.type, InvoiceType.Vat)
  assert.equal(result.status, InvoiceStatus.Issued)
  assert.deepEqual(result.buyerInfo, { company: '测试公司', taxId: '91110108MA' })
})

it('toInvoiceContract: draft invoice without issuedAt (边界)', () => {
  const input = {
    id: 'inv-002',
    tenantId: 't',
    invoiceNo: 'INV-DRAFT-001',
    amount: 0,
    taxAmount: 0,
    totalAmount: 0,
    type: InvoiceType.Regular,
    status: InvoiceStatus.Draft,
    createdAt: '2026-06-25T00:00:00Z',
  }
  const result = toInvoiceContract(input)
  assert.equal(result.status, InvoiceStatus.Draft)
  assert.equal(result.issuedAt, undefined)
  assert.equal(result.orderId, undefined)
  assert.equal(result.buyerInfo, undefined)
})

it('toInvoiceContract: cancelled invoice (反例)', () => {
  const input = {
    id: 'inv-003',
    tenantId: 't',
    invoiceNo: 'INV-CANCEL-001',
    amount: 10000,
    taxAmount: 0,
    totalAmount: 10000,
    type: InvoiceType.Regular,
    status: InvoiceStatus.Cancelled,
    createdAt: '2026-06-25T00:00:00Z',
  }
  const result = toInvoiceContract(input)
  assert.equal(result.status, InvoiceStatus.Cancelled)
  assert.equal(result.issuedAt, undefined)
})

// ── RevenueSummary ──

it('toRevenueSummaryContract: maps all fields (正例)', () => {
  const input = {
    storeId: 's-downtown',
    totalRevenue: 500000,
    totalExpense: 320000,
    totalRefund: 10000,
    netRevenue: 170000,
    transactionCount: 1200,
    periodStart: '2026-06-01',
    periodEnd: '2026-06-30',
  }
  const result = toRevenueSummaryContract(input)
  assert.equal(result.netRevenue, 170000)
  assert.equal(result.transactionCount, 1200)
})

it('toRevenueSummaryContract: storeId optional (边界)', () => {
  const input = {
    totalRevenue: 0,
    totalExpense: 0,
    totalRefund: 0,
    netRevenue: 0,
    transactionCount: 0,
    periodStart: '2026-06-01',
    periodEnd: '2026-06-30',
  }
  const result = toRevenueSummaryContract(input)
  assert.equal(result.storeId, undefined)
  assert.equal(result.netRevenue, 0)
})

// ── DailyRevenue ──

it('toDailyRevenueContract: maps all fields', () => {
  const input = {
    date: '2026-06-25',
    storeId: 's-downtown',
    revenue: 20000,
    expense: 12000,
    refund: 500,
    netRevenue: 7500,
    transactionCount: 60,
  }
  const result = toDailyRevenueContract(input)
  assert.equal(result.date, '2026-06-25')
  assert.equal(result.revenue, 20000)
  assert.equal(result.netRevenue, 7500)
})

it('toDailyRevenueContract: zero values (边界)', () => {
  const input = {
    date: '2026-06-25',
    revenue: 0,
    expense: 0,
    refund: 0,
    netRevenue: 0,
    transactionCount: 0,
  }
  const result = toDailyRevenueContract(input)
  assert.equal(result.storeId, undefined)
  assert.equal(result.revenue, 0)
  assert.equal(result.netRevenue, 0)
})

// ── 跨条目的字段纯度 (反例) ──

it('contract mappers: do not leak undefined internal properties (字段过滤)', () => {
  const ledger = {
    id: 'ledger-pure',
    tenantId: 't',
    type: LedgerType.Revenue,
    amount: 100,
    balance: 1000,
    description: 'test',
    recordedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
  }
  const result = toLedgerContract(ledger)
  const keys = Object.keys(result)
  // No unexpected keys should be present
  for (const key of keys) {
    assert.ok(
      ['id', 'tenantId', 'brandId', 'storeId', 'type', 'amount', 'balance', 'orderId', 'transactionId', 'description', 'category', 'recordedAt', 'createdAt'].includes(key),
      `Unexpected key: ${key}`
    )
  }
})
