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
import { AccountStatus, InvoiceStatus, SettlementStatus } from './finance.entity'

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

  it('HTTP 真 DB: ledger -> account -> settlement -> revenue summary 主链通过', async () => {
    const revenueLedger = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({
        type: 'REVENUE',
        amount: 1000,
        description: '门票收入',
        category: 'ticket',
        recordedAt: '2026-07-05T10:00:00.000Z',
      })
      .expect(201)

    assert.equal(revenueLedger.body.data.type, 'REVENUE')
    assert.equal(revenueLedger.body.data.balance, 1000)

    const expenseLedger = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({
        type: 'EXPENSE',
        amount: 300,
        description: '采购支出',
        category: 'supply',
        recordedAt: '2026-07-06T10:00:00.000Z',
      })
      .expect(201)

    const refundLedger = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({
        type: 'REFUND',
        amount: 100,
        description: '用户退款',
        category: 'refund',
        recordedAt: '2026-07-07T10:00:00.000Z',
      })
      .expect(201)

    assert.equal(expenseLedger.body.data.balance, 700)
    assert.equal(refundLedger.body.data.balance, 600)

    const listLedgers = await request(app.getHttpServer())
      .get('/finance/ledgers?type=REVENUE')
      .set(TENANT_A)
      .expect(200)

    assert.equal(listLedgers.body.data.length, 1)
    assert.equal(listLedgers.body.data[0].type, 'REVENUE')

    const accountRes = await request(app.getHttpServer())
      .post('/finance/accounts')
      .set(TENANT_A)
      .send({
        name: '主收款账户',
        type: 'CASH',
        initialBalance: 5000,
      })
      .expect(201)

    const accountId = accountRes.body.data.id as string
    assert.equal(accountRes.body.data.status, AccountStatus.Active)

    const freezeRes = await request(app.getHttpServer())
      .post(`/finance/accounts/${accountId}/freeze`)
      .set(TENANT_A)
      .expect(201)

    assert.equal(freezeRes.body.data.status, AccountStatus.Frozen)

    const closeRes = await request(app.getHttpServer())
      .post(`/finance/accounts/${accountId}/close`)
      .set(TENANT_A)
      .expect(201)

    assert.equal(closeRes.body.data.status, AccountStatus.Closed)

    const settlementRes = await request(app.getHttpServer())
      .post('/finance/settlements')
      .set(TENANT_A)
      .send({
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-31T23:59:59.999Z',
      })
      .expect(201)

    const settlementId = settlementRes.body.data.id as string
    assert.equal(settlementRes.body.data.totalRevenue, 1000)
    assert.equal(settlementRes.body.data.totalExpense, 300)
    assert.equal(settlementRes.body.data.netProfit, 700)
    assert.equal(settlementRes.body.data.settlementStatus, SettlementStatus.Pending)

    const settlementDetail = await request(app.getHttpServer())
      .get(`/finance/settlements/${settlementId}/detail`)
      .set(TENANT_A)
      .expect(200)

    assert.equal(settlementDetail.body.data.settlement.id, settlementId)
    assert.equal(settlementDetail.body.data.ledgers.length, 3)

    const confirmSettlement = await request(app.getHttpServer())
      .post(`/finance/settlements/${settlementId}/confirm`)
      .set(TENANT_A)
      .expect(201)

    assert.equal(confirmSettlement.body.data.settlementStatus, SettlementStatus.Confirmed)

    const revenueSummary = await request(app.getHttpServer())
      .get(
        '/finance/revenue/summary?startDate=2026-07-01T00:00:00.000Z&endDate=2026-07-31T23:59:59.999Z',
      )
      .set(TENANT_A)
      .expect(200)

    assert.equal(revenueSummary.body.data.totalRevenue, 1000)
    assert.equal(revenueSummary.body.data.totalExpense, 300)
    assert.equal(revenueSummary.body.data.totalRefund, 100)
    assert.equal(revenueSummary.body.data.netRevenue, 600)
    assert.equal(revenueSummary.body.data.transactionCount, 3)

    const dailyRevenue = await request(app.getHttpServer())
      .get('/finance/revenue/daily?date=2026-07-05')
      .set(TENANT_A)
      .expect(200)

    assert.equal(dailyRevenue.body.data.revenue, 1000)
    assert.equal(dailyRevenue.body.data.expense, 0)
    assert.equal(dailyRevenue.body.data.refund, 0)
  })

  it('HTTP 真 DB: invoice 状态流转与跨租户隔离通过', async () => {
    const invoiceRes = await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(TENANT_A)
      .send({
        type: 'REGULAR',
        amount: 200,
        taxAmount: 26,
        orderId: 'order-fin-core-001',
        buyerInfo: {
          name: '张三',
          taxId: '91310000TEST',
          email: 'zhangsan@example.com',
        },
      })
      .expect(201)

    const invoiceId = invoiceRes.body.data.id as string
    assert.equal(invoiceRes.body.data.status, InvoiceStatus.Draft)

    const getInvoice = await request(app.getHttpServer())
      .get(`/finance/invoices/${invoiceId}`)
      .set(TENANT_A)
      .expect(200)

    assert.equal(getInvoice.body.data.id, invoiceId)
    assert.equal(getInvoice.body.data.totalAmount, 226)

    const issueInvoice = await request(app.getHttpServer())
      .post(`/finance/invoices/${invoiceId}/issue`)
      .set(TENANT_A)
      .expect(201)

    assert.equal(issueInvoice.body.data.status, InvoiceStatus.Issued)

    const cancelInvoice = await request(app.getHttpServer())
      .post(`/finance/invoices/${invoiceId}/cancel`)
      .set(TENANT_A)
      .expect(201)

    assert.equal(cancelInvoice.body.data.status, InvoiceStatus.Cancelled)

    const listCancelled = await request(app.getHttpServer())
      .get('/finance/invoices?status=CANCELLED')
      .set(TENANT_A)
      .expect(200)

    assert.ok(Array.isArray(listCancelled.body.data))
    assert.ok(listCancelled.body.data.some((invoice: { id: string }) => invoice.id === invoiceId))

    const tenantBList = await request(app.getHttpServer())
      .get('/finance/invoices')
      .set(TENANT_B)
      .expect(200)

    assert.equal(
      tenantBList.body.data.some((invoice: { id: string }) => invoice.id === invoiceId),
      false,
    )

    await request(app.getHttpServer())
      .get(`/finance/invoices/${invoiceId}`)
      .set(TENANT_B)
      .expect(404)
  })
})
