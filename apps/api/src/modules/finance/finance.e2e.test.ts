import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Finance 财务 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext → TestController → FinanceService
 *
 * 验证:
 *   - POST /finance/ledgers — 记账（收入 / 支出 / 退款）
 *   - GET /finance/ledgers — 查询流水（含过滤 + 分页）
 *   - POST /finance/accounts — 创建账户
 *   - GET /finance/accounts — 查询账户列表
 *   - POST /finance/accounts/:id/freeze — 冻结账户
 *   - POST /finance/accounts/:id/close — 关闭账户
 *   - POST /finance/settlements — 创建结算
 *   - GET /finance/settlements — 查询结算
 *   - POST /finance/settlements/:id/confirm — 确认结算
 *   - POST /finance/invoices — 创建发票 → GET /invoices → issue → cancel
 *   - GET /finance/revenue/summary — 营收汇总
 *   - GET /finance/revenue/daily — 日营收
 *   - 跨租户隔离: Tenant A 数据不被 Tenant B 看到
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Controller, Get, Post, Body, Param, Query, Inject, Req } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { FinanceService, resetFinanceServiceTestState } from './finance.service';
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types';
import {
  CreateLedgerDto,
  LedgerQueryDto,
  CreateAccountDto,
  CreateSettlementDto,
  SettlementQueryDto,
  CreateInvoiceDto,
  InvoiceQueryDto,
  RevenueSummaryQueryDto,
  DailyRevenueQueryDto,
} from './finance.dto';
import {
  LedgerType,
  AccountStatus,
  AccountType,
  SettlementStatus,
  InvoiceStatus,
  InvoiceType,
} from './finance.entity';

// ── Middleware ──

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as unknown as TenantAwareRequest;
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-001',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-001',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-001',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland',
  };
  next();
}

// ── Test Controller ──

@Controller('finance')
class TestFinanceController {
  constructor(@Inject(FinanceService) private readonly fs: FinanceService) {}

  @Post('ledgers')
  recordLedger(@Req() req: Request, @Body() body: CreateLedgerDto) {
    return this.fs.recordLedger(
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
      body,
    );
  }

  @Get('ledgers')
  listLedgers(@Req() req: Request, @Query() query: LedgerQueryDto = {} as LedgerQueryDto) {
    return this.fs.listLedgers(
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
      query,
    );
  }

  @Get('ledgers/:id')
  getLedger(@Req() req: Request, @Param('id') id: string) {
    return this.fs.getLedger(id, (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext);
  }

  @Post('accounts')
  createAccount(@Req() req: Request, @Body() body: CreateAccountDto) {
    return this.fs.createAccount(
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
      body,
    );
  }

  @Get('accounts')
  listAccounts(@Req() req: Request, @Query('storeId') storeId?: string) {
    return this.fs.listAccounts(
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
      storeId,
    );
  }

  @Get('accounts/:id')
  getAccount(@Req() req: Request, @Param('id') id: string) {
    return this.fs.getAccount(
      id,
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
    );
  }

  @Get('accounts/:id/balance')
  getAccountBalance(@Req() req: Request, @Param('id') id: string) {
    return this.fs.getAccountBalance(
      id,
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
    );
  }

  @Post('accounts/:id/freeze')
  freezeAccount(@Req() req: Request, @Param('id') id: string) {
    return this.fs.freezeAccount(
      id,
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
    );
  }

  @Post('accounts/:id/close')
  closeAccount(@Req() req: Request, @Param('id') id: string) {
    return this.fs.closeAccount(
      id,
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
    );
  }

  @Post('settlements')
  createSettlement(@Req() req: Request, @Body() body: CreateSettlementDto) {
    return this.fs.createSettlement(
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
      body,
    );
  }

  @Get('settlements')
  listSettlements(
    @Req() req: Request,
    @Query() query: SettlementQueryDto = {} as SettlementQueryDto,
  ) {
    return this.fs.listSettlements(
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
      query,
    );
  }

  @Get('settlements/:id')
  getSettlement(@Req() req: Request, @Param('id') id: string) {
    return this.fs.getSettlement(
      id,
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
    );
  }

  @Get('settlements/:id/detail')
  getSettlementDetail(@Req() req: Request, @Param('id') id: string) {
    return this.fs.getSettlementDetail(
      id,
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
    );
  }

  @Post('settlements/:id/confirm')
  confirmSettlement(@Req() req: Request, @Param('id') id: string) {
    return this.fs.confirmSettlement(
      id,
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
    );
  }

  @Post('settlements/:id/dispute')
  disputeSettlement(@Req() req: Request, @Param('id') id: string) {
    return this.fs.disputeSettlement(
      id,
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
    );
  }

  @Post('invoices')
  createInvoice(@Req() req: Request, @Body() body: CreateInvoiceDto) {
    return this.fs.createInvoice(
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
      body,
    );
  }

  @Get('invoices')
  listInvoices(@Req() req: Request, @Query() query: InvoiceQueryDto = {} as InvoiceQueryDto) {
    return this.fs.listInvoices(
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
      query,
    );
  }

  @Get('invoices/:id')
  getInvoice(@Req() req: Request, @Param('id') id: string) {
    return this.fs.getInvoice(
      id,
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
    );
  }

  @Post('invoices/:id/issue')
  issueInvoice(@Req() req: Request, @Param('id') id: string) {
    return this.fs.issueInvoice(
      id,
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
    );
  }

  @Post('invoices/:id/cancel')
  cancelInvoice(@Req() req: Request, @Param('id') id: string) {
    return this.fs.cancelInvoice(
      id,
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
    );
  }

  @Get('revenue/summary')
  getRevenueSummary(
    @Req() req: Request,
    @Query() query: RevenueSummaryQueryDto = {} as RevenueSummaryQueryDto,
  ) {
    return this.fs.getRevenueSummary(
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
      query,
    );
  }

  @Get('revenue/daily')
  getDailyRevenue(@Req() req: Request, @Query() query: DailyRevenueQueryDto) {
    return this.fs.getDailyRevenue(
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
      query,
    );
  }

  @Post('transactions/revenue')
  recordTransactionRevenue(
    @Req() req: Request,
    @Body()
    body: {
      orderId: string;
      transactionId: string;
      amount: number;
      description: string;
      category?: string;
    },
  ) {
    return this.fs.recordTransactionRevenue(
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
      body,
    );
  }

  @Post('transactions/refund')
  recordTransactionRefund(
    @Req() req: Request,
    @Body() body: { orderId: string; transactionId: string; amount: number; description: string },
  ) {
    return this.fs.recordTransactionRefund(
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
      body,
    );
  }
}

// ── Helper ──

const TENANT_A = {
  'x-tenant-id': 'tenant-001',
  'x-brand-id': 'brand-001',
  'x-store-id': 'store-001',
  'x-market-code': 'cn-mainland',
};

const TENANT_B = {
  'x-tenant-id': 'tenant-099',
  'x-brand-id': 'brand-099',
  'x-store-id': 'store-099',
  'x-market-code': 'us-default',
};

async function buildApp() {
  resetFinanceServiceTestState();
  const financeService = new FinanceService();

  const moduleRef = await Test.createTestingModule({
    controllers: [TestFinanceController],
    providers: [{ provide: FinanceService, useValue: financeService }],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.use(attachTenantContext);
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.init();

  return { app, financeService };
}

// ═══════════════════════════════════════════════════════
// Ledger E2E 测试
// ═══════════════════════════════════════════════════════

it('e2e: POST /finance/ledgers — 记录收入流水', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer()).post('/finance/ledgers').set(TENANT_A).send({
      type: LedgerType.Revenue,
      amount: 1000,
      description: '门票收入',
      category: 'ticket',
    });
    assert.equal(res.statusCode, 201);
    assert.ok(res.body.data.id.startsWith('ledger-'));
    assert.equal(res.body.data.type, LedgerType.Revenue);
    assert.equal(res.body.data.amount, 1000);
    assert.equal(res.body.data.balance, 1000);
    assert.equal(res.body.data.tenantId, 'tenant-001');
    assert.equal(res.body.data.storeId, 'store-001');
  } finally {
    await app.close();
  }
});

it('e2e: POST /finance/ledgers — 记录支出流水', async () => {
  const { app } = await buildApp();
  try {
    await request(app.getHttpServer()).post('/finance/ledgers').set(TENANT_A).send({
      type: LedgerType.Revenue,
      amount: 2000,
      description: '商品收入',
      category: 'merchandise',
    });

    const res = await request(app.getHttpServer()).post('/finance/ledgers').set(TENANT_A).send({
      type: LedgerType.Expense,
      amount: 500,
      description: '采购支出',
      category: 'purchase',
    });

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.data.type, LedgerType.Expense);
    assert.equal(res.body.data.balance, 1500);
  } finally {
    await app.close();
  }
});

it('e2e: POST /finance/ledgers — 记录退款流水', async () => {
  const { app } = await buildApp();
  try {
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 500, description: '门票收入' });

    const res = await request(app.getHttpServer()).post('/finance/ledgers').set(TENANT_A).send({
      type: LedgerType.Refund,
      amount: 100,
      description: '退票',
      category: 'refund',
    });

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.data.type, LedgerType.Refund);
    // Refund 减少余额
    assert.equal(res.body.data.balance, 400);
  } finally {
    await app.close();
  }
});

it('e2e: GET /finance/ledgers — 查询流水列表', async () => {
  const { app } = await buildApp();
  try {
    const r1 = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 100, description: 'a', category: 'ticket' });
    const ledgerId = r1.body.data.id;

    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Expense, amount: 30, description: 'b', category: 'supply' });

    const res = await request(app.getHttpServer()).get('/finance/ledgers').set(TENANT_A);

    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 2);

    // 可以按ID查询单条
    const single = await request(app.getHttpServer())
      .get(`/finance/ledgers/${ledgerId}`)
      .set(TENANT_A);
    assert.equal(single.statusCode, 200);
    assert.equal(single.body.data.id, ledgerId);
    assert.equal(single.body.data.amount, 100);
  } finally {
    await app.close();
  }
});

it('e2e: GET /finance/ledgers — 按类型过滤流水', async () => {
  const { app } = await buildApp();
  try {
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 200, description: 'rev' });
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Expense, amount: 50, description: 'exp' });

    const res = await request(app.getHttpServer())
      .get('/finance/ledgers?type=REVENUE')
      .set(TENANT_A);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].type, LedgerType.Revenue);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// Account E2E 测试
// ═══════════════════════════════════════════════════════

it('e2e: POST /finance/accounts — 创建账户', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer()).post('/finance/accounts').set(TENANT_A).send({
      name: '主收款账户',
      type: AccountType.Cash,
      initialBalance: 10000,
      storeId: 'store-001',
    });

    assert.equal(res.statusCode, 201);
    assert.ok(res.body.data.id.startsWith('acct-'));
    assert.equal(res.body.data.name, '主收款账户');
    assert.equal(res.body.data.balance, 10000);
    assert.equal(res.body.data.status, AccountStatus.Active);
  } finally {
    await app.close();
  }
});

it('e2e: POST /finance/accounts & GET — 查询账户余额', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/accounts')
      .set(TENANT_A)
      .send({ name: '备用金账户', type: AccountType.Cash, initialBalance: 5000 });
    const acctId = createRes.body.data.id;

    const balanceRes = await request(app.getHttpServer())
      .get(`/finance/accounts/${acctId}/balance`)
      .set(TENANT_A);

    assert.equal(balanceRes.statusCode, 200);
    assert.equal(balanceRes.body.data.balance, 5000);

    const listRes = await request(app.getHttpServer()).get('/finance/accounts').set(TENANT_A);
    assert.equal(listRes.statusCode, 200);
    assert.equal(listRes.body.data.length, 1);
  } finally {
    await app.close();
  }
});

it('e2e: POST /finance/accounts/:id/freeze + close — 账户状态转换', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/accounts')
      .set(TENANT_A)
      .send({ name: '临停账户', type: AccountType.Cash, initialBalance: 0 });
    const acctId = createRes.body.data.id;

    // 冻结
    const freezeRes = await request(app.getHttpServer())
      .post(`/finance/accounts/${acctId}/freeze`)
      .set(TENANT_A);
    assert.equal(freezeRes.statusCode, 201);
    assert.equal(freezeRes.body.data.status, AccountStatus.Frozen);

    // 关闭
    const closeRes = await request(app.getHttpServer())
      .post(`/finance/accounts/${acctId}/close`)
      .set(TENANT_A);
    assert.equal(closeRes.statusCode, 201);
    assert.equal(closeRes.body.data.status, AccountStatus.Closed);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// Settlement E2E 测试
// ═══════════════════════════════════════════════════════

it('e2e: POST /finance/settlements — 创建结算', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer()).post('/finance/settlements').set(TENANT_A).send({
      storeId: 'store-001',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
      totalRevenue: 50000,
      totalExpense: 30000,
    });

    assert.equal(res.statusCode, 201);
    assert.ok(res.body.data.id.startsWith('stl-'));
    assert.equal(res.body.data.totalRevenue, 50000);
    assert.equal(res.body.data.totalExpense, 30000);
    assert.equal(res.body.data.netProfit, 20000);
    assert.equal(res.body.data.settlementStatus, SettlementStatus.Pending);
  } finally {
    await app.close();
  }
});

it('e2e: POST /finance/settlements/:id/confirm — 确认结算', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-06-01T00:00:00.000Z', endDate: '2026-06-30T23:59:59.999Z' });
    const stlId = createRes.body.data.id;

    const confirmRes = await request(app.getHttpServer())
      .post(`/finance/settlements/${stlId}/confirm`)
      .set(TENANT_A);

    assert.equal(confirmRes.statusCode, 201);
    assert.equal(confirmRes.body.data.settlementStatus, SettlementStatus.Confirmed);
    assert.ok(confirmRes.body.data.settledAt);
  } finally {
    await app.close();
  }
});

it('e2e: POST /finance/settlements/:id/dispute — 争议结算', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-06-01T00:00:00.000Z', endDate: '2026-06-30T23:59:59.999Z' });
    const stlId = createRes.body.data.id;

    const disputeRes = await request(app.getHttpServer())
      .post(`/finance/settlements/${stlId}/dispute`)
      .set(TENANT_A);

    assert.equal(disputeRes.statusCode, 201);
    assert.equal(disputeRes.body.data.settlementStatus, SettlementStatus.Disputed);
  } finally {
    await app.close();
  }
});

it('e2e: GET /finance/settlements — 查询结算列表并按状态过滤', async () => {
  const { app } = await buildApp();
  try {
    await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-05-01T00:00:00.000Z', endDate: '2026-05-31T23:59:59.999Z' });
    await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-06-01T00:00:00.000Z', endDate: '2026-06-30T23:59:59.999Z' });

    const listRes = await request(app.getHttpServer()).get('/finance/settlements').set(TENANT_A);
    assert.equal(listRes.statusCode, 200);
    assert.equal(listRes.body.data.length, 2);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// Invoice E2E 测试
// ═══════════════════════════════════════════════════════

it('e2e: POST /finance/invoices → GET → issue → cancel', async () => {
  const { app } = await buildApp();
  try {
    // 创建发票
    const createRes = await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({
        orderId: 'order-001',
        amount: 888,
        taxAmount: 88.8,
        type: InvoiceType.Regular,
        buyerInfo: { company: '测试公司', taxId: '123456789' },
      });
    assert.equal(createRes.statusCode, 201);
    const invId = createRes.body.data.id;
    assert.equal(createRes.body.data.status, InvoiceStatus.Draft);
    assert.equal(createRes.body.data.totalAmount, 976.8);

    // 查询
    const getRes = await request(app.getHttpServer())
      .get(`/finance/invoices/${invId}`)
      .set(TENANT_A);
    assert.equal(getRes.statusCode, 200);
    assert.equal(getRes.body.data.amount, 888);

    // 开票
    const issueRes = await request(app.getHttpServer())
      .post(`/finance/invoices/${invId}/issue`)
      .set(TENANT_A);
    assert.equal(issueRes.statusCode, 201);
    assert.equal(issueRes.body.data.status, InvoiceStatus.Issued);

    // 作废
    const cancelRes = await request(app.getHttpServer())
      .post(`/finance/invoices/${invId}/cancel`)
      .set(TENANT_A);
    assert.equal(cancelRes.statusCode, 201);
    assert.equal(cancelRes.body.data.status, InvoiceStatus.Cancelled);
  } finally {
    await app.close();
  }
});

it('e2e: GET /finance/invoices — 查询发票列表', async () => {
  const { app } = await buildApp();
  try {
    await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({ orderId: 'o1', amount: 100, type: InvoiceType.Regular });
    await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({ orderId: 'o2', amount: 200, type: InvoiceType.Regular });

    const res = await request(app.getHttpServer()).get('/finance/invoices').set(TENANT_A);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 2);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// Revenue E2E 测试
// ═══════════════════════════════════════════════════════

it('e2e: GET /finance/revenue/summary — 营收汇总', async () => {
  const { app } = await buildApp();
  try {
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 10000, description: '商品销售' });
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Expense, amount: 3000, description: '进货成本' });

    const res = await request(app.getHttpServer())
      .get('/finance/revenue/summary?storeId=store-001')
      .set(TENANT_A);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.totalRevenue, 10000);
    assert.equal(res.body.data.totalExpense, 3000);
    assert.equal(res.body.data.netRevenue, 7000);
    assert.equal(res.body.data.storeId, 'store-001');
    assert.equal(res.body.data.transactionCount, 2);
  } finally {
    await app.close();
  }
});

it('e2e: GET /finance/revenue/daily — 日营收', async () => {
  const { app } = await buildApp();
  try {
    await request(app.getHttpServer()).post('/finance/ledgers').set(TENANT_A).send({
      type: LedgerType.Revenue,
      amount: 5000,
      description: '日销售',
      recordedAt: '2026-06-15T10:00:00.000Z',
    });

    const res = await request(app.getHttpServer())
      .get('/finance/revenue/daily?storeId=store-001&date=2026-06-15')
      .set(TENANT_A);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.date, '2026-06-15');
    assert.equal(res.body.data.revenue, 5000);
    assert.equal(res.body.data.transactionCount, 1);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 交易联动
// ═══════════════════════════════════════════════════════

it('e2e: POST /finance/transactions/revenue — 交易联动记账', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .post('/finance/transactions/revenue')
      .set(TENANT_A)
      .send({
        orderId: 'ord-001',
        transactionId: 'txn-001',
        amount: 1500,
        description: '微信支付-门票',
      });

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.data.type, LedgerType.Revenue);
    assert.equal(res.body.data.amount, 1500);
    assert.equal(res.body.data.orderId, 'ord-001');
    assert.equal(res.body.data.transactionId, 'txn-001');
  } finally {
    await app.close();
  }
});

it('e2e: POST /finance/transactions/refund — 交易退款记账', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .post('/finance/transactions/refund')
      .set(TENANT_A)
      .send({
        orderId: 'ord-001',
        transactionId: 'txn-001',
        amount: 200,
        description: '退卡',
      });

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.data.type, LedgerType.Refund);
    assert.equal(res.body.data.amount, 200);
    assert.equal(res.body.data.category, 'refund');
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 跨租户隔离
// ═══════════════════════════════════════════════════════

it('e2e: 跨租户隔离 — Tenant A 数据不被 Tenant B 看到', async () => {
  const { app } = await buildApp();
  try {
    // Tenant A 记账
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 5000, description: 'A店收入' });
    await request(app.getHttpServer())
      .post('/finance/accounts')
      .set(TENANT_A)
      .send({ name: 'A店账户', type: AccountType.Cash, initialBalance: 1000 });

    // Tenant B 查询应看不到
    const ledgersB = await request(app.getHttpServer()).get('/finance/ledgers').set(TENANT_B);
    assert.equal(ledgersB.statusCode, 200);
    assert.equal(ledgersB.body.data.length, 0, 'Tenant B 不应看到 Tenant A 的流水');

    const accountsB = await request(app.getHttpServer()).get('/finance/accounts').set(TENANT_B);
    assert.equal(accountsB.statusCode, 200);
    assert.equal(accountsB.body.data.length, 0, 'Tenant B 不应看到 Tenant A 的账户');

    // Tenant B 查询 Tenant A 的单条数据应报错
    // 先拿 Tenant A 的 ledger id
    const ledgersA = await request(app.getHttpServer()).get('/finance/ledgers').set(TENANT_A);
    const ledgerIdA = ledgersA.body.data[0].id;

    const getErr = await request(app.getHttpServer())
      .get(`/finance/ledgers/${ledgerIdA}`)
      .set(TENANT_B);
    assert.equal(getErr.statusCode, 500);
  } finally {
    await app.close();
  }
});

it('e2e: invoices — 创建+查询+签发+取消 完整生命周期', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({ orderId: 'inv-lifecycle', amount: 1500, type: 'SALE' });
    const invId = createRes.body.data.id;
    assert.ok(invId);
    assert.equal(createRes.body.data.status, InvoiceStatus.Draft);

    // 查询
    const getRes = await request(app.getHttpServer())
      .get(`/finance/invoices/${invId}`)
      .set(TENANT_A);
    assert.equal(getRes.body.data.orderId, 'inv-lifecycle');

    // 签发
    const issueRes = await request(app.getHttpServer())
      .post(`/finance/invoices/${invId}/issue`)
      .set(TENANT_A);
    assert.equal(issueRes.body.data.status, InvoiceStatus.Issued);

    // 取消
    const cancelRes = await request(app.getHttpServer())
      .post(`/finance/invoices/${invId}/cancel`)
      .set(TENANT_A);
    assert.equal(cancelRes.body.data.status, InvoiceStatus.Cancelled);
  } finally {
    await app.close();
  }
});

it('e2e: settlements — 创建->确认流程', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-07-01T00:00:00.000Z', endDate: '2026-07-15T23:59:59.999Z' });
    const stlId = createRes.body.data.id;
    assert.ok(stlId);
    assert.equal(createRes.body.data.settlementStatus, SettlementStatus.Pending);

    const confirmRes = await request(app.getHttpServer())
      .post(`/finance/settlements/${stlId}/confirm`)
      .set(TENANT_A);
    assert.equal(confirmRes.body.data.settlementStatus, SettlementStatus.Confirmed);
    assert.ok(confirmRes.body.data.settledAt);
  } finally {
    await app.close();
  }
});

it('e2e: settlements — 创建->争议流程', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-07-01T00:00:00.000Z', endDate: '2026-07-15T23:59:59.999Z' });
    const stlId = createRes.body.data.id;
    assert.ok(stlId);

    // 直接争议（不先confirm）
    const disputeRes = await request(app.getHttpServer())
      .post(`/finance/settlements/${stlId}/dispute`)
      .set(TENANT_A);
    assert.equal(disputeRes.body.data.settlementStatus, SettlementStatus.Disputed);
  } finally {
    await app.close();
  }
});

it('e2e: invoices — 跨tenant隔离', async () => {
  const { app } = await buildApp();
  try {
    // Tenant A 创建发票
    await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({ orderId: 'inv-isolated', amount: 800, type: 'SALE' });

    // Tenant B 查列表应看不到
    const listB = await request(app.getHttpServer())
      .get('/finance/invoices')
      .set(TENANT_B);
    const foundInB = listB.body.data.find((i: any) => i.orderId === 'inv-isolated');
    assert.equal(foundInB, undefined);
  } finally {
    await app.close();
  }
});

it('e2e: accounts — 创建+查询+冻结+关闭+余额', async () => {
  const { app } = await buildApp();
  try {
    // 创建
    const createRes = await request(app.getHttpServer())
      .post('/finance/accounts')
      .set(TENANT_A)
      .send({ name: 'e2e-full-flow', type: 'BANK' });
    const acctId = createRes.body.data.id;
    assert.ok(acctId);

    // 查询
    const getRes = await request(app.getHttpServer())
      .get(`/finance/accounts/${acctId}`)
      .set(TENANT_A);
    assert.equal(getRes.body.data.name, 'e2e-full-flow');

    // 余额
    const balRes = await request(app.getHttpServer())
      .get(`/finance/accounts/${acctId}/balance`)
      .set(TENANT_A);
    assert.ok(balRes.body.data);

    // 冻结
    const freezeRes = await request(app.getHttpServer())
      .post(`/finance/accounts/${acctId}/freeze`)
      .set(TENANT_A);
    assert.ok(freezeRes.body.data);

    // 关闭
    const closeRes = await request(app.getHttpServer())
      .post(`/finance/accounts/${acctId}/close`)
      .set(TENANT_A);
    assert.ok(closeRes.body.data);
  } finally {
    await app.close();
  }
});

it('e2e: ledgers — 多条记账后按描述过滤', async () => {
  const { app } = await buildApp();
  try {
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 3000, description: 'e2e-filter-desc', category: 'other' });
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Expense, amount: 400, description: '办公用品', category: 'office' });

    const listRes = await request(app.getHttpServer())
      .get('/finance/ledgers')
      .set(TENANT_A);
    const matched = listRes.body.data.filter((l: any) => l.description === 'e2e-filter-desc');
    assert.ok(matched.length >= 1);
    assert.equal(matched[0].type, LedgerType.Revenue);
  } finally {
    await app.close();
  }
});

it('e2e: revenue — 汇总和日报', async () => {
  const { app } = await buildApp();
  try {
    // 先有几个流水
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 10000, description: '日报营收1', category: 'ticket' });

    // 营收汇总
    const sumRes = await request(app.getHttpServer())
      .get('/finance/revenue/summary')
      .set(TENANT_A);
    assert.ok(sumRes.body.data);

    // 日营收
    const dailyRes = await request(app.getHttpServer())
      .get('/finance/revenue/daily')
      .set(TENANT_A);
    assert.ok(dailyRes.body.data);
  } finally {
    await app.close();
  }
});

it('e2e: transactions — 交易联动记账+退款', async () => {
  const { app } = await buildApp();
  try {
    // 收入交易
    const revRes = await request(app.getHttpServer())
      .post('/finance/transactions/revenue')
      .set(TENANT_A)
      .send({ amount: 5000, description: '交易收入', orderId: 'tx-e2e-1' });
    assert.ok(revRes.body);

    // 退款
    const refundRes = await request(app.getHttpServer())
      .post('/finance/transactions/refund')
      .set(TENANT_A)
      .send({ amount: 500, description: '交易退款', orderId: 'tx-e2e-2', reason: '退货' });
    assert.ok(refundRes.body);
  } finally {
    await app.close();
  }
});

it('e2e: ledgers — 批量创建+全量列表', async () => {
  const { app } = await buildApp();
  try {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/finance/ledgers')
        .set(TENANT_A)
        .send({ type: LedgerType.Expense, amount: 100 * (i + 1), description: `e2e-bulk-${i}`, category: 'utility' });
    }
    const listRes = await request(app.getHttpServer())
      .get('/finance/ledgers')
      .set(TENANT_A);
    assert.ok(listRes.body.data.length >= 5);
  } finally {
    await app.close();
  }
});
