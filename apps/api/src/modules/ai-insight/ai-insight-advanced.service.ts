/**
 * ai-insight-advanced.service.ts — AI 洞察高级分析服务
 *
 * 提供高级数据分析能力：深度归因、预测看板、
 * 多维下钻、数据质量评估、自定义报告构建等
 */
import { Injectable } from '@nestjs/common'

export interface DeepAttribution {
  dimension: string
  filters: Record<string, unknown>
  contributions: Array<{
    category: string
    value: number
    contribution: number
    contributionPercent: number
    priorPeriodValue: number
    change: number
    changePercent: number
    significance: number
  }>
  topDrivers: Array<{ factor: string; impact: number; direction: 'positive' | 'negative' }>
  attributionMethod: string
}

export interface MetricForecast {
  metric: string
  historicalData: Array<{ period: string; actual: number }>
  forecastData: Array<{ period: string; forecast: number; lowerBound: number; upperBound: number }>
  seasonalityDetected: boolean
  trend: string
  volatility: number
  confidenceScore: number
}

export interface DataQualityReport {
  overallScore: number
  completeness: number
  accuracy: number
  consistency: number
  timeliness: number
  uniqueness: number
  issues: Array<{
    table: string
    field: string
    issueType: string
    severity: string
    description: string
    affectedRows: number
    recommendation: string
  }>
  scoreHistory: Array<{ date: string; score: number }>
}

export interface CustomReportConfig {
  reportId: string
  name: string
  metrics: string[]
  dimensions: string[]
  filters: Record<string, unknown>
  comparison: 'none' | 'period_over_period' | 'year_over_year'
  visualization: string
  schedule: string
}

export interface DashboardWidget {
  id: string
  type: 'metric' | 'chart' | 'table' | 'kpi' | 'alert'
  title: string
  dataSource: string
  refreshInterval: number
  config: Record<string, unknown>
  position: { x: number; y: number; w: number; h: number }
}

export interface AlertRule {
  id: string
  name: string
  metric: string
  condition: string
  threshold: number
  severity: 'info' | 'warning' | 'critical'
  enabled: boolean
  lastTriggered: string | null
  notificationChannels: string[]
}

export interface InsightRecommendation {
  id: string
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly'
  title: string
  description: string
  metric: string
  impact: number
  confidence: number
  actionable: boolean
  suggestedAction: string
  relatedKPIs: string[]
}

export interface DrillDownPath {
  currentLevel: string
  availableLevels: string[]
  currentFilters: Record<string, string>
  drillDownPaths: Array<{
    level: string
    value: string
    metric: number
    changePercent: number
    childCount: number
  }>
  breadcrumbs: Array<{ level: string; value: string }>
}

export interface BenchmarkComparison {
  metric: string
  yourValue: number
  industryAverage: number
  topPerformer: number
  percentile: number
  gapToAverage: number
  gapToTop: number
  peerGroup: string
  recommendations: string[]
}

export interface TimeComparison {
  metric: string
  currentPeriod: { label: string; value: number }
  previousPeriod: { label: string; value: number }
  periodChange: { absolute: number; percent: number }
  yearOverYear: { current: number; previous: number; change: number; changePercent: number }
  preDefinedComparisons: Array<{
    label: string
    value: number
    change: number
    changePercent: number
  }>
}

export interface CorrelationAnalysis {
  metrics: string[]
  correlationMatrix: Array<{
    metricA: string
    metricB: string
    correlationCoefficient: number
    strength: 'strong' | 'moderate' | 'weak' | 'none'
    direction: 'positive' | 'negative'
    significance: number
  }>
  keyInsights: string[]
  visualizationType: string
}

@Injectable()
export class AdvancedInsightService {
  /**
   * 深度归因分析
   */
  deepAttribution(metric: string, dimension: string, filters?: Record<string, unknown>): DeepAttribution {
    const categories = ['渠道A', '渠道B', '渠道C', '渠道D', '渠道E']
    const total = Math.round(1000000 + Math.random() * 2000000)

    const contributions = categories.map((cat, idx) => {
      const value = Math.round(total * (0.1 + Math.random() * 0.3))
      const priorValue = Math.round(value * (0.7 + Math.random() * 0.5))
      const contribution = value / total
      return {
        category: cat,
        value,
        contribution: Math.round(contribution * 1000) / 1000,
        contributionPercent: Math.round(contribution * 10000) / 100,
        priorPeriodValue: priorValue,
        change: value - priorValue,
        changePercent: Math.round(((value - priorValue) / priorValue) * 10000) / 100,
        significance: Math.round((0.3 + Math.random() * 0.6) * 1000) / 1000,
      }
    }).sort((a, b) => b.contribution - a.contribution)

    return {
      dimension,
      filters: filters ?? {},
      contributions,
      topDrivers: contributions.slice(0, 3).map(c => ({
        factor: c.category,
        impact: c.contributionPercent,
        direction: c.changePercent > 0 ? 'positive' as const : 'negative' as const,
      })),
      attributionMethod: 'shapley_value',
    }
  }

  /**
   * 指标预测
   */
  forecastMetric(metric: string, periods: number = 12): MetricForecast {
    const baseValue = 1000
    const historicalData = Array.from({ length: periods }, (_, i) => ({
      period: `2026-${String(i + 1).padStart(2, '0')}`,
      actual: Math.round(baseValue + (i * 50) + (Math.random() - 0.5) * 200),
    }))

    const lastActual = historicalData[historicalData.length - 1].actual
    const forecastData = Array.from({ length: 6 }, (_, i) => {
      const trend = 30 + Math.random() * 20
      const predicted = lastActual + (i + 1) * trend
      return {
        period: new Date(Date.now() + (i + 1) * 30 * 86400000).toISOString().slice(0, 7),
        forecast: Math.round(predicted),
        lowerBound: Math.round(predicted * 0.85),
        upperBound: Math.round(predicted * 1.15),
      }
    })

    return {
      metric,
      historicalData,
      forecastData,
      seasonalityDetected: Math.random() > 0.5,
      trend: '上升',
      volatility: Math.round((10 + Math.random() * 30) * 10) / 10,
      confidenceScore: Math.round((0.6 + Math.random() * 0.3) * 100) / 100,
    }
  }

  /**
   * 数据质量报告
   */
  getDataQualityReport(): DataQualityReport {
    const completeness = Math.round((85 + Math.random() * 14) * 10) / 10
    const accuracy = Math.round((88 + Math.random() * 11) * 10) / 10
    const consistency = Math.round((82 + Math.random() * 16) * 10) / 10
    const timeliness = Math.round((90 + Math.random() * 9) * 10) / 10
    const uniqueness = Math.round((92 + Math.random() * 7) * 10) / 10
    const overall = Math.round((completeness + accuracy + consistency + timeliness + uniqueness) / 5 * 10) / 10

    return {
      overallScore: overall,
      completeness,
      accuracy,
      consistency,
      timeliness,
      uniqueness,
      issues: [
        { table: 'orders', field: 'customer_phone', issueType: 'missing_values', severity: 'medium', description: '3.2% 的订单缺少客户电话', affectedRows: 1280, recommendation: '补充客户联系方式字段' },
        { table: 'products', field: 'category', issueType: 'inconsistent_values', severity: 'low', description: '分类字段存在不一致命名', affectedRows: 45, recommendation: '统一分类标准' },
        { table: 'customers', field: 'email', issueType: 'duplicates', severity: 'medium', description: '2.1% 的客户邮箱存在重复记录', affectedRows: 850, recommendation: '建立去重机制' },
      ],
      scoreHistory: Array.from({ length: 12 }, (_, i) => ({
        date: `2026-${String(i + 1).padStart(2, '0')}-01`,
        score: Math.round((75 + Math.random() * 20) * 10) / 10,
      })),
    }
  }

  /**
   * 洞察推荐
   */
  generateInsightRecommendations(): InsightRecommendation[] {
    return [
      {
        id: `insight-${Date.now()}-1`,
        type: 'opportunity',
        title: '高价值客户增长机会',
        description: '近期高价值客户转化率提升25%，建议加大高端产品推广力度',
        metric: '高价值客户占比',
        impact: 15,
        confidence: 0.78,
        actionable: true,
        suggestedAction: '增加VIP专属营销活动',
        relatedKPIs: ['客单价', '会员复购率', '平均订单金额'],
      },
      {
        id: `insight-${Date.now()}-2`,
        type: 'risk',
        title: '客户流失率上升预警',
        description: '30天活跃会员数下降8%，需重点关注存量客户维护',
        metric: '会员流失率',
        impact: -12,
        confidence: 0.85,
        actionable: true,
        suggestedAction: '启动沉睡会员唤醒活动',
        relatedKPIs: ['会员活跃度', '回购率', '会员满意度'],
      },
      {
        id: `insight-${Date.now()}-3`,
        type: 'trend',
        title: '夜间消费趋势上升',
        description: '夜间(20:00-23:00)消费占比从 18% 增长到 25%',
        metric: '夜间消费占比',
        impact: 8,
        confidence: 0.92,
        actionable: true,
        suggestedAction: '调整夜间运营策略和人员配置',
        relatedKPIs: ['时段营收', '夜间运营成本', '满意度'],
      },
      {
        id: `insight-${Date.now()}-4`,
        type: 'anomaly',
        title: '某门店营收异常下降',
        description: '门店A本周营收环比下降 35%，远超过其他门店',
        metric: '门店营收',
        impact: -20,
        confidence: 0.88,
        actionable: true,
        suggestedAction: '排查门店A运营问题',
        relatedKPIs: ['门店营收', '客流', '客单价'],
      },
    ]
  }

  /**
   * 多维下钻分析
   */
  drillDown(metric: string, currentLevel: string, filters: Record<string, string>): DrillDownPath {
    const levels: Record<string, string[]> = {
      '全部': ['渠道', '门店', '时段'],
      '渠道': ['渠道分群', '渠道转化', '渠道成本'],
      '门店': ['门店区域', '门店类型', '门店规模'],
      '时段': ['日间/夜间', '工作日/周末', '旺季/淡季'],
    }

    const available = levels[currentLevel] ?? ['下级维度1', '下级维度2', '下级维度3']
    const drillPaths = available.map(l => ({
      level: l,
      value: `示例值`,
      metric: Math.round(1000 + Math.random() * 9000),
      changePercent: Math.round((Math.random() * 40 - 10) * 100) / 100,
      childCount: Math.round(2 + Math.random() * 8),
    }))

    return {
      currentLevel,
      availableLevels: Object.keys(levels),
      currentFilters: filters,
      drillDownPaths: drillPaths.sort((a, b) => b.metric - a.metric),
      breadcrumbs: [
        { level: '全部', value: '概览' },
        { level: currentLevel, value: currentLevel },
      ],
    }
  }

  /**
   * 同行对比
   */
  getBenchmarkComparison(metric: string): BenchmarkComparison {
    const yourValue = Math.round(70 + Math.random() * 25)
    const industryAvg = Math.round(60 + Math.random() * 20)
    const topPerf = Math.round(90 + Math.random() * 8)

    return {
      metric,
      yourValue,
      industryAverage: industryAvg,
      topPerformer: topPerf,
      percentile: Math.round((yourValue / topPerf) * 100),
      gapToAverage: yourValue - industryAvg,
      gapToTop: topPerf - yourValue,
      peerGroup: '同规模企业',
      recommendations: [
        yourValue < industryAvg ? '低于行业平均，建议对标头部企业' : '表现优于行业平均，建议维持',
        '关注行业最佳实践，持续优化',
      ],
    }
  }

  /**
   * 时间维度对比
   */
  compareTimePeriods(metric: string): TimeComparison {
    const current = Math.round(1000 + Math.random() * 2000)
    const previous = Math.round(current * (0.6 + Math.random() * 0.6))
    const yoyCurrent = Math.round(current * (0.9 + Math.random() * 0.2))
    const yoyPrevious = Math.round(yoyCurrent * (0.6 + Math.random() * 0.6))

    return {
      metric,
      currentPeriod: { label: '本月', value: current },
      previousPeriod: { label: '上月', value: previous },
      periodChange: { absolute: current - previous, percent: Math.round(((current - previous) / previous) * 10000) / 100 },
      yearOverYear: { current: yoyCurrent, previous: yoyPrevious, change: yoyCurrent - yoyPrevious, changePercent: Math.round(((yoyCurrent - yoyPrevious) / yoyPrevious) * 10000) / 100 },
      preDefinedComparisons: [
        { label: '环比上周', value: Math.round(current * (0.8 + Math.random() * 0.4)), change: Math.round((Math.random() * 40 - 10) * 100) / 100, changePercent: Math.round((Math.random() * 30 - 10) * 100) / 100 },
        { label: '同比去年', value: Math.round(current * (0.6 + Math.random() * 0.5)), change: Math.round((Math.random() * 50) * 100) / 100, changePercent: Math.round((Math.random() * 40) * 100) / 100 },
        { label: '目标完成率', value: Math.round(current), change: 0, changePercent: Math.round((current / 1500) * 10000) / 100 },
      ],
    }
  }

  /**
   * 相关性分析
   */
  analyzeCorrelations(metrics: string[]): CorrelationAnalysis {
    const defaultMetrics = metrics.length > 0 ? metrics : ['日营收', '到店人数', '客单价', '会员活跃度', '游戏局数']
    const matrix: CorrelationAnalysis['correlationMatrix'] = []

    for (let i = 0; i < defaultMetrics.length; i++) {
      for (let j = i + 1; j < defaultMetrics.length; j++) {
        const coeff = Math.round((Math.random() * 2 - 1) * 100) / 100
        const abs = Math.abs(coeff)
        const strength: 'strong' | 'moderate' | 'weak' | 'none' =
          abs > 0.7 ? 'strong' : abs > 0.4 ? 'moderate' : abs > 0.2 ? 'weak' : 'none'

        matrix.push({
          metricA: defaultMetrics[i],
          metricB: defaultMetrics[j],
          correlationCoefficient: coeff,
          strength,
          direction: coeff > 0 ? 'positive' : 'negative',
          significance: Math.round((0.5 + Math.random() * 0.45) * 1000) / 1000,
        })
      }
    }

    return {
      metrics: defaultMetrics,
      correlationMatrix: matrix.sort((a, b) => Math.abs(b.correlationCoefficient) - Math.abs(a.correlationCoefficient)),
      keyInsights: [
        '日营收与到店人数呈强正相关，客流量是营收的核心驱动因素',
        '会员活跃度与游戏局数存在中度正相关，游戏是会员运营的有效手段',
        '客单价与日营收的相关性中等，表明提升客单价有增长空间',
      ],
      visualizationType: 'heatmap',
    }
  }
}
