import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { RevenueReportType, type RevenueReport } from './store-revenue-report.entity'

// ── In-memory store ──

const reportStore = new Map<string, RevenueReport>()

// ── Mock data seeded on first use ──

let seeded = false

function seedMockReports(): void {
  if (seeded) return
  seeded = true

  const tenant = 'tenant-001'

  interface MockReportData {
    storeId: string
    storeName: string
    startDate: string
    endDate: string
    reportType: string
    totalRevenue: number
    totalExpense: number
    grossProfit: number
    netProfit: number
    revenueBreakdown: Record<string, number>
    expenseBreakdown: Record<string, number>
    previousRevenue?: number
    previousExpense?: number
    revenueGrowthRate?: number
    expenseGrowthRate?: number
  }

  const mockReports: MockReportData[] = [
    // ── 深圳万象城店 ──
    {
      storeId: 'store-001',
      storeName: '深圳万象城店',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      reportType: 'monthly',
      totalRevenue: 1285000,
      totalExpense: 785000,
      grossProfit: 500000,
      netProfit: 380000,
      revenueBreakdown: { '饮品': 380000, '甜品': 250000, '简餐': 420000, '外卖': 235000 },
      expenseBreakdown: { '原材料': 350000, '人工': 220000, '租金': 120000, '水电': 48000, '其他': 47000 },
      previousRevenue: 1200000,
      previousExpense: 750000,
      revenueGrowthRate: 7.08,
      expenseGrowthRate: 4.67,
    },
    {
      storeId: 'store-001',
      storeName: '深圳万象城店',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      reportType: 'monthly',
      totalRevenue: 1200000,
      totalExpense: 750000,
      grossProfit: 450000,
      netProfit: 340000,
      revenueBreakdown: { '饮品': 360000, '甜品': 230000, '简餐': 390000, '外卖': 220000 },
      expenseBreakdown: { '原材料': 330000, '人工': 210000, '租金': 120000, '水电': 45000, '其他': 45000 },
      previousRevenue: 1150000,
      previousExpense: 720000,
      revenueGrowthRate: 4.35,
      expenseGrowthRate: 4.17,
    },
    // ── 北京国贸店 ──
    {
      storeId: 'store-002',
      storeName: '北京国贸店',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      reportType: 'monthly',
      totalRevenue: 985000,
      totalExpense: 620000,
      grossProfit: 365000,
      netProfit: 275000,
      revenueBreakdown: { '饮品': 290000, '甜品': 195000, '简餐': 320000, '外卖': 180000 },
      expenseBreakdown: { '原材料': 280000, '人工': 180000, '租金': 100000, '水电': 35000, '其他': 25000 },
      previousRevenue: 950000,
      previousExpense: 600000,
      revenueGrowthRate: 3.68,
      expenseGrowthRate: 3.33,
    },
    {
      storeId: 'store-002',
      storeName: '北京国贸店',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      reportType: 'monthly',
      totalRevenue: 950000,
      totalExpense: 600000,
      grossProfit: 350000,
      netProfit: 265000,
      revenueBreakdown: { '饮品': 280000, '甜品': 185000, '简餐': 310000, '外卖': 175000 },
      expenseBreakdown: { '原材料': 270000, '人工': 175000, '租金': 100000, '水电': 32000, '其他': 23000 },
      previousRevenue: 910000,
      previousExpense: 580000,
      revenueGrowthRate: 4.40,
      expenseGrowthRate: 3.45,
    },
    // ── 上海南京路店 ──
    {
      storeId: 'store-003',
      storeName: '上海南京路店',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      reportType: 'monthly',
      totalRevenue: 1420000,
      totalExpense: 890000,
      grossProfit: 530000,
      netProfit: 410000,
      revenueBreakdown: { '饮品': 420000, '甜品': 280000, '简餐': 460000, '外卖': 260000 },
      expenseBreakdown: { '原材料': 400000, '人工': 250000, '租金': 140000, '水电': 55000, '其他': 45000 },
      previousRevenue: 1350000,
      previousExpense: 850000,
      revenueGrowthRate: 5.19,
      expenseGrowthRate: 4.71,
    },
    {
      storeId: 'store-003',
      storeName: '上海南京路店',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      reportType: 'monthly',
      totalRevenue: 1350000,
      totalExpense: 850000,
      grossProfit: 500000,
      netProfit: 385000,
      revenueBreakdown: { '饮品': 400000, '甜品': 260000, '简餐': 440000, '外卖': 250000 },
      expenseBreakdown: { '原材料': 380000, '人工': 240000, '租金': 140000, '水电': 50000, '其他': 40000 },
      previousRevenue: 1280000,
      previousExpense: 810000,
      revenueGrowthRate: 5.47,
      expenseGrowthRate: 4.94,
    },
    // ── 广州天河城店 ──
    {
      storeId: 'store-004',
      storeName: '广州天河城店',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      reportType: 'monthly',
      totalRevenue: 820000,
      totalExpense: 530000,
      grossProfit: 290000,
      netProfit: 215000,
      revenueBreakdown: { '饮品': 260000, '甜品': 160000, '简餐': 270000, '外卖': 130000 },
      expenseBreakdown: { '原材料': 240000, '人工': 150000, '租金': 85000, '水电': 30000, '其他': 25000 },
      previousRevenue: 790000,
      previousExpense: 510000,
      revenueGrowthRate: 3.80,
      expenseGrowthRate: 3.92,
    },
    {
      storeId: 'store-004',
      storeName: '广州天河城店',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      reportType: 'monthly',
      totalRevenue: 790000,
      totalExpense: 510000,
      grossProfit: 280000,
      netProfit: 208000,
      revenueBreakdown: { '饮品': 250000, '甜品': 155000, '简餐': 260000, '外卖': 125000 },
      expenseBreakdown: { '原材料': 230000, '人工': 145000, '租金': 85000, '水电': 28000, '其他': 22000 },
      previousRevenue: 760000,
      previousExpense: 490000,
      revenueGrowthRate: 3.95,
      expenseGrowthRate: 4.08,
    },
    // ── 成都春熙路店 ──
    {
      storeId: 'store-005',
      storeName: '成都春熙路店',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      reportType: 'monthly',
      totalRevenue: 710000,
      totalExpense: 460000,
      grossProfit: 250000,
      netProfit: 185000,
      revenueBreakdown: { '饮品': 220000, '甜品': 140000, '简餐': 230000, '外卖': 120000 },
      expenseBreakdown: { '原材料': 210000, '人工': 130000, '租金': 70000, '水电': 28000, '其他': 22000 },
      previousRevenue: 680000,
      previousExpense: 440000,
      revenueGrowthRate: 4.41,
      expenseGrowthRate: 4.55,
    },
    {
      storeId: 'store-005',
      storeName: '成都春熙路店',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      reportType: 'monthly',
      totalRevenue: 680000,
      totalExpense: 440000,
      grossProfit: 240000,
      netProfit: 178000,
      revenueBreakdown: { '饮品': 210000, '甜品': 135000, '简餐': 220000, '外卖': 115000 },
      expenseBreakdown: { '原材料': 200000, '人工': 125000, '租金': 70000, '水电': 25000, '其他': 20000 },
      previousRevenue: 650000,
      previousExpense: 420000,
      revenueGrowthRate: 4.62,
      expenseGrowthRate: 4.76,
    },
    // ── 杭州西湖店 ──
    {
      storeId: 'store-006',
      storeName: '杭州西湖店',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      reportType: 'monthly',
      totalRevenue: 650000,
      totalExpense: 410000,
      grossProfit: 240000,
      netProfit: 180000,
      revenueBreakdown: { '饮品': 200000, '甜品': 130000, '简餐': 210000, '外卖': 110000 },
      expenseBreakdown: { '原材料': 185000, '人工': 120000, '租金': 65000, '水电': 24000, '其他': 16000 },
      previousRevenue: 620000,
      previousExpense: 390000,
      revenueGrowthRate: 4.84,
      expenseGrowthRate: 5.13,
    },
    {
      storeId: 'store-006',
      storeName: '杭州西湖店',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      reportType: 'monthly',
      totalRevenue: 620000,
      totalExpense: 390000,
      grossProfit: 230000,
      netProfit: 172000,
      revenueBreakdown: { '饮品': 190000, '甜品': 125000, '简餐': 200000, '外卖': 105000 },
      expenseBreakdown: { '原材料': 175000, '人工': 115000, '租金': 65000, '水电': 22000, '其他': 13000 },
      previousRevenue: 590000,
      previousExpense: 370000,
      revenueGrowthRate: 5.08,
      expenseGrowthRate: 5.41,
    },
    // ── 每日报表 ──
    {
      storeId: 'store-001',
      storeName: '深圳万象城店',
      startDate: '2026-07-15',
      endDate: '2026-07-15',
      reportType: 'daily',
      totalRevenue: 42500,
      totalExpense: 26200,
      grossProfit: 16300,
      netProfit: 12500,
      revenueBreakdown: { '饮品': 12800, '甜品': 8200, '简餐': 14000, '外卖': 7500 },
      expenseBreakdown: { '原材料': 11800, '人工': 7500, '租金': 4000, '水电': 1600, '其他': 1300 },
      previousRevenue: 41000,
      previousExpense: 25500,
      revenueGrowthRate: 3.66,
      expenseGrowthRate: 2.75,
    },
    {
      storeId: 'store-002',
      storeName: '北京国贸店',
      startDate: '2026-07-15',
      endDate: '2026-07-15',
      reportType: 'daily',
      totalRevenue: 32800,
      totalExpense: 20700,
      grossProfit: 12100,
      netProfit: 9200,
      revenueBreakdown: { '饮品': 9800, '甜品': 6500, '简餐': 10700, '外卖': 5800 },
      expenseBreakdown: { '原材料': 9300, '人工': 6000, '租金': 3300, '水电': 1200, '其他': 900 },
      previousRevenue: 31500,
      previousExpense: 20000,
      revenueGrowthRate: 4.13,
      expenseGrowthRate: 3.50,
    },
    // ── 季度报表 ──
    {
      storeId: 'store-001',
      storeName: '深圳万象城店',
      startDate: '2026-04-01',
      endDate: '2026-06-30',
      reportType: 'quarterly',
      totalRevenue: 3600000,
      totalExpense: 2220000,
      grossProfit: 1380000,
      netProfit: 1050000,
      revenueBreakdown: { '饮品': 1080000, '甜品': 690000, '简餐': 1170000, '外卖': 660000 },
      expenseBreakdown: { '原材料': 990000, '人工': 630000, '租金': 360000, '水电': 132000, '其他': 108000 },
      previousRevenue: 3400000,
      previousExpense: 2100000,
      revenueGrowthRate: 5.88,
      expenseGrowthRate: 5.71,
    },
    {
      storeId: 'store-002',
      storeName: '北京国贸店',
      startDate: '2026-04-01',
      endDate: '2026-06-30',
      reportType: 'quarterly',
      totalRevenue: 2850000,
      totalExpense: 1800000,
      grossProfit: 1050000,
      netProfit: 795000,
      revenueBreakdown: { '饮品': 840000, '甜品': 555000, '简餐': 930000, '外卖': 525000 },
      expenseBreakdown: { '原材料': 810000, '人工': 525000, '租金': 300000, '水电': 96000, '其他': 69000 },
      previousRevenue: 2730000,
      previousExpense: 1740000,
      revenueGrowthRate: 4.40,
      expenseGrowthRate: 3.45,
    },
  ]

  for (const m of mockReports) {
    const report: RevenueReport = {
      id: `report-${randomUUID()}`,
      storeId: m.storeId,
      storeName: m.storeName,
      startDate: m.startDate,
      endDate: m.endDate,
      reportType: m.reportType as RevenueReportType,
      totalRevenue: m.totalRevenue,
      totalExpense: m.totalExpense,
      grossProfit: m.grossProfit,
      netProfit: m.netProfit,
      revenueBreakdown: m.revenueBreakdown,
      expenseBreakdown: m.expenseBreakdown,
      previousRevenue: m.previousRevenue,
      previousExpense: m.previousExpense,
      revenueGrowthRate: m.revenueGrowthRate,
      expenseGrowthRate: m.expenseGrowthRate,
      tenantId: tenant,
      createdAt: new Date(`${m.endDate}T12:00:00`).toISOString(),
    }
    reportStore.set(report.id, report)
  }
}

@Injectable()
export class StoreRevenueReportService {
  // ═══════════════════════════════════════════════════════════════════
  // Report CRUD
  // ═══════════════════════════════════════════════════════════════════

  generateReport(input: {
    tenantId: string
    storeId: string
    storeName: string
    startDate: string
    endDate: string
    reportType: string
  }): RevenueReport {
    // Generate a computed report based on mock data aggregation
    const mockRevenueBreakdown: Record<string, number> = {
      '饮品': Math.round(Math.random() * 100000 + 50000),
      '甜品': Math.round(Math.random() * 80000 + 30000),
      '简餐': Math.round(Math.random() * 120000 + 60000),
      '外卖': Math.round(Math.random() * 60000 + 20000),
    }

    const mockExpenseBreakdown: Record<string, number> = {
      '原材料': Math.round(Math.random() * 80000 + 40000),
      '人工': Math.round(Math.random() * 60000 + 25000),
      '租金': Math.round(Math.random() * 30000 + 15000),
      '水电': Math.round(Math.random() * 12000 + 5000),
      '其他': Math.round(Math.random() * 10000 + 3000),
    }

    const totalRevenue = Object.values(mockRevenueBreakdown).reduce((a, b) => a + b, 0)
    const totalExpense = Object.values(mockExpenseBreakdown).reduce((a, b) => a + b, 0)
    const grossProfit = totalRevenue - totalExpense
    const netProfit = grossProfit - Math.round(grossProfit * 0.15) // 扣除约15%税费等

    const previousRevenue = Math.round(totalRevenue * (0.9 + Math.random() * 0.1))
    const previousExpense = Math.round(totalExpense * (0.9 + Math.random() * 0.1))
    const revenueGrowthRate = Number(((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(2))
    const expenseGrowthRate = Number(((totalExpense - previousExpense) / previousExpense * 100).toFixed(2))

    const report: RevenueReport = {
      id: `report-${randomUUID()}`,
      storeId: input.storeId,
      storeName: input.storeName,
      startDate: input.startDate,
      endDate: input.endDate,
      reportType: input.reportType as RevenueReportType,
      totalRevenue,
      totalExpense,
      grossProfit,
      netProfit,
      revenueBreakdown: mockRevenueBreakdown,
      expenseBreakdown: mockExpenseBreakdown,
      previousRevenue,
      previousExpense,
      revenueGrowthRate,
      expenseGrowthRate,
      tenantId: input.tenantId,
      createdAt: new Date().toISOString(),
    }
    reportStore.set(report.id, report)
    return report
  }

  getReport(reportId: string, tenantId: string): RevenueReport | undefined {
    const report = reportStore.get(reportId)
    if (!report || report.tenantId !== tenantId) return undefined
    return report
  }

  listReports(
    tenantId: string,
    filter?: {
      storeId?: string
      startDate?: string
      endDate?: string
      reportType?: string
    }
  ): RevenueReport[] {
    seedMockReports()
    return Array.from(reportStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => (filter?.storeId ? r.storeId === filter.storeId : true))
      .filter((r) => (filter?.startDate ? r.startDate >= filter.startDate : true))
      .filter((r) => (filter?.endDate ? r.endDate <= filter.endDate : true))
      .filter((r) => (filter?.reportType ? r.reportType === filter.reportType : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  deleteReport(reportId: string, tenantId: string): void {
    const report = this.requireReport(reportId, tenantId)
    reportStore.delete(report.id)
  }

  // ═══════════════════════════════════════════════════════════════════
  // Aggregation queries
  // ═══════════════════════════════════════════════════════════════════

  getStoreSummary(
    storeId: string,
    tenantId: string,
    startDate?: string,
    endDate?: string
  ): RevenueReport | undefined {
    seedMockReports()
    const reports = Array.from(reportStore.values())
      .filter((r) => r.tenantId === tenantId && r.storeId === storeId)
      .filter((r) => (startDate ? r.startDate >= startDate : true))
      .filter((r) => (endDate ? r.endDate <= endDate : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    if (reports.length === 0) return undefined

    // Return the most recent report for this store
    return reports[0]
  }

  getOverallSummary(
    tenantId: string,
    startDate?: string,
    endDate?: string
  ): { totalRevenue: number; totalExpense: number; grossProfit: number; netProfit: number; storeCount: number } {
    seedMockReports()
    const reports = Array.from(reportStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => (startDate ? r.startDate >= startDate : true))
      .filter((r) => (endDate ? r.endDate <= endDate : true))

    const totalRevenue = reports.reduce((sum, r) => sum + r.totalRevenue, 0)
    const totalExpense = reports.reduce((sum, r) => sum + r.totalExpense, 0)
    const storeIds = new Set(reports.map((r) => r.storeId))

    return {
      totalRevenue,
      totalExpense,
      grossProfit: totalRevenue - totalExpense,
      netProfit: totalRevenue - totalExpense - Math.round((totalRevenue - totalExpense) * 0.15),
      storeCount: storeIds.size,
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Internals
  // ═══════════════════════════════════════════════════════════════════

  private requireReport(reportId: string, tenantId: string): RevenueReport {
    const report = reportStore.get(reportId)
    if (!report || report.tenantId !== tenantId) {
      throw new Error(`Report not found: ${reportId}`)
    }
    return report
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test helpers
  // ═══════════════════════════════════════════════════════════════════

  resetReportStoresForTests(): void {
    reportStore.clear()
    seeded = false
  }
}
