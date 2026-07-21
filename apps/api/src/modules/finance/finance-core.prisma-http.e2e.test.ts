import 'reflect-metadata'
import assert from 'node:assert/strict'
import { afterAll, beforeAll, describe, it } from 'vitest'
import type { NextFunction, Request, Response } from 'express'
import { ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { TenantGuard } from '../agent/tenant.guard'
import type { TenantAwareRequest } from '../tenant/tenant.types'
import { PrismaService } from '../../prisma/prisma.service'
import { FinanceController } from './finance.controller'
import { FinanceService } from './finance.service'
import {
  AccountStatus,
  InvoiceStatus,
  SettlementStatus,
  AccountType,
  LedgerType,
} from './finance.entity'

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as unknown as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-finance-core',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-finance-core',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-finance-core',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland',
  }
  next()
}

const TENANT_A = {
  'x-tenant-id': 'tenant-finance-core-a',
  'x-brand-id': 'brand-finance-core-a',
  'x-store-id': 'store-finance-core-a',
  'x-market-code': 'cn-mainland',
}

const TENANT_B = {
  'x-tenant-id': 'tenant-finance-core-b',
  'x-brand-id': 'brand-finance-core-b',
  'x-store-id': 'store-finance-core-b',
  'x-market-code': 'cn-mainland',
}

describe('Finance Core Prisma HTTP E2E', () => {
  let app: any
  let prisma: PrismaService

  beforeAll(async () => {
    prisma = new PrismaService()
    await prisma.onModuleInit()

    const financeService = new FinanceService(prisma)

    const moduleRef = await Test.createTestingModule({
      controllers: [FinanceController],
      providers: [
        TenantGuard,
        { provide: PrismaService, useValue: prisma },
        { provide: FinanceService, useValue: financeService },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.useGlobalInterceptors(new ResponseInterceptor())
    app.use(attachTenantContext)
    await app.init()
  })

  afterAll(async () => {
    await prisma.invoiceV2.deleteMany({
      where: {
        tenantId: {
          in: [TENANT_A['x-tenant-id'], TENANT_B['x-tenant-id']],
        },
      },
    })
    await prisma.financeSettlement.deleteMany({
      where: {
        tenantId: {
          in: [TENANT_A['x-tenant-id'], TENANT_B['x-tenant-id']],
        },
      },
    })
    await prisma.financeAccount.deleteMany({
      where: {
        tenantId: {
          in: [TENANT_A['x-tenant-id'], TENANT_B['x-tenant-id']],
        },
      },
    })
    await prisma.financeLedger.deleteMany({
      where: {
        tenantId: {
          in: [TENANT_A['x-tenant-id'], TENANT_B['x-tenant-id']],
        },
      },
    })
    await app.close()
    await prisma.onModuleDestroy()
  })

  // ─── 正例: 10+ ───────────────────────────────────────────

  it('正例1: ledger 创收 POST 后 balance 累计正确', async () => {
    const r1 = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: 'REVENUE', amount: 500, description: '门票收入', category: 'ticket', recordedAt: '2026-07-01T10:00:00.000Z' })
      .expect(201)
    assert.equal(r1.body.data.type, LedgerType.Revenue)
    assert.equal(r1.body.data.amount, 500)
    const balance1 = r1.body.data.balance as number

    const r2 = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: 'REVENUE', amount: 300, description: '商品收入', category: 'merchandise', recordedAt: '2026-07-02T10:00:00.000Z' })
      .expect(201)
    assert.equal(r2.body.data.amount, 300)
    assert.equal(r2.body.data.balance, balance1 + 300)
  })

  it('正例2: ledger 支出扣减 balance 正确', async () => {
    const initialBalance = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: 'REVENUE', amount: 1000, description: '初始化', category: 'init', recordedAt: '2026-07-03T10:00:00.000Z' })
      .expect(201)
    const startBal = initialBalance.body.data.balance as number

    const expense = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: 'EXPENSE', amount: 400, description: '租金支出', category: 'rent', recordedAt: '2026-07-04T10:00:00.000Z' })
      .expect(201)
    assert.equal(expense.body.data.type, LedgerType.Expense)
    assert.equal(expense.body.data.balance, startBal - 400)

    const expense2 = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: 'EXPENSE', amount: 100, description: '水电费', category: 'utility', recordedAt: '2026-07-05T10:00:00.000Z' })
      .expect(201)
    assert.equal(expense2.body.data.balance, startBal - 400 - 100)
  })

  it('正例3: ledger 退款生效 balance 正确', async () => {
    const rev = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: 'REVENUE', amount: 2000, description: '充值', category: 'topup', recordedAt: '2026-07-06T10:00:00.000Z' })
      .expect(201)
    const revBal = rev.body.data.balance as number

    const refund = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: 'REFUND', amount: 500, description: '退款', category: 'refund', recordedAt: '2026-07-07T10:00:00.000Z' })
      .expect(201)
    assert.equal(refund.body.data.type, LedgerType.Refund)
    assert.equal(refund.body.data.balance, revBal - 500)
  })

  it('正例4: ledger 列表筛选 type=EXPENSE 正确', async () => {
    const list = await request(app.getHttpServer())
      .get('/finance/ledgers?type=EXPENSE')
      .set(TENANT_A)
      .expect(200)
    assert.ok(Array.isArray(list.body.data))
    for (const ledger of list.body.data) {
      assert.equal(ledger.type, LedgerType.Expense)
    }
  })

  it('正例5: ledger 按 ID 查询返回正确记录', async () => {
    const created = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: 'REVENUE', amount: 100, description: '用于ID查询', category: 'test', recordedAt: '2026-07-08T10:00:00.000Z' })
      .expect(201)
    const ledgerId = created.body.data.id as string

    const got = await request(app.getHttpServer())
      .get(`/finance/ledgers/${ledgerId}`)
      .set(TENANT_A)
      .expect(200)
    assert.equal(got.body.data.id, ledgerId)
    assert.equal(got.body.data.amount, 100)
    assert.equal(got.body.data.description, '用于ID查询')
  })

  it('正例6: account 创建 + 余额查询 + 状态流转完整', async () => {
    const created = await request(app.getHttpServer())
      .post('/finance/accounts')
      .set(TENANT_A)
      .send({ name: '对公账户', type: 'BANK', initialBalance: 10000 })
      .expect(201)
    const acctId = created.body.data.id as string
    assert.equal(created.body.data.status, AccountStatus.Active)
    assert.equal(created.body.data.type, AccountType.Bank)
    assert.equal(created.body.data.balance, 10000)

    const bal = await request(app.getHttpServer())
      .get(`/finance/accounts/${acctId}/balance`)
      .set(TENANT_A)
      .expect(200)
    assert.equal(bal.body.data.balance, 10000)

    const freeze = await request(app.getHttpServer())
      .post(`/finance/accounts/${acctId}/freeze`)
      .set(TENANT_A)
      .expect(201)
    assert.equal(freeze.body.data.status, AccountStatus.Frozen)

    const closed = await request(app.getHttpServer())
      .post(`/finance/accounts/${acctId}/close`)
      .set(TENANT_A)
      .expect(201)
    assert.equal(closed.body.data.status, AccountStatus.Closed)
  })

  it('正例7: account 列表 + 按 storeId 筛选', async () => {
    const accts = await request(app.getHttpServer())
      .get('/finance/accounts')
      .set(TENANT_A)
      .expect(200)
    assert.ok(Array.isArray(accts.body.data))

    const filtered = await request(app.getHttpServer())
      .get(`/finance/accounts?storeId=${TENANT_A['x-store-id']}`)
      .set(TENANT_A)
      .expect(200)
    assert.ok(Array.isArray(filtered.body.data))
  })

  it('正例8: settlement 创建、确认 + 明细查询', async () => {
    const settlement = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-31T23:59:59.999Z',
      })
      .expect(201)
    const sid = settlement.body.data.id as string
    assert.equal(settlement.body.data.settlementStatus, SettlementStatus.Pending)
    assert.ok(settlement.body.data.totalRevenue > 0)
    assert.ok(settlement.body.data.totalExpense > 0)

    const detail = await request(app.getHttpServer())
      .get(`/finance/settlements/${sid}/detail`)
      .set(TENANT_A)
      .expect(200)
    assert.equal(detail.body.data.settlement.id, sid)
    assert.ok(Array.isArray(detail.body.data.ledgers))

    const confirmed = await request(app.getHttpServer())
      .post(`/finance/settlements/${sid}/confirm`)
      .set(TENANT_A)
      .expect(201)
    assert.equal(confirmed.body.data.settlementStatus, SettlementStatus.Confirmed)
  })

  it('正例9: settlement 列表查询', async () => {
    const list = await request(app.getHttpServer())
      .get('/finance/settlements')
      .set(TENANT_A)
      .expect(200)
    assert.ok(Array.isArray(list.body.data))
    if (list.body.data.length > 0) {
      assert.ok(list.body.data[0].id)
    }
  })

  it('正例10: invoice 完整生命周期 Draft → Issued → Cancelled', async () => {
    const created = await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({
        type: 'REGULAR',
        amount: 500,
        taxAmount: 65,
        orderId: 'order-fin-core-lifecycle',
        buyerInfo: { name: '李四', taxId: '91310000LIFE', email: 'lisi@test.com' },
      })
      .expect(201)
    const invId = created.body.data.id as string
    assert.equal(created.body.data.status, InvoiceStatus.Draft)
    assert.equal(created.body.data.totalAmount, 565)

    const issued = await request(app.getHttpServer())
      .post(`/finance/invoices/${invId}/issue`)
      .set(TENANT_A)
      .expect(201)
    assert.equal(issued.body.data.status, InvoiceStatus.Issued)

    const cancelled = await request(app.getHttpServer())
      .post(`/finance/invoices/${invId}/cancel`)
      .set(TENANT_A)
      .expect(201)
    assert.equal(cancelled.body.data.status, InvoiceStatus.Cancelled)
  })

  it('正例11: invoice 列表筛选 status=DRAFT', async () => {
    const list = await request(app.getHttpServer())
      .get('/finance/invoices?status=DRAFT')
      .set(TENANT_A)
      .expect(200)
    assert.ok(Array.isArray(list.body.data))
  })

  it('正例12: settlement 争议流程 disputed 正确', async () => {
    const settlement = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-31T23:59:59.999Z',
      })
      .expect(201)
    const sid = settlement.body.data.id as string
    assert.equal(settlement.body.data.settlementStatus, SettlementStatus.Pending)

    const disputed = await request(app.getHttpServer())
      .post(`/finance/settlements/${sid}/dispute`)
      .set(TENANT_A)
      .expect(201)
    assert.equal(disputed.body.data.settlementStatus, SettlementStatus.Disputed)
  })

  it('正例13: revenue summary 返回完整统计', async () => {
    const summary = await request(app.getHttpServer())
      .get('/finance/revenue/summary?startDate=2026-07-01T00:00:00.000Z&endDate=2026-07-31T23:59:59.999Z')
      .set(TENANT_A)
      .expect(200)
    assert.ok(summary.body.data.totalRevenue !== undefined)
    assert.ok(summary.body.data.totalExpense !== undefined)
    assert.ok(summary.body.data.totalRefund !== undefined)
    assert.ok(summary.body.data.netRevenue !== undefined)
    assert.ok(summary.body.data.transactionCount !== undefined)
  })

  it('正例14: revenue daily 按天查询', async () => {
    const daily = await request(app.getHttpServer())
      .get('/finance/revenue/daily?date=2026-07-03')
      .set(TENANT_A)
      .expect(200)
    assert.ok(daily.body.data.date !== undefined)
    assert.ok(daily.body.data.revenue !== undefined)
    assert.ok(daily.body.data.expense !== undefined)
    assert.ok(daily.body.data.refund !== undefined)
  })

  it('正例15: revenue daily 当天有数据', async () => {
    // 07-03 我们写过初始化 1000
    const daily = await request(app.getHttpServer())
      .get('/finance/revenue/daily?date=2026-07-03')
      .set(TENANT_A)
      .expect(200)
    assert.equal(daily.body.data.revenue, 1000)
  })

  // ─── 反例: 5+ ───────────────────────────────────────────

  it('反例1: ledger 缺少必填字段 amount 拒绝', async () => {
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: 'REVENUE', description: '缺金额' })
      .expect(400)
  })

  it('反例2: settlement 无效日期格式拒绝', async () => {
    await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({ startDate: 'not-a-date', endDate: '2026-07-31T23:59:59.999Z' })
      .expect(400)
  })

  it('反例3: invoice 负数金额拒绝', async () => {
    await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({
        type: 'REGULAR',
        amount: -100,
        taxAmount: 0,
        buyerInfo: { name: '负测试' },
      })
      .expect(400)
  })

  it('反例4: account 不合法 type 拒绝', async () => {
    await request(app.getHttpServer())
      .post('/finance/accounts')
      .set(TENANT_A)
      .send({ name: '非法账户', type: 'CRYPTO', initialBalance: 100 })
      .expect(400)
  })

  it('反例5: 跨租户读取 ledger 被隔离', async () => {
    const listA = await request(app.getHttpServer())
      .get('/finance/ledgers')
      .set(TENANT_A)
      .expect(200)
    const listB = await request(app.getHttpServer())
      .get('/finance/ledgers')
      .set(TENANT_B)
      .expect(200)
    // 租户B不应看到租户A的记录（从零开始）
    assert.equal(listB.body.data.length, 0)
  })

  it('反例6: 跨租户读取 settlement 被隔离', async () => {
    const listB = await request(app.getHttpServer())
      .get('/finance/settlements')
      .set(TENANT_B)
      .expect(200)
    assert.equal(listB.body.data.length, 0)
  })

  it('反例7: 跨租户读取 account 被隔离', async () => {
    const listB = await request(app.getHttpServer())
      .get('/finance/accounts')
      .set(TENANT_B)
      .expect(200)
    assert.equal(listB.body.data.length, 0)
  })

  it('反例8: 跨租户读取 invoice 被隔离', async () => {
    const listB = await request(app.getHttpServer())
      .get('/finance/invoices')
      .set(TENANT_B)
      .expect(200)
    assert.equal(listB.body.data.length, 0)
  })

  it('反例9: 对不存在的 ledger 查询返回 404', async () => {
    await request(app.getHttpServer())
      .get('/finance/ledgers/nonexistent-id-12345')
      .set(TENANT_A)
      .expect(404)
  })

  // ─── 边界: 5+ ───────────────────────────────────────────

  it('边界1: ledger 金额为 0 可创建', async () => {
    const res = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: 'ADJUSTMENT', amount: 0, description: '零金额调整', category: 'adjust', recordedAt: '2026-07-10T10:00:00.000Z' })
      .expect(201)
    assert.equal(res.body.data.type, LedgerType.Adjustment)
    assert.equal(res.body.data.amount, 0)
  })

  it('边界2: ledger 超大金额（百万级）可正确处理', async () => {
    const res = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: 'REVENUE', amount: 999999.99, description: '大额', category: 'bulk', recordedAt: '2026-07-11T10:00:00.000Z' })
      .expect(201)
    assert.equal(res.body.data.amount, 999999.99)
    assert.ok(typeof res.body.data.balance === 'number')
  })

  it('边界3: account 初始余额为 0 可创建', async () => {
    const res = await request(app.getHttpServer())
      .post('/finance/accounts')
      .set(TENANT_A)
      .send({ name: '零余额账户', type: 'CASH', initialBalance: 0 })
      .expect(201)
    assert.equal(res.body.data.balance, 0)
    assert.equal(res.body.data.status, AccountStatus.Active)
  })

  it('边界4: invoice 极小额（0.01）可创建', async () => {
    const res = await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({
        type: 'REGULAR',
        amount: 0.01,
        taxAmount: 0,
        buyerInfo: { name: '小额测试' },
      })
      .expect(201)
    assert.equal(res.body.data.status, InvoiceStatus.Draft)
  })

  it('边界5: settlement 同一天起止可创建', async () => {
    const res = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({
        startDate: '2026-07-15T00:00:00.000Z',
        endDate: '2026-07-15T23:59:59.999Z',
      })
      .expect(201)
    assert.equal(res.body.data.settlementStatus, SettlementStatus.Pending)
  })

  it('边界6: settlement 跨年区间可创建', async () => {
    const res = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.999Z',
      })
      .expect(201)
    assert.equal(res.body.data.settlementStatus, SettlementStatus.Pending)
    assert.ok(res.body.data.totalRevenue >= 0)
    assert.ok(res.body.data.totalExpense >= 0)
  })

  it('边界7: 跨租户读取 ledger ID 返回404', async () => {
    const created = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({ type: 'REVENUE', amount: 1, description: '跨租户边界', category: 'iso', recordedAt: '2026-07-12T10:00:00.000Z' })
      .expect(201)
    const ledgerId = created.body.data.id as string

    await request(app.getHttpServer())
      .get(`/finance/ledgers/${ledgerId}`)
      .set(TENANT_B)
      .expect(404)
  })

  // ─── Prisma DB 验证 ─────────────────────────────────────

  it('DB验证: ledger 数据已持久化到 Prisma', async () => {
    const dbLedgers = await prisma.financeLedger.findMany({
      where: { tenantId: TENANT_A['x-tenant-id'] },
    })
    assert.ok(dbLedgers.length > 0)
    const revenueLedgers = dbLedgers.filter(l => l.type === 'REVENUE')
    assert.ok(revenueLedgers.length > 0)
  })

  it('DB验证: settlement 已被 Prisma 持久化', async () => {
    const dbSettlements = await prisma.financeSettlement.findMany({
      where: { tenantId: TENANT_A['x-tenant-id'] },
    })
    assert.ok(dbSettlements.length > 0)
  })
})
