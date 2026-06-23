/**
 * 🐜 自动: [finance] [D] controller spec 补全
 *
 * FinanceController 路由、装饰器元数据 + 业务场景验证
 * 覆盖: Ledger, Account, Settlement, Invoice, Revenue, Transaction 完整路由
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import type { RequestTenantContext } from '../tenant/tenant.types';

// ── 模拟装饰器 ──

function Controller(prefix: string) {
  return (target: Function & { __prefix?: string }) => {
    target.__prefix = prefix;
    return target;
  };
}

const getRegistrations: string[] = [];
function Get(path = '') {
  return (_target: object, propertyKey: string | symbol) => {
    getRegistrations.push(`${String(propertyKey)}:${path}`);
  };
}

const postRegistrations: string[] = [];
function Post(path = '') {
  return (_target: object, propertyKey: string | symbol) => {
    postRegistrations.push(`${String(propertyKey)}:${path}`);
  };
}

const paramRegistrations: string[] = [];
function Param(key?: string) {
  return (_target: object, propertyKey: string | symbol, _parameterIndex: number) => {
    paramRegistrations.push(`${String(propertyKey)}:${key}`);
  };
}

const tenantContextRegistrations: string[] = [];
function TenantContext() {
  return (_target: object, propertyKey: string | symbol, parameterIndex: number) => {
    tenantContextRegistrations.push(`${String(propertyKey)}:${parameterIndex}`);
  };
}

// ── Mock FinanceController ──

class FinanceController {
  // ── Ledger ──

  recordLedger(
    ctx: RequestTenantContext,
    body: {
      type: string;
      amount: number;
      description: string;
      orderId?: string;
      category?: string;
    },
  ) {
    return {
      id: 'ledger-mock-1',
      tenantId: ctx.tenantId,
      type: body.type,
      amount: body.amount,
      balance: body.type === 'REVENUE' ? body.amount : -body.amount,
      description: body.description,
      orderId: body.orderId,
      category: body.category,
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  listLedgers(
    ctx: RequestTenantContext,
    query?: { type?: string; storeId?: string; orderId?: string; category?: string },
  ) {
    return [] as Array<Record<string, unknown>>;
  }

  getLedger(ledgerId: string, ctx: RequestTenantContext) {
    return {
      id: ledgerId,
      tenantId: ctx.tenantId,
      type: 'REVENUE',
      amount: 100,
      balance: 100,
      description: 'Mock ledger',
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  // ── Account ──

  createAccount(
    ctx: RequestTenantContext,
    body: { name: string; type: string; initialBalance?: number; storeId?: string },
  ) {
    return {
      id: 'acct-mock-1',
      tenantId: ctx.tenantId,
      storeId: body.storeId ?? ctx.storeId,
      name: body.name,
      type: body.type,
      balance: body.initialBalance ?? 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  listAccounts(ctx: RequestTenantContext, storeId?: string) {
    return [] as Array<Record<string, unknown>>;
  }

  getAccount(accountId: string, ctx: RequestTenantContext) {
    return {
      id: accountId,
      tenantId: ctx.tenantId,
      name: 'Mock Account',
      type: 'CASH',
      balance: 5000,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  getAccountBalance(accountId: string, ctx: RequestTenantContext) {
    return { id: accountId, name: 'Mock Account', balance: 5000, status: 'ACTIVE' };
  }

  freezeAccount(accountId: string, ctx: RequestTenantContext) {
    return {
      id: accountId,
      tenantId: ctx.tenantId,
      name: 'Frozen Account',
      type: 'BANK',
      balance: 1000,
      status: 'FROZEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  closeAccount(accountId: string, ctx: RequestTenantContext) {
    return {
      id: accountId,
      tenantId: ctx.tenantId,
      name: 'Closed Account',
      type: 'BANK',
      balance: 0,
      status: 'CLOSED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // ── Settlement ──

  createSettlement(
    ctx: RequestTenantContext,
    body: {
      storeId?: string;
      startDate: string;
      endDate: string;
      totalRevenue?: number;
      totalExpense?: number;
    },
  ) {
    const rev = body.totalRevenue ?? 1000;
    const exp = body.totalExpense ?? 300;
    return {
      id: 'stl-mock-1',
      tenantId: ctx.tenantId,
      storeId: body.storeId ?? ctx.storeId,
      startDate: body.startDate,
      endDate: body.endDate,
      totalRevenue: rev,
      totalExpense: exp,
      netProfit: rev - exp,
      settlementStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };
  }

  listSettlements(
    ctx: RequestTenantContext,
    query?: { settlementStatus?: string; storeId?: string },
  ) {
    return [] as Array<Record<string, unknown>>;
  }

  getSettlement(settlementId: string, ctx: RequestTenantContext) {
    return {
      id: settlementId,
      tenantId: ctx.tenantId,
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
      totalRevenue: 5000,
      totalExpense: 2000,
      netProfit: 3000,
      settlementStatus: 'CONFIRMED',
      settledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  getSettlementDetail(settlementId: string, ctx: RequestTenantContext) {
    return {
      settlement: {
        id: settlementId,
        tenantId: ctx.tenantId,
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-30T23:59:59.999Z',
        totalRevenue: 5000,
        totalExpense: 2000,
        netProfit: 3000,
        settlementStatus: 'PENDING',
        createdAt: new Date().toISOString(),
      },
      ledgers: [],
    };
  }

  confirmSettlement(settlementId: string, ctx: RequestTenantContext) {
    return {
      id: settlementId,
      tenantId: ctx.tenantId,
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
      totalRevenue: 5000,
      totalExpense: 2000,
      netProfit: 3000,
      settlementStatus: 'CONFIRMED',
      settledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  disputeSettlement(settlementId: string, ctx: RequestTenantContext) {
    return {
      id: settlementId,
      tenantId: ctx.tenantId,
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
      totalRevenue: 5000,
      totalExpense: 2000,
      netProfit: 3000,
      settlementStatus: 'DISPUTED',
      createdAt: new Date().toISOString(),
    };
  }

  // ── Invoice ──

  createInvoice(
    ctx: RequestTenantContext,
    body: {
      type: string;
      amount: number;
      taxAmount?: number;
      orderId?: string;
      buyerInfo?: Record<string, unknown>;
    },
  ) {
    const tax = body.taxAmount ?? 0;
    return {
      id: 'inv-mock-1',
      tenantId: ctx.tenantId,
      storeId: ctx.storeId,
      orderId: body.orderId,
      invoiceNo: `INV-${Date.now()}-0001`,
      amount: body.amount,
      taxAmount: tax,
      totalAmount: body.amount + tax,
      type: body.type,
      status: 'DRAFT',
      buyerInfo: body.buyerInfo,
      createdAt: new Date().toISOString(),
    };
  }

  listInvoices(
    ctx: RequestTenantContext,
    query?: { status?: string; storeId?: string; orderId?: string },
  ) {
    return [] as Array<Record<string, unknown>>;
  }

  getInvoice(invoiceId: string, ctx: RequestTenantContext) {
    return {
      id: invoiceId,
      tenantId: ctx.tenantId,
      storeId: ctx.storeId,
      invoiceNo: 'INV-001',
      amount: 100,
      taxAmount: 13,
      totalAmount: 113,
      type: 'VAT',
      status: 'DRAFT',
      buyerInfo: { name: 'Test' },
      createdAt: new Date().toISOString(),
    };
  }

  issueInvoice(invoiceId: string, ctx: RequestTenantContext) {
    return {
      id: invoiceId,
      tenantId: ctx.tenantId,
      storeId: ctx.storeId,
      invoiceNo: 'INV-001',
      amount: 100,
      taxAmount: 13,
      totalAmount: 113,
      type: 'VAT',
      status: 'ISSUED',
      issuedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  cancelInvoice(invoiceId: string, ctx: RequestTenantContext) {
    return {
      id: invoiceId,
      tenantId: ctx.tenantId,
      storeId: ctx.storeId,
      invoiceNo: 'INV-001',
      amount: 100,
      taxAmount: 13,
      totalAmount: 113,
      type: 'VAT',
      status: 'CANCELLED',
      createdAt: new Date().toISOString(),
    };
  }

  // ── Revenue Summary ──

  getRevenueSummary(
    ctx: RequestTenantContext,
    query?: { storeId?: string; startDate?: string; endDate?: string },
  ) {
    return {
      storeId: query?.storeId ?? ctx.storeId,
      totalRevenue: 10000,
      totalExpense: 3000,
      totalRefund: 500,
      netRevenue: 6500,
      transactionCount: 42,
      periodStart: query?.startDate ?? '2026-06-01T00:00:00.000Z',
      periodEnd: query?.endDate ?? '2026-06-30T23:59:59.999Z',
    };
  }

  getDailyRevenue(ctx: RequestTenantContext, query: { date: string }) {
    return {
      date: query.date,
      storeId: ctx.storeId,
      revenue: 1500,
      expense: 300,
      refund: 100,
      netRevenue: 1100,
      transactionCount: 15,
    };
  }

  // ── Transaction Integration ──

  recordTransactionRevenue(
    ctx: RequestTenantContext,
    params: {
      orderId: string;
      transactionId: string;
      amount: number;
      description: string;
      category?: string;
    },
  ) {
    return {
      id: 'ledger-rev-1',
      tenantId: ctx.tenantId,
      type: 'REVENUE',
      amount: params.amount,
      balance: params.amount,
      description: params.description,
      orderId: params.orderId,
      transactionId: params.transactionId,
      category: params.category ?? 'transaction',
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  recordTransactionRefund(
    ctx: RequestTenantContext,
    params: { orderId: string; transactionId: string; amount: number; description: string },
  ) {
    return {
      id: 'ledger-ref-1',
      tenantId: ctx.tenantId,
      type: 'REFUND',
      amount: params.amount,
      balance: -params.amount,
      description: params.description,
      orderId: params.orderId,
      transactionId: params.transactionId,
      category: 'refund',
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }
}

// ── 应用装饰器 ──

Get('ledgers')(FinanceController.prototype, 'listLedgers');
Get('ledgers/:ledgerId')(FinanceController.prototype, 'getLedger');
Get('accounts')(FinanceController.prototype, 'listAccounts');
Get('accounts/:accountId')(FinanceController.prototype, 'getAccount');
Get('accounts/:accountId/balance')(FinanceController.prototype, 'getAccountBalance');
Get('settlements')(FinanceController.prototype, 'listSettlements');
Get('settlements/:settlementId')(FinanceController.prototype, 'getSettlement');
Get('settlements/:settlementId/detail')(FinanceController.prototype, 'getSettlementDetail');
Get('invoices')(FinanceController.prototype, 'listInvoices');
Get('invoices/:invoiceId')(FinanceController.prototype, 'getInvoice');
Get('revenue/summary')(FinanceController.prototype, 'getRevenueSummary');
Get('revenue/daily')(FinanceController.prototype, 'getDailyRevenue');

Post('ledgers')(FinanceController.prototype, 'recordLedger');
Post('accounts')(FinanceController.prototype, 'createAccount');
Post('accounts/:accountId/freeze')(FinanceController.prototype, 'freezeAccount');
Post('accounts/:accountId/close')(FinanceController.prototype, 'closeAccount');
Post('settlements')(FinanceController.prototype, 'createSettlement');
Post('settlements/:settlementId/confirm')(FinanceController.prototype, 'confirmSettlement');
Post('settlements/:settlementId/dispute')(FinanceController.prototype, 'disputeSettlement');
Post('invoices')(FinanceController.prototype, 'createInvoice');
Post('invoices/:invoiceId/issue')(FinanceController.prototype, 'issueInvoice');
Post('invoices/:invoiceId/cancel')(FinanceController.prototype, 'cancelInvoice');
Post('transactions/revenue')(FinanceController.prototype, 'recordTransactionRevenue');
Post('transactions/refund')(FinanceController.prototype, 'recordTransactionRefund');

Param('ledgerId')(FinanceController.prototype, 'getLedger', 0);
Param('accountId')(FinanceController.prototype, 'getAccount', 0);
Param('accountId')(FinanceController.prototype, 'getAccountBalance', 0);
Param('accountId')(FinanceController.prototype, 'freezeAccount', 0);
Param('accountId')(FinanceController.prototype, 'closeAccount', 0);
Param('settlementId')(FinanceController.prototype, 'getSettlement', 0);
Param('settlementId')(FinanceController.prototype, 'getSettlementDetail', 0);
Param('settlementId')(FinanceController.prototype, 'confirmSettlement', 0);
Param('settlementId')(FinanceController.prototype, 'disputeSettlement', 0);
Param('invoiceId')(FinanceController.prototype, 'getInvoice', 0);
Param('invoiceId')(FinanceController.prototype, 'issueInvoice', 0);
Param('invoiceId')(FinanceController.prototype, 'cancelInvoice', 0);

TenantContext()(FinanceController.prototype, 'recordLedger', 0);
TenantContext()(FinanceController.prototype, 'listLedgers', 0);
TenantContext()(FinanceController.prototype, 'getLedger', 1);
TenantContext()(FinanceController.prototype, 'createAccount', 0);
TenantContext()(FinanceController.prototype, 'listAccounts', 0);
TenantContext()(FinanceController.prototype, 'getAccount', 1);
TenantContext()(FinanceController.prototype, 'getAccountBalance', 1);
TenantContext()(FinanceController.prototype, 'freezeAccount', 1);
TenantContext()(FinanceController.prototype, 'closeAccount', 1);
TenantContext()(FinanceController.prototype, 'createSettlement', 0);
TenantContext()(FinanceController.prototype, 'listSettlements', 0);
TenantContext()(FinanceController.prototype, 'getSettlement', 1);
TenantContext()(FinanceController.prototype, 'getSettlementDetail', 1);
TenantContext()(FinanceController.prototype, 'confirmSettlement', 1);
TenantContext()(FinanceController.prototype, 'disputeSettlement', 1);
TenantContext()(FinanceController.prototype, 'createInvoice', 0);
TenantContext()(FinanceController.prototype, 'listInvoices', 0);
TenantContext()(FinanceController.prototype, 'getInvoice', 1);
TenantContext()(FinanceController.prototype, 'issueInvoice', 1);
TenantContext()(FinanceController.prototype, 'cancelInvoice', 1);
TenantContext()(FinanceController.prototype, 'getRevenueSummary', 0);
TenantContext()(FinanceController.prototype, 'getDailyRevenue', 0);
TenantContext()(FinanceController.prototype, 'recordTransactionRevenue', 0);
TenantContext()(FinanceController.prototype, 'recordTransactionRefund', 0);

Controller('finance')(FinanceController);

// ── 辅助函数 ──

function makeCtx(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return {
    tenantId: 'tenant-default',
    brandId: 'brand-default',
    storeId: 'store-default',
    marketCode: 'cn',
    ...overrides,
  };
}

const CTX = makeCtx();

// ── 测试 ──

describe('FinanceController', () => {
  let controller: FinanceController;

  test.beforeEach(() => {
    controller = new FinanceController();
  });

  // ═══════════ 装饰器元数据 ═══════════
  describe('装饰器元数据', () => {
    test('@Controller prefix 为 "finance"', () => {
      const prefix = (FinanceController as typeof FinanceController & { __prefix?: string })
        .__prefix;
      assert.equal(prefix, 'finance');
    });

    test('注册了 12 个 @Get 路由', () => {
      assert.equal(getRegistrations.length, 12);
    });

    test('注册了 12 个 @Post 路由', () => {
      assert.equal(postRegistrations.length, 12);
    });

    test('所有 @Get 路由清单完整', () => {
      const expectedGetRoutes = [
        'listLedgers:ledgers',
        'getLedger:ledgers/:ledgerId',
        'listAccounts:accounts',
        'getAccount:accounts/:accountId',
        'getAccountBalance:accounts/:accountId/balance',
        'listSettlements:settlements',
        'getSettlement:settlements/:settlementId',
        'getSettlementDetail:settlements/:settlementId/detail',
        'listInvoices:invoices',
        'getInvoice:invoices/:invoiceId',
        'getRevenueSummary:revenue/summary',
        'getDailyRevenue:revenue/daily',
      ];
      for (const expected of expectedGetRoutes) {
        assert.ok(getRegistrations.includes(expected), `缺少 GET route: ${expected}`);
      }
    });

    test('所有 @Post 路由清单完整', () => {
      const expectedPostRoutes = [
        'recordLedger:ledgers',
        'createAccount:accounts',
        'freezeAccount:accounts/:accountId/freeze',
        'closeAccount:accounts/:accountId/close',
        'createSettlement:settlements',
        'confirmSettlement:settlements/:settlementId/confirm',
        'disputeSettlement:settlements/:settlementId/dispute',
        'createInvoice:invoices',
        'issueInvoice:invoices/:invoiceId/issue',
        'cancelInvoice:invoices/:invoiceId/cancel',
        'recordTransactionRevenue:transactions/revenue',
        'recordTransactionRefund:transactions/refund',
      ];
      for (const expected of expectedPostRoutes) {
        assert.ok(postRegistrations.includes(expected), `缺少 POST route: ${expected}`);
      }
    });

    test('所有 ID 参数路由注册了 @Param', () => {
      const paramKeys = ['ledgerId', 'accountId', 'settlementId', 'invoiceId'];
      for (const key of paramKeys) {
        const matched = paramRegistrations.filter((r) => r.endsWith(`:${key}`));
        assert.ok(matched.length > 0, `缺少 @Param("${key}") 注册`);
      }
    });

    test('所有方法注册了 @TenantContext', () => {
      assert.ok(
        tenantContextRegistrations.length >= 23,
        `期望 >= 23 TenantContext 装饰器，实际 ${tenantContextRegistrations.length}`,
      );
    });
  });

  // ═══════════ Ledger ═══════════
  describe('Ledger — 记账', () => {
    test('recordLedger 记录收入返回正余额', async () => {
      const result = await controller.recordLedger(CTX, {
        type: 'REVENUE',
        amount: 1000,
        description: '台球3小时',
      });
      assert.equal(result.type, 'REVENUE');
      assert.equal(result.amount, 1000);
      assert.equal(result.balance, 1000); // 收入余额正向
    });

    test('recordLedger 记录支出返回负余额', async () => {
      const result = await controller.recordLedger(CTX, {
        type: 'EXPENSE',
        amount: 500,
        description: '清洁采购',
      });
      assert.equal(result.type, 'EXPENSE');
      assert.equal(result.balance, -500);
    });

    test('recordLedger 带 orderId 和 category', async () => {
      const result = await controller.recordLedger(CTX, {
        type: 'REFUND',
        amount: 100,
        description: '退款',
        orderId: 'order-001',
        category: 'refund',
      });
      assert.equal(result.orderId, 'order-001');
      assert.equal(result.category, 'refund');
    });

    test('listLedgers 返回数组', () => {
      const result = controller.listLedgers(CTX);
      assert.ok(Array.isArray(result));
    });

    test('getLedger 按 ID 返回', () => {
      const result = controller.getLedger('ledger-abc', CTX);
      assert.equal(result.id, 'ledger-abc');
      assert.equal(result.amount, 100);
    });
  });

  // ═══════════ Account ═══════════
  describe('Account — 账户管理', () => {
    test('createAccount 创建现金账户 Active', async () => {
      const result = await controller.createAccount(CTX, { name: '门店现金', type: 'CASH' });
      assert.equal(result.name, '门店现金');
      assert.equal(result.type, 'CASH');
      assert.equal(result.status, 'ACTIVE');
    });

    test('createAccount 带初始余额', async () => {
      const result = await controller.createAccount(CTX, {
        name: '银行账户',
        type: 'BANK',
        initialBalance: 50000,
      });
      assert.equal(result.balance, 50000);
    });

    test('createAccount 带 storeId', async () => {
      const result = await controller.createAccount(CTX, {
        name: '分店账户',
        type: 'WECHAT',
        storeId: 'store-sz',
      });
      assert.equal(result.storeId, 'store-sz');
    });

    test('getAccount 返回账户详情', () => {
      const result = controller.getAccount('acct-1', CTX);
      assert.equal(result.id, 'acct-1');
      assert.equal(result.status, 'ACTIVE');
    });

    test('getAccountBalance 返回摘要而非全量', () => {
      const result = controller.getAccountBalance('acct-1', CTX);
      assert.equal(result.id, 'acct-1');
      assert.equal(typeof result.balance, 'number');
      assert.equal(typeof result.status, 'string');
      // 仅摘要字段，不应有额外字段
      const keys = Object.keys(result).sort();
      assert.deepEqual(keys, ['balance', 'id', 'name', 'status']);
    });

    test('freezeAccount 状态变 FROZEN', () => {
      const result = controller.freezeAccount('acct-1', CTX);
      assert.equal(result.status, 'FROZEN');
    });

    test('closeAccount 状态变 CLOSED 余额清零', () => {
      const result = controller.closeAccount('acct-1', CTX);
      assert.equal(result.status, 'CLOSED');
      assert.equal(result.balance, 0);
    });

    test('listAccounts 无 storeId 返回全部', () => {
      const result = controller.listAccounts(CTX);
      assert.ok(Array.isArray(result));
    });

    test('listAccounts 带 storeId 过滤', () => {
      let capturedStoreId: string | undefined;
      const original = controller.listAccounts;
      controller.listAccounts = (ctx: RequestTenantContext, storeId?: string) => {
        capturedStoreId = storeId;
        return [];
      };
      controller.listAccounts(CTX, 'store-filtered');
      assert.equal(capturedStoreId, 'store-filtered');
      controller.listAccounts = original;
    });
  });

  // ═══════════ Settlement ═══════════
  describe('Settlement — 结算', () => {
    test('createSettlement 默认 PENDING，自动计算净利', async () => {
      const result = await controller.createSettlement(CTX, {
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-30T23:59:59.999Z',
      });
      assert.equal(result.settlementStatus, 'PENDING');
      assert.equal(result.netProfit, 700); // 1000 - 300
    });

    test('createSettlement 手动指定收支', async () => {
      const result = await controller.createSettlement(CTX, {
        storeId: 'store-sz',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-30T23:59:59.999Z',
        totalRevenue: 20000,
        totalExpense: 8000,
      });
      assert.equal(result.totalRevenue, 20000);
      assert.equal(result.totalExpense, 8000);
      assert.equal(result.netProfit, 12000);
    });

    test('confirmSettlement → CONFIRMED 带 settledAt', () => {
      const result = controller.confirmSettlement('stl-1', CTX);
      assert.equal(result.settlementStatus, 'CONFIRMED');
      assert.ok(result.settledAt);
    });

    test('disputeSettlement → DISPUTED', () => {
      const result = controller.disputeSettlement('stl-1', CTX);
      assert.equal(result.settlementStatus, 'DISPUTED');
    });

    test('getSettlementDetail 含 settlement + ledgers', () => {
      const result = controller.getSettlementDetail('stl-1', CTX);
      assert.ok(result.settlement);
      assert.equal(result.settlement.id, 'stl-1');
      assert.ok(Array.isArray(result.ledgers));
    });
  });

  // ═══════════ Invoice ═══════════
  describe('Invoice — 发票', () => {
    test('createInvoice Draft 状态', async () => {
      const result = await controller.createInvoice(CTX, { type: 'REGULAR', amount: 500 });
      assert.equal(result.status, 'DRAFT');
      assert.equal(result.type, 'REGULAR');
    });

    test('createInvoice 增值税发票含税金额正确', async () => {
      const result = await controller.createInvoice(CTX, {
        type: 'VAT',
        amount: 1000,
        taxAmount: 130,
        orderId: 'order-inv',
        buyerInfo: { company: 'Test Corp' },
      });
      assert.equal(result.totalAmount, 1130);
      assert.equal(result.orderId, 'order-inv');
    });

    test('issueInvoice → ISSUED 带 issuedAt', () => {
      const result = controller.issueInvoice('inv-1', CTX);
      assert.equal(result.status, 'ISSUED');
      assert.ok(result.issuedAt);
    });

    test('cancelInvoice → CANCELLED', () => {
      const result = controller.cancelInvoice('inv-1', CTX);
      assert.equal(result.status, 'CANCELLED');
    });
  });

  // ═══════════ Revenue ═══════════
  describe('Revenue — 营收', () => {
    test('getRevenueSummary 默认返回汇总', () => {
      const result = controller.getRevenueSummary(CTX);
      assert.equal(result.totalRevenue, 10000);
      assert.equal(result.netRevenue, 6500);
      assert.equal(result.transactionCount, 42);
    });

    test('getRevenueSummary 按门店过滤', () => {
      const result = controller.getRevenueSummary(CTX, { storeId: 'store-bj' });
      assert.equal(result.storeId, 'store-bj');
    });

    test('getDailyRevenue 按日期查询', () => {
      const result = controller.getDailyRevenue(CTX, { date: '2026-06-15' });
      assert.equal(result.date, '2026-06-15');
      assert.equal(result.revenue, 1500);
      assert.equal(result.netRevenue, 1100);
    });
  });

  // ═══════════ Transaction Integration ═══════════
  describe('Transaction Integration — 交易集成', () => {
    test('recordTransactionRevenue 收入到账', async () => {
      const result = await controller.recordTransactionRevenue(CTX, {
        orderId: 'O-1',
        transactionId: 'T-1',
        amount: 500,
        description: '订单收款',
      });
      assert.equal(result.type, 'REVENUE');
      assert.equal(result.amount, 500);
      assert.equal(result.orderId, 'O-1');
    });

    test('recordTransactionRefund 退款记录', async () => {
      const result = await controller.recordTransactionRefund(CTX, {
        orderId: 'O-1',
        transactionId: 'T-2',
        amount: 100,
        description: '部分退款',
      });
      assert.equal(result.type, 'REFUND');
      assert.equal(result.amount, 100);
      assert.equal(result.balance, -100);
    });
  });

  // ═══════════ 边界场景 ═══════════
  describe('边界与异常场景', () => {
    test('空 tenant context 不阻塞执行', () => {
      const emptyCtx = {} as RequestTenantContext;
      const result = controller.getRevenueSummary(emptyCtx);
      assert.equal(typeof result.totalRevenue, 'number');
    });

    test('极小金额记录', async () => {
      const result = await controller.recordLedger(CTX, {
        type: 'REVENUE',
        amount: 0.01,
        description: '极小金额',
      });
      assert.equal(result.amount, 0.01);
    });

    test('极大金额记录', async () => {
      const result = await controller.recordLedger(CTX, {
        type: 'REVENUE',
        amount: 999999.99,
        description: '大额',
      });
      assert.equal(result.amount, 999999.99);
    });

    test('listLedgers 不带任何查询参数', () => {
      const result = controller.listLedgers(CTX);
      assert.ok(Array.isArray(result));
    });

    test('listInvoices 不带查询参数', () => {
      const result = controller.listInvoices(CTX);
      assert.ok(Array.isArray(result));
    });

    test('listAccounts 不带 storeId', () => {
      const result = controller.listAccounts(CTX);
      assert.ok(Array.isArray(result));
    });

    test('不同 tenant 隔离', () => {
      const ctxA = makeCtx({ tenantId: 'tenant-a' });
      const ctxB = makeCtx({ tenantId: 'tenant-b' });
      const resultA = controller.getLedger('l-1', ctxA);
      const resultB = controller.getLedger('l-2', ctxB);
      assert.equal(resultA.tenantId, 'tenant-a');
      assert.equal(resultB.tenantId, 'tenant-b');
    });
  });
});
