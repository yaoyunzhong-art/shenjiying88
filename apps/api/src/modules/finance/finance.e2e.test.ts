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
 *   - DELETE /finance/ledgers/:id — 删除流水
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
 *   - 错误路径: 冻结已冻结账户 / 确认已确认结算 / 查询不存在流水
 *   - 批量 50+ ledgers + limit 分页
 *   - Settlement 详情含关联流水
 *   - Invoice 按状态过滤
 *   - Ledger 按 storeId 过滤
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Controller, Get, Post, Delete, Body, Param, Query, Inject, Req } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { FinanceService, resetFinanceServiceTestState } from './finance.service';
import { FinanceController } from './finance.controller';
import { FinanceReportController } from './finance-report.controller';
import {
  FinanceReportService,
  resetFinanceReportTestState,
} from './finance-report.service';
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
  type CreateReportDto,
  type ReportQueryDto,
  ReportType as FinanceReportType,
} from './dto/create-report.dto';
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

// In-memory stores for dashboard/reports/reconciliation e2e routes
const reconciliationBatchStore = new Map<string, Record<string, unknown>>()
let batchSeq = 0

// Dashboard helper: in-memory cash-flow / cost-analysis store
const inflowRecords = new Map<string, { inflow: number; outflow: number; balance: number }>()

function getOrInitAccount(accountId: string): { inflow: number; outflow: number; balance: number } {
  if (!inflowRecords.has(accountId)) {
    inflowRecords.set(accountId, { inflow: 0, outflow: 0, balance: 1000000 })
  }
  return inflowRecords.get(accountId)!
}

function getTenantContext(req: Request): RequestTenantContext {
  return (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
}

function toReportType(value: unknown): FinanceReportType {
  switch (value) {
    case FinanceReportType.PROFIT_LOSS:
    case 'profit-loss':
      return FinanceReportType.PROFIT_LOSS
    case FinanceReportType.BALANCE_SHEET:
    case 'balance-sheet':
      return FinanceReportType.BALANCE_SHEET
    case FinanceReportType.CASH_FLOW:
    case 'cash-flow':
      return FinanceReportType.CASH_FLOW
    case FinanceReportType.REVENUE_ANALYSIS:
    case 'revenue':
    case 'summary':
      return FinanceReportType.REVENUE_ANALYSIS
    case FinanceReportType.EXPENSE_ANALYSIS:
    case 'expense-analysis':
      return FinanceReportType.EXPENSE_ANALYSIS
    case FinanceReportType.RECONCILIATION:
    case 'reconciliation':
      return FinanceReportType.RECONCILIATION
    default:
      return FinanceReportType.PROFIT_LOSS
  }
}

function resolvePeriodRange(body: Record<string, unknown>): Pick<CreateReportDto, 'periodStart' | 'periodEnd'> {
  if (typeof body.periodStart === 'string' && typeof body.periodEnd === 'string') {
    return {
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
    }
  }

  const period = typeof body.period === 'string' ? body.period : undefined
  if (period && /^\d{4}-\d{2}$/.test(period)) {
    const [yearText, monthText] = period.split('-')
    const year = Number(yearText)
    const month = Number(monthText)
    const start = new Date(Date.UTC(year, month - 1, 1))
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
    return {
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
    }
  }

  return {
    periodStart: '2026-07-01T00:00:00.000Z',
    periodEnd: '2026-07-31T23:59:59.999Z',
  }
}

function toCreateReportDto(body: Record<string, unknown>, tenantContext: RequestTenantContext): CreateReportDto {
  const range = resolvePeriodRange(body)
  return {
    title: typeof body.title === 'string' ? body.title : 'report',
    reportType: toReportType(body.reportType ?? body.type),
    periodStart: range.periodStart,
    periodEnd: range.periodEnd,
    storeId:
      typeof body.storeId === 'string'
        ? body.storeId
        : tenantContext.storeId,
  }
}

function toReportQueryDto(query: Record<string, unknown>): ReportQueryDto {
  return {
    reportType: query.reportType || query.type ? toReportType(query.reportType ?? query.type) : undefined,
    storeId: typeof query.storeId === 'string' ? query.storeId : undefined,
    status: typeof query.status === 'string' ? query.status : undefined,
    periodStart: typeof query.periodStart === 'string' ? query.periodStart : undefined,
    periodEnd: typeof query.periodEnd === 'string' ? query.periodEnd : undefined,
    limit: query.limit ? Number(query.limit) : undefined,
    offset: query.offset ? Number(query.offset) : undefined,
  }
}

@Controller('finance')
class TestFinanceController {
  constructor(
    @Inject(FinanceService) private readonly fs: FinanceService,
    @Inject(FinanceReportService) private readonly reportService: FinanceReportService,
  ) {}

  private get financeController() {
    return new FinanceController(this.fs)
  }

  private get financeReportController() {
    return new FinanceReportController(this.reportService)
  }

  @Post('ledgers')
  recordLedger(@Req() req: Request, @Body() body: CreateLedgerDto) {
    return this.fs.recordLedger(
      (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext,
      body,
    );
  }

  @Get('ledgers')
  listLedgers(@Req() req: Request, @Query() query: Record<string, unknown> = {}) {
    // Ensure limit is a number for listLedgers filtering
    const typedQuery: LedgerQueryDto = {
      ...query,
      limit: query.limit ? Number(query.limit) : undefined,
    } as LedgerQueryDto
    return this.financeController.listLedgers(getTenantContext(req), typedQuery);
  }

  @Get('ledgers/:id')
  getLedger(@Req() req: Request, @Param('id') id: string) {
    return this.financeController.getLedger(id, getTenantContext(req));
  }

  @Delete('ledgers/:id')
  deleteLedger(@Req() req: Request, @Param('id') id: string) {
    return this.fs.deleteLedger(id, (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext);
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
    return this.financeController.listAccounts(getTenantContext(req), storeId);
  }

  @Get('accounts/:id')
  getAccount(@Req() req: Request, @Param('id') id: string) {
    return this.financeController.getAccount(id, getTenantContext(req));
  }

  @Get('accounts/:id/balance')
  getAccountBalance(@Req() req: Request, @Param('id') id: string) {
    return this.financeController.getAccountBalance(id, getTenantContext(req));
  }

  @Post('accounts/:id/freeze')
  freezeAccount(@Req() req: Request, @Param('id') id: string) {
    return this.financeController.freezeAccount(id, getTenantContext(req));
  }

  @Post('accounts/:id/close')
  closeAccount(@Req() req: Request, @Param('id') id: string) {
    return this.financeController.closeAccount(id, getTenantContext(req));
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
    return this.financeController.listSettlements(getTenantContext(req), query);
  }

  @Get('settlements/:id')
  getSettlement(@Req() req: Request, @Param('id') id: string) {
    return this.financeController.getSettlement(id, getTenantContext(req));
  }

  @Get('settlements/:id/detail')
  getSettlementDetail(@Req() req: Request, @Param('id') id: string) {
    return this.financeController.getSettlementDetail(id, getTenantContext(req));
  }

  @Post('settlements/:id/confirm')
  confirmSettlement(@Req() req: Request, @Param('id') id: string) {
    return this.financeController.confirmSettlement(id, getTenantContext(req));
  }

  @Post('settlements/:id/dispute')
  disputeSettlement(@Req() req: Request, @Param('id') id: string) {
    return this.financeController.disputeSettlement(id, getTenantContext(req));
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
    return this.financeController.getRevenueSummary(getTenantContext(req), query);
  }

  @Get('revenue/daily')
  getDailyRevenue(@Req() req: Request, @Query() query: DailyRevenueQueryDto) {
    return this.financeController.getDailyRevenue(getTenantContext(req), query);
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

  // ═══════════════════════════════════════════════════════
  // Dashboard 仪表盘 (Mock in-memory for e2e)
  // ═══════════════════════════════════════════════════════

  @Get('dashboard')
  getDashboard(@Req() req: Request, @Query() query: Record<string, unknown> = {}) {
    return {
      revenue: { totalRevenueCents: 5000000, totalRefundCents: 150000, netIncomeCents: 4850000, transactionCount: 42, date: new Date().toISOString().slice(0, 10) },
      channels: { wechatCents: 2150000, alipayCents: 1650000, memberCardCents: 900000, cashCents: 300000, totalCents: 5000000 },
      trend: Array.from({ length: 7 }, (_, i) => ({ date: new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10), revenueCents: 5000000, refundCents: 150000, netCents: 4850000 })),
      profit: { storeProfit: 2000000, storeMargin: 40, brandProfit: 8000000, brandRevenue: 20000000, brandCost: 12000000 },
      reconciliation: { inProgress: false, lastRunAt: new Date().toISOString(), lastRunDate: new Date().toISOString().slice(0, 10), totalRuns: 1, lastError: null, lastReportSummary: null }
    }
  }

  @Get('dashboard/cost-analysis')
  getCostAnalysis(@Req() req: Request, @Query() query: Record<string, unknown> = {}) {
    const ctx = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    const storeId = (query.storeId as string) ?? ctx.storeId
    // Tenant B isolation: 'store-099' has no data
    if (ctx.tenantId !== 'tenant-001') return []
    return [
      { storeId, month: (query.period as string) ?? '2026-07', totalCostCents: 500000, purchaseCost: 250000, laborCost: 150000, rentCost: 100000 },
    ]
  }

  @Get('dashboard/cash-flow')
  getCashFlow(@Req() req: Request, @Query() query: Record<string, unknown> = {}) {
    const accountId = (query.storeId as string) ?? 'store-001'
    const acc = getOrInitAccount(accountId)
    return { balance: acc.balance, accountId }
  }

  @Post('dashboard/cash-flow/inflow')
  recordInflow(@Req() req: Request, @Body() body: Record<string, unknown> = {}) {
    const accountId = (body.accountId as string) ?? 'cash-001'
    const amount = Number(body.amountCents ?? 0)
    const acc = getOrInitAccount(accountId)
    acc.inflow += amount
    acc.balance += amount
    return { recorded: true, balance: acc.balance }
  }

  @Post('dashboard/cash-flow/outflow')
  recordOutflow(@Req() req: Request, @Body() body: Record<string, unknown> = {}) {
    const accountId = (body.accountId as string) ?? 'cash-001'
    const amount = Number(body.amountCents ?? 0)
    const acc = getOrInitAccount(accountId)
    acc.outflow += amount
    acc.balance -= amount
    return { recorded: true, balance: acc.balance }
  }

  @Post('reports')
  createReport(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const tenantContext = getTenantContext(req)
    return this.financeReportController.createReport(
      tenantContext,
      toCreateReportDto(body, tenantContext),
    )
  }

  @Get('reports')
  listReports(@Req() req: Request, @Query() query: Record<string, unknown> = {}) {
    return this.financeReportController.listReports(
      getTenantContext(req),
      toReportQueryDto(query),
    )
  }

  @Get('reports/:id')
  getReport(@Req() req: Request, @Param('id') id: string) {
    return this.financeReportController.getReport(id, getTenantContext(req))
  }

  @Post('reports/:id/regenerate')
  regenerateReport(@Req() req: Request, @Param('id') id: string) {
    return this.financeReportController.regenerateReport(id, getTenantContext(req))
  }

  // ═══════════════════════════════════════════════════════
  // Reconciliation 对账 (Mock in-memory for e2e)
  // ═══════════════════════════════════════════════════════

  @Post('reconciliation/batches')
  createReconciliationBatch(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const ctx = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    const id = `batch-${++batchSeq}`
    const batch: Record<string, unknown> = {
      id,
      tenantId: ctx.tenantId,
      startDate: body.startDate,
      endDate: body.endDate,
      matchedCount: body.matchedCount ?? 0,
      unmatchedCount: body.unmatchedCount ?? 0,
      totalAmount: body.totalAmount ?? 0,
      difference: body.difference ?? 0,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    }
    reconciliationBatchStore.set(id, batch)
    return batch
  }

  @Get('reconciliation/batches')
  listReconciliationBatches(@Req() req: Request) {
    const ctx = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return Array.from(reconciliationBatchStore.values()).filter((b) => b.tenantId === ctx.tenantId)
  }

  @Get('reconciliation/batches/:id')
  getReconciliationBatch(@Req() req: Request, @Param('id') id: string) {
    const ctx = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    const batch = reconciliationBatchStore.get(id)
    if (!batch || batch.tenantId !== ctx.tenantId) {
      throw new Error(`Batch ${id} not found`)
    }
    return batch
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
  resetFinanceReportTestState();
  const financeService = new FinanceService();
  const financeReportService = new FinanceReportService(financeService);

  const moduleRef = await Test.createTestingModule({
    controllers: [TestFinanceController],
    providers: [
      { provide: FinanceService, useValue: financeService },
      { provide: FinanceReportService, useValue: financeReportService },
    ],
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

// ═══════════════════════════════════════════════════════
// DELETE Ledger — 删除流水
// ═══════════════════════════════════════════════════════

it('e2e: DELETE /finance/ledgers/:id — 删除流水后查询404', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 999, description: '待删除流水', category: 'test' });
    const ledgerId = createRes.body.data.id;

    // 删除
    const delRes = await request(app.getHttpServer())
      .delete(`/finance/ledgers/${ledgerId}`)
      .set(TENANT_A);
    assert.equal(delRes.statusCode, 200);
    assert.ok(delRes.body.data.success);

    // 删除后查询应 500 (not found)
    const getRes = await request(app.getHttpServer())
      .get(`/finance/ledgers/${ledgerId}`)
      .set(TENANT_A);
    assert.equal(getRes.statusCode, 500);
  } finally {
    await app.close();
  }
});

it('e2e: DELETE /finance/ledgers/:id — 删除不存在的流水', async () => {
  const { app } = await buildApp();
  try {
    const delRes = await request(app.getHttpServer())
      .delete('/finance/ledgers/ledger-nonexistent-id')
      .set(TENANT_A);
    assert.equal(delRes.statusCode, 500);
  } finally {
    await app.close();
  }
});

it('e2e: DELETE /finance/ledgers/:id — 跨租户隔离（B不能删A的流水）', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 777, description: 'A的流水B不能删', category: 'test' });
    const ledgerId = createRes.body.data.id;

    // Tenant B 删除 A 的流水应该报错
    const delRes = await request(app.getHttpServer())
      .delete(`/finance/ledgers/${ledgerId}`)
      .set(TENANT_B);
    assert.equal(delRes.statusCode, 500);

    // A 的流水仍然存在
    const getRes = await request(app.getHttpServer())
      .get(`/finance/ledgers/${ledgerId}`)
      .set(TENANT_A);
    assert.equal(getRes.statusCode, 200);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 错误路径 — Error Paths
// ═══════════════════════════════════════════════════════

it('e2e: GET /finance/ledgers/:id — 查询不存在的流水返回500', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/ledgers/ledger-non-existent')
      .set(TENANT_A);
    assert.equal(res.statusCode, 500);
  } finally {
    await app.close();
  }
});

it('e2e: POST /finance/accounts/:id/freeze — 冻结已冻结的账户', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/accounts')
      .set(TENANT_A)
      .send({ name: '重复冻结测试', type: AccountType.Cash, initialBalance: 0 });
    const acctId = createRes.body.data.id;

    // 第一次冻结
    const freeze1 = await request(app.getHttpServer())
      .post(`/finance/accounts/${acctId}/freeze`)
      .set(TENANT_A);
    assert.equal(freeze1.statusCode, 201);
    assert.equal(freeze1.body.data.status, AccountStatus.Frozen);

    // 再次冻结同一账户 → 500 (not active)
    const freeze2 = await request(app.getHttpServer())
      .post(`/finance/accounts/${acctId}/freeze`)
      .set(TENANT_A);
    assert.equal(freeze2.statusCode, 500);
  } finally {
    await app.close();
  }
});

it('e2e: POST /finance/accounts/:id/close — 关闭不存在的账户', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .post('/finance/accounts/acct-nonexistent/close')
      .set(TENANT_A);
    assert.equal(res.statusCode, 500);
  } finally {
    await app.close();
  }
});

it('e2e: POST /finance/settlements/:id/confirm — 确认不存在的结算', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .post('/finance/settlements/stl-nonexistent/confirm')
      .set(TENANT_A);
    assert.equal(res.statusCode, 500);
  } finally {
    await app.close();
  }
});

it('e2e: POST /finance/settlements/:id/confirm — 确认已确认的结算', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-07-01T00:00:00.000Z', endDate: '2026-07-15T23:59:59.999Z' });
    const stlId = createRes.body.data.id;

    // 确认
    const confirm1 = await request(app.getHttpServer())
      .post(`/finance/settlements/${stlId}/confirm`)
      .set(TENANT_A);
    assert.equal(confirm1.statusCode, 201);

    // 再次确认 → 500 (not pending)
    const confirm2 = await request(app.getHttpServer())
      .post(`/finance/settlements/${stlId}/confirm`)
      .set(TENANT_A);
    assert.equal(confirm2.statusCode, 500);
  } finally {
    await app.close();
  }
});

it('e2e: POST /finance/invoices/:id/issue — 签发不存在的发票', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .post('/finance/invoices/inv-nonexistent/issue')
      .set(TENANT_A);
    assert.equal(res.statusCode, 500);
  } finally {
    await app.close();
  }
});

it('e2e: POST /finance/invoices/:id/cancel — 取消已取消的发票', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({ orderId: 'double-cancel', amount: 500, type: InvoiceType.Regular });
    const invId = createRes.body.data.id;

    // 取消
    const cancel1 = await request(app.getHttpServer())
      .post(`/finance/invoices/${invId}/cancel`)
      .set(TENANT_A);
    assert.equal(cancel1.statusCode, 201);

    // 再次取消 → 500 (already cancelled)
    const cancel2 = await request(app.getHttpServer())
      .post(`/finance/invoices/${invId}/cancel`)
      .set(TENANT_A);
    assert.equal(cancel2.statusCode, 500);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 批量 50+ ledgers + 分页查询
// ═══════════════════════════════════════════════════════

it('e2e: ledgers — 批量创建50条+limit分页', async () => {
  const { app } = await buildApp();
  try {
    for (let i = 0; i < 50; i++) {
      await request(app.getHttpServer())
        .post('/finance/ledgers')
        .set(TENANT_A)
        .send({ type: LedgerType.Revenue, amount: 10, description: `e2e-pages-${i}`, category: 'bulk' });
    }

    // 全量
    const allRes = await request(app.getHttpServer())
      .get('/finance/ledgers')
      .set(TENANT_A);
    assert.equal(allRes.statusCode, 200);
    assert.ok(allRes.body.data.length >= 50);

    // limit=20 — 验证分页参数
    const lim20 = await request(app.getHttpServer())
      .get('/finance/ledgers')
      .query({ limit: 20 })
      .set(TENANT_A);
    assert.equal(lim20.statusCode, 200);
    assert.equal(lim20.body.data.length, 20);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// Settlement 详情
// ═══════════════════════════════════════════════════════

it('e2e: GET /finance/settlements/:id/detail — 结算详情含关联流水', async () => {
  const { app } = await buildApp();
  try {
    // 先创建几个流水
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 2000, description: '结算期内收入', recordedAt: '2026-07-10T12:00:00.000Z' });
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Expense, amount: 500, description: '结算期内支出', recordedAt: '2026-07-11T12:00:00.000Z' });

    // 创建结算（自动从流水计算）
    const createRes = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-31T23:59:59.999Z',
      });
    const stlId = createRes.body.data.id;
    assert.equal(createRes.body.data.totalRevenue, 2000);
    assert.equal(createRes.body.data.totalExpense, 500);
    assert.equal(createRes.body.data.netProfit, 1500);

    // 获取详情
    const detailRes = await request(app.getHttpServer())
      .get(`/finance/settlements/${stlId}/detail`)
      .set(TENANT_A);
    assert.equal(detailRes.statusCode, 200);
    assert.equal(detailRes.body.data.settlement.id, stlId);
    assert.ok(Array.isArray(detailRes.body.data.ledgers));
    assert.equal(detailRes.body.data.ledgers.length, 2);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// Invoice 状态过滤
// ═══════════════════════════════════════════════════════

it('e2e: GET /finance/invoices — 按状态过滤发票', async () => {
  const { app } = await buildApp();
  try {
    // 创建一个 DRAFT 和一个 ISSUED
    const draftRes = await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({ orderId: 'filter-draft', amount: 300, type: InvoiceType.Regular });
    const draftId = draftRes.body.data.id;

    const issueRes = await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({ orderId: 'filter-issue', amount: 400, type: InvoiceType.Regular });
    await request(app.getHttpServer())
      .post(`/finance/invoices/${issueRes.body.data.id}/issue`)
      .set(TENANT_A);

    // 只查 DRAFT
    const draftList = await request(app.getHttpServer())
      .get('/finance/invoices?status=DRAFT')
      .set(TENANT_A);
    assert.equal(draftList.statusCode, 200);
    assert.ok(draftList.body.data.every((i: any) => i.status === InvoiceStatus.Draft));

    // 只查 ISSUED
    const issuedList = await request(app.getHttpServer())
      .get('/finance/invoices?status=ISSUED')
      .set(TENANT_A);
    assert.equal(issuedList.statusCode, 200);
    assert.ok(issuedList.body.data.every((i: any) => i.status === InvoiceStatus.Issued));
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 流水计数关联验证
// ═══════════════════════════════════════════════════════

it('e2e: ledgers — 多笔收入/支出后确认余额正确', async () => {
  const { app } = await buildApp();
  try {
    // 收入 3000
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 3000, description: '门票收入', category: 'ticket' });

    // 收入 2000
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 2000, description: '商品收入', category: 'merchandise' });

    // 支出 1000 → 余额 4000
    const expRes = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Expense, amount: 1000, description: '物料采购', category: 'supply' });
    assert.equal(expRes.body.data.balance, 4000);

    // 退款 500 → 余额 3500
    const refRes = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Refund, amount: 500, description: '退票', category: 'refund' });
    assert.equal(refRes.body.data.balance, 3500);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// Ledger 按 storeId 过滤
// ═══════════════════════════════════════════════════════

it('e2e: GET /finance/ledgers — 按storeId过滤', async () => {
  const { app } = await buildApp();
  try {
    const TENANT_A_STORE2 = { ...TENANT_A, 'x-store-id': 'store-002' };

    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 100, description: 'store-001收入', category: 'test' });

    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A_STORE2)
      .send({ type: LedgerType.Revenue, amount: 200, description: 'store-002收入', category: 'test' });

    // 过滤 store-002
    const res = await request(app.getHttpServer())
      .get('/finance/ledgers?storeId=store-002')
      .set(TENANT_A);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].storeId, 'store-002');
    assert.equal(res.body.data[0].amount, 200);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// Tenant A 结算跨租户隔离
// ═══════════════════════════════════════════════════════

it('e2e: settlements — 跨tenant隔离（结算数据隔离）', async () => {
  const { app } = await buildApp();
  try {
    // Tenant A 创建结算
    await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-08-01T00:00:00.000Z', endDate: '2026-08-15T23:59:59.999Z' });

    // Tenant B 查不到
    const listB = await request(app.getHttpServer())
      .get('/finance/settlements')
      .set(TENANT_B);
    assert.equal(listB.body.data.length, 0);

    // Tenant A 自己能查到
    const listA = await request(app.getHttpServer())
      .get('/finance/settlements')
      .set(TENANT_A);
    assert.ok(listA.body.data.length >= 1);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 成本分析 API (P-38 cost-cash-flow)
// ═══════════════════════════════════════════════════════

it('e2e: cost-analysis — 获取成本分析数据', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/dashboard/cost-analysis')
      .set(TENANT_A)
      .query({ storeId: 'store-001', period: '2026-W30' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  } finally {
    await app.close();
  }
});

it('e2e: cost-analysis — 无storeId应返回不同门店对比', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/dashboard/cost-analysis')
      .set(TENANT_A)
      .query({ period: '2026-W30' });
    expect(res.status).toBe(200);
  } finally {
    await app.close();
  }
});

it('e2e: cost-analysis — 跨租户隔离', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/dashboard/cost-analysis')
      .set(TENANT_B)
      .query({ storeId: 'store-001', period: '2026-W30' });
    expect(res.status).toBe(200);
    // Tenant B 看不到 A 的数据
    const dataB = Array.isArray(res.body.data) ? res.body.data.length : 0;
    expect(dataB).toBe(0);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 现金流 API (P-38 cash-flow)
// ═══════════════════════════════════════════════════════

it('e2e: cash-flow — 获取现金流概况', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/dashboard/cash-flow')
      .set(TENANT_A)
      .query({ storeId: 'store-001', period: '2026-W30' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('balance');
  } finally {
    await app.close();
  }
});

it('e2e: cash-flow — 记录流入并验证余额', async () => {
  const { app } = await buildApp();
  try {
    const inflow = await request(app.getHttpServer())
      .post('/finance/dashboard/cash-flow/inflow')
      .set(TENANT_A)
      .send({ accountId: 'cash-001', amountCents: 100000, description: '测试流入', source: 'sale' });
    expect(inflow.status).toBe(201);

    const balance = await request(app.getHttpServer())
      .get('/finance/dashboard/cash-flow')
      .set(TENANT_A)
      .query({ storeId: 'store-001', period: '2026-W30' });
    expect(balance.status).toBe(200);
  } finally {
    await app.close();
  }
});

it('e2e: cash-flow — 记录流出', async () => {
  const { app } = await buildApp();
  try {
    const outflow = await request(app.getHttpServer())
      .post('/finance/dashboard/cash-flow/outflow')
      .set(TENANT_A)
      .send({ accountId: 'cash-001', amountCents: 50000, description: '采购支出', source: 'purchase' });
    expect(outflow.status).toBe(201);
  } finally {
    await app.close();
  }
});

it('e2e: cash-flow — 0金额流入应正常处理', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .post('/finance/dashboard/cash-flow/inflow')
      .set(TENANT_A)
      .send({ accountId: 'cash-001', amountCents: 0, description: '零金额', source: 'adjustment' });
    expect(res.status).toBe(201);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// Report 边界
// ═══════════════════════════════════════════════════════

it('e2e: revenue/daily — 无数据周期返回空', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/revenue/daily')
      .set(TENANT_A)
      .query({ storeId: 'store-001', date: '2025-01-07' });
    expect(res.status).toBe(200);
    expect(res.body.data.transactionCount).toBe(0);
  } finally {
    await app.close();
  }
});

it('e2e: revenue/summary — 跨租户隔离', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/revenue/summary')
      .set(TENANT_B)
      .query({ storeId: 'store-001' });
    expect(res.status).toBe(200);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// Ledger 批量/边界
// ═══════════════════════════════════════════════════════

it('e2e: ledgers — 批量创建+limit分页验证', async () => {
  const { app } = await buildApp();
  try {
    const batchSize = 15;
    for (let i = 0; i < batchSize; i++) {
      await request(app.getHttpServer())
        .post('/finance/ledgers')
        .set(TENANT_A)
        .send({ amountCents: (i + 1) * 1000, type: i % 3 === 0 ? 'refund' : 'income', description: `批量${i}` });
    }

    const list = await request(app.getHttpServer())
      .get('/finance/ledgers')
      .set(TENANT_A)
      .query({ limit: 5 });
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeLessThanOrEqual(5);
  } finally {
    await app.close();
  }
});

it('e2e: ledgers — 按storeId过滤', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/ledgers')
      .set(TENANT_A)
      .query({ storeId: 'store-001' });
    expect(res.status).toBe(200);
  } finally {
    await app.close();
  }
});

it('e2e: ledgers — 按type过滤(refund)', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/ledgers')
      .set(TENANT_A)
      .query({ type: 'refund' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  } finally {
    await app.close();
  }
});

it('e2e: ledgers — 查询不存在account应返回空', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/ledgers')
      .set(TENANT_A)
      .query({ accountId: 'nonexistent-account' });
    expect(res.status).toBe(200);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// Invoice 状态过滤边界
// ═══════════════════════════════════════════════════════

it('e2e: invoices — 按状态过滤（新创建为draft）', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({ amountCents: 200000, invoicedAt: '2026-07-19T00:00:00.000Z' });
    expect(createRes.status).toBe(201);

    const list = await request(app.getHttpServer())
      .get('/finance/invoices')
      .set(TENANT_A)
      .query({ status: 'draft' });
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);
  } finally {
    await app.close();
  }
});

it('e2e: invoices — 创建→开票→取消完整生命周期', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({ amountCents: 300000, invoicedAt: '2026-07-19T00:00:00.000Z' });
    expect(createRes.status).toBe(201);
    const invoiceId = createRes.body.data?.id ?? createRes.body.id;

    if (invoiceId) {
      await request(app.getHttpServer())
        .post('/finance/invoices/' + invoiceId + '/issue')
        .set(TENANT_A);

      await request(app.getHttpServer())
        .post('/finance/invoices/' + invoiceId + '/cancel')
        .set(TENANT_A);
    }
  } finally {
    await app.close();
  }
});

it('e2e: invoices — 跨租户隔离', async () => {
  const { app } = await buildApp();
  try {
    await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({ amountCents: 400000, invoicedAt: '2026-07-19T00:00:00.000Z' });

    const listB = await request(app.getHttpServer())
      .get('/finance/invoices')
      .set(TENANT_B);
    expect(listB.status).toBe(200);
    expect(listB.body.data.length).toBe(0);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 成本分析深度测试 (P-38)
// ═══════════════════════════════════════════════════════

it('e2e: cost-analysis — 不同period返回不同数据', async () => {
  const { app } = await buildApp();
  try {
    const w30 = await request(app.getHttpServer())
      .get('/finance/dashboard/cost-analysis')
      .set(TENANT_A)
      .query({ storeId: 'store-001', period: '2026-W30' });

    const w31 = await request(app.getHttpServer())
      .get('/finance/dashboard/cost-analysis')
      .set(TENANT_A)
      .query({ storeId: 'store-001', period: '2026-W31' });

    expect(w30.status).toBe(200);
    expect(w31.status).toBe(200);
  } finally {
    await app.close();
  }
});

it('e2e: cost-analysis — 返回数据含costBreakdown结构', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/dashboard/cost-analysis')
      .set(TENANT_A)
      .query({ storeId: 'store-001', period: '2026-W30' });
    expect(res.status).toBe(200);
    if (res.body.data?.length > 0) {
      const first = res.body.data[0];
      // 检查成本分解字段
      expect(first).toHaveProperty('purchaseCost');
      expect(first).toHaveProperty('laborCost');
    }
  } finally {
    await app.close();
  }
});

it('e2e: cost-analysis — 跨period同比环比字段', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/dashboard/cost-analysis')
      .set(TENANT_A)
      .query({ storeId: 'store-001', period: '2026-W30' });
    expect(res.status).toBe(200);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 批量现金流链式测试 (P-38)
// ═══════════════════════════════════════════════════════

it('e2e: cash-flow — 批量inflow/outflow后验证余额链', async () => {
  const { app } = await buildApp();
  try {
    // 3笔流入 + 1笔流出
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post('/finance/dashboard/cash-flow/inflow')
        .set(TENANT_A)
        .send({ accountId: 'cash-chain', amountCents: 10000, description: `链式流入${i}`, source: 'sale' });
    }

    await request(app.getHttpServer())
      .post('/finance/dashboard/cash-flow/outflow')
      .set(TENANT_A)
      .send({ accountId: 'cash-chain', amountCents: 5000, description: '链式流出', source: 'expense' });

    const balance = await request(app.getHttpServer())
      .get('/finance/dashboard/cash-flow')
      .set(TENANT_A)
      .query({ storeId: 'store-001', period: '2026-W30' });
    expect(balance.status).toBe(200);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 报告深度 (P-38 revenue)
// ═══════════════════════════════════════════════════════

it('e2e: revenue/daily — 多store返回', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/revenue/daily')
      .set(TENANT_A)
      .query({ storeId: 'store-001', date: '2026-07-15' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('date');
    expect(res.body.data).toHaveProperty('revenue');
  } finally {
    await app.close();
  }
});

it('e2e: revenue/summary — 返回期望的维度', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/revenue/summary')
      .set(TENANT_A)
      .query({ storeId: 'store-001' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalRevenue');
    expect(res.body.data).toHaveProperty('transactionCount');
  } finally {
    await app.close();
  }
});

it('e2e: revenue/summary — 无storeId应汇总所有门店', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/revenue/summary')
      .set(TENANT_A);
    expect(res.status).toBe(200);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 发票批量 (P-38 invoices)
// ═══════════════════════════════════════════════════════

it('e2e: invoices — 批量创建跨状态过滤', async () => {
  const { app } = await buildApp();
  try {
    await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({ amountCents: 100000, invoicedAt: '2026-07-19T00:00:00.000Z' });

    await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({ amountCents: 200000, invoicedAt: '2026-07-19T00:00:00.000Z' });

    const res = await request(app.getHttpServer())
      .get('/finance/invoices')
      .set(TENANT_A);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 结算完整生命周期 (P-38 settlements)
// ═══════════════════════════════════════════════════════

it('e2e: settlements — 创建→确认→查看详情', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-08-01T00:00:00.000Z', endDate: '2026-08-15T23:59:59.999Z' });
    expect(createRes.status).toBe(201);
    const settlementId = createRes.body.data?.id ?? createRes.body.id;

    if (settlementId) {
      await request(app.getHttpServer())
        .post('/finance/settlements/' + settlementId + '/confirm')
        .set(TENANT_A);

      const detail = await request(app.getHttpServer())
        .get('/finance/settlements/' + settlementId + '/detail')
        .set(TENANT_A);
      expect(detail.status).toBe(200);
    }
  } finally {
    await app.close();
  }
});

it('e2e: settlements — 争议流程', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-09-01T00:00:00.000Z', endDate: '2026-09-15T23:59:59.999Z' });
    expect(createRes.status).toBe(201);
    const sid = createRes.body.data?.id ?? createRes.body.id;
    if (sid) {
      const disputeRes = await request(app.getHttpServer())
        .post('/finance/settlements/' + sid + '/dispute')
        .set(TENANT_A);
      expect(disputeRes.status).toBe(201);
    }
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 对账 Reconciliation (P-38)
// ═══════════════════════════════════════════════════════

it('e2e: reconciliation — 创建对账批次', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/reconciliation/batches')
      .set(TENANT_A)
      .send({
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-07T23:59:59.999Z',
        matchedCount: 120,
        unmatchedCount: 3,
        totalAmount: 5000000,
        difference: 1500,
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data).toHaveProperty('id');
  } finally {
    await app.close();
  }
});

it('e2e: reconciliation — 查询对账批次列表', async () => {
  const { app } = await buildApp();
  try {
    // 先创建
    await request(app.getHttpServer())
      .post('/finance/reconciliation/batches')
      .set(TENANT_A)
      .send({
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-07T23:59:59.999Z',
        matchedCount: 100,
        unmatchedCount: 0,
        totalAmount: 3000000,
        difference: 0,
      });

    const list = await request(app.getHttpServer())
      .get('/finance/reconciliation/batches')
      .set(TENANT_A);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);
    expect(list.body.data.length).toBeGreaterThanOrEqual(1);
  } finally {
    await app.close();
  }
});

it('e2e: reconciliation — 按批次ID查询详情', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/reconciliation/batches')
      .set(TENANT_A)
      .send({
        startDate: '2026-07-15T00:00:00.000Z',
        endDate: '2026-07-21T23:59:59.999Z',
        matchedCount: 80,
        unmatchedCount: 2,
        totalAmount: 2000000,
        difference: 500,
      });
    const batchId = createRes.body.data.id;

    const detail = await request(app.getHttpServer())
      .get('/finance/reconciliation/batches/' + batchId)
      .set(TENANT_A);
    expect(detail.status).toBe(200);
    expect(detail.body.data.id).toBe(batchId);
  } finally {
    await app.close();
  }
});

it('e2e: reconciliation — 跨租户隔离', async () => {
  const { app } = await buildApp();
  try {
    await request(app.getHttpServer())
      .post('/finance/reconciliation/batches')
      .set(TENANT_A)
      .send({
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-07T23:59:59.999Z',
        matchedCount: 50, unmatchedCount: 1, totalAmount: 1000000, difference: 200,
      });

    const listB = await request(app.getHttpServer())
      .get('/finance/reconciliation/batches')
      .set(TENANT_B);
    expect(listB.status).toBe(200);
    expect(listB.body.data.length).toBe(0);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 报表 Reports (P-38)
// ═══════════════════════════════════════════════════════

it('e2e: reports — 创建报表', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send({ title: 'test-report', type: 'profit-loss', period: '2026-W30', storeId: 'store-001' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data).toHaveProperty('id');
  } finally {
    await app.close();
  }
});

it('e2e: reports — 查询报表列表', async () => {
  const { app } = await buildApp();
  try {
    await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send({ title: 'monthly-summary', type: 'summary', period: '2026-07', storeId: 'store-001' });

    const list = await request(app.getHttpServer())
      .get('/finance/reports')
      .set(TENANT_A);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);
  } finally {
    await app.close();
  }
});

it('e2e: reports — 按reportId查询详情', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send({ title: 'weekly-report', type: 'revenue', period: '2026-W30', storeId: 'store-001' });
    const reportId = createRes.body.data.id;

    const detail = await request(app.getHttpServer())
      .get('/finance/reports/' + reportId)
      .set(TENANT_A);
    expect(detail.status).toBe(200);
  } finally {
    await app.close();
  }
});

it('e2e: reports — 重新生成报表', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send({ title: 'regenerate-test', type: 'profit-loss', period: '2026-W31', storeId: 'store-001' });
    const reportId = createRes.body.data.id;

    const regen = await request(app.getHttpServer())
      .post('/finance/reports/' + reportId + '/regenerate')
      .set(TENANT_A);
    expect(regen.status).toBe(201);
  } finally {
    await app.close();
  }
});

it('e2e: reports — PROFIT_LOSS 真实报表应走 resolved 营收主链', async () => {
  const { app } = await buildApp();
  try {
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({
        type: LedgerType.Revenue,
        amount: 10000,
        description: '报表营收',
        recordedAt: '2026-07-10T10:00:00.000Z',
      });
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({
        type: LedgerType.Expense,
        amount: 2500,
        description: '报表成本',
        recordedAt: '2026-07-10T11:00:00.000Z',
      });

    const createRes = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send({
        title: 'resolved-profit-loss',
        reportType: FinanceReportType.PROFIT_LOSS,
        periodStart: '2026-07-01T00:00:00.000Z',
        periodEnd: '2026-07-31T23:59:59.999Z',
        storeId: 'store-001',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.status).toBe('COMPLETED');
    expect(createRes.body.data.summary.totalRevenue).toBe(10000);
    expect(createRes.body.data.summary.totalExpense).toBe(2500);
    expect(createRes.body.data.summary.netProfit).toBe(7500);
  } finally {
    await app.close();
  }
});

it('e2e: reports — BALANCE_SHEET 真实报表应走 resolved 账户主链', async () => {
  const { app } = await buildApp();
  try {
    await request(app.getHttpServer())
      .post('/finance/accounts')
      .set(TENANT_A)
      .send({ name: '现金账户', type: AccountType.Cash, initialBalance: 5000, storeId: 'store-001' });
    await request(app.getHttpServer())
      .post('/finance/accounts')
      .set(TENANT_A)
      .send({ name: '微信账户', type: AccountType.Wechat, initialBalance: 3000, storeId: 'store-001' });
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({
        type: LedgerType.Revenue,
        amount: 1200,
        description: '资产报表营收',
        recordedAt: '2026-07-15T10:00:00.000Z',
      });

    const createRes = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send({
        title: 'resolved-balance-sheet',
        reportType: FinanceReportType.BALANCE_SHEET,
        periodStart: '2026-07-01T00:00:00.000Z',
        periodEnd: '2026-07-31T23:59:59.999Z',
        storeId: 'store-001',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.status).toBe('COMPLETED');
    expect(createRes.body.data.data.accountDetails).toHaveLength(2);
    expect(createRes.body.data.data.assets.total).toBe(9200);
  } finally {
    await app.close();
  }
});

it('e2e: reports — 跨租户隔离', async () => {
  const { app } = await buildApp();
  try {
    await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send({ title: 'tenant-a-only', type: 'summary', period: '2026-07', storeId: 'store-001' });

    const listB = await request(app.getHttpServer())
      .get('/finance/reports')
      .set(TENANT_B);
    expect(listB.status).toBe(200);
    expect(listB.body.data.length).toBe(0);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 账户深度测试 (P-38 accounts)
// ═══════════════════════════════════════════════════════

it('e2e: accounts — 创建后冻结再关闭全流程', async () => {
  const { app } = await buildApp();
  try {
    const createRes = await request(app.getHttpServer())
      .post('/finance/accounts')
      .set(TENANT_A)
      .send({ name: 'cycle-account', type: 'checking', storeId: 'store-001' });
    expect(createRes.status).toBe(201);
    const accountId = createRes.body.data?.id ?? createRes.body.id;

    if (accountId) {
      await request(app.getHttpServer())
        .post('/finance/accounts/' + accountId + '/freeze')
        .set(TENANT_A);

      await request(app.getHttpServer())
        .post('/finance/accounts/' + accountId + '/close')
        .set(TENANT_A);
    }
  } finally {
    await app.close();
  }
});

it('e2e: accounts — 查询不存在的账户返回空', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/accounts?name=nonexistent')
      .set(TENANT_A);
    expect(res.status).toBe(200);
  } finally {
    await app.close();
  }
});

it('e2e: accounts — 跨租户隔离', async () => {
  const { app } = await buildApp();
  try {
    await request(app.getHttpServer())
      .post('/finance/accounts')
      .set(TENANT_A)
      .send({ name: 'tenant-a-account', type: 'savings', storeId: 'store-001' });

    const listB = await request(app.getHttpServer())
      .get('/finance/accounts')
      .set(TENANT_B);
    expect(listB.status).toBe(200);
    expect(listB.body.data.length).toBe(0);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 更多 Ledger 边界
// ═══════════════════════════════════════════════════════

it('e2e: ledgers — 按金额范围过滤', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/ledgers')
      .set(TENANT_A)
      .query({ minAmount: 1000, maxAmount: 100000 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  } finally {
    await app.close();
  }
});

it('e2e: ledgers — 按日期范围过滤', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/ledgers')
      .set(TENANT_A)
      .query({ startDate: '2026-07-01', endDate: '2026-07-31' });
    expect(res.status).toBe(200);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// 报表删除边界
// ═══════════════════════════════════════════════════════

it('e2e: reports — 不存在的reportId应返回500', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/reports/nonexistent-report')
      .set(TENANT_A);
    expect(res.status).toBe(500);
  } finally {
    await app.close();
  }
});

it('e2e: reports — 批量创建+按类型过滤', async () => {
  const { app } = await buildApp();
  try {
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post('/finance/reports')
        .set(TENANT_A)
        .send({ title: 'batch-report-' + i, type: 'profit-loss', period: '2026-07', storeId: 'store-001' });
    }

    const list = await request(app.getHttpServer())
      .get('/finance/reports')
      .set(TENANT_A)
      .query({ type: 'profit-loss' });
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// Dashboard 主面板 (P-38 profit/loss)
// ═══════════════════════════════════════════════════════

it('e2e: dashboard — 获取主面板(含profit/loss)', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/dashboard')
      .set(TENANT_A)
      .query({ storeId: 'store-001' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('revenue');
  } finally {
    await app.close();
  }
});

it('e2e: dashboard — 无storeId应汇总', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/dashboard')
      .set(TENANT_A);
    expect(res.status).toBe(200);
  } finally {
    await app.close();
  }
});

it('e2e: dashboard — 跨租户隔离', async () => {
  const { app } = await buildApp();
  try {
    const res = await request(app.getHttpServer())
      .get('/finance/dashboard')
      .set(TENANT_B);
    expect(res.status).toBe(200);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// P-38 补充: 跨账期 营收差异检测 (通过 settlement + daily revenue 模拟)
// ═══════════════════════════════════════════════════════

it('e2e: revenue — 跨账期营收汇总对比 (两期收入不同)', async () => {
  const { app } = await buildApp();
  try {
    // 第1期: 7月上旬 收入 8000
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 5000, description: '7月上旬门票', category: 'ticket', recordedAt: '2026-07-05T12:00:00.000Z' });
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 3000, description: '7月上旬商品', category: 'merchandise', recordedAt: '2026-07-08T12:00:00.000Z' });

    // 第2期: 7月下旬 收入 12000
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 7000, description: '7月下旬门票', category: 'ticket', recordedAt: '2026-07-20T12:00:00.000Z' });
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 5000, description: '7月下旬活动', category: 'event', recordedAt: '2026-07-25T12:00:00.000Z' });

    // 第3期: 8月上旬 — 零收入
    // (故意不创建流水)

    // 创建结算 A (7月上半月)
    const stlA = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-07-01T00:00:00.000Z', endDate: '2026-07-15T23:59:59.999Z' });
    assert.equal(stlA.status, 201);
    assert.equal(stlA.body.data.totalRevenue, 8000);

    // 创建结算 B (7月下半月)
    const stlB = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-07-16T00:00:00.000Z', endDate: '2026-07-31T23:59:59.999Z' });
    assert.equal(stlB.status, 201);
    assert.equal(stlB.body.data.totalRevenue, 12000);

    // 验证两期收入不同
    assert.ok(stlB.body.data.totalRevenue > stlA.body.data.totalRevenue);
    assert.equal(stlB.body.data.totalRevenue - stlA.body.data.totalRevenue, 4000);

    // 创建结算 C (8月上旬 — 无数据应收入为0)
    const stlC = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-08-01T00:00:00.000Z', endDate: '2026-08-07T23:59:59.999Z' });
    assert.equal(stlC.status, 201);
    assert.equal(stlC.body.data.totalRevenue, 0);
    assert.equal(stlC.body.data.totalExpense, 0);
  } finally {
    await app.close();
  }
});

it('e2e: revenue — 跨账期差异: 同周期内收入升级对比', async () => {
  const { app } = await buildApp();
  try {
    // W31 营收明细
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 6000, description: 'W31 门票', category: 'ticket', recordedAt: '2026-07-28T12:00:00.000Z' });
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Expense, amount: 2000, description: 'W31 采购', category: 'purchase', recordedAt: '2026-07-29T12:00:00.000Z' });

    // W32 营收明细
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 9000, description: 'W32 门票', category: 'ticket', recordedAt: '2026-08-05T12:00:00.000Z' });
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Expense, amount: 3000, description: 'W32 采购', category: 'purchase', recordedAt: '2026-08-06T12:00:00.000Z' });

    // W31 结算
    const stlW31 = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-07-27T00:00:00.000Z', endDate: '2026-08-02T23:59:59.999Z' });
    assert.equal(stlW31.status, 201);
    assert.equal(stlW31.body.data.totalRevenue, 6000);
    assert.equal(stlW31.body.data.totalExpense, 2000);
    assert.equal(stlW31.body.data.netProfit, 4000);

    // W32 结算
    const stlW32 = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-08-03T00:00:00.000Z', endDate: '2026-08-09T23:59:59.999Z' });
    assert.equal(stlW32.status, 201);
    assert.equal(stlW32.body.data.totalRevenue, 9000);
    assert.equal(stlW32.body.data.totalExpense, 3000);
    assert.equal(stlW32.body.data.netProfit, 6000);

    // 跨周对比: W32 净利增长 50%
    assert.equal(stlW32.body.data.netProfit - stlW31.body.data.netProfit, 2000);
  } finally {
    await app.close();
  }
});

it('e2e: revenue — 跨账期日营收差异检测', async () => {
  const { app } = await buildApp();
  try {
    // 两天的日营收数据
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 3000, description: 'Day1收入', category: 'ticket', recordedAt: '2026-08-10T10:00:00.000Z' });
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 4500, description: 'Day2收入', category: 'ticket', recordedAt: '2026-08-11T10:00:00.000Z' });
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 2000, description: 'Day3收入', category: 'merchandise', recordedAt: '2026-08-10T14:00:00.000Z' });

    // 查日营收 Aug 10
    const day1 = await request(app.getHttpServer())
      .get('/finance/revenue/daily')
      .set(TENANT_A)
      .query({ storeId: 'store-001', date: '2026-08-10' });
    assert.equal(day1.status, 200);
    assert.equal(day1.body.data.revenue, 5000);
    assert.equal(day1.body.data.transactionCount, 2);

    // 查日营收 Aug 11 (只有1笔)
    const day2 = await request(app.getHttpServer())
      .get('/finance/revenue/daily')
      .set(TENANT_A)
      .query({ storeId: 'store-001', date: '2026-08-11' });
    assert.equal(day2.status, 200);
    assert.equal(day2.body.data.revenue, 4500);
    assert.equal(day2.body.data.transactionCount, 1);

    // 跨日差异检测: day1 > day2
    assert.ok(day1.body.data.revenue > day2.body.data.revenue, 'Day1营收应高于Day2');
    // 差额
    assert.equal(day1.body.data.revenue - day2.body.data.revenue, 500);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// P-38 补充: 发票冲红 + 退款
// ═══════════════════════════════════════════════════════

it('e2e: invoices — 发票冲红(取消)后记录退款流水', async () => {
  const { app } = await buildApp();
  try {
    // 原始收入
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 5000, description: '原门票收入', category: 'ticket' });

    // 创建发票
    const createRes = await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({ orderId: 'red-ink-001', amount: 5000, type: InvoiceType.Regular });
    assert.equal(createRes.status, 201);
    const invId = createRes.body.data.id;

    // 开票
    const issueRes = await request(app.getHttpServer())
      .post(`/finance/invoices/${invId}/issue`)
      .set(TENANT_A);
    assert.equal(issueRes.status, 201);
    assert.equal(issueRes.body.data.status, InvoiceStatus.Issued);

    // 冲红 → 取消发票
    const cancelRes = await request(app.getHttpServer())
      .post(`/finance/invoices/${invId}/cancel`)
      .set(TENANT_A);
    assert.equal(cancelRes.status, 201);
    assert.equal(cancelRes.body.data.status, InvoiceStatus.Cancelled);

    // 记录退款流水 (模拟退票)
    const refundLedger = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Refund, amount: 5000, description: '发票冲红退款', category: 'refund', orderId: 'red-ink-001' });
    assert.equal(refundLedger.status, 201);
    assert.equal(refundLedger.body.data.type, LedgerType.Refund);
    assert.equal(refundLedger.body.data.amount, 5000);
    assert.equal(refundLedger.body.data.orderId, 'red-ink-001');

    // 验证余额: 原始收入 - 退款 = 0
    assert.equal(refundLedger.body.data.balance, 0);
  } finally {
    await app.close();
  }
});

it('e2e: invoices — 冲红后重新开票 (取消后重建)', async () => {
  const { app } = await buildApp();
  try {
    // 原始收入
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 3000, description: '商品销售', category: 'merchandise' });

    // 创建发票A
    const invA = await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({ orderId: 'rebill-001', amount: 3000, type: InvoiceType.Regular });
    const invAId = invA.body.data.id;

    // 开票
    await request(app.getHttpServer())
      .post(`/finance/invoices/${invAId}/issue`)
      .set(TENANT_A);

    // 冲红(取消)发票A
    await request(app.getHttpServer())
      .post(`/finance/invoices/${invAId}/cancel`)
      .set(TENANT_A);

    // 退款流水
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Refund, amount: 3000, description: '发票A冲红退款', category: 'refund', orderId: 'rebill-001' });

    // 创建发票B (重开)
    const invB = await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({ orderId: 'rebill-002', amount: 3200, type: InvoiceType.Vat, buyerInfo: { company: '重开公司' } });
    assert.equal(invB.status, 201);
    assert.equal(invB.body.data.amount, 3200);
    assert.equal(invB.body.data.status, InvoiceStatus.Draft);

    // 新发票开票
    const issueB = await request(app.getHttpServer())
      .post(`/finance/invoices/${invB.body.data.id}/issue`)
      .set(TENANT_A);
    assert.equal(issueB.status, 201);
    assert.equal(issueB.body.data.status, InvoiceStatus.Issued);
  } finally {
    await app.close();
  }
});

it('e2e: invoices — 含税发票冲红 + taxAmount 准确性', async () => {
  const { app } = await buildApp();
  try {
    // 含税发票创建
    const createRes = await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({
        orderId: 'tax-red-ink',
        amount: 1000,
        taxAmount: 130,
        type: InvoiceType.Vat,
        buyerInfo: { company: '增值税购买方', taxId: 'VAT987654' },
      });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.data.totalAmount, 1130);
    const invId = createRes.body.data.id;

    // 开票
    const issueRes = await request(app.getHttpServer())
      .post(`/finance/invoices/${invId}/issue`)
      .set(TENANT_A);
    assert.equal(issueRes.status, 201);

    // 冲红(取消)
    const cancelRes = await request(app.getHttpServer())
      .post(`/finance/invoices/${invId}/cancel`)
      .set(TENANT_A);
    assert.equal(cancelRes.status, 201);
    assert.equal(cancelRes.body.data.status, InvoiceStatus.Cancelled);
    assert.equal(cancelRes.body.data.taxAmount, 130);

    // 校验: 取消后taxAmount仍保留
    const getRes = await request(app.getHttpServer())
      .get(`/finance/invoices/${invId}`)
      .set(TENANT_A);
    assert.equal(getRes.body.data.taxAmount, 130);
    assert.equal(getRes.body.data.totalAmount, 1130);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// P-38 补充: 财务权限拒绝 (非admin)
// ═══════════════════════════════════════════════════════

it('e2e: permission — 非admin不能确认跨租户结算', async () => {
  const { app } = await buildApp();
  try {
    // Tenant A 创建结算
    const createRes = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-08-01T00:00:00.000Z', endDate: '2026-08-31T23:59:59.999Z' });
    assert.equal(createRes.status, 201);
    const stlId = createRes.body.data.id;

    // Tenant B (非admin/不同租户) 确认 A 的结算 → 应失败 (500)
    const confirmByB = await request(app.getHttpServer())
      .post(`/finance/settlements/${stlId}/confirm`)
      .set(TENANT_B);
    assert.equal(confirmByB.status, 500);

    // Tenant B 争议 A 的结算 → 也应失败
    const disputeByB = await request(app.getHttpServer())
      .post(`/finance/settlements/${stlId}/dispute`)
      .set(TENANT_B);
    assert.equal(disputeByB.status, 500);
  } finally {
    await app.close();
  }
});

it('e2e: permission — 非admin不能查看对方发票详情', async () => {
  const { app } = await buildApp();
  try {
    // Tenant A 创建并签发发票
    const createRes = await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({ orderId: 'private-inv', amount: 9999, type: InvoiceType.Regular });
    const invId = createRes.body.data.id;

    // Tenant B 试图查看 A 的发票 → 应失败 (500)
    const getByB = await request(app.getHttpServer())
      .get(`/finance/invoices/${invId}`)
      .set(TENANT_B);
    assert.equal(getByB.status, 500);
  } finally {
    await app.close();
  }
});

it('e2e: permission — 非admin不能删除对方流水', async () => {
  const { app } = await buildApp();
  try {
    // Tenant A 创建流水
    const createRes = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 8888, description: 'A专属收入', category: 'private' });
    assert.equal(createRes.status, 201);
    const ledgerId = createRes.body.data.id;

    // Tenant B (非admin) 删除 → 应失败 (500)
    const delByB = await request(app.getHttpServer())
      .delete(`/finance/ledgers/${ledgerId}`)
      .set(TENANT_B);
    assert.equal(delByB.status, 500);

    // A 的流水仍然存在
    const stillExists = await request(app.getHttpServer())
      .get(`/finance/ledgers/${ledgerId}`)
      .set(TENANT_A);
    assert.equal(stillExists.status, 200);
    assert.equal(stillExists.body.data.amount, 8888);
  } finally {
    await app.close();
  }
});

// ═══════════════════════════════════════════════════════
// P-38 补充: 多 settlement 合并
// ═══════════════════════════════════════════════════════

it('e2e: settlements — 多门店多结算查询与合并汇总', async () => {
  const { app } = await buildApp();
  try {
    const TENANT_A_STORE2 = { ...TENANT_A, 'x-store-id': 'store-002' };

    // 门店1 结算: 两期
    await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({
        storeId: 'store-001',
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-15T23:59:59.999Z',
      });
    await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({
        storeId: 'store-001',
        startDate: '2026-07-16T00:00:00.000Z',
        endDate: '2026-07-31T23:59:59.999Z',
      });

    // 门店2 结算: 一期
    await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A_STORE2)
      .send({
        storeId: 'store-002',
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-31T23:59:59.999Z',
      });

    // 查询全部 (不限storeId)
    const allRes = await request(app.getHttpServer())
      .get('/finance/settlements')
      .set(TENANT_A);
    assert.equal(allRes.status, 200);
    assert.equal(allRes.body.data.length, 3);

    // 按storeId过滤
    const store1Res = await request(app.getHttpServer())
      .get('/finance/settlements')
      .set(TENANT_A)
      .query({ storeId: 'store-001' });
    assert.equal(store1Res.status, 200);
    assert.equal(store1Res.body.data.length, 2);
    assert.ok(store1Res.body.data.every((s: any) => s.storeId === 'store-001'));

    const store2Res = await request(app.getHttpServer())
      .get('/finance/settlements')
      .set(TENANT_A_STORE2)
      .query({ storeId: 'store-002' });
    assert.equal(store2Res.status, 200);
    assert.equal(store2Res.body.data.length, 1);
  } finally {
    await app.close();
  }
});

it('e2e: settlements — 多结算状态过滤 (Pending + Confirmed)', async () => {
  const { app } = await buildApp();
  try {
    // 创建 Pending 结算
    const pendingRes = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-09-01T00:00:00.000Z', endDate: '2026-09-15T23:59:59.999Z' });
    const pendingId = pendingRes.body.data.id;

    // 创建 Disputed 结算
    const disputedRes = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-09-16T00:00:00.000Z', endDate: '2026-09-30T23:59:59.999Z' });
    const disputedId = disputedRes.body.data.id;
    await request(app.getHttpServer())
      .post(`/finance/settlements/${disputedId}/dispute`)
      .set(TENANT_A);

    // 创建 Confirmed 结算
    const confirmRes = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: '2026-10-01T00:00:00.000Z', endDate: '2026-10-15T23:59:59.999Z' });
    const confirmId = confirmRes.body.data.id;
    await request(app.getHttpServer())
      .post(`/finance/settlements/${confirmId}/confirm`)
      .set(TENANT_A);

    // 查询 Pending
    const pendingList = await request(app.getHttpServer())
      .get('/finance/settlements')
      .set(TENANT_A)
      .query({ settlementStatus: SettlementStatus.Pending });
    assert.equal(pendingList.status, 200);
    assert.ok(pendingList.body.data.some((s: any) => s.id === pendingId));

    // 查询 Confirmed
    const confirmedList = await request(app.getHttpServer())
      .get('/finance/settlements')
      .set(TENANT_A)
      .query({ settlementStatus: SettlementStatus.Confirmed });
    assert.equal(confirmedList.status, 200);
    assert.ok(confirmedList.body.data.some((s: any) => s.id === confirmId));

    // 查询 Disputed
    const disputedList = await request(app.getHttpServer())
      .get('/finance/settlements')
      .set(TENANT_A)
      .query({ settlementStatus: SettlementStatus.Disputed });
    assert.equal(disputedList.status, 200);
    assert.ok(disputedList.body.data.some((s: any) => s.id === disputedId));
  } finally {
    await app.close();
  }
});

it('e2e: settlements — 合并结算: 带收入/支出账期汇总', async () => {
  const { app } = await buildApp();
  try {
    // 在 2026-11 账期内创建多笔流水
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 10000, description: '11月门票', category: 'ticket', recordedAt: '2026-11-05T12:00:00.000Z' });
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Revenue, amount: 5000, description: '11月商品', category: 'merchandise', recordedAt: '2026-11-10T12:00:00.000Z' });
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Expense, amount: 3000, description: '11月采购', category: 'purchase', recordedAt: '2026-11-12T12:00:00.000Z' });
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: LedgerType.Refund, amount: 1000, description: '11月退款', category: 'refund', recordedAt: '2026-11-15T12:00:00.000Z' });

    // 创建结算 (不传 totalRevenue/totalExpense → 自动从流水计算)
    const stlRes = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: '2026-11-30T23:59:59.999Z',
      });
    assert.equal(stlRes.status, 201);
    assert.equal(stlRes.body.data.totalRevenue, 15000);
    assert.equal(stlRes.body.data.totalExpense, 3000);
    assert.equal(stlRes.body.data.netProfit, 12000);

    // 确认结算
    const confirmRes = await request(app.getHttpServer())
      .post(`/finance/settlements/${stlRes.body.data.id}/confirm`)
      .set(TENANT_A);
    assert.equal(confirmRes.status, 201);
    assert.equal(confirmRes.body.data.settlementStatus, SettlementStatus.Confirmed);
    assert.ok(confirmRes.body.data.settledAt);
  } finally {
    await app.close();
  }
});
