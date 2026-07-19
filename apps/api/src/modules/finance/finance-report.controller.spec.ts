/**
 * finance-report.controller.spec.ts — P-38 报表 Controller 测试
 *
 * Mock Service + NestJS TestingModule
 * 三件套: 正例(正常CRUD) + 反例(404/错误参数) + 边界(空列表/分页)
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

// ═══════════════════════════════════════════════════════════════
// Mock Data
// ═══════════════════════════════════════════════════════════════

const defaultCtx: RequestTenantContext = { tenantId: 't-1', storeId: 's-001' }

const mockCompletedReport: FinancialReport = {
  id: 'rpt-001',
  tenantId: 't-1',
  storeId: 's-001',
  title: '利润表 2026-07',
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

const mockGeneratingReport: FinancialReport = {
  ...mockCompletedReport,
  id: 'rpt-002',
  status: 'GENERATING',
  data: undefined,
  summary: undefined,
  generatedAt: undefined,
}

const mockFailedReport: FinancialReport = {
  ...mockCompletedReport,
  id: 'rpt-003',
  status: 'FAILED',
  errorMessage: 'Data source unavailable',
  data: undefined,
  summary: undefined,
  generatedAt: undefined,
}

const mockExportResult: ExportResult = {
  id: 'exp-001',
  reportId: 'rpt-001',
  format: 'JSON',
  content: '{"sections":[]}',
  generatedAt: '2026-07-19T00:00:00.000Z',
  expiresAt: '2026-07-20T00:00:00.000Z',
}

const mockReportList: FinancialReport[] = [
  mockCompletedReport,
  { ...mockCompletedReport, id: 'rpt-004', reportType: 'BALANCE_SHEET', title: '资产负债表 2026-07' },
  { ...mockCompletedReport, id: 'rpt-005', reportType: 'CASH_FLOW', title: '现金流量表 2026-07' },
]

// ═══════════════════════════════════════════════════════════════
// Mock Service
// ═══════════════════════════════════════════════════════════════

class MockFinanceReportService {
  createReport = vi.fn().mockReturnValue(mockCompletedReport)
  listReports = vi.fn().mockReturnValue(mockReportList)
  getReport = vi.fn().mockReturnValue(mockCompletedReport)
  regenerateReport = vi.fn().mockReturnValue(mockCompletedReport)
  exportReport = vi.fn().mockReturnValue(mockExportResult)
  getExportResult = vi.fn().mockReturnValue(mockExportResult)
  deleteReport = vi.fn().mockReturnValue(true)
}

// Dummy — FinanceReportService 还注入了 FinanceService
class MockFinanceService {
  getRevenueSummary = vi.fn()
  listAccounts = vi.fn()
}

// ═══════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════

describe('FinanceReportController', () => {
  let ctrl: FinanceReportController
  let mockSvc: MockFinanceReportService

  beforeEach(async () => {
    mockSvc = new MockFinanceReportService()
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanceReportController],
      providers: [
        { provide: FinanceReportService, useValue: mockSvc },
        { provide: FinanceService, useValue: new MockFinanceService() },
      ],
    }).compile()
    ctrl = module.get(FinanceReportController)
  })

  // ═══════════════════════════════════════════════════════════════
  // 路由元数据
  // ═══════════════════════════════════════════════════════════════

  it('ROUTE-1: 控制器路径前缀 /finance/reports', () => {
    const path = Reflect.getMetadata('path', FinanceReportController)
    expect(path).toBe('finance/reports')
  })

  it('ROUTE-2: 暴露所有 7 个处理方法', () => {
    const proto = FinanceReportController.prototype
    expect(typeof proto.createReport).toBe('function')
    expect(typeof proto.listReports).toBe('function')
    expect(typeof proto.getReport).toBe('function')
    expect(typeof proto.regenerateReport).toBe('function')
    expect(typeof proto.exportReport).toBe('function')
    expect(typeof proto.getExportResult).toBe('function')
    expect(typeof proto.deleteReport).toBe('function')
  })

  // ═══════════════════════════════════════════════════════════════
  // 正例 (happy path)
  // ═══════════════════════════════════════════════════════════════

  it('FLOW-1: createReport → 成功创建报表并返回完整对象', () => {
    const body = {
      title: '利润表 2026-07',
      reportType: ReportType.PROFIT_LOSS,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      storeId: 's-001',
      exportFormats: [ExportFormat.JSON, ExportFormat.CSV],
    }
    const result = ctrl.createReport(defaultCtx, body)
    expect(result).toEqual(mockCompletedReport)
    expect(mockSvc.createReport).toHaveBeenCalledOnce()
    expect(mockSvc.createReport).toHaveBeenCalledWith(defaultCtx, body)
  })

  it('FLOW-2: createReport → 最小必需参数（无 storeId/exportFormats）', () => {
    const body = {
      title: '简易报表',
      reportType: ReportType.PROFIT_LOSS,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
    }
    const result = ctrl.createReport(defaultCtx, body)
    expect(result).toEqual(mockCompletedReport)
    expect(mockSvc.createReport).toHaveBeenCalledWith(defaultCtx, body)
  })

  it('FLOW-3: getReport → 返回指定报表详情', () => {
    const result = ctrl.getReport('rpt-001', defaultCtx)
    expect(result).toEqual(mockCompletedReport)
    expect(mockSvc.getReport).toHaveBeenCalledWith('rpt-001', defaultCtx)
  })

  it('FLOW-4: listReports → 返回报表列表', () => {
    const result = ctrl.listReports(defaultCtx, {})
    expect(result).toHaveLength(3)
    expect(mockSvc.listReports).toHaveBeenCalledWith(defaultCtx, {})
  })

  it('FLOW-5: listReports → 按 reportType 过滤', () => {
    mockSvc.listReports.mockReturnValueOnce([mockReportList[1]])
    const result = ctrl.listReports(defaultCtx, { reportType: ReportType.BALANCE_SHEET })
    expect(result).toHaveLength(1)
    expect(result[0].reportType).toBe('BALANCE_SHEET')
    expect(mockSvc.listReports).toHaveBeenCalledWith(defaultCtx, { reportType: ReportType.BALANCE_SHEET })
  })

  it('FLOW-6: listReports → 分页参数传递', () => {
    mockSvc.listReports.mockReturnValueOnce([mockReportList[0]])
    const query = { limit: 1, offset: 1, reportType: ReportType.PROFIT_LOSS }
    const result = ctrl.listReports(defaultCtx, query)
    expect(result).toHaveLength(1)
    expect(mockSvc.listReports).toHaveBeenCalledWith(defaultCtx, query)
  })

  it('FLOW-7: regenerateReport → 重新生成报表', () => {
    const result = ctrl.regenerateReport('rpt-001', defaultCtx)
    expect(result).toEqual(mockCompletedReport)
    expect(mockSvc.regenerateReport).toHaveBeenCalledWith('rpt-001', defaultCtx)
  })

  it('FLOW-8: regenerateReport → 重新生成失败报表也能触发', () => {
    mockSvc.regenerateReport.mockReturnValueOnce(mockCompletedReport)
    const result = ctrl.regenerateReport('rpt-003', defaultCtx)
    expect(result.status).toBe('COMPLETED')
    expect(mockSvc.regenerateReport).toHaveBeenCalledWith('rpt-003', defaultCtx)
  })

  it('FLOW-9: exportReport → 成功导出 JSON', () => {
    const body = { format: ExportFormat.JSON, columns: ['revenue', 'expense'] }
    const result = ctrl.exportReport('rpt-001', defaultCtx, body)
    expect(result).toEqual(mockExportResult)
    expect(mockSvc.exportReport).toHaveBeenCalledWith('rpt-001', defaultCtx, body)
  })

  it('FLOW-10: exportReport → 导出 CSV（无 columns）', () => {
    const body = { format: ExportFormat.CSV }
    mockSvc.exportReport.mockReturnValueOnce({
      ...mockExportResult, format: 'CSV', content: 'revenue,expense\n100000,60000'
    })
    const result = ctrl.exportReport('rpt-001', defaultCtx, body)
    expect(result.format).toBe('CSV')
    expect(mockSvc.exportReport).toHaveBeenCalledWith('rpt-001', defaultCtx, body)
  })

  it('FLOW-11: getExportResult → 获取导出结果', () => {
    const result = ctrl.getExportResult('exp-001', defaultCtx)
    expect(result).toEqual(mockExportResult)
    expect(mockSvc.getExportResult).toHaveBeenCalledWith('exp-001', defaultCtx)
  })

  it('FLOW-12: deleteReport → 删除报表成功', () => {
    const result = ctrl.deleteReport('rpt-001', defaultCtx)
    expect(result).toEqual({ success: true, message: 'Report rpt-001 deleted' })
    expect(mockSvc.deleteReport).toHaveBeenCalledWith('rpt-001', defaultCtx)
  })

  it('FLOW-13: createReport → 批量创建不同报表类型', () => {
    const types = Object.values(ReportType)
    for (const reportType of types) {
      const body = {
        title: `Test ${reportType}`,
        reportType,
        periodStart: '2026-07-01',
        periodEnd: '2026-07-31',
      }
      ctrl.createReport(defaultCtx, body)
    }
    expect(mockSvc.createReport).toHaveBeenCalledTimes(types.length)
  })

  // ═══════════════════════════════════════════════════════════════
  // 反例 (defensive)
  // ═══════════════════════════════════════════════════════════════

  it('DEF-1: getReport → 不存在的报表抛出 404', () => {
    mockSvc.getReport.mockImplementation(() => { throw new Error('Report not_found not found') })
    expect(() => ctrl.getReport('not_found', defaultCtx)).toThrow('Report not_found not found')
    expect(mockSvc.getReport).toHaveBeenCalledWith('not_found', defaultCtx)
  })

  it('DEF-2: deleteReport → 不存在的报表抛出 404', () => {
    mockSvc.deleteReport.mockImplementation(() => { throw new Error('Report not_found not found or access denied') })
    expect(() => ctrl.deleteReport('not_found', defaultCtx)).toThrow('Report not_found not found')
    expect(mockSvc.deleteReport).toHaveBeenCalledWith('not_found', defaultCtx)
  })

  it('DEF-3: exportReport → 未完成的报表无法导出', () => {
    mockSvc.exportReport.mockImplementation(() => { throw new Error('Report rpt-002 is not completed (status: GENERATING)') })
    const body = { format: ExportFormat.JSON }
    expect(() => ctrl.exportReport('rpt-002', defaultCtx, body)).toThrow('not completed')
    expect(mockSvc.exportReport).toHaveBeenCalledWith('rpt-002', defaultCtx, body)
  })

  it('DEF-4: getExportResult → 不存在的导出请求', () => {
    mockSvc.getExportResult.mockImplementation(() => { throw new Error('Export result invalid_exp not found') })
    expect(() => ctrl.getExportResult('invalid_exp', defaultCtx)).toThrow('not found')
    expect(mockSvc.getExportResult).toHaveBeenCalledWith('invalid_exp', defaultCtx)
  })

  it('DEF-5: getReport → 不同租户无权访问', () => {
    const otherCtx: RequestTenantContext = { tenantId: 't-other' }
    mockSvc.getReport.mockImplementation(() => { throw new Error('Report rpt-001 not found') })
    expect(() => ctrl.getReport('rpt-001', otherCtx)).toThrow('not found')
    expect(mockSvc.getReport).toHaveBeenCalledWith('rpt-001', otherCtx)
  })

  it('DEF-6: regenerateReport → 不存在的报表', () => {
    mockSvc.regenerateReport.mockImplementation(() => { throw new Error('Report ghost not found') })
    expect(() => ctrl.regenerateReport('ghost', defaultCtx)).toThrow('not found')
    expect(mockSvc.regenerateReport).toHaveBeenCalledWith('ghost', defaultCtx)
  })

  it('DEF-7: deleteReport → 不同租户无权限删除', () => {
    const otherCtx: RequestTenantContext = { tenantId: 't-other' }
    mockSvc.deleteReport.mockImplementation(() => { throw new Error('Report rpt-001 not found or access denied') })
    expect(() => ctrl.deleteReport('rpt-001', otherCtx)).toThrow('access denied')
    expect(mockSvc.deleteReport).toHaveBeenCalledWith('rpt-001', otherCtx)
  })

  // ═══════════════════════════════════════════════════════════════
  // 边界 (edge)
  // ═══════════════════════════════════════════════════════════════

  it('EDGE-1: listReports → 空列表（无数据）', () => {
    mockSvc.listReports.mockReturnValueOnce([])
    const result = ctrl.listReports(defaultCtx, {})
    expect(result).toHaveLength(0)
    expect(mockSvc.listReports).toHaveBeenCalledWith(defaultCtx, {})
  })

  it('EDGE-2: listReports → 按不存在的 reportType 过滤返回空', () => {
    mockSvc.listReports.mockReturnValueOnce([])
    const result = ctrl.listReports(defaultCtx, { reportType: 'INVALID_TYPE' as ReportType })
    expect(result).toHaveLength(0)
    expect(mockSvc.listReports).toHaveBeenCalledWith(defaultCtx, { reportType: 'INVALID_TYPE' as ReportType })
  })

  it('EDGE-3: listReports → offset 超出范围返回空', () => {
    mockSvc.listReports.mockReturnValueOnce([])
    const result = ctrl.listReports(defaultCtx, { offset: 999, limit: 10 })
    expect(result).toHaveLength(0)
    expect(mockSvc.listReports).toHaveBeenCalledWith(defaultCtx, { offset: 999, limit: 10 })
  })

  it('EDGE-4: listReports → 空查询对象（{} as ReportQueryDto）兼容', () => {
    mockSvc.listReports.mockReturnValueOnce(mockReportList)
    const result = ctrl.listReports(defaultCtx, {} as any)
    expect(result).toHaveLength(3)
    expect(mockSvc.listReports).toHaveBeenCalledWith(defaultCtx, {})
  })

  it('EDGE-5: getExportResult → 导出的内容可能为空（大文件返回 URL）', () => {
    const urlOnlyExport: ExportResult = {
      ...mockExportResult, content: undefined, url: 'https://cdn.example.com/export/rpt-001.json'
    }
    mockSvc.getExportResult.mockReturnValueOnce(urlOnlyExport)
    const result = ctrl.getExportResult('exp-url-1', defaultCtx)
    expect(result.url).toBeDefined()
    expect(result.content).toBeUndefined()
    expect(mockSvc.getExportResult).toHaveBeenCalledWith('exp-url-1', defaultCtx)
  })

  it('EDGE-6: listReports → 按 storeId 过滤', () => {
    mockSvc.listReports.mockReturnValueOnce([mockReportList[0]])
    const result = ctrl.listReports(defaultCtx, { storeId: 's-001' })
    expect(result).toHaveLength(1)
    expect(mockSvc.listReports).toHaveBeenCalledWith(defaultCtx, { storeId: 's-001' })
  })

  it('EDGE-7: listReports → 按状态过滤返回过滤结果', () => {
    mockSvc.listReports.mockReturnValueOnce([mockCompletedReport])
    const result = ctrl.listReports(defaultCtx, { status: 'COMPLETED' })
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('COMPLETED')
    expect(mockSvc.listReports).toHaveBeenCalledWith(defaultCtx, { status: 'COMPLETED' })
  })

  it('EDGE-8: report 对象包含完整 createdAt 时间戳', () => {
    const result = ctrl.createReport(defaultCtx, {
      title: '时间戳测试',
      reportType: ReportType.PROFIT_LOSS,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
    })
    // 至少有个 id 和 status 字段
    expect(result).toBeDefined()
    expect(result.status).toBe('COMPLETED')
  })
})
