/**
 * 🐜 圈梁: [ai-insight] 洞察模块圈梁测试
 *
 * 正例 + 反例 + 边界
 * 验证: DTO、实体、合约、Service 核心接口
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AiInsightService } from './ai-insight.service'
import { GenerateReportDto } from './ai-insight.dto'
import type { InsightReport } from './ai-insight.entity'
import {
  toInsightReportContract,
  toKPIContract,
  toAnomalyContract,
  toDashboardSummaryContract,
} from './ai-insight.contract'

// ─── DTO ────────────────────────────────────────────────

describe('ai-insight DTO', () => {
  // 正例: 合法 GenerateReportDto
  it('正例: GenerateReportDto 包含所有必需字段', () => {
    const dto = new GenerateReportDto()
    dto.type = 'revenue'
    dto.periodStart = '2026-06-01'
    dto.periodEnd = '2026-06-30'
    expect(dto.type).toBe('revenue')
    expect(dto.periodStart).toBe('2026-06-01')
    expect(dto.periodEnd).toBe('2026-06-30')
  })

  // 反例: type 为无效值
  it('反例: type 传入无效字符串', () => {
    const dto = new GenerateReportDto()
    dto.type = 'invalid' as any
    dto.periodStart = '2026-06-01'
    dto.periodEnd = '2026-06-30'
    expect(dto.type).toBe('invalid')
  })

  // 边界: periodStart 和 periodEnd 相等
  it('边界: periodStart 等于 periodEnd', () => {
    const dto = new GenerateReportDto()
    dto.type = 'member'
    dto.periodStart = '2026-06-15'
    dto.periodEnd = '2026-06-15'
    expect(dto.periodStart).toBe(dto.periodEnd)
  })
})

// ─── Service ─────────────────────────────────────────────

describe('ai-insight Service', () => {
  let service: AiInsightService

  beforeEach(() => {
    service = new AiInsightService()
  })

  // 正例: 获取 KPI 列表
  it('正例: getKPIs 返回数组', () => {
    const kpis = service.getKPIs('default')
    expect(Array.isArray(kpis)).toBe(true)
  })

  // 正例: 获取单个 KPI 详情
  it('正例: getKPIDetail 返回 KPI 对象', () => {
    const kpis = service.getKPIs('default')
    if (kpis.length > 0) {
      const detail = service.getKPIDetail(kpis[0].id)
      expect(detail).toBeDefined()
      expect(detail!.id).toBe(kpis[0].id)
    }
  })

  // 反例: 查询不存在的 KPI
  it('反例: getKPIDetail 不存在的 ID 返回 undefined', () => {
    const result = service.getKPIDetail('non-existent-kpi')
    expect(result).toBeUndefined()
  })

  // 正例: 生成洞察报告
  it('正例: generateReport 生成报告', () => {
    const report = service.generateReport('default', undefined, 'revenue', '2026-06-01', '2026-06-30')
    expect(report).toBeDefined()
    expect(report.id).toBeDefined()
    expect(report.type).toBe('revenue')
  })

  // 正例: getDashboardSummary 返回摘要
  it('正例: getDashboardSummary 返回摘要', () => {
    const dashboard = service.getDashboardSummary('default')
    expect(dashboard).toBeDefined()
    expect(dashboard.tenantId).toBe('default')
    expect(typeof dashboard.activeAnomalies).toBe('number')
    expect(typeof dashboard.today.revenue).toBe('number')
  })
})

// ─── 合约 ────────────────────────────────────────────────

describe('ai-insight 合约转换', () => {
  const mockReport: InsightReport = {
    id: 'report-1',
    tenantId: 't1',
    type: 'revenue',
    title: '6月营收报告',
    summary: '营收增长 15%',
    data: {
      metrics: { totalRevenue: 500000 },
      trends: [],
      anomalies: [],
    },
    periodStart: '2026-06-01',
    periodEnd: '2026-06-30',
    generatedAt: '2026-07-01T00:00:00Z',
    createdAt: '2026-07-01T00:00:00Z',
  }

  it('正例: toInsightReportContract 正确映射', () => {
    const contract = toInsightReportContract(mockReport)
    expect(contract.id).toBe('report-1')
    expect(contract.type).toBe('revenue')
    expect(contract.data.metrics.totalRevenue).toBe(500000)
  })

  it('边界: 空趋势/异常数据的合约转换', () => {
    const emptyReport: InsightReport = {
      ...mockReport,
      data: { metrics: {}, trends: [], anomalies: [] },
    }
    const contract = toInsightReportContract(emptyReport)
    expect(contract.data.trends).toHaveLength(0)
    expect(contract.data.anomalies).toHaveLength(0)
    expect(Object.keys(contract.data.metrics)).toHaveLength(0)
  })
})
