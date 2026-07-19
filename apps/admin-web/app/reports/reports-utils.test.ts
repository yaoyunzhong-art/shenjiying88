/**
 * reports-utils.test.ts — 报表中心工具函数 L1 测试
 *
 * 覆盖: buildChartOption 六种图表 / 数据类型校验 / 边界
 * 方法: 纯函数静态分析, 不依赖 React 渲染 / ECharts 运行时
 *
 * Phase-39 T169
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { ReportResult, ReportTab } from './reports-utils'
import { buildChartOption } from './reports-utils'

// ─── Mock ReportResult 工厂 ──────────────────────────────

const BASE: Omit<ReportResult, 'type' | 'rows' | 'columns'> = {
  tenantId: 'test-tenant',
  period: { from: '2024-06-01', to: '2024-06-30' },
  generatedAt: '2024-07-01T00:00:00Z',
  cached: false,
}

function makeReport(overrides: Partial<ReportResult> & { type: string; rows: Record<string, any>[]; columns: ReportResult['columns'] }): ReportResult {
  return { ...BASE, ...overrides }
}

// ─── 通用结构 ────────────────────────────────────────────

describe('buildChartOption: 通用结构', () => {
  it('应返回包含 grid / tooltip / toolbox 的通用属性', () => {
    const report = makeReport({
      type: 'revenue',
      columns: [{ field: 'period', alias: '日期', type: 'dimension' }],
      rows: [{ period: '2024-06-01', revenue: 100 }],
    })
    const opt = buildChartOption('revenue', report)
    assert.ok(opt.grid, '缺少 grid 属性')
    assert.ok(opt.tooltip, '缺少 tooltip 属性')
    assert.ok(opt.toolbox, '缺少 toolbox 属性')
    assert.ok(opt.toolbox.feature?.saveAsImage, '缺少 toolbox.saveAsImage')
    assert.ok(opt.toolbox.feature?.dataZoom, '缺少 toolbox.dataZoom')
  })

  it('series 应为数组且至少包含一项', () => {
    const report = makeReport({
      type: 'revenue',
      columns: [{ field: 'period', alias: '日期', type: 'dimension' }],
      rows: [{ period: '2024-06-01', revenue: 100 }],
    })
    const opt = buildChartOption('revenue', report)
    assert.ok(Array.isArray(opt.series))
    assert.ok(opt.series.length >= 1)
  })
})

// ─── Tab: revenue（折线图） ─────────────────────────────

describe('buildChartOption: revenue（营收趋势）', () => {
  const COLUMNS: ReportResult['columns'] = [
    { field: 'period', alias: '日期', type: 'dimension' },
    { field: 'revenue', alias: '营收', type: 'metric' },
  ]

  it('应构建 line 类型图表', () => {
    const report = makeReport({ type: 'revenue', columns: COLUMNS, rows: [{ period: '06-01', revenue: 100 }] })
    const opt = buildChartOption('revenue', report)
    assert.equal(opt.title?.text, '营收趋势')
    assert.equal(opt.series[0].type, 'line')
    assert.equal(opt.xAxis?.type, 'category')
    assert.equal(opt.yAxis?.type, 'value')
  })

  it('应正确映射 xAxis.data 和 series.data', () => {
    const report = makeReport({
      type: 'revenue', columns: COLUMNS,
      rows: [
        { period: '06-01', revenue: 100 },
        { period: '06-02', revenue: 200 },
        { period: '06-03', revenue: 150 },
      ],
    })
    const opt = buildChartOption('revenue', report)
    assert.deepEqual(opt.xAxis.data, ['06-01', '06-02', '06-03'])
    assert.deepEqual(opt.series[0].data, [100, 200, 150])
  })

  it('period 缺省时使用空字符串', () => {
    const report = makeReport({ type: 'revenue', columns: COLUMNS, rows: [{ revenue: 100 }] })
    const opt = buildChartOption('revenue', report)
    assert.equal(opt.xAxis.data[0], '')
  })

  it('revenue 缺省时使用 0', () => {
    const report = makeReport({ type: 'revenue', columns: COLUMNS, rows: [{ period: '06-01' }] })
    const opt = buildChartOption('revenue', report)
    assert.equal(opt.series[0].data[0], 0)
  })

  it('应启用 smooth 和 areaStyle 美化', () => {
    const report = makeReport({ type: 'revenue', columns: COLUMNS, rows: [{ period: '06-01', revenue: 100 }] })
    const opt = buildChartOption('revenue', report)
    assert.equal(opt.series[0].smooth, true)
    assert.ok(opt.series[0].areaStyle)
  })
})

// ─── Tab: product-ranking（柱状图） ─────────────────────

describe('buildChartOption: product-ranking（商品排行）', () => {
  const COLUMNS: ReportResult['columns'] = [
    { field: 'name', alias: '商品', type: 'dimension' },
    { field: 'soldQty', alias: '销量', type: 'metric' },
  ]

  it('应构建 bar 类型图表', () => {
    const report = makeReport({ type: 'product-ranking', columns: COLUMNS, rows: [{ name: 'A', soldQty: 10 }] })
    const opt = buildChartOption('product-ranking', report)
    assert.equal(opt.title?.text, '商品 Top N 排行')
    assert.equal(opt.series[0].type, 'bar')
    assert.ok(opt.xAxis?.axisLabel?.rotate, 30)
  })

  it('应优先使用 name 字段作为分类轴', () => {
    const report = makeReport({ type: 'product-ranking', columns: COLUMNS, rows: [{ name: '投篮机', soldQty: 120, sku: 'S-1' }] })
    const opt = buildChartOption('product-ranking', report)
    assert.equal(opt.xAxis.data[0], '投篮机')
  })

  it('name 缺省时回退到 sku', () => {
    const report = makeReport({ type: 'product-ranking', columns: COLUMNS, rows: [{ sku: 'S-001', soldQty: 50 }] })
    const opt = buildChartOption('product-ranking', report)
    assert.equal(opt.xAxis.data[0], 'S-001')
  })

  it('name 和 sku 都缺省时使用空字符串', () => {
    const report = makeReport({ type: 'product-ranking', columns: COLUMNS, rows: [{ soldQty: 10 }] })
    const opt = buildChartOption('product-ranking', report)
    assert.equal(opt.xAxis.data[0], '')
  })

  it('soldQty 缺省时回退到 count', () => {
    const report = makeReport({ type: 'product-ranking', columns: COLUMNS, rows: [{ name: 'A', count: 99 }] })
    const opt = buildChartOption('product-ranking', report)
    assert.equal(opt.series[0].data[0], 99)
  })

  it('10 条数据时 xAxis.data 长度正确', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ name: `商品${i}`, soldQty: i * 10 }))
    const report = makeReport({ type: 'product-ranking', columns: COLUMNS, rows })
    const opt = buildChartOption('product-ranking', report)
    assert.equal(opt.xAxis.data.length, 10)
    assert.equal(opt.series[0].data.length, 10)
  })
})

// ─── Tab: payment-mix（饼图） ──────────────────────────

describe('buildChartOption: payment-mix（支付占比）', () => {
  const COLUMNS: ReportResult['columns'] = [
    { field: 'method', alias: '方式', type: 'dimension' },
    { field: 'amount', alias: '金额', type: 'metric' },
  ]

  it('应构建 pie 类型图表，带环形半径', () => {
    const report = makeReport({ type: 'payment-mix', columns: COLUMNS, rows: [{ method: '微信支付', amount: 5000 }] })
    const opt = buildChartOption('payment-mix', report)
    assert.equal(opt.series[0].type, 'pie')
    assert.deepEqual(opt.series[0].radius, ['40%', '70%'])
    assert.ok(opt.series[0].label)
  })

  it('数据项应包含 name 和 value', () => {
    const report = makeReport({
      type: 'payment-mix', columns: COLUMNS,
      rows: [
        { method: '微信支付', amount: 65000 },
        { method: '支付宝', amount: 35000 },
      ],
    })
    const opt = buildChartOption('payment-mix', report)
    assert.equal(opt.series[0].data.length, 2)
    assert.equal(opt.series[0].data[0].name, '微信支付')
    assert.equal(opt.series[0].data[0].value, 65000)
    assert.equal(opt.series[0].data[1].name, '支付宝')
    assert.equal(opt.series[0].data[1].value, 35000)
  })

  it('amount 缺省时回退到 amountCents', () => {
    const report = makeReport({
      type: 'payment-mix', columns: COLUMNS,
      rows: [{ method: '现金', amountCents: 10000 }],
    })
    const opt = buildChartOption('payment-mix', report)
    assert.equal(opt.series[0].data[0].value, 10000)
  })

  it('method 缺省时使用空字符串', () => {
    const report = makeReport({ type: 'payment-mix', columns: COLUMNS, rows: [{ amount: 100 }] })
    const opt = buildChartOption('payment-mix', report)
    assert.equal(opt.series[0].data[0].name, '')
  })

  it('应包括图例 (legend)', () => {
    const report = makeReport({ type: 'payment-mix', columns: COLUMNS, rows: [{ method: '微信支付', amount: 100 }] })
    const opt = buildChartOption('payment-mix', report)
    assert.ok(opt.legend, '饼图应包含 legend')
  })
})

// ─── Tab: hourly-heatmap（热力图） ─────────────────────

describe('buildChartOption: hourly-heatmap（时段热力）', () => {
  it('应构建 heatmap 类型图表', () => {
    const report = makeReport({ type: 'hourly-heatmap', columns: [], rows: [] })
    const opt = buildChartOption('hourly-heatmap', report)
    assert.equal(opt.series[0].type, 'heatmap')
    assert.equal(opt.title?.text, '时段热力图')
  })

  it('xAxis 应包含 24 小时刻度', () => {
    const report = makeReport({ type: 'hourly-heatmap', columns: [], rows: [] })
    const opt = buildChartOption('hourly-heatmap', report)
    assert.equal(opt.xAxis.data.length, 24)
    assert.equal(opt.xAxis.data[0], '0:00')
    assert.equal(opt.xAxis.data[23], '23:00')
  })

  it('yAxis 应包含 7 天', () => {
    const report = makeReport({ type: 'hourly-heatmap', columns: [], rows: [] })
    const opt = buildChartOption('hourly-heatmap', report)
    assert.equal(opt.yAxis.data.length, 7)
    assert.ok(opt.yAxis.data.includes('周一'))
    assert.ok(opt.yAxis.data.includes('周日'))
  })

  it('应包含 visualMap 颜色映射', () => {
    const report = makeReport({ type: 'hourly-heatmap', columns: [], rows: [] })
    const opt = buildChartOption('hourly-heatmap', report)
    assert.ok(opt.visualMap, '缺少 visualMap')
    assert.equal(opt.visualMap.min, 0)
    assert.equal(opt.visualMap.max, 100)
    assert.ok(opt.visualMap.calculable)
  })

  it('数据量应为 168 个格子 (24h × 7d)', () => {
    const report = makeReport({ type: 'hourly-heatmap', columns: [], rows: [] })
    const opt = buildChartOption('hourly-heatmap', report)
    assert.equal(opt.series[0].data.length, 168)
  })

  it('每个数据点应为 [hour, day, value] 三元组', () => {
    const report = makeReport({ type: 'hourly-heatmap', columns: [], rows: [] })
    const opt = buildChartOption('hourly-heatmap', report)
    for (const point of opt.series[0].data) {
      assert.equal(point.length, 3)
      assert.ok(typeof point[0] === 'number')
      assert.ok(typeof point[1] === 'number')
      assert.ok(typeof point[2] === 'number')
    }
  })

  it('值范围应在 0-100 之间', () => {
    const report = makeReport({ type: 'hourly-heatmap', columns: [], rows: [] })
    const opt = buildChartOption('hourly-heatmap', report)
    for (const point of opt.series[0].data) {
      assert.ok(point[2] >= 0 && point[2] <= 100, `值 ${point[2]} 超出 0-100 范围`)
    }
  })
})

// ─── Tab: order（漏斗图） ──────────────────────────────

describe('buildChartOption: order（订单漏斗）', () => {
  const COLUMNS: ReportResult['columns'] = [
    { field: 'stage', alias: '阶段', type: 'dimension' },
    { field: 'count', alias: '数量', type: 'metric' },
  ]

  it('应构建 funnel 类型图表', () => {
    const report = makeReport({ type: 'order', columns: COLUMNS, rows: [{ stage: '浏览', count: 1000 }] })
    const opt = buildChartOption('order', report)
    assert.equal(opt.series[0].type, 'funnel')
    assert.equal(opt.title?.text, '订单转化漏斗')
  })

  it('应映射 stage→name 和 count→value', () => {
    const report = makeReport({
      type: 'order', columns: COLUMNS,
      rows: [
        { stage: '浏览', count: 10000 },
        { stage: '加购', count: 3000 },
        { stage: '下单', count: 1500 },
        { stage: '支付', count: 1200 },
      ],
    })
    const opt = buildChartOption('order', report)
    assert.equal(opt.series[0].data.length, 4)
    assert.equal(opt.series[0].data[0].name, '浏览')
    assert.equal(opt.series[0].data[0].value, 10000)
    assert.equal(opt.series[0].data[3].name, '支付')
    assert.equal(opt.series[0].data[3].value, 1200)
  })

  it('stage 缺省时回退到 status', () => {
    const report = makeReport({ type: 'order', columns: COLUMNS, rows: [{ status: '完成', count: 500 }] })
    const opt = buildChartOption('order', report)
    assert.equal(opt.series[0].data[0].name, '完成')
  })

  it('count 缺省时使用 0', () => {
    const report = makeReport({ type: 'order', columns: COLUMNS, rows: [{ stage: '浏览' }] })
    const opt = buildChartOption('order', report)
    assert.equal(opt.series[0].data[0].value, 0)
  })

  it('空行返回空漏斗', () => {
    const report = makeReport({ type: 'order', columns: COLUMNS, rows: [] })
    const opt = buildChartOption('order', report)
    assert.equal(opt.series[0].data.length, 0)
  })
})

// ─── Tab: inventory（仪表盘） ──────────────────────────

describe('buildChartOption: inventory（库存周转）', () => {
  const COLUMNS: ReportResult['columns'] = [
    { field: 'turnoverRate', alias: '周转率', type: 'metric' },
  ]

  it('应构建 gauge 类型图表', () => {
    const report = makeReport({ type: 'inventory', columns: COLUMNS, rows: [{ turnoverRate: 0.75 }] })
    const opt = buildChartOption('inventory', report)
    assert.equal(opt.series[0].type, 'gauge')
    assert.equal(opt.title?.text, '库存周转率')
  })

  it('turnoverRate 应格式化为百分比显示', () => {
    const report = makeReport({ type: 'inventory', columns: COLUMNS, rows: [{ turnoverRate: 0.755 }] })
    const opt = buildChartOption('inventory', report)
    // value * 100 → toFixed(2)
    assert.equal(opt.series[0].data[0].value, '75.50')
  })

  it('空行时使用 0', () => {
    const report = makeReport({ type: 'inventory', columns: COLUMNS, rows: [] })
    const opt = buildChartOption('inventory', report)
    assert.equal(opt.series[0].data[0].value, '0.00')
  })

  it('turnoverRate 缺省时使用 0', () => {
    const report = makeReport({ type: 'inventory', columns: COLUMNS, rows: [{}] })
    const opt = buildChartOption('inventory', report)
    assert.equal(opt.series[0].data[0].value, '0.00')
  })

  it('应包含 gauge 进度条和指针配置', () => {
    const report = makeReport({ type: 'inventory', columns: COLUMNS, rows: [{ turnoverRate: 0.5 }] })
    const opt = buildChartOption('inventory', report)
    assert.ok(opt.series[0].progress?.show, '缺少 progress 配置')
    assert.ok(opt.series[0].pointer, '缺少 pointer 配置')
    assert.ok(opt.series[0].anchor, '缺少 anchor 配置')
    assert.ok(opt.series[0].detail, '缺少 detail 配置')
  })
})

// ─── 默认分支 ────────────────────────────────────────────

describe('buildChartOption: 默认/未知 Tab', () => {
  it('未知 tab 应返回默认标题', () => {
    const report = makeReport({ type: 'unknown', columns: [], rows: [] })
    const opt = buildChartOption('unknown' as ReportTab, report)
    assert.equal(opt.title?.text, '未知报表')
    assert.ok(opt.series === undefined || opt.series === null || opt.series === '', '未知 tab 不应包含 series')
  })
})

// ─── 类型结构完整性 ──────────────────────────────────────

describe('ReportResult 类型结构', () => {
  it('ReportResult 应包含 type、tenantId、period、columns、rows', () => {
    // 验证导出类型可用
    const report: ReportResult = {
      type: 'revenue',
      tenantId: 't1',
      period: { from: '2024-01-01', to: '2024-01-31' },
      columns: [{ field: 'a', alias: 'A', type: 'dimension' }],
      rows: [{ a: 'x', b: 1 }],
      generatedAt: '2024-02-01T00:00:00Z',
      cached: false,
    }
    assert.equal(report.type, 'revenue')
    assert.equal(report.tenantId, 't1')
    assert.equal(report.period.from, '2024-01-01')
    assert.equal(report.columns.length, 1)
    assert.equal(report.rows.length, 1)
  })

  it('ReportTab 应为 6 种字面量联合类型', () => {
    // 验证联合类型的每个值
    const tabs: ReportTab[] = ['revenue', 'product-ranking', 'payment-mix', 'hourly-heatmap', 'order', 'inventory']
    assert.equal(tabs.length, 6)
    for (const t of tabs) {
      // 能在 switch 中正常使用
      const tab: ReportTab = t
      assert.ok(tab)
    }
  })

  it('columns 应区分 dimension 和 metric', () => {
    const report: ReportResult = makeReport({
      type: 'revenue',
      columns: [
        { field: 'period', alias: '日期', type: 'dimension' },
        { field: 'revenue', alias: '营收', type: 'metric' },
      ],
      rows: [{ period: '06-01', revenue: 100 }],
    })
    const dim = report.columns.filter(c => c.type === 'dimension')
    const met = report.columns.filter(c => c.type === 'metric')
    assert.equal(dim.length, 1)
    assert.equal(met.length, 1)
    assert.equal(dim[0].field, 'period')
    assert.equal(met[0].field, 'revenue')
  })

  it('rows 应支持任意 Record<string, any> 模式', () => {
    const report: ReportResult = makeReport({
      type: 'revenue',
      columns: [{ field: 'k', alias: 'K', type: 'metric' }],
      rows: [{ k: 42, extraField: 'should be allowed', nested: { a: 1 } }],
    })
    assert.equal(report.rows[0].k, 42)
    assert.equal(report.rows[0].extraField, 'should be allowed')
    assert.deepEqual(report.rows[0].nested, { a: 1 })
  })
})
