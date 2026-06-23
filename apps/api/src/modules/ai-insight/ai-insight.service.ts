import { Injectable } from '@nestjs/common'
import {
  type InsightReport,
  type KPI,
  type Anomaly,
  type Trend,
  type TrendItem,
  type AnomalyItem,
  type DashboardSummary,
  type SummaryPeriod,
  type ForecastPoint
} from './ai-insight.entity'

/**
 * AI 经营洞察服务
 * KPI 看板 | 洞察报告 | 异常检测 | 趋势预测 | 仪表盘
 */
@Injectable()
export class AiInsightService {
  // ─── 模拟数据存储 ───

  /** KPI 指标池 */
  private kpis: KPI[] = []
  /** 异常记录池 */
  private anomalies: Anomaly[] = []
  /** 趋势记录池 */
  private trends: Trend[] = []
  /** 报告池 */
  private reports: InsightReport[] = []

  constructor() {
    this.seedData()
  }

  // ─── KPI 看板 ───

  /**
   * 获取KPI列表，支持按分类筛选
   */
  getKPIs(tenantId: string, storeId?: string, category?: string): KPI[] {
    let results = this.kpis.filter((k) => k.tenantId === tenantId)
    if (storeId) {
      results = results.filter((k) => k.storeId === storeId || k.storeId === undefined)
    }
    if (category) {
      results = results.filter((k) => k.category === category)
    }
    return results
  }

  /**
   * 获取单个KPI详情
   */
  getKPIDetail(kpiId: string): KPI | undefined {
    return this.kpis.find((k) => k.id === kpiId)
  }

  // ─── 洞察报告 ───

  /**
   * 生成洞察报告
   * 模拟 AI 分析：聚合数据 + 计算趋势 + 检测异常
   */
  generateReport(
    tenantId: string,
    storeId: string | undefined,
    type: InsightReport['type'],
    periodStart: string,
    periodEnd: string
  ): InsightReport {
    // 从 KPI 池中筛选关联的指标
    const relevantKPIs = this.kpis.filter(
      (k) =>
        k.tenantId === tenantId &&
        (storeId ? k.storeId === storeId || !k.storeId : true) &&
        this.typeToCategory(type).includes(k.category)
    )

    // 构建指标映射和趋势
    const metrics: Record<string, number> = {}
    const trends: TrendItem[] = []
    const anomalies: AnomalyItem[] = []

    for (const kpi of relevantKPIs) {
      metrics[kpi.name] = kpi.value

      // 模拟上期值（用于计算趋势）
      const previousValue = this.simulatePreviousValue(kpi.value, kpi.trend)
      const changePercent =
        previousValue > 0 ? ((kpi.value - previousValue) / previousValue) * 100 : 0

      trends.push({
        name: kpi.name,
        current: kpi.value,
        previous: previousValue,
        changePercent: Math.round(changePercent * 100) / 100
      })

      // 异常检测：目标未达成或数值异常波动
      const threshold = kpi.target * (kpi.trend === 'up' ? 0.8 : 1.2)
      if (
        (kpi.trend === 'up' && kpi.value < threshold) ||
        (kpi.trend === 'down' && kpi.value > threshold) ||
        Math.abs(changePercent) > 50
      ) {
        anomalies.push({
          metric: kpi.name,
          value: kpi.value,
          threshold,
          severity: Math.abs(changePercent) > 50 ? 'high' : Math.abs(changePercent) > 25 ? 'medium' : 'low'
        })
      }
    }

    // 生成摘要
    const summary = this.generateSummary(type, metrics, trends, anomalies)

    const now = new Date().toISOString()
    const report: InsightReport = {
      id: `report-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tenantId,
      storeId,
      type,
      title: `${this.getTypeLabel(type)}洞察报告`,
      summary,
      data: { metrics, trends, anomalies },
      periodStart,
      periodEnd,
      generatedAt: now,
      createdAt: now
    }

    this.reports.push(report)
    return report
  }

  /**
   * 查询报告列表
   */
  getReports(
    tenantId: string,
    options?: { storeId?: string; type?: string; limit?: number }
  ): InsightReport[] {
    let results = this.reports.filter((r) => r.tenantId === tenantId)
    if (options?.storeId) {
      results = results.filter((r) => r.storeId === options!.storeId)
    }
    if (options?.type) {
      results = results.filter((r) => r.type === options!.type)
    }
    results.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    if (options?.limit) {
      results = results.slice(0, options.limit)
    }
    return results
  }

  // ─── 异常检测 ───

  /**
   * 执行异常检测
   * 基于 3-sigma 规则检测异常值
   */
  detectAnomalies(tenantId: string, storeId?: string, metric?: string): Anomaly[] {
    // 按指标分组，计算均值与标准差
    const kpiPool = this.kpis.filter((k) => {
      if (k.tenantId !== tenantId) return false
      if (storeId && k.storeId && k.storeId !== storeId) return false
      if (metric && k.name !== metric) return false
      return true
    })

    // 按指标名称分组
    const groups = new Map<string, number[]>()
    for (const kpi of kpiPool) {
      const values = groups.get(kpi.name) ?? []
      values.push(kpi.value)
      groups.set(kpi.name, values)
    }

    const detected: Anomaly[] = []

    for (const [metricName, values] of groups) {
      if (values.length < 2) continue

      const mean = values.reduce((s, v) => s + v, 0) / values.length
      const variance =
        values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
      const stdDev = Math.sqrt(variance)

      // 3-sigma 规则
      const upperBound = mean + 3 * stdDev
      const lowerBound = mean - 3 * stdDev

      for (const value of values) {
        if (value > upperBound || value < lowerBound) {
          const deviation = mean > 0 ? Math.abs((value - mean) / mean) * 100 : 0
          let severity: Anomaly['severity'] = 'low'
          if (deviation > 50) severity = 'critical'
          else if (deviation > 30) severity = 'high'
          else if (deviation > 15) severity = 'medium'

          const existing = this.anomalies.find(
            (a) =>
              a.tenantId === tenantId &&
              a.metric === metricName &&
              a.value === value &&
              a.status === 'open'
          )

          if (!existing) {
            const anomaly: Anomaly = {
              id: `anomaly-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              tenantId,
              storeId,
              metric: metricName,
              value,
              expectedValue: Math.round(mean * 100) / 100,
              deviationPercent: Math.round(deviation * 100) / 100,
              severity,
              detectedAt: new Date().toISOString(),
              status: 'open'
            }
            this.anomalies.push(anomaly)
            detected.push(anomaly)
          }
        }
      }
    }

    return detected
  }

  /**
   * 确认异常
   */
  acknowledgeAnomaly(id: string): Anomaly | undefined {
    const anomaly = this.anomalies.find((a) => a.id === id)
    if (anomaly && anomaly.status === 'open') {
      anomaly.status = 'acknowledged'
    }
    return anomaly
  }

  /**
   * 解决异常
   */
  resolveAnomaly(id: string): Anomaly | undefined {
    const anomaly = this.anomalies.find((a) => a.id === id)
    if (anomaly && anomaly.status !== 'resolved') {
      anomaly.status = 'resolved'
      anomaly.resolvedAt = new Date().toISOString()
    }
    return anomaly
  }

  /**
   * 查询异常列表
   */
  getAnomalies(
    tenantId: string,
    options?: { storeId?: string; status?: string; severity?: string; limit?: number }
  ): Anomaly[] {
    let results = this.anomalies.filter((a) => a.tenantId === tenantId)
    if (options?.storeId) {
      results = results.filter((a) => a.storeId === options!.storeId || !a.storeId)
    }
    if (options?.status) {
      results = results.filter((a) => a.status === options!.status)
    }
    if (options?.severity) {
      results = results.filter((a) => a.severity === options!.severity)
    }
    results.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
    if (options?.limit) {
      results = results.slice(0, options.limit)
    }
    return results
  }

  // ─── 趋势预测 ───

  /**
   * 生成趋势预测
   * 使用简单移动平均 + 线性回归进行预测
   */
  generateForecast(
    tenantId: string,
    metric: string,
    period: string
  ): Trend {
    // 从 KPI 中获取历史数据
    const history = this.kpis
      .filter((k) => k.tenantId === tenantId && k.name === metric)
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())

    const forecastDays = 7 // 预测未来7天
    const forecast: ForecastPoint[] = []
    let confidence = 0.5

    if (history.length === 0) {
      // 无历史数据，生成随机预测
      for (let i = 1; i <= forecastDays; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)
        forecast.push({
          date: date.toISOString().slice(0, 10),
          value: Math.round(100 + Math.random() * 50)
        })
      }
      confidence = 0.1
    } else if (history.length === 1) {
      // 单点数据，水平预测
      const baseValue = history[0].value
      for (let i = 1; i <= forecastDays; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)
        forecast.push({
          date: date.toISOString().slice(0, 10),
          value: Math.round(baseValue * (1 + (Math.random() - 0.5) * 0.1))
        })
      }
      confidence = 0.3
    } else {
      // 线性回归
      const points = history.map((k, idx) => ({
        x: idx,
        y: k.value
      }))

      const { slope, intercept } = this.linearRegression(points)

      for (let i = 1; i <= forecastDays; i++) {
        const nextX = points.length + i
        const predicted = Math.round(intercept + slope * nextX)
        const date = new Date()
        date.setDate(date.getDate() + i)
        forecast.push({
          date: date.toISOString().slice(0, 10),
          value: Math.max(0, predicted)
        })
      }

      // 置信度基于数据量和方差
      const rSquared = this.calculateRSquared(points, slope, intercept)
      confidence = Math.min(0.95, Math.max(0.3, rSquared * (1 - 1 / history.length)))
    }

    const trend: Trend = {
      id: `trend-${metric}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tenantId,
      metric,
      forecast,
      confidence: Math.round(confidence * 100) / 100,
      generatedAt: new Date().toISOString()
    }

    this.trends.push(trend)
    return trend
  }

  /**
   * 获取趋势预测
   */
  getForecast(trendId: string): Trend | undefined {
    return this.trends.find((t) => t.id === trendId)
  }

  // ─── 仪表盘 ───

  /**
   * 获取仪表盘摘要
   */
  getDashboardSummary(tenantId: string, storeId?: string): DashboardSummary {
    const kpiPool = this.kpis.filter(
      (k) => k.tenantId === tenantId && (storeId ? k.storeId === storeId || !k.storeId : true)
    )

    const now = new Date()
    const today = now.toISOString().slice(0, 10)

    // 本周起始
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const weekStr = weekStart.toISOString().slice(0, 10)

    // 本月起始
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthStr = monthStart.toISOString().slice(0, 10)

    const buildPeriodSummary = (label: string, start: string, end: string): SummaryPeriod => {
      const relevant = kpiPool
      const revenue = this.sumByCategory(relevant, 'revenue')
      const members = this.sumByCategory(relevant, 'member')
      const attendance = this.sumByCategory(relevant, 'attendance')
      const games = this.sumByCategory(relevant, 'game')

      // 模拟同比变化
      const yoyPercent = this.simulateYoyPercent()

      return {
        label,
        start,
        end,
        revenue,
        members,
        attendance,
        games,
        kpis: relevant.slice(0, 5), // Top 5 KPIs
        yoyPercent
      }
    }

    // 活跃异常数
    const activeAnomalies = this.anomalies.filter(
      (a) => a.tenantId === tenantId && a.status !== 'resolved'
    ).length

    return {
      tenantId,
      storeId,
      today: buildPeriodSummary('今日', today, today),
      thisWeek: buildPeriodSummary('本周', weekStr, today),
      thisMonth: buildPeriodSummary('本月', monthStr, today),
      activeAnomalies,
      reportCount: this.reports.filter((r) => r.tenantId === tenantId).length,
      generatedAt: now.toISOString()
    }
  }

  // ─── 工具方法 ───

  /**
   * 类型到分类映射
   */
  private typeToCategory(type: InsightReport['type']): KPI['category'][] {
    switch (type) {
      case 'revenue':
        return ['revenue']
      case 'member':
        return ['member']
      case 'attendance':
        return ['attendance']
      case 'game':
        return ['game']
      case 'kpi':
        return ['revenue', 'member', 'attendance', 'game', 'operation']
    }
  }

  /**
   * 获取类型标签
   */
  private getTypeLabel(type: InsightReport['type']): string {
    const labels: Record<string, string> = {
      revenue: '营收',
      member: '会员',
      attendance: '到店',
      game: '游戏',
      kpi: '综合'
    }
    return labels[type] ?? type
  }

  /**
   * 模拟上期值
   */
  private simulatePreviousValue(current: number, trend: string): number {
    const factor = trend === 'up' ? 1.05 : trend === 'down' ? 0.95 : 1
    // 引入 5% 随机波动
    const noise = 1 + (Math.random() - 0.5) * 0.1
    return Math.round((current / factor) * noise)
  }

  /**
   * 生成摘要文本
   */
  private generateSummary(
    type: string,
    metrics: Record<string, number>,
    trends: TrendItem[],
    anomalies: AnomalyItem[]
  ): string {
    const metricCount = Object.keys(metrics).length
    const anomalyCount = anomalies.length
    const upTrends = trends.filter((t) => t.changePercent > 0).length
    const downTrends = trends.filter((t) => t.changePercent < 0).length

    let summary = `本报告覆盖 ${metricCount} 项关键指标`
    if (upTrends > downTrends) {
      summary += `，${upTrends} 项指标呈上升趋势`
    } else if (downTrends > upTrends) {
      summary += `，${downTrends} 项指标呈下降趋势`
    } else if (upTrends > 0) {
      summary += '，指标整体稳定'
    }
    if (anomalyCount > 0) {
      summary += `，检测到 ${anomalyCount} 项异常，建议关注`
    }
    summary += '。'
    return summary
  }

  /**
   * 简单线性回归
   * y = intercept + slope * x
   */
  private linearRegression(points: { x: number; y: number }[]): {
    slope: number
    intercept: number
  } {
    const n = points.length
    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumXX = 0

    for (const p of points) {
      sumX += p.x
      sumY += p.y
      sumXY += p.x * p.y
      sumXX += p.x * p.x
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return { slope, intercept }
  }

  /**
   * 计算 R² 决定系数
   */
  private calculateRSquared(
    points: { x: number; y: number }[],
    slope: number,
    intercept: number
  ): number {
    const meanY = points.reduce((s, p) => s + p.y, 0) / points.length
    let ssRes = 0
    let ssTot = 0

    for (const p of points) {
      const predicted = intercept + slope * p.x
      ssRes += (p.y - predicted) ** 2
      ssTot += (p.y - meanY) ** 2
    }

    return ssTot > 0 ? 1 - ssRes / ssTot : 0
  }

  /**
   * 按分类求和
   */
  private sumByCategory(kpis: KPI[], category: string): number {
    return kpis
      .filter((k) => k.category === category)
      .reduce((sum, k) => sum + k.value, 0)
  }

  /**
   * 模拟同比变化百分比
   */
  private simulateYoyPercent(): number {
    return Math.round((Math.random() * 40 - 10) * 100) / 100 // -10% to +30%
  }

  // ─── 数据初始化 ───

  /**
   * 初始化模拟数据
   */
  private seedData(): void {
    const now = new Date().toISOString()
    const tenantId = 'default'
    const storeIds = ['store-01', 'store-02', 'store-03']

    const kpiDefs: Array<{ name: string; category: KPI['category']; unit: string; baseValue: number; target: number }> = [
      { name: '日营收', category: 'revenue', unit: '元', baseValue: 15000, target: 20000 },
      { name: '客单价', category: 'revenue', unit: '元/人', baseValue: 85, target: 100 },
      { name: '新注册会员', category: 'member', unit: '人', baseValue: 25, target: 30 },
      { name: '会员复购率', category: 'member', unit: '%', baseValue: 45, target: 55 },
      { name: '到店人数', category: 'attendance', unit: '人', baseValue: 180, target: 200 },
      { name: '排队时长', category: 'attendance', unit: '分钟', baseValue: 8, target: 5 },
      { name: '游戏局数', category: 'game', unit: '局', baseValue: 350, target: 400 },
      { name: '设备使用率', category: 'game', unit: '%', baseValue: 72, target: 85 },
      { name: '员工效率', category: 'operation', unit: '%', baseValue: 88, target: 95 },
      { name: '投诉率', category: 'operation', unit: '%', baseValue: 1.2, target: 0.5 }
    ]

    let kpiIdx = 0
    for (const storeId of storeIds) {
      for (const def of kpiDefs) {
        const variation = 0.7 + Math.random() * 0.6 // 70% ~ 130% of base
        const value = Math.round(def.baseValue * variation * 100) / 100
        const trendRand = Math.random()
        const trend: KPI['trend'] = trendRand > 0.6 ? 'up' : trendRand > 0.3 ? 'stable' : 'down'

        this.kpis.push({
          id: `kpi-${kpiIdx++}`,
          tenantId,
          storeId,
          name: def.name,
          category: def.category,
          value,
          target: def.target,
          unit: def.unit,
          trend,
          period: 'daily',
          updatedAt: now
        })
      }
    }

    // 生成一些初始异常
    this.anomalies.push({
      id: 'anomaly-1',
      tenantId,
      storeId: 'store-01',
      metric: '日营收',
      value: 6500,
      expectedValue: 15000,
      deviationPercent: 56.67,
      severity: 'high',
      detectedAt: now,
      status: 'open'
    })
    this.anomalies.push({
      id: 'anomaly-2',
      tenantId,
      storeId: 'store-01',
      metric: '投诉率',
      value: 4.8,
      expectedValue: 1.2,
      deviationPercent: 300,
      severity: 'critical',
      detectedAt: now,
      status: 'acknowledged'
    })
    this.anomalies.push({
      id: 'anomaly-3',
      tenantId,
      storeId: 'store-02',
      metric: '设备使用率',
      value: 38,
      expectedValue: 72,
      deviationPercent: 47.22,
      severity: 'medium',
      detectedAt: now,
      status: 'resolved',
      resolvedAt: now
    })
  }
}
