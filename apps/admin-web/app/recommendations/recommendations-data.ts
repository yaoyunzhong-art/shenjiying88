export interface RecommendationSummary {
  tenantId: string
  generatedAt: string
  cached: boolean
  strategyWeights: Record<string, number>
  funnel: { stage: string; count: number }[]
  topReasons: { reason: string; count: number }[]
  coldStart: { cold: number; warm: number }
  heatmap: { strategy: string; category: string; count: number }[]
  metadata: {
    totalRequests: number
    avgExecutionMs: number
    cacheHitRate: number
    fallbackRate: number
  }
}

export interface RecommendationSnapshotDelivery {
  deliveryMode: 'mock'
  summary: RecommendationSummary
  generatedAt: string
}

function buildRecommendationSummary(generatedAt: string): RecommendationSummary {
  return {
    tenantId: 'default',
    generatedAt,
    cached: false,
    strategyWeights: {
      'item-cf': 0.35,
      'user-cf': 0.2,
      popular: 0.2,
      'recently-viewed': 0.1,
      personalized: 0.15,
    },
    funnel: [
      { stage: '曝光', count: 12000 },
      { stage: '点击', count: 4800 },
      { stage: '加购', count: 1600 },
      { stage: '购买', count: 480 },
    ],
    topReasons: [
      { reason: '与您浏览过的“无线耳机”相似', count: 1280 },
      { reason: '购买了“运动鞋”的会员也喜欢', count: 980 },
      { reason: '本月热销 TOP 10', count: 860 },
      { reason: '您最近浏览过', count: 640 },
      { reason: '基于您的偏好“数码”', count: 420 },
    ],
    coldStart: { cold: 320, warm: 1680 },
    heatmap: [
      { strategy: 'item-cf', category: '数码', count: 420 },
      { strategy: 'item-cf', category: '服饰', count: 280 },
      { strategy: 'item-cf', category: '食品', count: 120 },
      { strategy: 'user-cf', category: '数码', count: 180 },
      { strategy: 'user-cf', category: '服饰', count: 240 },
      { strategy: 'user-cf', category: '食品', count: 80 },
      { strategy: 'popular', category: '数码', count: 360 },
      { strategy: 'popular', category: '服饰', count: 480 },
      { strategy: 'popular', category: '食品', count: 320 },
      { strategy: 'recently-viewed', category: '数码', count: 220 },
      { strategy: 'recently-viewed', category: '服饰', count: 180 },
      { strategy: 'recently-viewed', category: '食品', count: 80 },
      { strategy: 'personalized', category: '数码', count: 280 },
      { strategy: 'personalized', category: '服饰', count: 320 },
      { strategy: 'personalized', category: '食品', count: 200 },
    ],
    metadata: {
      totalRequests: 2000,
      avgExecutionMs: 42,
      cacheHitRate: 0.38,
      fallbackRate: 0.16,
    },
  }
}

export async function loadRecommendationsSnapshot(): Promise<RecommendationSnapshotDelivery> {
  const generatedAt = new Date().toISOString()
  return {
    deliveryMode: 'mock',
    summary: buildRecommendationSummary(generatedAt),
    generatedAt,
  }
}
