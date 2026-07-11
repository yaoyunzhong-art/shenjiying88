/**
 * ai-insight.service.spec.ts — 扩展版 AI 洞察 Service 综合测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AiInsightService } from './ai-insight.service'

describe('AiInsightService (Complete)', () => {
  let service: AiInsightService

  beforeEach(() => {
    service = new AiInsightService()
  })

  // ───── KPI ─────

  describe('getKPIs', () => {
    it('应返回指定租户的 KPI 列表', () => {
      const kpis = service.getKPIs('default')
      expect(kpis.length).toBeGreaterThan(0)
      expect(kpis[0].tenantId).toBe('default')
    })

    it('应支持按门店 ID 过滤', () => {
      const allKpis = service.getKPIs('default')
      const storeKpis = service.getKPIs('default', 'store-01')
      expect(storeKpis.length).toBeLessThanOrEqual(allKpis.length)
    })

    it('应支持按分类筛选', () => {
      const revenueKpis = service.getKPIs('default', undefined, 'revenue')
      expect(revenueKpis.every(k => k.category === 'revenue')).toBe(true)
    })

    it('当无匹配时返回空数组', () => {
      const kpis = service.getKPIs('non-existent-tenant')
      expect(kpis).toHaveLength(0)
    })
  })

  describe('getKPIDetail', () => {
    it('应返回有效的 KPI 详情', () => {
      const detail = service.getKPIDetail('kpi-0')
      expect(detail).toBeDefined()
      expect(detail!.id).toBe('kpi-0')
    })

    it('当 ID 不存在时返回 undefined', () => {
      const detail = service.getKPIDetail('non-existent')
      expect(detail).toBeUndefined()
    })
  })

  // ───── 报告 ─────

  describe('generateReport', () => {
    it('应为指定类型生成报告', () => {
      const report = service.generateReport('default', undefined, 'revenue', '2026-07-01', '2026-07-11')
      expect(report).toBeDefined()
      expect(report.type).toBe('revenue')
      expect(report.id).toBeTruthy()
      expect(report.data.metrics).toBeDefined()
      expect(report.data.trends.length).toBeGreaterThan(0)
    })

    it('应为每种报告类型生成内容', () => {
      const types: Array<'revenue' | 'member' | 'attendance' | 'game' | 'kpi'> = ['revenue', 'member', 'attendance', 'game', 'kpi']
      for (const type of types) {
        const report = service.generateReport('default', undefined, type, '2026-07-01', '2026-07-11')
        expect(report.type).toBe(type)
        expect(report.title).toBeTruthy()
      }
    })

    it('报告应包含异常检测数据', () => {
      const report = service.generateReport('default', 'store-01', 'kpi', '2026-07-01', '2026-07-11')
      expect(report.data.anomalies).toBeDefined()
    })
  })

  describe('getReports', () => {
    it('应返回生成的报告列表', () => {
      service.generateReport('default', undefined, 'revenue', '2026-07-01', '2026-07-11')
      const reports = service.getReports('default')
      expect(reports.length).toBeGreaterThanOrEqual(1)
    })

    it('应按类型过滤', () => {
      service.generateReport('default', undefined, 'revenue', '2026-01-01', '2026-01-07')
      service.generateReport('default', undefined, 'member', '2026-01-01', '2026-01-07')
      const filtered = service.getReports('default', { type: 'revenue' })
      expect(filtered.every(r => r.type === 'revenue')).toBe(true)
    })
  })

  // ───── 异常检测 ─────

  describe('detectAnomalies', () => {
    it('应检测异常值', () => {
      const anomalies = service.detectAnomalies('default')
      expect(anomalies).toBeInstanceOf(Array)
    })

    it('应设置异常严重程度', () => {
      const anomalies = service.detectAnomalies('default')
      for (const a of anomalies) {
        expect(['low', 'medium', 'high', 'critical']).toContain(a.severity)
      }
    })
  })

  describe('acknowledgeAnomaly', () => {
    it('应将异常状态从 open 改为 acknowledged', () => {
      const anomalies = service.detectAnomalies('default')
      if (anomalies.length > 0) {
        const result = service.acknowledgeAnomaly(anomalies[0].id)
        expect(result).toBeDefined()
        expect(result!.status).toBe('acknowledged')
      }
    })
  })

  describe('resolveAnomaly', () => {
    it('应将异常标记为已解决并记录解决时间', () => {
      const anomalies = service.detectAnomalies('default')
      if (anomalies.length > 0) {
        const result = service.resolveAnomaly(anomalies[0].id)
        expect(result!.status).toBe('resolved')
        expect(result!.resolvedAt).toBeDefined()
      }
    })
  })

  // ───── 趋势预测 ─────

  describe('generateForecast', () => {
    it('应为指定指标生成趋势预测', () => {
      const trend = service.generateForecast('default', '日营收', '7d')
      expect(trend).toBeDefined()
      expect(trend.id).toBeTruthy()
      expect(trend.metric).toBe('日营收')
      expect(trend.forecast.length).toBeGreaterThan(0)
      expect(trend.confidence).toBeGreaterThan(0)
    })

    it('应为每个预测点生成有效日期', () => {
      const trend = service.generateForecast('default', '客单价', '7d')
      for (const point of trend.forecast) {
        expect(point.date).toBeTruthy()
        expect(typeof point.value).toBe('number')
        expect(point.value).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('getForecast', () => {
    it('应返回已生成的预测', () => {
      const created = service.generateForecast('default', '日营收', '7d')
      const retrieved = service.getForecast(created.id)
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(created.id)
    })
  })

  // ───── 仪表盘 ─────

  describe('getDashboardSummary', () => {
    it('应返回完整的仪表盘摘要', () => {
      const summary = service.getDashboardSummary('default')
      expect(summary).toBeDefined()
      expect(summary.tenantId).toBe('default')
      expect(summary.today).toBeDefined()
      expect(summary.thisWeek).toBeDefined()
      expect(summary.thisMonth).toBeDefined()
      expect(typeof summary.activeAnomalies).toBe('number')
    })

    it('今日/本周/本月的 label 应正确', () => {
      const summary = service.getDashboardSummary('default')
      expect(summary.today.label).toBe('今日')
      expect(summary.thisWeek.label).toBe('本周')
      expect(summary.thisMonth.label).toBe('本月')
    })

    it('应包含 KPI 明细', () => {
      const summary = service.getDashboardSummary('default')
      expect(summary.today.kpis.length).toBeGreaterThan(0)
    })
  })

  // ───── 集成 ─────

  describe('集成场景', () => {
    it('完整的报告生成 + 查询流程', () => {
      const report = service.generateReport('default', 'store-01', 'kpi', '2026-07-01', '2026-07-11')
      const reports = service.getReports('default')
      expect(reports.find(r => r.id === report.id)).toBeDefined()
    })

    it('异常检测 → 确认 → 解决流程', () => {
      const detected = service.detectAnomalies('default')
      if (detected.length > 0) {
        const ack = service.acknowledgeAnomaly(detected[0].id)
        expect(ack!.status).toBe('acknowledged')
        const resolved = service.resolveAnomaly(detected[0].id)
        expect(resolved!.status).toBe('resolved')
      }
    })
  })
})
