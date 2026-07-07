import { describe, it, expect } from 'vitest'
/**
 * 🐜 自动: [P-39数据报表] E4营销+E5赵数据 角色模拟测试
 *
 * 模拟函数（纯函数式内联）：
 *   - generateSalesReport / calculateConversionRate / buildDashboard / formatReport
 *
 * E4 营销视角：日/周/月报表 · 转化率 · 看板 · 空数据 · 异常
 * E5 赵数据视角：数据核对 · 聚合校验 · 边界值 · 零数据 · 浮点精度
 *
 * 12 项测试覆盖 E4+E5 视角。每个测试 ≤ 3 步（Arrange → Act → Assert）。
 */

// ════════════════════════════════════════════════════════════
// 类型定义
// ════════════════════════════════════════════════════════════

interface SalesReport {
  period: string
  totalRevenue: number
  orderCount: number
  avgOrderValue: number
  storeIds: string[]
}

interface DashboardCard {
  label: string
  value: number
  change: number // 同比变化百分比, 0 表示无对比
  unit: string
}

interface DashboardChart {
  labels: string[]
  datasets: { label: string; data: number[] }[]
}

interface Dashboard {
  cards: DashboardCard[]
  chart: DashboardChart
}

interface FormattedReport {
  period: string
  totalRevenue: string
  orderCount: string
  avgOrderValue: string
  stores: string
  locale: string
}

// ════════════════════════════════════════════════════════════
// 模拟函数（纯函数式内联，无外部依赖）
// ════════════════════════════════════════════════════════════

/**
 * 根据订单数组和周期生成销售报表。
 * 周期支持 'daily' | 'weekly' | 'monthly'。
 */
function generateSalesReport(orders: { storeId: string; revenue: number }[], period: string): SalesReport {
  const periodKey = ['daily', 'weekly', 'monthly'].includes(period) ? period : 'daily'

  if (!orders || orders.length === 0) {
    return {
      period: periodKey,
      totalRevenue: 0,
      orderCount: 0,
      avgOrderValue: 0,
      storeIds: [],
    }
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.revenue, 0)
  const orderCount = orders.length
  const avgOrderValue = orderCount > 0 ? Math.round((totalRevenue / orderCount) * 100) / 100 : 0
  const storeIds = [...new Set(orders.map(o => o.storeId))].sort()

  return {
    period: periodKey,
    totalRevenue,
    orderCount,
    avgOrderValue,
    storeIds,
  }
}

/**
 * 计算转化率 (impressions → purchases)。
 * 无曝光时返回 0 避免除零。
 */
function calculateConversionRate(impressions: number, purchases: number): number {
  if (impressions <= 0) return 0
  const rate = purchases / impressions
  return Math.round(rate * 10000) / 10000 // 保留 4 位小数
}

/**
 * 构建营销看板: 收入卡、订单卡、客单价卡、转化率卡 + 趋势图。
 */
function buildDashboard(metrics: {
  totalRevenue: number
  orderCount: number
  avgOrderValue: number
  conversionRate: number
  prevTotalRevenue?: number
  prevOrderCount?: number
  prevAvgOrderValue?: number
  prevConversionRate?: number
  chartLabels?: string[]
  chartRevenueData?: number[]
  chartOrderData?: number[]
}): Dashboard {
  const calcChange = (curr: number, prev: number | undefined): number => {
    if (prev === undefined || prev === 0) return 0
    return Math.round(((curr - prev) / prev) * 10000) / 100
  }

  const cards: DashboardCard[] = [
    { label: '总收入', value: metrics.totalRevenue, change: calcChange(metrics.totalRevenue, metrics.prevTotalRevenue), unit: '元' },
    { label: '订单数', value: metrics.orderCount, change: calcChange(metrics.orderCount, metrics.prevOrderCount), unit: '笔' },
    { label: '客单价', value: metrics.avgOrderValue, change: calcChange(metrics.avgOrderValue, metrics.prevAvgOrderValue), unit: '元' },
    { label: '转化率', value: metrics.conversionRate * 100, change: calcChange(metrics.conversionRate, metrics.prevConversionRate), unit: '%' },
  ]

  const chart: DashboardChart = {
    labels: metrics.chartLabels ?? ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    datasets: [
      { label: '收入', data: metrics.chartRevenueData ?? [] },
      ...(metrics.chartOrderData ? [{ label: '订单', data: metrics.chartOrderData }] : []),
    ],
  }

  return { cards, chart }
}

/**
 * 格式化报表供前端展示（数字本地化、单位友好）。
 */
function formatReport(report: SalesReport, locale: string): FormattedReport {
  const numFmt = new Intl.NumberFormat(locale === 'zh-CN' ? 'zh-CN' : 'en-US')

  return {
    period: report.period,
    totalRevenue: `¥${numFmt.format(report.totalRevenue)}`,
    orderCount: numFmt.format(report.orderCount),
    avgOrderValue: `¥${numFmt.format(report.avgOrderValue)}`,
    stores: report.storeIds.map(id => `#${id}`).join(', ') || '无门店',
    locale,
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 🅴⁴ E4 营销视角 — 运营数据报表
// ═══════════════════════════════════════════════════════════════════════

describe('🅴⁴ E4 营销视角 — 销售报表', () => {
  // ── E4-01: 日销售报表 ──
  it('E4-01 日销售报表：生成完整日报表收入/订单/客单价', () => {
    const orders = [
      { storeId: 'S001', revenue: 50000 },
      { storeId: 'S002', revenue: 30000 },
      { storeId: 'S001', revenue: 20000 },
    ]
    const report = generateSalesReport(orders, 'daily')

    expect(report.period).toBe('daily')
    expect(report.totalRevenue).toBe(100000)
    expect(report.orderCount).toBe(3)
    expect(report.avgOrderValue).toBe(33333.33)
    expect(report.storeIds).toEqual(['S001', 'S002'])
  })

  // ── E4-02: 周销售报表 ──
  it('E4-02 周销售报表：聚合 7 天数据生成周报', () => {
    const orders = Array.from({ length: 7 }, (_, i) => ({ storeId: 'S001', revenue: 12000 * (i + 1) }))
    const report = generateSalesReport(orders, 'weekly')

    expect(report.period).toBe('weekly')
    expect(report.totalRevenue).toBe(336000)
    expect(report.orderCount).toBe(7)
    expect(report.avgOrderValue).toBe(48000)
  })

  // ── E4-03: 月销售报表 ──
  it('E4-03 月销售报表：聚合月度数据并列出所有门店', () => {
    const orders = [
      { storeId: 'S001', revenue: 150000 },
      { storeId: 'S002', revenue: 200000 },
      { storeId: 'S003', revenue: 75000 },
    ]
    const report = generateSalesReport(orders, 'monthly')

    expect(report.period).toBe('monthly')
    expect(report.totalRevenue).toBe(425000)
    expect(report.orderCount).toBe(3)
    expect(report.storeIds).toEqual(['S001', 'S002', 'S003'])
  })

  // ── E4-04: 转化率计算 ──
  it('E4-04 转化率计算：正常曝光/购买场景', () => {
    const rate = calculateConversionRate(1000, 85)
    expect(rate).toBe(0.085) // 8.5%
  })

  // ── E4-05: 营销看板 ──
  it('E4-05 营销看板：包含收入/订单/客单价/转化率四张卡片 + 趋势图', () => {
    const dashboard = buildDashboard({
      totalRevenue: 500000,
      orderCount: 120,
      avgOrderValue: 4166.67,
      conversionRate: 0.12,
      prevTotalRevenue: 400000,
      prevOrderCount: 100,
      chartLabels: ['1日', '2日', '3日'],
      chartRevenueData: [150000, 200000, 150000],
    })

    expect(dashboard.cards).toHaveLength(4)
    expect(dashboard.cards[0].label).toBe('总收入')
    expect(dashboard.cards[0].value).toBe(500000)
    expect(dashboard.cards[0].change).toBe(25)
    expect(dashboard.cards[1].value).toBe(120)
    expect(dashboard.cards[3].label).toBe('转化率')
    expect(dashboard.chart.labels).toEqual(['1日', '2日', '3日'])
    expect(dashboard.chart.datasets.length).toBeGreaterThanOrEqual(1)
  })

  // ── E4-06: 空数据报表 ──
  it('E4-06 空数据报表：无订单时收入/订单/客单价均为 0', () => {
    const report = generateSalesReport([], 'daily')
    expect(report.totalRevenue).toBe(0)
    expect(report.orderCount).toBe(0)
    expect(report.avgOrderValue).toBe(0)
    expect(report.storeIds).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════════════
// 🅴⁵ E5 赵数据视角 — 数据准确性与边界
// ═══════════════════════════════════════════════════════════════════════

describe('🅴⁵ E5 赵数据视角 — 数据校验与边界', () => {
  // ── E5-07: 无序 storeId 排序校验 ──
  it('E5-07 门店排序：storeIds 按字母升序排列', () => {
    const orders = [
      { storeId: 'Z999', revenue: 10000 },
      { storeId: 'A001', revenue: 20000 },
      { storeId: 'M500', revenue: 15000 },
    ]
    const report = generateSalesReport(orders, 'daily')
    expect(report.storeIds).toEqual(['A001', 'M500', 'Z999'])
  })

  // ── E5-08: 多门店聚合 ──
  it('E5-08 多门店聚合：10 家门店、500 笔订单', () => {
    const storeIds = Array.from({ length: 10 }, (_, i) => `S${String(i + 1).padStart(3, '0')}`)
    const orders = storeIds.flatMap((sid) =>
      Array.from({ length: 50 }, () => ({ storeId: sid, revenue: Math.floor(Math.random() * 1000) + 100 }))
    )
    const report = generateSalesReport(orders, 'monthly')

    expect(report.period).toBe('monthly')
    expect(report.orderCount).toBe(500)
    expect(report.storeIds).toEqual(storeIds)
  })

  // ── E5-09: 零曝光转化率 ──
  it('E5-09 零曝光转化率：impressions=0 时返回 0', () => {
    const rate = calculateConversionRate(0, 5)
    expect(rate).toBe(0)
  })

  // ── E5-10: 高转化率精度 ──
  it('E5-10 高转化率精度：极低曝光/高转场景保留 4 位小数', () => {
    const rate = calculateConversionRate(3, 2)
    expect(rate).toBe(0.6667) // 2/3 ≈ 0.6667
  })

  // ── E5-11: 看板空数据降级 ──
  it('E5-11 看板空数据降级：无前值对比时 change=0', () => {
    const dashboard = buildDashboard({
      totalRevenue: 100000,
      orderCount: 30,
      avgOrderValue: 3333.33,
      conversionRate: 0.05,
      chartLabels: [],
      chartRevenueData: [],
    })

    expect(dashboard.cards.every(c => c.change === 0)).toBe(true)
  })

  // ── E5-12: 报表格式化 ──
  it('E5-12 报表格式化：zh-CN 货币/数字本地化', () => {
    const report: SalesReport = {
      period: 'daily',
      totalRevenue: 1234567,
      orderCount: 890,
      avgOrderValue: 1387.15,
      storeIds: ['S001', 'S002'],
    }
    const formatted = formatReport(report, 'zh-CN')
    expect(formatted.period).toBe('daily')
    expect(formatted.totalRevenue).toBe('¥1,234,567')
    expect(formatted.orderCount).toBe('890')
    expect(formatted.avgOrderValue).toBe('¥1,387.15')
    expect(formatted.stores).toBe('#S001, #S002')
    expect(formatted.locale).toBe('zh-CN')
  })
})
