/**
 * finance/page.test.ts — 财务管理页真实数据护栏
 * 覆盖: helper 映射 / 趋势聚合 / 页面真接线 / 三态护栏
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  buildFinanceOverviewCards,
  buildFinanceQueryWindow,
  buildFinanceTrend,
  mapLedgerToFinanceRecord,
  mapLedgerTypeToFinanceType,
  type StorefrontLedgerRecord,
  type StorefrontRevenueSummary,
} from '../../lib/storefront-finance';

function createLedger(overrides?: Partial<StorefrontLedgerRecord>): StorefrontLedgerRecord {
  return {
    id: 'ledger-001',
    type: 'REVENUE',
    amount: 188,
    balance: 188,
    orderId: 'order-001',
    transactionId: 'payment-001',
    description: 'Transaction payment succeeded for order ORD001',
    category: 'transaction',
    recordedAt: '2026-07-20T10:30:00.000Z',
    createdAt: '2026-07-20T10:30:00.000Z',
    ...overrides,
  };
}

function createSummary(overrides?: Partial<StorefrontRevenueSummary>): StorefrontRevenueSummary {
  return {
    storeId: 'store-001',
    totalRevenue: 1888,
    totalExpense: 120,
    totalRefund: 88,
    netRevenue: 1680,
    transactionCount: 6,
    periodStart: '2026-02-01T00:00:00.000Z',
    periodEnd: '2026-07-20T23:59:59.999Z',
    ...overrides,
  };
}

test('week 查询窗口从当天向前回溯 7 天', () => {
  const { startDate, endDate } = buildFinanceQueryWindow('week', new Date('2026-07-20T12:00:00.000Z'));
  assert.equal(startDate, '2026-07-14T00:00:00.000Z');
  assert.equal(endDate, '2026-07-20T12:00:00.000Z');
});

test('ledger type 映射为页面财务类型', () => {
  assert.equal(mapLedgerTypeToFinanceType('REVENUE'), 'income');
  assert.equal(mapLedgerTypeToFinanceType('EXPENSE'), 'expense');
  assert.equal(mapLedgerTypeToFinanceType('REFUND'), 'refund');
  assert.equal(mapLedgerTypeToFinanceType('ADJUSTMENT'), 'adjustment');
});

test('revenue ledger 映射为正向入账记录', () => {
  const record = mapLedgerToFinanceRecord(createLedger());
  assert.equal(record.type, 'income');
  assert.equal(record.amount, 188);
  assert.equal(record.amountLabel, '+¥188.00');
  assert.equal(record.orderIdLabel, 'order-001');
  assert.equal(record.transactionIdLabel, 'payment-001');
});

test('refund ledger 映射为负向退款记录', () => {
  const record = mapLedgerToFinanceRecord(createLedger({
    type: 'REFUND',
    amount: 66,
    transactionId: 'refund-001',
  }));
  assert.equal(record.type, 'refund');
  assert.equal(record.amount, -66);
  assert.equal(record.amountLabel, '-¥66.00');
});

test('真实 ledger 聚合为近 6 个月趋势', () => {
  const trend = buildFinanceTrend([
    createLedger({ recordedAt: '2026-03-05T10:00:00.000Z', amount: 300 }),
    createLedger({ recordedAt: '2026-03-08T10:00:00.000Z', type: 'REFUND', amount: 50 }),
    createLedger({ recordedAt: '2026-06-11T10:00:00.000Z', amount: 800 }),
    createLedger({ recordedAt: '2026-07-19T10:00:00.000Z', type: 'EXPENSE', amount: 120 }),
  ], new Date('2026-07-20T12:00:00.000Z'));

  assert.equal(trend.length, 6);
  const march = trend.find((item) => item.month === '2026-03');
  const july = trend.find((item) => item.month === '2026-07');
  assert.ok(march);
  assert.equal(march?.revenue, 300);
  assert.equal(march?.refund, 50);
  assert.equal(march?.netRevenue, 250);
  assert.ok(july);
  assert.equal(july?.expense, 120);
});

test('概览卡片使用真实 summary 与趋势数据', () => {
  const cards = buildFinanceOverviewCards(
    createSummary(),
    [
      { month: '2026-06', revenue: 1000, expense: 0, refund: 0, netRevenue: 1000, transactionCount: 2 },
      { month: '2026-07', revenue: 1200, expense: 0, refund: 0, netRevenue: 1200, transactionCount: 3 },
    ],
  );

  assert.equal(cards.length, 5);
  assert.equal(cards[0]?.label, '总营收');
  assert.equal(cards[0]?.value, '¥1888.00');
  assert.match(cards[0]?.hint ?? '', /↑ 20.0%/);
  assert.equal(cards[3]?.label, '净收入');
  assert.equal(cards[3]?.value, '¥1680.00');
});

test('finance 页面已接入真实 dashboard helper 与三态护栏', async () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf-8');
  assert.ok(source.includes('loadStorefrontFinanceDashboard'), 'should load real storefront finance dashboard');
  assert.ok(source.includes('dashboard.summary.transactionCount === 0'), 'should guard empty real ledger state');
  assert.ok(source.includes('重新加载'), 'should provide retry action for error state');
  assert.ok(source.includes('finance/revenue/summary') || source.includes('finance/ledgers'), 'should describe real finance data source');

  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function');
});
