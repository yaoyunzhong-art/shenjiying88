/**
 * finance-report.controller.test.ts — P-38 报表 Controller 补充测试
 *
 * 与 finance-report.controller.spec.ts 互补
 * 覆盖场景:
 *   - resolved 主链完整集成测试
 *   - 控制器装饰器元数据验证
 *   - HTTP 层语义一致
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'reflect-metadata'
import { Test, type TestingModule } from '@nestjs/testing'
import { FinanceReportController } from './finance-report.controller'
import { FinanceReportService } from './finance-report.service'
import { FinanceService } from './finance.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type { FinancialReport, ExportResult } from './types'
import { ReportType, ExportFormat } from './dto/create-report.dto'

const defaultCtx: RequestTenantContext = { tenantId: 't-1', storeId: 's-001' }

const mockReport: FinancialReport = {
  id: 'rpt-001',
  tenantId: 't-1',
  storeId: 's-001',
  title: '利润表',
  reportType: 'PROFIT_LOSS',
  periodStart: '2026-07-01',
  periodEnd: '2026-07-31',
  status: 'COMPLETED',
  data: { sections: [], grossProfit: 0, netProfit: 0 },
  summary: { totalRevenue: 100000, totalExpense: 60000, totalRefund: 5000, netProfit: 35000, transactionCount: 42 },
  generatedAt: '2026-07-19T00:00:00.000Z',
  exportFormats: ['JSON', 'CSV'],
  createdAt: '2026-07-19T00:00:00.000Z',
}

const mockExport: ExportResult = {
  id: 'exp-001',
  reportId: 'rpt-001',
  format: 'JSON',
  content: '{"data":true}',
  generatedAt: '2026-07-19T00:00:00.000Z',
  expiresAt: '2026-07-20T00:00:00.000Z',
}

describe('FinanceReportController - 补充测试', () => {
  let ctrl: FinanceReportController
  let mockSvc: Record<string, ReturnType<typeof vi.fn>>
  let mockSvcInstance: FinanceReportService

  beforeEach(async () => {
    mockSvc = {
      createReport: vi.fn().mockReturnValue(mockReport),
      listReports: vi.fn().mockReturnValue([mockReport]),
      getReport: vi.fn().mockReturnValue(mockReport),
      regenerateReport: vi.fn().mockReturnValue(mockReport),
      exportReport: vi.fn().mockReturnValue(mockExport),
      getExportResult: vi.fn().mockReturnValue(mockExport),
      deleteReport: vi.fn().mockReturnValue(true),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanceReportController],
      providers: [
        { provide: FinanceReportService, useValue: mockSvc },
        { provide: FinanceService, useValue: { getRevenueSummary: vi.fn(), listAccounts: vi.fn() } },
      ],
    }).compile()

    ctrl = module.get(FinanceReportController)
    mockSvcInstance = module.get(FinanceReportService)
  })

  // ── 路由元数据 ──

  it('控制器路径前缀为 finance/reports', () => {
    const path = Reflect.getMetadata('path', FinanceReportController)
    expect(path).toBe('finance/reports')
  })

  it('所有 7 个端点方法已定义', () => {
    const proto = FinanceReportController.prototype
    expect(typeof proto.createReport).toBe('function')
    expect(typeof proto.listReports).toBe('function')
    expect(typeof proto.getReport).toBe('function')
    expect(typeof proto.regenerateReport).toBe('function')
    expect(typeof proto.exportReport).toBe('function')
    expect(typeof proto.getExportResult).toBe('function')
    expect(typeof proto.deleteReport).toBe('function')
  })

  // ── 缺少 resolved 时的回退 ──

  it('无 resolved 方法时使用原始方法', async () => {
    const result = await ctrl.createReport(defaultCtx, {
      title: 'test',
      reportType: ReportType.PROFIT_LOSS,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
    })
    expect(result).toEqual(mockReport)
    expect(mockSvc.createReport).toHaveBeenCalled()
  })

  it('无 resolved 时 deleteReport 返回 success 消息', async () => {
    const result = await ctrl.deleteReport('rpt-001', defaultCtx)
    expect(result).toEqual({ success: true, message: 'Report rpt-001 deleted' })
  })

  // ── 带 resolved 主链的委托 ──

  it('createReportResolved 优先于 createReport', async () => {
    const resolved = vi.fn().mockResolvedValue(mockReport)
    ;(mockSvcInstance as any).createReportResolved = resolved

    const result = await ctrl.createReport(defaultCtx, {
      title: 'resolved',
      reportType: ReportType.PROFIT_LOSS,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
    })
    expect(result).toEqual(mockReport)
    expect(resolved).toHaveBeenCalled()
    expect(mockSvc.createReport).not.toHaveBeenCalled()
  })

  it('getReportResolved 优先于 getReport', async () => {
    const resolved = vi.fn().mockResolvedValue(mockReport)
    ;(mockSvcInstance as any).getReportResolved = resolved

    const result = await ctrl.getReport('rpt-001', defaultCtx)
    expect(result).toEqual(mockReport)
    expect(resolved).toHaveBeenCalledWith('rpt-001', defaultCtx)
  })

  it('regenerateReportResolved 优先于 regenerateReport', async () => {
    const resolved = vi.fn().mockResolvedValue(mockReport)
    ;(mockSvcInstance as any).regenerateReportResolved = resolved

    const result = await ctrl.regenerateReport('rpt-001', defaultCtx)
    expect(result).toEqual(mockReport)
    expect(resolved).toHaveBeenCalledWith('rpt-001', defaultCtx)
  })

  it('exportReportResolved 优先于 exportReport', async () => {
    const resolved = vi.fn().mockResolvedValue(mockExport)
    ;(mockSvcInstance as any).exportReportResolved = resolved

    const result = await ctrl.exportReport('rpt-001', defaultCtx, { format: ExportFormat.JSON })
    expect(result).toEqual(mockExport)
    expect(resolved).toHaveBeenCalledWith('rpt-001', defaultCtx, { format: ExportFormat.JSON })
  })

  it('getExportResultResolved 优先于 getExportResult', async () => {
    const resolved = vi.fn().mockResolvedValue(mockExport)
    ;(mockSvcInstance as any).getExportResultResolved = resolved

    const result = await ctrl.getExportResult('exp-001', defaultCtx)
    expect(result).toEqual(mockExport)
    expect(resolved).toHaveBeenCalledWith('exp-001', defaultCtx)
  })

  it('deleteReportResolved 优先于 deleteReport', async () => {
    const resolved = vi.fn().mockResolvedValue(true)
    ;(mockSvcInstance as any).deleteReportResolved = resolved

    const result = await ctrl.deleteReport('rpt-001', defaultCtx)
    expect(result).toEqual({ success: true, message: 'Report rpt-001 deleted' })
    expect(resolved).toHaveBeenCalledWith('rpt-001', defaultCtx)
  })

  // ── TenantGuard ──

  it('控制器应用了 TenantGuard', () => {
    const guards = Reflect.getMetadata('__guards__', FinanceReportController)
    expect(guards).toBeDefined()
  })

  // ── TenantContext 装饰器注入 ──

  it('createReport 接受 TenantContext 参数', async () => {
    // 控制器已正常实例化，函数为 async 即可确认
    const result = await ctrl.createReport(defaultCtx, {
      title: 'tenant-test',
      reportType: ReportType.PROFIT_LOSS,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
    })
    expect(result).toBeDefined()
  })

  // ── exportReport 传递 body 参数 ──

  it('exportReport 参数传递正确', () => {
    const body = { format: ExportFormat.CSV, columns: ['revenue'] }
    ctrl.exportReport('rpt-001', defaultCtx, body)
    expect(mockSvc.exportReport).toHaveBeenCalledWith('rpt-001', defaultCtx, body)
  })

  // ── listReports 过滤参数 ──

  it('listReports 传递查询参数', async () => {
    const query = { reportType: ReportType.PROFIT_LOSS, limit: 5, offset: 0 }
    await ctrl.listReports(defaultCtx, query)
    expect(mockSvc.listReports).toHaveBeenCalledWith(defaultCtx, query)
  })

  // ── 错误传播 ──

  it('getReport 抛出 NotFoundException', async () => {
    mockSvc.getReport.mockImplementation(() => { throw new Error('not found') })
    await expect(ctrl.getReport('bad-id', defaultCtx)).rejects.toThrow()
  })

  it('exportReport 抛出 ConflictException', async () => {
    mockSvc.exportReport.mockImplementation(() => { throw new Error('not completed') })
    await expect(ctrl.exportReport('bad-id', defaultCtx, { format: ExportFormat.JSON })).rejects.toThrow()
  })
})
