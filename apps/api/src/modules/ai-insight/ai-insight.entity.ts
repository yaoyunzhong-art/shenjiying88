/**
 * 洞察报告
 */
export interface InsightReport {
  /** 报告唯一标识 */
  id: string
  /** 租户 ID */
  tenantId: string
  /** 品牌 ID（可选） */
  brandId?: string
  /** 门店 ID（可选） */
  storeId?: string
  /** 报告类型 */
  type: 'revenue' | 'member' | 'attendance' | 'game' | 'kpi'
  /** 报告标题 */
  title: string
  /** 报告摘要 */
  summary: string
  /** 报告数据 */
  data: {
    /** 关键指标映射 */
    metrics: Record<string, number>
    /** 趋势列表 */
    trends: TrendItem[]
    /** 异常列表 */
    anomalies: AnomalyItem[]
  }
  /** 报告周期起始日期 (ISO date) */
  periodStart: string
  /** 报告周期结束日期 (ISO date) */
  periodEnd: string
  /** 报告生成时间 */
  generatedAt: string
  /** 创建时间 */
  createdAt: string
}

/**
 * 趋势项
 */
export interface TrendItem {
  /** 指标名称 */
  name: string
  /** 当期值 */
  current: number
  /** 上期值 */
  previous: number
  /** 变化百分比 */
  changePercent: number
}

/**
 * 异常项
 */
export interface AnomalyItem {
  /** 指标名称 */
  metric: string
  /** 当前值 */
  value: number
  /** 阈值 */
  threshold: number
  /** 严重程度 */
  severity: 'low' | 'medium' | 'high'
}

/**
 * KPI 指标
 */
export interface KPI {
  /** KPI 唯一标识 */
  id: string
  /** 租户 ID */
  tenantId: string
  /** 门店 ID（可选） */
  storeId?: string
  /** 指标名称 */
  name: string
  /** 指标分类 */
  category: 'revenue' | 'member' | 'attendance' | 'game' | 'operation'
  /** 当前值 */
  value: number
  /** 目标值 */
  target: number
  /** 单位 */
  unit: string
  /** 趋势方向 */
  trend: 'up' | 'down' | 'stable'
  /** 统计周期 */
  period: string
  /** 更新时间 */
  updatedAt: string
}

/**
 * 异常检测结果
 */
export interface Anomaly {
  /** 异常唯一标识 */
  id: string
  /** 租户 ID */
  tenantId: string
  /** 门店 ID（可选） */
  storeId?: string
  /** 指标名称 */
  metric: string
  /** 当前值 */
  value: number
  /** 期望值 */
  expectedValue: number
  /** 偏差百分比 */
  deviationPercent: number
  /** 严重程度 */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** 检测时间 */
  detectedAt: string
  /** 解决时间（可选） */
  resolvedAt?: string
  /** 状态 */
  status: 'open' | 'acknowledged' | 'resolved'
}

/**
 * 趋势预测
 */
export interface Trend {
  /** 预测唯一标识 */
  id: string
  /** 租户 ID */
  tenantId: string
  /** 门店 ID（可选） */
  storeId?: string
  /** 预测指标 */
  metric: string
  /** 预测数据点 */
  forecast: ForecastPoint[]
  /** 置信度 (0-1) */
  confidence: number
  /** 预测生成时间 */
  generatedAt: string
}

/**
 * 预测数据点
 */
export interface ForecastPoint {
  /** 日期 (ISO date) */
  date: string
  /** 预测值 */
  value: number
}

/**
 * 仪表盘摘要
 */
export interface DashboardSummary {
  /** 租户 ID */
  tenantId: string
  /** 门店 ID（可选） */
  storeId?: string
  /** 今日 KPI */
  today: SummaryPeriod
  /** 本周 KPI */
  thisWeek: SummaryPeriod
  /** 本月 KPI */
  thisMonth: SummaryPeriod
  /** 活跃异常数 */
  activeAnomalies: number
  /** 生成的报告数 */
  reportCount: number
  /** 生成时间 */
  generatedAt: string
}

/**
 * 时间周期摘要
 */
export interface SummaryPeriod {
  /** 周期标签 */
  label: string
  /** 周期起始日期 */
  start: string
  /** 周期结束日期 */
  end: string
  /** 营收 */
  revenue: number
  /** 会员数 */
  members: number
  /** 到店数 */
  attendance: number
  /** 游戏场次 */
  games: number
  /** 各KPI明细 */
  kpis: KPI[]
  /** 同比变化 */
  yoyPercent: number
}
