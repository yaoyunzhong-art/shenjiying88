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

function makeReportPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: '测试报表',
    reportType: 'REVENUE_ANALYSIS',
    periodStart: '2026-07-01T00:00:00.000Z',
    periodEnd: '2026-07-31T23:59:59.999Z',
    exportFormats: ['JSON'],
    ...overrides,
  }
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

  // ─── 正例: 10+ ───────────────────────────────────────────

  it('正例1: 创建 PROFIT_LOSS 报表完整返回', async () => {
    const res = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ title: '7月利润表', reportType: 'PROFIT_LOSS' }))
      .expect(201)

    const rid = res.body.data.id as string
    assert.ok(rid.startsWith('rpt-'), `id 应以 rpt- 开头: ${rid}`)
    assert.equal(res.body.data.tenantId, TENANT_A['x-tenant-id'])
    assert.equal(res.body.data.status, 'COMPLETED')
    assert.equal(res.body.data.reportType, 'PROFIT_LOSS')
    assert.equal(res.body.data.title, '7月利润表')
  })

  it('正例2: 创建 BALANCE_SHEET 报表', async () => {
    const res = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ title: '资产负债表', reportType: 'BALANCE_SHEET' }))
      .expect(201)

    assert.equal(res.body.data.reportType, 'BALANCE_SHEET')
    assert.equal(res.body.data.status, 'COMPLETED')
  })

  it('正例3: 创建 CASH_FLOW 报表', async () => {
    const res = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ title: '现金流量表', reportType: 'CASH_FLOW' }))
      .expect(201)

    assert.equal(res.body.data.reportType, 'CASH_FLOW')
  })

  it('正例4: 创建 EXPENSE_ANALYSIS 报表', async () => {
    const res = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ title: '支出分析', reportType: 'EXPENSE_ANALYSIS' }))
      .expect(201)

    assert.equal(res.body.data.reportType, 'EXPENSE_ANALYSIS')
  })

  it('正例5: 创建 RECONCILIATION 报表', async () => {
    const res = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ title: '对账报表', reportType: 'RECONCILIATION' }))
      .expect(201)

    assert.equal(res.body.data.reportType, 'RECONCILIATION')
  })

  it('正例6: 多格式导出 JSON+CSV+EXCEL', async () => {
    const create = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ title: '多格式报表', exportFormats: ['JSON', 'CSV', 'EXCEL'] }))
      .expect(201)
    const rid = create.body.data.id as string

    const exportRes = await request(app.getHttpServer())
      .post(`/finance/reports/${rid}/export`)
      .set(TENANT_A)
      .send({ format: 'JSON', columns: ['revenue'] })
      .expect(201)
    assert.ok(exportRes.body.data.id)
    assert.equal(exportRes.body.data.format, 'JSON')

    const exportCsv = await request(app.getHttpServer())
      .post(`/finance/reports/${rid}/export`)
      .set(TENANT_A)
      .send({ format: 'CSV', columns: ['revenue', 'expense'] })
      .expect(201)
    assert.equal(exportCsv.body.data.format, 'CSV')
  })

  it('正例7: 创建后列表查询返回新报表', async () => {
    const list = await request(app.getHttpServer())
      .get('/finance/reports')
      .set(TENANT_A)
      .expect(200)
    assert.ok(Array.isArray(list.body.data))
    assert.ok(list.body.data.length >= 5) // 至少前5条创建都在
  })

  it('正例8: GET 单个报表详情正确', async () => {
    const create = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ title: 'GET 详情测试' }))
      .expect(201)
    const rid = create.body.data.id as string

    const got = await request(app.getHttpServer())
      .get(`/finance/reports/${rid}`)
      .set(TENANT_A)
      .expect(200)
    assert.equal(got.body.data.id, rid)
    assert.equal(got.body.data.title, 'GET 详情测试')
    assert.equal(got.body.data.tenantId, TENANT_A['x-tenant-id'])
  })

  it('正例9: regenerate 报表可正确重新生成', async () => {
    const create = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ title: '再生测试' }))
      .expect(201)
    const rid = create.body.data.id as string

    const regen = await request(app.getHttpServer())
      .post(`/finance/reports/${rid}/regenerate`)
      .set(TENANT_A)
      .expect(201)
    assert.equal(regen.body.data.id, rid)
    assert.equal(regen.body.data.status, 'COMPLETED')
  })

  it('正例10: 导出 + 获取导出详情完整流程', async () => {
    const create = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ title: '导出详情测试' }))
      .expect(201)
    const rid = create.body.data.id as string

    const exportRes = await request(app.getHttpServer())
      .post(`/finance/reports/${rid}/export`)
      .set(TENANT_A)
      .send({ format: 'JSON', columns: ['revenue', 'expense', 'refund'] })
      .expect(201)
    const eid = exportRes.body.data.id as string

    const gotExport = await request(app.getHttpServer())
      .get(`/finance/reports/exports/${eid}`)
      .set(TENANT_A)
      .expect(200)
    assert.equal(gotExport.body.data.id, eid)
    assert.equal(gotExport.body.data.reportId, rid)
    assert.equal(gotExport.body.data.format, 'JSON')
  })

  it('正例11: 删除报表级联删除导出', async () => {
    const create = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ title: '级联删除测试' }))
      .expect(201)
    const rid = create.body.data.id as string

    const exportRes = await request(app.getHttpServer())
      .post(`/finance/reports/${rid}/export`)
      .set(TENANT_A)
      .send({ format: 'CSV' })
      .expect(201)
    const eid = exportRes.body.data.id as string

    await request(app.getHttpServer())
      .delete(`/finance/reports/${rid}`)
      .set(TENANT_A)
      .expect(200)

    const dbReport = await prisma.financeReport.findUnique({ where: { id: rid } })
    const dbExport = await prisma.financeReportExport.findUnique({ where: { id: eid } })
    assert.equal(dbReport, null)
    assert.equal(dbExport, null)
  })

  it('正例12: reportType=REVENUE_ANALYSIS 带 storeId 过滤创建', async () => {
    const res = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send({
        ...makeReportPayload({ title: '门店收入分析' }),
        storeId: TENANT_A['x-store-id'],
      })
      .expect(201)
    assert.equal(res.body.data.reportType, 'REVENUE_ANALYSIS')
  })

  it('正例13: 报表支持 filters 导出参数', async () => {
    const create = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ title: 'Filter导出测试' }))
      .expect(201)
    const rid = create.body.data.id as string

    const exportRes = await request(app.getHttpServer())
      .post(`/finance/reports/${rid}/export`)
      .set(TENANT_A)
      .send({
        format: 'JSON',
        columns: ['revenue'],
        filters: { storeId: 'test-store' },
      })
      .expect(201)
    assert.ok(exportRes.body.data.id)
  })

  // ─── 反例: 5+ ───────────────────────────────────────────

  it('反例1: 创建报表缺 title 拒绝', async () => {
    const { title: _, ...noTitle } = makeReportPayload()
    await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(noTitle)
      .expect(400)
  })

  it('反例2: 创建报表无效 reportType 拒绝', async () => {
    await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ reportType: 'INVALID_TYPE' }))
      .expect(400)
  })

  it('反例3: 创建报表无效 periodStart 格式拒绝', async () => {
    await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ periodStart: 'invalid-date' }))
      .expect(400)
  })

  it('反例4: 导出不存在的报表返回 404', async () => {
    await request(app.getHttpServer())
      .post('/finance/reports/nonexistent-rpt-id/export')
      .set(TENANT_A)
      .send({ format: 'JSON' })
      .expect(404)
  })

  it('反例5: 不存在的导出 ID 查询返回 404', async () => {
    await request(app.getHttpServer())
      .get('/finance/reports/exports/nonexistent-export-id')
      .set(TENANT_A)
      .expect(404)
  })

  it('反例6: 无效 exportFormat 拒绝', async () => {
    const create = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload())
      .expect(201)
    const rid = create.body.data.id as string

    await request(app.getHttpServer())
      .post(`/finance/reports/${rid}/export`)
      .set(TENANT_A)
      .send({ format: 'XML' })
      .expect(400)
  })

  it('反例7: 删除不存在的报表返回 404', async () => {
    await request(app.getHttpServer())
      .delete('/finance/reports/nonexistent-rpt-id')
      .set(TENANT_A)
      .expect(404)
  })

  it('反例8: 空 exportFormats 数组可创建但导出仍需指定 format', async () => {
    const create = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ exportFormats: [] }))
      .expect(201)
    const rid = create.body.data.id as string

    await request(app.getHttpServer())
      .post(`/finance/reports/${rid}/export`)
      .set(TENANT_A)
      .send({ format: 'JSON' })
      .expect(201)
    // 至少可以导出
  })

  it('反例9: 空的 body 导出请求拒绝', async () => {
    const create = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload())
      .expect(201)
    const rid = create.body.data.id as string

    await request(app.getHttpServer())
      .post(`/finance/reports/${rid}/export`)
      .set(TENANT_A)
      .send({})
      .expect(400)
  })

  // ─── 边界: 5+ ───────────────────────────────────────────

  it('边界1: 跨租户读取报表列表被隔离', async () => {
    const listB = await request(app.getHttpServer())
      .get('/finance/reports')
      .set(TENANT_B)
      .expect(200)
    assert.ok(Array.isArray(listB.body.data))
    assert.equal(listB.body.data.length, 0)
  })

  it('边界2: 跨租户读取报表详情返回 404', async () => {
    const create = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ title: '跨租户隔离测试' }))
      .expect(201)
    const rid = create.body.data.id as string

    await request(app.getHttpServer())
      .get(`/finance/reports/${rid}`)
      .set(TENANT_B)
      .expect(404)
  })

  it('边界3: 跨租户删除报表返回 404', async () => {
    const create = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ title: '跨租户删除测试' }))
      .expect(201)
    const rid = create.body.data.id as string

    await request(app.getHttpServer())
      .delete(`/finance/reports/${rid}`)
      .set(TENANT_B)
      .expect(404)
  })

  it('边界4: 跨租户导出报表返回 404', async () => {
    const create = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ title: '跨租户导出测试' }))
      .expect(201)
    const rid = create.body.data.id as string

    await request(app.getHttpServer())
      .post(`/finance/reports/${rid}/export`)
      .set(TENANT_B)
      .send({ format: 'JSON' })
      .expect(404)
  })

  it('边界5: 跨租户 regenerate 返回 404', async () => {
    const create = await request(app.getHttpServer())
      .post('/finance/reports')
      .set(TENANT_A)
      .send(makeReportPayload({ title: '跨租户再生测试' }))
      .expect(201)
    const rid = create.body.data.id as string

    await request(app.getHttpServer())
      .post(`/finance/reports/${rid}/regenerate`)
      .set(TENANT_B)
      .expect(404)
  })

  it('边界6: 报表大数据量列表不可缺失', async () => {
    // 批量创建多个报表，验证列表返回不受限
    const payloads = [
      makeReportPayload({ title: '批量报表1', reportType: 'PROFIT_LOSS' }),
      makeReportPayload({ title: '批量报表2', reportType: 'BALANCE_SHEET' }),
      makeReportPayload({ title: '批量报表3', reportType: 'CASH_FLOW' }),
    ]
    for (const p of payloads) {
      await request(app.getHttpServer())
        .post('/finance/reports')
        .set(TENANT_A)
        .send(p)
        .expect(201)
    }

    const list = await request(app.getHttpServer())
      .get('/finance/reports')
      .set(TENANT_A)
      .expect(200)
    assert.ok(list.body.data.length >= 8) // 包含前面所有创建
  })

  it('边界7: 带 query 参数 type 过滤列表', async () => {
    const list = await request(app.getHttpServer())
      .get('/finance/reports?reportType=PROFIT_LOSS')
      .set(TENANT_A)
      .expect(200)
    assert.ok(Array.isArray(list.body.data))
    for (const r of list.body.data) {
      assert.equal(r.reportType, 'PROFIT_LOSS')
    }
  })

  // ─── Prisma DB 验证 ─────────────────────────────────────

  it('DB验证: 报表数据已持久化到 Prisma', async () => {
    const dbReports = await prisma.financeReport.findMany({
      where: { tenantId: TENANT_A['x-tenant-id'] },
    })
    assert.ok(dbReports.length > 0)
  })

  it('DB验证: 导出数据已级联持久化', async () => {
    const dbExports = await prisma.financeReportExport.findMany({
      where: { tenantId: TENANT_A['x-tenant-id'] },
    })
    assert.ok(dbExports.length > 0)
  })
})
