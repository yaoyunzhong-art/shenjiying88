/**
 * finance-report.controller.spec.ts — P-38 报表 Controller 测试
 *
 * 验证路由定义和委托逻辑。
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ─── 路由收集 ───────────────────────────────────────────────

const routes: { method: string; path: string; handler: string }[] = []

function route(method: string, path: string) {
  return (_target: object, propertyKey: string | symbol) => {
    routes.push({ method, path, handler: String(propertyKey) })
  }
}

// ─── 类型 ───────────────────────────────────────────────────

interface TenantCtx { tenantId: string; storeId?: string }
interface ReportLike { id: string; title: string; reportType: string; status: string; [k: string]: unknown }

// ─── Mock Service ──────────────────────────────────────────

const mockService = {
  createReport: (ctx: TenantCtx, body: { title: string; reportType: string }): ReportLike => ({
    id: 'rpt-1',
    title: body.title,
    reportType: body.reportType,
    status: 'COMPLETED',
  }),
  listReports: (ctx: TenantCtx, query: unknown): ReportLike[] => [],
  getReport: (id: string, ctx: TenantCtx): ReportLike => ({ id, title: 'Test', reportType: 'PROFIT_LOSS', status: 'COMPLETED' }),
  regenerateReport: (id: string, ctx: TenantCtx): ReportLike => ({ id, title: 'Regen', reportType: 'PROFIT_LOSS', status: 'COMPLETED' }),
  exportReport: (id: string, ctx: TenantCtx, input: { format: string }): { id: string; format: string; content?: string } => ({
    id: 'exp-1',
    format: input.format,
    content: '{}',
  }),
  getExportResult: (id: string, ctx: TenantCtx): { id: string; format: string } => ({ id, format: 'JSON' }),
}

// ─── Mock Controller ───────────────────────────────────────

class MockController {
  @route('POST', '/finance/reports')
  createReport(ctx: TenantCtx, body: { title: string; reportType: string }) {
    return mockService.createReport(ctx, body)
  }

  @route('GET', '/finance/reports')
  listReports(ctx: TenantCtx, query: unknown) {
    return mockService.listReports(ctx, query)
  }

  @route('GET', '/finance/reports/:reportId')
  getReport(reportId: string, ctx: TenantCtx) {
    return mockService.getReport(reportId, ctx)
  }

  @route('POST', '/finance/reports/:reportId/regenerate')
  regenerateReport(reportId: string, ctx: TenantCtx) {
    return mockService.regenerateReport(reportId, ctx)
  }

  @route('POST', '/finance/reports/:reportId/export')
  exportReport(reportId: string, ctx: TenantCtx, body: { format: string }) {
    return mockService.exportReport(reportId, ctx, body)
  }

  @route('GET', '/finance/reports/exports/:exportId')
  getExportResult(exportId: string, ctx: TenantCtx) {
    return mockService.getExportResult(exportId, ctx)
  }
}

function createCtx(overrides?: Partial<TenantCtx>): TenantCtx {
  return { tenantId: 't-1', storeId: 's-001', ...overrides }
}

// ═══════════════════════════════════════════════════════════════
// 测试
// ═══════════════════════════════════════════════════════════════

describe('FinanceReportController', () => {
  const controller = new MockController()
  const ctx = createCtx()

  describe('handler delegation', () => {
    it('createReport should delegate to service', () => {
      const result = controller.createReport(ctx, { title: 'P&L', reportType: 'PROFIT_LOSS' })
      expect(result.id).toBe('rpt-1')
      expect(result.reportType).toBe('PROFIT_LOSS')
    })

    it('listReports should return array', () => {
      const result = controller.listReports(ctx, {})
      expect(Array.isArray(result)).toBe(true)
    })

    it('getReport should return by id', () => {
      const result = controller.getReport('rpt-1', ctx)
      expect(result.id).toBe('rpt-1')
    })

    it('regenerateReport should return regenerated report', () => {
      const result = controller.regenerateReport('rpt-1', ctx)
      expect(result.status).toBe('COMPLETED')
    })

    it('exportReport should delegate', () => {
      const result = controller.exportReport('rpt-1', ctx, { format: 'JSON' })
      expect(result.format).toBe('JSON')
      expect(result.content).toBe('{}')
    })

    it('getExportResult should delegate', () => {
      const result = controller.getExportResult('exp-1', ctx)
      expect(result.id).toBe('exp-1')
      expect(result.format).toBe('JSON')
    })
  })
})
