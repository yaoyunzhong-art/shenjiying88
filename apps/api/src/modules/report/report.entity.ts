/**
 * 报表/看板 - Entity (V9 需求 5 · V10 Day 7 Phase 91)
 *
 * 报表类型:
 * - 日报/周报/月报 (日报为主,周/月聚合)
 * - 自定义看板 (任意维度组合)
 * - 5 类业务指标: 销售/会员/库存/营销/AI 使用
 */

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'custom'

export type ReportMetric =
  | 'sales.amount'        // 销售额
  | 'sales.count'         // 订单数
  | 'sales.traffic'       // 客流/到店人数
  | 'sales.conversion'    // 转化率 (%)
  | 'member.new'          // 新增会员
  | 'member.active'       // 活跃会员
  | 'inventory.turnover'  // 库存周转
  | 'marketing.roi'       // 营销 ROI
  | 'ai.tokens'           // AI 调用 token
  | 'ai.latency'          // AI 响应延迟

export type ReportDimension =
  | 'store' | 'tenant' | 'brand' | 'category' | 'product' | 'campaign' | 'member_tier'

/** 报表定义 */
export interface ReportDefinition {
  id: string
  name: string
  period: ReportPeriod
  metrics: ReportMetric[]
  dimensions: ReportDimension[]
  /** 数据源 (e.g. orders, members, ai_logs) */
  source: 'orders' | 'members' | 'inventory' | 'marketing' | 'ai_logs'
  /** 缓存 TTL (秒) */
  cacheTtl: number
  /** 创建者 */
  createdBy: string
  createdAt: string
  updatedAt: string
}

/** 报表数据点 */
export interface ReportDataPoint {
  /** 时间维度 (yyyy-mm-dd / yyyy-Wxx / yyyy-mm) */
  bucket: string
  /** 维度值 (e.g. store-001) */
  dimension: string
  metric: ReportMetric
  value: number
  /** 同比/环比 */
  yoy?: number
  qoq?: number
}

/** 看板布局 */
export interface DashboardLayout {
  id: string
  name: string
  /** 看板卡片配置 */
  cards: DashboardCard[]
  /** 拥有者 */
  ownerId: string
  isShared: boolean
  createdAt: string
  updatedAt: string
}

export interface DashboardCard {
  id: string
  /** 引用报表 */
  reportId: string
  /** 显示类型 */
  display: 'line' | 'bar' | 'pie' | 'number' | 'table' | 'heatmap'
  /** 标题 */
  title: string
  /** 大小 (1-12 grid) */
  size: { w: number; h: number }
  /** 位置 */
  position: { x: number; y: number }
  /** 额外配置 (阈值/颜色等) */
  config?: Record<string, unknown>
}

/** 报表查询请求 */
export interface ReportQueryRequest {
  reportId: string
  period: ReportPeriod
  from?: string
  to?: string
  dimensions?: ReportDimension[]
  metrics?: ReportMetric[]
}

export interface ReportQueryResponse {
  reportId: string
  period: ReportPeriod
  generatedAt: string
  data: ReportDataPoint[]
  totalPoints: number
}

/** 指标展示 */
export const METRIC_LABELS: Record<ReportMetric, string> = {
  'sales.amount': '销售额',
  'sales.count': '订单数',
  'sales.traffic': '客流量',
  'sales.conversion': '转化率',
  'member.new': '新增会员',
  'member.active': '活跃会员',
  'inventory.turnover': '库存周转',
  'marketing.roi': '营销 ROI',
  'ai.tokens': 'AI Token',
  'ai.latency': 'AI 延迟',
}

export const METRIC_UNITS: Record<ReportMetric, string> = {
  'sales.amount': '元',
  'sales.count': '单',
  'sales.traffic': '人',
  'sales.conversion': '%',
  'member.new': '人',
  'member.active': '人',
  'inventory.turnover': '%',
  'marketing.roi': '倍',
  'ai.tokens': 'tokens',
  'ai.latency': 'ms',
}
