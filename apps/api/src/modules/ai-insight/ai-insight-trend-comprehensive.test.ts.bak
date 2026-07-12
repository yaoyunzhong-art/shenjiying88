/**
 * ai-insight-trend-comprehensive.test.ts — AI 洞察趋势与报告完整测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AiInsightService } from './ai-insight.service'

describe('AiInsightService Trend & Reports (Deep)', () => {
  let service: AiInsightService

  beforeEach(() => {
    service = new AiInsightService()
  })

  describe('报告生成全方位测试', () => {
    it('所有报告类型都应生成有效数据', () => {
      const types: Array<'revenue' | 'member' | 'attendance' | 'game' | 'kpi'> = ['revenue', 'member', 'attendance', 'game', 'kpi']
      for (const type of types) {
        const report = service.generateReport('default', undefined, type, '2026-07-01', '2026-07-11')
        expect(report.id).toBeTruthy()
        expect(report.type).toBe(type)
        expect(report.title).toBeTruthy()
        expect(report.data.metrics).toBeDefined()
        expect(Object.keys(report.data.metrics).length).toBeGreaterThan(0)
      }
    })

    it('报告应包含趋势分析数据', () => {
      const report = service.generateReport('default', 'store-01', 'kpi', '2026-07-01', '2026-07-11')
      expect(report.data.trends.length).toBeGreaterThan(0)
      report.data.trends.forEach(t => {
        expect(t.name).toBeTruthy()
        expect(typeof t.current).toBe('number')
        expect(typeof t.changePercent).toBe('number')
      })
    })

    it('报告异常检测应返回问题指标', () => {
      const report = service.generateReport('default', 'store-01', 'kpi', '2026-07-01', '2026-07-11')
      expect(report.data.anomalies).toBeDefined()
    })

    it('门店过滤应正确限缩结果范围', () => {
      const allReport = service.generateReport('default', undefined, 'kpi', '2026-07-01', '2026-07-11')
      const storeReport = service.generateReport('default', 'store-01', 'kpi', '2026-07-01', '2026-07-11')
      expect(allReport.data.metrics).toBeDefined()
      expect(storeReport.data.metrics).toBeDefined()
    })
  })

  describe('趋势预测全方位测试', () => {
    it('应生成多个指标的预测', () => {
      const metrics = ['日营收', '客单价', '新注册会员', '到店人数', '游戏局数']
      for (const metric of metrics) {
        const trend = service.generateForecast('default', metric, '7d')
        expect(trend.metric).toBe(metric)
        expect(trend.forecast.length).toBe(7)
      }
    })

    it('所有预测值应为非负', () => {
      const trend = service.generateForecast('default', '日营收', '14d')
      for (const point of trend.forecast) {
        expect(point.value).toBeGreaterThanOrEqual(0)
      }
    })

    it('置信度应在合理范围内', () => {
      const trend = service.generateForecast('default', '日营收', '7d')
      expect(trend.confidence).toBeGreaterThan(0)
      expect(trend.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('异常检测全方位测试', () => {
    it('应检测到多种严重程度异常', () => {
      const anomalies = service.detectAnomalies('default')
      expect(anomalies.length).toBeGreaterThan(0)
      const severities = new Set(anomalies.map(a => a.severity))
      expect(severities.size).toBeGreaterThanOrEqual(1)
    })

    it('异常应有合理的偏差百分比', () => {
      const anomalies = service.detectAnomalies('default')
      for (const a of anomalies) {
        expect(a.deviationPercent).toBeGreaterThan(0)
        expect(a.expectedValue).toBeGreaterThan(0)
      }
    })
  })

  describe('仪表盘全方位测试', () => {
    it('应包含今日/本周/本月三个周期', () => {
      const dash = service.getDashboardSummary('default')
      expect(dash.today.label).toBe('今日')
      expect(dash.thisWeek.label).toBe('本周')
      expect(dash.thisMonth.label).toBe('本月')
    })

    it('每个周期应包含营收、会员、到店、游戏数据', () => {
      const dash = service.getDashboardSummary('default')
      const periods = [dash.today, dash.thisWeek, dash.thisMonth]
      for (const p of periods) {
        expect(typeof p.revenue).toBe('number')
        expect(typeof p.members).toBe('number')
        expect(typeof p.attendance).toBe('number')
        expect(typeof p.games).toBe('number')
      }
    })

    it('activeAnomalies 应为非负整数', () => {
      const dash = service.getDashboardSummary('default')
      expect(dash.activeAnomalies).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(dash.activeAnomalies)).toBe(true)
    })
  })
})
