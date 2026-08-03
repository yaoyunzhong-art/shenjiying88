/**
 * store-revenue-report.service.test.ts - 门店营收报告 Service 单元测试
 *
 * 覆盖: 正例 + 反例 + 边界（三件套）
 * 原则: 无 as any · 无 describe.skip · 无 it.only
 * 隔离: beforeEach 重置 Service
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StoreRevenueReportService } from './store-revenue-report.service'

function createFreshService(): StoreRevenueReportService {
  const service = new StoreRevenueReportService()
  service.resetReportStoresForTests()
  return service
}

const TENANT = 'tenant-001'

// ═══════════════════════════════════════════════════════════════════
// generateReport
// ═══════════════════════════════════════════════════════════════════

describe('StoreRevenueReportService · generateReport', () => {
  let service: StoreRevenueReportService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 生成月度报告', () => {
    const report = service.generateReport({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '深圳万象城店',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      reportType: 'monthly',
    })
    expect(report.storeName).toBe('深圳万象城店')
    expect(report.reportType).toBe('monthly')
    expect(report.id).toMatch(/^report-/)
    expect(report.totalRevenue).toBeGreaterThan(0)
    expect(report.totalExpense).toBeGreaterThan(0)
    expect(report.grossProfit).toBeGreaterThan(0)
  })

  it('正例: 生成每日报告', () => {
    const report = service.generateReport({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '深圳万象城店',
      startDate: '2026-07-20',
      endDate: '2026-07-20',
      reportType: 'daily',
    })
    expect(report.reportType).toBe('daily')
    expect(report.revenueBreakdown).toBeDefined()
    expect(report.expenseBreakdown).toBeDefined()
  })

  it('正例: revenueGrowthRate 为合理数值', () => {
    const report = service.generateReport({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '深圳万象城店',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      reportType: 'monthly',
    })
    // growth rate 可能是正值或负值（随机生成），但不应该为 NaN
    expect(Number.isNaN(report.revenueGrowthRate)).toBe(false)
    expect(Number.isNaN(report.expenseGrowthRate)).toBe(false)
  })

  it('边界: 大范围的季度报告', () => {
    const report = service.generateReport({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '深圳万象城店',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      reportType: 'quarterly',
    })
    expect(report.reportType).toBe('quarterly')
    expect(report.totalRevenue).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// getReport
// ═══════════════════════════════════════════════════════════════════

describe('StoreRevenueReportService · getReport', () => {
  let service: StoreRevenueReportService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 通过 ID 获取报告', () => {
    const created = service.generateReport({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '深圳万象城店',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      reportType: 'monthly',
    })
    const found = service.getReport(created.id, TENANT)
    expect(found).toBeDefined()
    expect(found!.id).toBe(created.id)
  })

  it('反例: 不同 tenant 无法获取', () => {
    const created = service.generateReport({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '深圳万象城店',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      reportType: 'monthly',
    })
    const found = service.getReport(created.id, 'tenant-other')
    expect(found).toBeUndefined()
  })

  it('边界: 不存在的报告 ID', () => {
    const found = service.getReport('nonexistent', TENANT)
    expect(found).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════
// listReports
// ═══════════════════════════════════════════════════════════════════

describe('StoreRevenueReportService · listReports', () => {
  let service: StoreRevenueReportService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 列出所有模拟报告', () => {
    const reports = service.listReports(TENANT)
    expect(reports.length).toBeGreaterThanOrEqual(16)
    expect(reports.every(r => r.tenantId === TENANT)).toBe(true)
  })

  it('正例: 按 storeId 筛选', () => {
    const reports = service.listReports(TENANT, { storeId: 'store-001' })
    expect(reports.every(r => r.storeId === 'store-001')).toBe(true)
  })

  it('正例: 按 reportType 筛选', () => {
    const reports = service.listReports(TENANT, { reportType: 'daily' })
    expect(reports.every(r => r.reportType === 'daily')).toBe(true)
  })

  it('正例: 按日期范围筛选', () => {
    const reports = service.listReports(TENANT, {
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    })
    expect(reports.every(r => r.startDate >= '2026-07-01' && r.endDate <= '2026-07-31')).toBe(true)
  })

  it('边界: 不存在的 tenant 返回空', () => {
    const reports = service.listReports('tenant-nonexistent')
    expect(reports.length).toBe(0)
  })

  it('边界: 按不存在的 storeId 筛选', () => {
    const reports = service.listReports(TENANT, { storeId: 'store-999' })
    expect(reports.length).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// deleteReport
// ═══════════════════════════════════════════════════════════════════

describe('StoreRevenueReportService · deleteReport', () => {
  let service: StoreRevenueReportService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 删除已存在的报告', () => {
    const created = service.generateReport({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '待删除',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      reportType: 'monthly',
    })
    service.deleteReport(created.id, TENANT)
    expect(service.getReport(created.id, TENANT)).toBeUndefined()
  })

  it('反例: 删除不存在的报告抛异常', () => {
    expect(() => service.deleteReport('nonexistent', TENANT)).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════
// getStoreSummary
// ═══════════════════════════════════════════════════════════════════

describe('StoreRevenueReportService · getStoreSummary', () => {
  let service: StoreRevenueReportService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 返回门店最新报告', () => {
    const summary = service.getStoreSummary('store-001', TENANT)
    expect(summary).toBeDefined()
    expect(summary!.storeId).toBe('store-001')
  })

  it('正例: 按日期范围筛选', () => {
    const summary = service.getStoreSummary('store-001', TENANT, '2026-07-01', '2026-07-31')
    expect(summary).toBeDefined()
    expect(summary!.startDate >= '2026-07-01').toBe(true)
    expect(summary!.endDate <= '2026-07-31').toBe(true)
  })

  it('边界: 不存在的门店', () => {
    const summary = service.getStoreSummary('store-999', TENANT)
    expect(summary).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════
// getOverallSummary
// ═══════════════════════════════════════════════════════════════════

describe('StoreRevenueReportService · getOverallSummary', () => {
  let service: StoreRevenueReportService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 返回总体摘要', () => {
    const summary = service.getOverallSummary(TENANT)
    expect(summary.totalRevenue).toBeGreaterThan(0)
    expect(summary.totalExpense).toBeGreaterThan(0)
    expect(typeof summary.grossProfit).toBe('number')
    expect(summary.netProfit).toBeGreaterThan(0)
    expect(summary.storeCount).toBeGreaterThanOrEqual(4)
  })

  it('正例: 按日期范围筛选', () => {
    const summary = service.getOverallSummary(TENANT, '2026-07-01', '2026-07-31')
    expect(summary.totalRevenue).toBeGreaterThan(0)
  })

  it('边界: 不存在的 tenant', () => {
    const summary = service.getOverallSummary('tenant-nonexistent')
    expect(summary.totalRevenue).toBe(0)
    expect(summary.storeCount).toBe(0)
  })
})
