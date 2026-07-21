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
import { FinanceReportController } from './finance-report.controller'
import { FinanceReportService } from './finance-report.service'

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as unknown as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-finance-e2e',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-finance-e2e',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-finance-e2e',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland',
  }
  next()
}

const TENANT_A = {
  'x-tenant-id': 'tenant-finance-e2e-a',
  'x-brand-id': 'brand-finance-e2e-a',
  'x-store-id': 'store-finance-e2e-a',
  'x-market-code': 'cn-mainland',
}

const TENANT_B = {
  'x-tenant-id': 'tenant-finance-e2e-b',
  'x-brand-id': 'brand-finance-e2e-b',
  'x-store-id': 'store-finance-e2e-b',
  'x-market-code': 'cn-mainland',
}

describe('FinanceReport Prisma HTTP E2E', () => {
  let app: any
  let prisma: PrismaService

  beforeAll(async () => {
    prisma = new PrismaService()
    await prisma.onModuleInit()

    const financeService = new FinanceService(prisma)
    const financeReportService = new FinanceReportService(financeService, undefined, prisma)

    const moduleRef = await Test.createTestingModule({
      controllers: [FinanceController, FinanceReportController],
      providers: [
        TenantGuard,
        { provide: PrismaService, useValue: prisma },
        { provide: FinanceService, useValue: financeService },
        { provide: FinanceReportService, useValue: financeReportService },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.useGlobalInterceptors(new ResponseInterceptor())
    app.use(attachTenantContext)
    await app.init()
  })

  afterAll(async () => {
    await prisma.financeReportExport.deleteMany({
      where: {
        tenantId: {
          in: [TENANT_A['x-tenant-id'], TENANT_B['x-tenant-id']],
        },
      },
    })
    await prisma.financeReport.deleteMany({
      where: {
        tenantId: {
          in: [TENANT_A['x-tenant-id'], TENANT_B['x-tenant-id']],
        },
      },
    })
    await app.close()
    await prisma.onModuleDestroy()
  })

  it('HTTP 真 DB: create -> list -> get -> export -> get export -> delete 全链路通过', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send({
        title: '7月利润表',
        reportType: 'PROFIT_LOSS',
        periodStart: '2026-07-01T00:00:00.000Z',
        periodEnd: '2026-07-31T23:59:59.999Z',
        exportFormats: ['JSON', 'CSV'],
      })
      .expect(201)

    const reportId = createRes.body.data.id as string
    assert.ok(reportId.startsWith('rpt-'))
    assert.equal(createRes.body.data.tenantId, TENANT_A['x-tenant-id'])
    assert.equal(createRes.body.data.status, 'COMPLETED')
    assert.equal(createRes.body.data.reportType, 'PROFIT_LOSS')

    const listRes = await request(app.getHttpServer())
      .get('/finance/reports')
      .set(TENANT_A)
      .expect(200)

    assert.ok(Array.isArray(listRes.body.data))
    assert.ok(listRes.body.data.some((report: { id: string }) => report.id === reportId))

    const getRes = await request(app.getHttpServer())
      .get(`/finance/reports/${reportId}`)
      .set(TENANT_A)
      .expect(200)

    assert.equal(getRes.body.data.id, reportId)
    assert.equal(getRes.body.data.tenantId, TENANT_A['x-tenant-id'])

    const exportRes = await request(app.getHttpServer())
      .post(`/finance/reports/${reportId}/export`)
      .set(TENANT_A)
      .send({
        format: 'JSON',
        columns: ['revenue', 'expense'],
      })
      .expect(201)

    const exportId = exportRes.body.data.id as string
    assert.ok(exportId)
    assert.equal(exportRes.body.data.reportId, reportId)
    assert.equal(exportRes.body.data.format, 'JSON')

    const getExportRes = await request(app.getHttpServer())
      .get(`/finance/reports/exports/${exportId}`)
      .set(TENANT_A)
      .expect(200)

    assert.equal(getExportRes.body.data.id, exportId)
    assert.equal(getExportRes.body.data.reportId, reportId)

    await request(app.getHttpServer())
      .delete(`/finance/reports/${reportId}`)
      .set(TENANT_A)
      .expect(200)

    const deletedReport = await prisma.financeReport.findUnique({
      where: { id: reportId },
    })
    const deletedExport = await prisma.financeReportExport.findUnique({
      where: { id: exportId },
    })

    assert.equal(deletedReport, null)
    assert.equal(deletedExport, null)
  })

  it('HTTP 真 DB: 跨租户读取被隔离', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send({
        title: '隔离测试报表',
        reportType: 'REVENUE_ANALYSIS',
        periodStart: '2026-07-01T00:00:00.000Z',
        periodEnd: '2026-07-31T23:59:59.999Z',
        exportFormats: ['JSON'],
      })
      .expect(201)

    const reportId = createRes.body.data.id as string

    const tenantBList = await request(app.getHttpServer())
      .get('/finance/reports')
      .set(TENANT_B)
      .expect(200)

    assert.ok(Array.isArray(tenantBList.body.data))
    assert.equal(
      tenantBList.body.data.some((report: { id: string }) => report.id === reportId),
      false,
    )

    await request(app.getHttpServer())
      .get(`/finance/reports/${reportId}`)
      .set(TENANT_B)
      .expect(404)

    await prisma.financeReport.delete({
      where: { id: reportId },
    })
  })
})
