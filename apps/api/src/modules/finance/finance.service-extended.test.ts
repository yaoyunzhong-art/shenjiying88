/**
 * finance.service-extended.test.ts — 树哥B 保底续产: 财务service 增强测试
 *
 * 覆盖:
 *   对账逻辑 (reconciliation service)
 *   财务流水查询 (listLedgers 多维度过滤)
 *   收入统计 (getRevenueSummary)
 *   支出统计 (getDailyRevenue expense 维度)
 *   财务报表生成 (createSettlement 数据聚合)
 *   财务汇总 (getRevenueSummary 无数据时)
 *   期间结算 (settlement 生命周期全流程)
 *   跨租户隔离
 *   发票全生命周期
 *   交易联动 (recordTransactionRevenue / recordTransactionRefund)
 *   账户余额查询边界
 *   getSettlementDetail 完整校验
 */

import { describe, it, expect, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { FinanceService, resetFinanceServiceTestState } from './finance.service';
import {
  LedgerType,
  AccountType,
  AccountStatus,
  SettlementStatus,
  InvoiceStatus,
  InvoiceType,
} from './finance.entity';
import type { RequestTenantContext } from '../tenant/tenant.types';

// ── helpers ────────────────────────────────────────────

function makeService(): FinanceService {
  resetFinanceServiceTestState();
  return new FinanceService();
}

const CTX_A: RequestTenantContext = {
  tenantId: 'tenant-A',
  brandId: 'brand-A',
  storeId: 'store-A',
  marketCode: 'cn',
};
const CTX_B: RequestTenantContext = {
  tenantId: 'tenant-B',
  brandId: 'brand-B',
  storeId: 'store-B',
  marketCode: 'cn',
};

async function seedLedger(
  svc: FinanceService,
  ctx: RequestTenantContext,
  type: LedgerType,
  amount: number,
  overrides?: Partial<{
    description: string;
    recordedAt: string;
    orderId: string;
    transactionId: string;
    category: string;
  }>,
) {
  return svc.recordLedger(ctx, {
    type,
    amount,
    description: overrides?.description ?? 'test',
    recordedAt: overrides?.recordedAt,
    orderId: overrides?.orderId,
    transactionId: overrides?.transactionId,
    category: overrides?.category,
  });
}

// ─────────────────────────────────────────────────────
// Section 1: 对账逻辑与财务流水查询
// ─────────────────────────────────────────────────────
describe('[finance-extended] 对账逻辑与财务流水查询', () => {
  let svc: FinanceService;

  beforeEach(() => {
    svc = makeService();
  });

  it('listLedgers 空租户返回空', () => {
    const result = svc.listLedgers(CTX_A);
    expect(result).toEqual([]);
  });

  it('listLedgers 按 storeId 过滤', async () => {
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 100);
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 200);

    const storeResult = svc.listLedgers(CTX_A, { storeId: 'nonexistent' });
    expect(storeResult).toHaveLength(0);
  });

  it('listLedgers 按 transactionId 过滤', async () => {
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 100, {
      transactionId: 'tx-001',
    });
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 200, {
      transactionId: 'tx-002',
    });

    const result = svc.listLedgers(CTX_A, { transactionId: 'tx-001' });
    expect(result).toHaveLength(1);
    expect(result[0].transactionId).toBe('tx-001');
  });

  it('listLedgers 按 category 过滤', async () => {
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 100, {
      category: 'sale',
    });
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 200, {
      category: 'refund',
    });

    const result = svc.listLedgers(CTX_A, { category: 'sale' });
    expect(result).toHaveLength(1);
  });

  it('deleteLedger 成功删除后不可再查询', async () => {
    const ledger = await seedLedger(svc, CTX_A, LedgerType.Revenue, 500);
    const delResult = svc.deleteLedger(ledger.id, CTX_A);
    expect(delResult.success).toBe(true);
    assert.throws(() => svc.getLedger(ledger.id, CTX_A));
  });

  it('deleteLedger 对跨租户 ledger 抛出 NotFoundException', async () => {
    const ledger = await seedLedger(svc, CTX_A, LedgerType.Revenue, 500);
    assert.throws(() => svc.deleteLedger(ledger.id, CTX_B));
  });

  it('getLedgerResolved 在无 Prisma 时回退到内存', async () => {
    const ledger = await seedLedger(svc, CTX_A, LedgerType.Revenue, 300);
    const resolved = await svc.getLedgerResolved(ledger.id, CTX_A);
    expect(resolved.id).toBe(ledger.id);
    expect(resolved.amount).toBe(300);
  });

  it('deleteLedgerResolved 在无 Prisma 时回退到内存', async () => {
    const ledger = await seedLedger(svc, CTX_A, LedgerType.Revenue, 200);
    const result = await svc.deleteLedgerResolved(ledger.id, CTX_A);
    expect(result.success).toBe(true);
    assert.throws(() => svc.getLedger(ledger.id, CTX_A));
  });

  it('记录混合类型流水后 多维度过滤正确', async () => {
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 1000, {
      description: '销售',
      category: 'sale',
    });
    await seedLedger(svc, CTX_A, LedgerType.Expense, 300, {
      description: '进货',
      category: 'purchase',
    });
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 500, {
      description: '服务费',
      category: 'service',
    });

    const revLedgers = svc.listLedgers(CTX_A, { type: LedgerType.Revenue });
    expect(revLedgers).toHaveLength(2);
    const expenseLedgers = svc.listLedgers(CTX_A, { type: LedgerType.Expense });
    expect(expenseLedgers).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────
// Section 2: 收入统计 / 支出统计 / 每日营收
// ─────────────────────────────────────────────────────
describe('[finance-extended] 收入统计 与 每日营收', () => {
  let svc: FinanceService;

  beforeEach(() => {
    svc = makeService();
  });

  it('getRevenueSummary 无数据时各项为零', () => {
    const summary = svc.getRevenueSummary(CTX_A, {
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
    });
    expect(summary.totalRevenue).toBe(0);
    expect(summary.totalExpense).toBe(0);
    expect(summary.totalRefund).toBe(0);
    expect(summary.netRevenue).toBe(0);
    expect(summary.transactionCount).toBe(0);
  });

  it('getRevenueSummary 正确汇总收支退款', async () => {
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 5000);
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 3000);
    await seedLedger(svc, CTX_A, LedgerType.Expense, 1000);
    await seedLedger(svc, CTX_A, LedgerType.Refund, 500);

    const summary = svc.getRevenueSummary(CTX_A, {
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
    });
    expect(summary.totalRevenue).toBe(8000);
    expect(summary.totalExpense).toBe(1000);
    expect(summary.totalRefund).toBe(500);
    // netRevenue = 8000 - 1000 - 500 = 6500
    expect(summary.netRevenue).toBe(6500);
    expect(summary.transactionCount).toBe(4);
  });

  it('getRevenueSummary 跨租户隔离', async () => {
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 1000);
    await seedLedger(svc, CTX_B, LedgerType.Revenue, 9999);

    const summary = svc.getRevenueSummary(CTX_A, {
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
    });
    // only tenant-A data
    expect(summary.totalRevenue).toBe(1000);
  });

  it('getRevenueSummary 按 storeId 过滤', async () => {
    const ctxStore2: RequestTenantContext = {
      ...CTX_A,
      storeId: 'store-A2',
    };
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 3000);
    await seedLedger(svc, ctxStore2, LedgerType.Revenue, 5000);

    const summary = svc.getRevenueSummary(CTX_A, {
      storeId: 'store-A2',
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
    });
    expect(summary.totalRevenue).toBe(5000);
    expect(summary.storeId).toBe('store-A2');
  });

  it('getDailyRevenue 按日统计', async () => {
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 500, {
      recordedAt: '2026-06-15T10:00:00Z',
    });
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 300, {
      recordedAt: '2026-06-15T14:00:00Z',
    });
    await seedLedger(svc, CTX_A, LedgerType.Expense, 100, {
      recordedAt: '2026-06-15T08:00:00Z',
    });

    const daily = svc.getDailyRevenue(CTX_A, {
      date: '2026-06-15',
      storeId: 'store-A',
    });
    expect(daily.revenue).toBe(800);
    expect(daily.expense).toBe(100);
    expect(daily.refund).toBe(0);
    expect(daily.netRevenue).toBe(700);
    expect(daily.transactionCount).toBe(3);
  });

  it('getDailyRevenue 跨天数据不干扰', async () => {
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 200, {
      recordedAt: '2026-06-14T23:59:00Z',
    });
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 100, {
      recordedAt: '2026-06-15T00:01:00Z',
    });

    const daily14 = svc.getDailyRevenue(CTX_A, { date: '2026-06-14' });
    const daily15 = svc.getDailyRevenue(CTX_A, { date: '2026-06-15' });
    expect(daily14.revenue).toBe(200);
    expect(daily15.revenue).toBe(100);
  });

  it('getRevenueSummaryResolved 在无 Prisma 时回退', async () => {
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 2000);
    const resolved = await svc.getRevenueSummaryResolved(CTX_A, {
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
    });
    expect(resolved.totalRevenue).toBe(2000);
  });

  it('getDailyRevenueResolved 在无 Prisma 时回退', async () => {
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 150, {
      recordedAt: '2026-07-01T12:00:00Z',
    });
    const resolved = await svc.getDailyRevenueResolved(CTX_A, {
      date: '2026-07-01',
    });
    expect(resolved.revenue).toBe(150);
    expect(resolved.transactionCount).toBe(1);
  });
});

// ─────────────────────────────────────────────────────
// Section 3: 结算 (Settlement) 生命周期与详情
// ─────────────────────────────────────────────────────
describe('[finance-extended] 期间结算与汇总', () => {
  let svc: FinanceService;

  beforeEach(() => {
    svc = makeService();
  });

  it('createSettlement startDate > endDate 抛出 BadRequestException', async () => {
    await expect(
      svc.createSettlement(CTX_A, {
        startDate: '2026-06-30T00:00:00Z',
        endDate: '2026-06-01T00:00:00Z',
      }),
    ).rejects.toThrow('Settlement start date must be before or equal to end date');
  });

  it('createSettlement 支持手动指定 totalRevenue/totalExpense', async () => {
    const settlement = await svc.createSettlement(CTX_A, {
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-12-31T00:00:00Z',
      totalRevenue: 10000,
      totalExpense: 4000,
    });
    expect(settlement.totalRevenue).toBe(10000);
    expect(settlement.totalExpense).toBe(4000);
    expect(settlement.netProfit).toBe(6000);
  });

  it('listSettlements 按 settlementStatus 过滤', async () => {
    const s1 = await svc.createSettlement(CTX_A, {
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-03-31T00:00:00Z',
    });
    await svc.createSettlement(CTX_A, {
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-06-30T00:00:00Z',
    });
    svc.confirmSettlement(s1.id, CTX_A);

    const pending = svc.listSettlements(CTX_A, {
      settlementStatus: SettlementStatus.Pending,
    });
    const confirmed = svc.listSettlements(CTX_A, {
      settlementStatus: SettlementStatus.Confirmed,
    });
    expect(pending).toHaveLength(1);
    expect(confirmed).toHaveLength(1);
  });

  it('listSettlements 按日期范围过滤', async () => {
    const s1 = await svc.createSettlement(CTX_A, {
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-03-31T00:00:00Z',
    });
    const s2 = await svc.createSettlement(CTX_A, {
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-06-30T00:00:00Z',
    });

    const result = svc.listSettlements(CTX_A, {
      startAfter: '2026-01-01T00:00:00Z',
      endBefore: '2026-07-01T00:00:00Z',
    });
    expect(result).toHaveLength(2);
    // both settlements should be returned
    const resultIds = result.map((s) => s.id);
    expect(resultIds).toContain(s1.id);
    expect(resultIds).toContain(s2.id);
  });

  it('非 Pending 的 settlement 不能 dispute', async () => {
    const s = await svc.createSettlement(CTX_A, {
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-03-31T00:00:00Z',
    });
    svc.confirmSettlement(s.id, CTX_A);
    assert.throws(() => svc.disputeSettlement(s.id, CTX_A));
  });

  it('getSettlementDetail 返回结算及其关联账本', async () => {
    await seedLedger(svc, CTX_A, LedgerType.Revenue, 1200, {
      recordedAt: '2026-05-15T10:00:00Z',
    });
    await seedLedger(svc, CTX_A, LedgerType.Expense, 400, {
      recordedAt: '2026-05-20T10:00:00Z',
    });

    const s = await svc.createSettlement(CTX_A, {
      startDate: '2026-05-01T00:00:00Z',
      endDate: '2026-05-31T00:00:00Z',
    });

    const detail = svc.getSettlementDetail(s.id, CTX_A);
    expect(detail.settlement.id).toBe(s.id);
    expect(detail.ledgers).toHaveLength(2);
    expect(detail.settlement.totalRevenue).toBe(1200);
    expect(detail.settlement.totalExpense).toBe(400);
  });

  it('getSettlementDetailResolved 在无 Prisma 时回退', async () => {
    const s = await svc.createSettlement(CTX_A, {
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-12-31T00:00:00Z',
    });
    const detail = await svc.getSettlementDetailResolved(s.id, CTX_A);
    expect(detail.settlement.id).toBe(s.id);
  });

  it('listSettlements 跨租户隔离', async () => {
    await svc.createSettlement(CTX_A, {
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-03-31T00:00:00Z',
    });
    await svc.createSettlement(CTX_B, {
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-03-31T00:00:00Z',
    });

    const listA = svc.listSettlements(CTX_A);
    expect(listA).toHaveLength(1);
  });

  it('confirmSettlementResolved 在无 Prisma 时回退', async () => {
    const s = await svc.createSettlement(CTX_A, {
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-03-31T00:00:00Z',
    });
    const confirmed = await svc.confirmSettlementResolved(s.id, CTX_A);
    expect(confirmed.settlementStatus).toBe(SettlementStatus.Confirmed);
  });

  it('disputeSettlementResolved 在无 Prisma 时回退', async () => {
    const s = await svc.createSettlement(CTX_A, {
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-03-31T00:00:00Z',
    });
    const disputed = await svc.disputeSettlementResolved(s.id, CTX_A);
    expect(disputed.settlementStatus).toBe(SettlementStatus.Disputed);
  });
});

// ─────────────────────────────────────────────────────
// Section 4: 发票 (Invoice) 生命周期
// ─────────────────────────────────────────────────────
describe('[finance-extended] 发票全生命周期', () => {
  let svc: FinanceService;

  beforeEach(() => {
    svc = makeService();
  });

  it('createInvoice 生成 draft 状态发票', async () => {
    const inv = await svc.createInvoice(CTX_A, {
      amount: 1000,
      taxAmount: 60,
      type: InvoiceType.Regular,
      orderId: 'order-001',
      buyerInfo: {
        name: '客户甲',
        taxId: 'TAX123',
        email: 'a@example.com',
      },
    });
    expect(inv.status).toBe(InvoiceStatus.Draft);
    expect(inv.amount).toBe(1000);
    expect(inv.taxAmount).toBe(60);
    expect(inv.totalAmount).toBe(1060);
    expect(inv.invoiceNo).toBeTruthy();
    expect(inv.buyerInfo).toBeDefined();
  });

  it('issueInvoice Draft → Issued', async () => {
    const inv = await svc.createInvoice(CTX_A, {
      amount: 500,
      type: InvoiceType.Regular,
    });
    const issued = svc.issueInvoice(inv.id, CTX_A);
    expect(issued.status).toBe(InvoiceStatus.Issued);
    expect(issued.issuedAt).toBeTruthy();
  });

  it('issueInvoice 非 Draft 报错', async () => {
    const inv = await svc.createInvoice(CTX_A, {
      amount: 500,
      type: InvoiceType.Regular,
    });
    svc.issueInvoice(inv.id, CTX_A);
    assert.throws(() => svc.issueInvoice(inv.id, CTX_A));
  });

  it('cancelInvoice Draft → Cancelled', async () => {
    const inv = await svc.createInvoice(CTX_A, {
      amount: 200,
      type: InvoiceType.Regular,
    });
    const cancelled = svc.cancelInvoice(inv.id, CTX_A);
    expect(cancelled.status).toBe(InvoiceStatus.Cancelled);
  });

  it('cancelInvoice 重复取消报错', async () => {
    const inv = await svc.createInvoice(CTX_A, {
      amount: 200,
      type: InvoiceType.Regular,
    });
    svc.cancelInvoice(inv.id, CTX_A);
    assert.throws(() => svc.cancelInvoice(inv.id, CTX_A));
  });

  it('listInvoices 多维度过滤', async () => {
    await svc.createInvoice(CTX_A, {
      amount: 300,
      type: InvoiceType.Regular,
      orderId: 'order-001',
    });
    await svc.createInvoice(CTX_A, {
      amount: 500,
      type: InvoiceType.Vat,
      orderId: 'order-002',
    });
    await svc.createInvoice(CTX_A, {
      amount: 700,
      type: InvoiceType.Regular,
      orderId: 'order-003',
    });

    const standardInvs = svc.listInvoices(CTX_A, { type: InvoiceType.Regular });
    expect(standardInvs).toHaveLength(2);
    const orderInvs = svc.listInvoices(CTX_A, { orderId: 'order-002' });
    expect(orderInvs).toHaveLength(1);
  });

  it('listInvoices 跨租户隔离', async () => {
    await svc.createInvoice(CTX_A, {
      amount: 100,
      type: InvoiceType.Regular,
    });
    await svc.createInvoice(CTX_B, {
      amount: 200,
      type: InvoiceType.Vat,
    });
    const invs = svc.listInvoices(CTX_A);
    expect(invs).toHaveLength(1);
  });

  it('getInvoice 不存在抛错', () => {
    assert.throws(() => svc.getInvoice('nonexistent', CTX_A));
  });

  it('getInvoiceResolved 在无 Prisma 时回退', async () => {
    const inv = await svc.createInvoice(CTX_A, {
      amount: 100,
      type: InvoiceType.Regular,
    });
    const resolved = await svc.getInvoiceResolved(inv.id, CTX_A);
    expect(resolved.id).toBe(inv.id);
  });

  it('issueInvoiceResolved 在无 Prisma 时回退', async () => {
    const inv = await svc.createInvoice(CTX_A, {
      amount: 100,
      type: InvoiceType.Regular,
    });
    const issued = await svc.issueInvoiceResolved(inv.id, CTX_A);
    expect(issued.status).toBe(InvoiceStatus.Issued);
  });

  it('cancelInvoiceResolved 在无 Prisma 时回退', async () => {
    const inv = await svc.createInvoice(CTX_A, {
      amount: 100,
      type: InvoiceType.Regular,
    });
    const cancelled = await svc.cancelInvoiceResolved(inv.id, CTX_A);
    expect(cancelled.status).toBe(InvoiceStatus.Cancelled);
  });

  it('listInvoicesResolved 在无 Prisma 时回退', async () => {
    await svc.createInvoice(CTX_A, {
      amount: 100,
      type: InvoiceType.Regular,
    });
    const result = await svc.listInvoicesResolved(CTX_A);
    expect(result).toHaveLength(1);
  });

  it('已发出发票 listInvoices 按 issuedAfter 过滤', async () => {
    const inv = await svc.createInvoice(CTX_A, {
      amount: 100,
      type: InvoiceType.Regular,
    });
    svc.issueInvoice(inv.id, CTX_A);
    const result = svc.listInvoices(CTX_A, {
      issuedAfter: new Date(Date.now() - 60000).toISOString(),
    });
    expect(result).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────
// Section 5: 交易联动 & 账户余额边界
// ─────────────────────────────────────────────────────
describe('[finance-extended] 交易联动与账户余额', () => {
  let svc: FinanceService;

  beforeEach(() => {
    svc = makeService();
  });

  it('recordTransactionRevenue 自动设置 category 为 transaction', async () => {
    const ledger = await svc.recordTransactionRevenue(CTX_A, {
      orderId: 'O-100',
      transactionId: 'T-100',
      amount: 800,
      description: '商品收款',
    });
    expect(ledger.category).toBe('transaction');
    expect(ledger.orderId).toBe('O-100');
    expect(ledger.transactionId).toBe('T-100');
  });

  it('recordTransactionRefund 自动设置 category 为 refund', async () => {
    const ledger = await svc.recordTransactionRefund(CTX_A, {
      orderId: 'O-100',
      transactionId: 'T-101',
      amount: 200,
      description: '部分退款',
    });
    expect(ledger.category).toBe('refund');
  });

  it('收入 + 退款组合余额计算正确', async () => {
    await svc.recordTransactionRevenue(CTX_A, {
      orderId: 'O-1',
      transactionId: 'T-1',
      amount: 1000,
      description: '收款',
    });
    const refund = await svc.recordTransactionRefund(CTX_A, {
      orderId: 'O-1',
      transactionId: 'T-2',
      amount: 100,
      description: '退款',
    });
    expect(refund.balance).toBe(900);
  });

  it('createAccount 默认 initialBalance 为 0', async () => {
    const acct = await svc.createAccount(CTX_A, {
      name: '默认账户',
      type: AccountType.Cash,
    });
    expect(acct.balance).toBe(0);
  });

  it('getAccountBalance 返回摘要字段', async () => {
    const acct = await svc.createAccount(CTX_A, {
      name: '银行卡',
      type: AccountType.Bank,
      initialBalance: 5000,
    });
    const bal = svc.getAccountBalance(acct.id, CTX_A);
    expect(bal.id).toBe(acct.id);
    expect(bal.name).toBe('银行卡');
    expect(bal.balance).toBe(5000);
    expect(bal.status).toBe(AccountStatus.Active);
  });

  it('Frozen 状态的账户不能再次 freeze', async () => {
    const acct = await svc.createAccount(CTX_A, {
      name: '冻结测试',
      type: AccountType.Cash,
    });
    svc.freezeAccount(acct.id, CTX_A);
    assert.throws(() => svc.freezeAccount(acct.id, CTX_A));
  });

  it('closeAccount 不能关闭已关闭账户', async () => {
    const acct = await svc.createAccount(CTX_A, {
      name: '关闭测试',
      type: AccountType.Cash,
    });
    svc.closeAccount(acct.id, CTX_A);
    assert.throws(() => svc.closeAccount(acct.id, CTX_A));
  });

  it('freezeAccountResolved 在无 Prisma 时回退', async () => {
    const acct = await svc.createAccount(CTX_A, {
      name: '远程冻结',
      type: AccountType.Cash,
    });
    const frozen = await svc.freezeAccountResolved(acct.id, CTX_A);
    expect(frozen.status).toBe(AccountStatus.Frozen);
  });

  it('closeAccountResolved 在无 Prisma 时回退', async () => {
    const acct = await svc.createAccount(CTX_A, {
      name: '远程关闭',
      type: AccountType.Cash,
    });
    const closed = await svc.closeAccountResolved(acct.id, CTX_A);
    expect(closed.status).toBe(AccountStatus.Closed);
  });

  it('账户跨租户隔离', async () => {
    const acctA = await svc.createAccount(CTX_A, {
      name: 'A 租户账户',
      type: AccountType.Cash,
    });
    assert.throws(() => svc.getAccount(acctA.id, CTX_B));
  });

  it('listAccounts 按 storeId 过滤', async () => {
    const ctxA2: RequestTenantContext = {
      ...CTX_A,
      storeId: 'store-A2',
    };
    await svc.createAccount(CTX_A, { name: '店铺1', type: AccountType.Cash });
    await svc.createAccount(ctxA2, { name: '店铺2', type: AccountType.Bank });

    const store1Accts = svc.listAccounts(CTX_A, 'store-A');
    expect(store1Accts).toHaveLength(1);
  });
});
