export type RecommendationStatus = 'active' | 'paused' | 'draft' | 'archived'
export type RecommendationPriority = 'high' | 'medium' | 'low'
export type RecommendationStrategyType = 'item-cf' | 'user-cf' | 'popular' | 'recently-viewed' | 'personalized' | 'hybrid'

export interface RecommendationRule {
  key: string
  value: string
  enabled: boolean
}

export interface RecommendationStrategy {
  id: string
  name: string
  description: string
  strategyType: RecommendationStrategyType
  status: RecommendationStatus
  priority: RecommendationPriority
  version: number
  createdBy: string
  createdAt: string
  updatedAt: string
  totalRecommendations: number
  conversionRate: number
  avgCtr: number
  avgRevenue: number
  rules: RecommendationRule[]
  targetAudience: string[]
  channels: string[]
}

export interface RecommendationDetailSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'recommendation-detail-mock'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  strategy: RecommendationStrategy
}

const MOCK_RECOMMENDATIONS: Record<string, RecommendationStrategy> = {
  'rec-001': {
    id: 'rec-001',
    name: '首页猜你喜欢',
    description: '基于用户历史行为与偏好的首页混合推荐策略。',
    strategyType: 'hybrid',
    status: 'active',
    priority: 'high',
    version: 3,
    createdBy: '张建国',
    createdAt: '2025-01-15',
    updatedAt: '2026-06-20',
    totalRecommendations: 2840000,
    conversionRate: 12.5,
    avgCtr: 38.2,
    avgRevenue: 186000,
    rules: [
      { key: 'max_items', value: '20', enabled: true },
      { key: 'diversity_threshold', value: '0.6', enabled: true },
      { key: 'cold_start_fallback', value: 'popular', enabled: true },
    ],
    targetAudience: ['所有活跃会员', '新注册用户'],
    channels: ['首页', '搜索结果页'],
  },
  'rec-002': {
    id: 'rec-002',
    name: '商品详情页关联推荐',
    description: '基于 Item-CF 的详情页关联推荐策略。',
    strategyType: 'item-cf',
    status: 'active',
    priority: 'high',
    version: 5,
    createdBy: '李小红',
    createdAt: '2024-09-01',
    updatedAt: '2026-06-22',
    totalRecommendations: 5600000,
    conversionRate: 8.3,
    avgCtr: 24.5,
    avgRevenue: 92000,
    rules: [
      { key: 'max_similar_items', value: '10', enabled: true },
      { key: 'min_similarity_score', value: '0.5', enabled: true },
      { key: 'category_restriction', value: 'same_category', enabled: true },
    ],
    targetAudience: ['所有访客'],
    channels: ['商品详情页'],
  },
  'rec-003': {
    id: 'rec-003',
    name: '购物车凑单推荐',
    description: '提升客单价的凑单推荐策略。',
    strategyType: 'popular',
    status: 'paused',
    priority: 'medium',
    version: 2,
    createdBy: '刘强',
    createdAt: '2025-03-10',
    updatedAt: '2026-05-15',
    totalRecommendations: 1200000,
    conversionRate: 18.7,
    avgCtr: 42.1,
    avgRevenue: 45000,
    rules: [
      { key: 'min_cart_amount', value: '50', enabled: true },
      { key: 'price_range', value: '10-200', enabled: true },
      { key: 'exclude_purchased', value: 'true', enabled: true },
    ],
    targetAudience: ['购物车金额 > 50 元的用户'],
    channels: ['购物车页面', '结算页'],
  },
}

export async function loadRecommendationDetailSnapshot(id: string): Promise<RecommendationDetailSnapshot> {
  const strategy = MOCK_RECOMMENDATIONS[id] ?? MOCK_RECOMMENDATIONS['rec-001']
  return {
    deliveryMode: 'mock',
    sourceLabel: 'recommendation-detail-mock',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadRecommendationDetailSnapshot -> local E54 snapshot shell',
    businessDataSource: 'recommendation-detail-data.ts mock recommendation strategies',
    refreshPath: `loadRecommendationDetailSnapshot(${id})`,
    note: '当前页面先完成 E54 壳层化与来源态透明化，策略详情与规则编辑仍以 mock 快照承载。',
    strategy,
  }
}
