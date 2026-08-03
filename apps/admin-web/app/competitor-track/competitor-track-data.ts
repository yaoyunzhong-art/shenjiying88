export type ScoreLevel = 'high' | 'medium' | 'low'

export interface CompetitorRecord {
  id: string
  name: string
  city: string
  score: number
  priceMin: number
  priceMax: number
  douyinHeat: number
  category: string
  description: string
  brandIntro: string
  storeCount: number
  mainDistricts: string[]
  heatTrend: 'up' | 'stable' | 'down'
  createdAt: string
}

export interface CompetitorTrackSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'competitor-track-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  competitors: CompetitorRecord[]
  cities: string[]
}

export const DEFAULT_COMPETITORS: CompetitorRecord[] = [
  {
    id: 'cp-001',
    name: '瑞幸咖啡',
    city: '北京',
    score: 4.3,
    priceMin: 9,
    priceMax: 35,
    douyinHeat: 92,
    category: '咖啡茶饮',
    description: '国内领先咖啡连锁，覆盖度高',
    brandIntro:
      '瑞幸咖啡是中国门店数最多的咖啡品牌，以“专业咖啡新鲜式”为理念，主打高性价比现磨咖啡。',
    storeCount: 15000,
    mainDistricts: ['朝阳区', '海淀区', '东城区'],
    heatTrend: 'up',
    createdAt: '2024-01-15',
  },
  {
    id: 'cp-002',
    name: '星巴克',
    city: '北京',
    score: 4.1,
    priceMin: 30,
    priceMax: 60,
    douyinHeat: 85,
    category: '咖啡茶饮',
    description: '全球咖啡巨头，品牌力强',
    brandIntro:
      '星巴克咖啡公司成立于 1971 年，全球最大的咖啡连锁品牌，致力于为消费者提供优质咖啡体验。',
    storeCount: 7000,
    mainDistricts: ['朝阳区', '海淀区', '西城区'],
    heatTrend: 'stable',
    createdAt: '2024-01-10',
  },
  {
    id: 'cp-003',
    name: 'Manner Coffee',
    city: '上海',
    score: 4.5,
    priceMin: 15,
    priceMax: 30,
    douyinHeat: 78,
    category: '咖啡茶饮',
    description: '精品咖啡连锁，性价比高',
    brandIntro:
      'Manner Coffee 创立于 2015 年，以“让咖啡成为生活的一部分”为使命，主打精品平价咖啡。',
    storeCount: 1200,
    mainDistricts: ['浦东新区', '静安区', '徐汇区'],
    heatTrend: 'up',
    createdAt: '2024-02-20',
  },
  {
    id: 'cp-004',
    name: '霸王茶姬',
    city: '广州',
    score: 4.2,
    priceMin: 18,
    priceMax: 35,
    douyinHeat: 90,
    category: '咖啡茶饮',
    description: '国风茶饮，年轻化品牌',
    brandIntro:
      '霸王茶姬是新中式国风茶饮品牌，以东方美学和现代茶饮创新为核心竞争力。',
    storeCount: 4500,
    mainDistricts: ['天河区', '越秀区', '荔湾区'],
    heatTrend: 'up',
    createdAt: '2024-03-05',
  },
  {
    id: 'cp-005',
    name: '蜜雪冰城',
    city: '郑州',
    score: 3.8,
    priceMin: 3,
    priceMax: 12,
    douyinHeat: 95,
    category: '咖啡茶饮',
    description: '平价茶饮之王，下沉市场霸主',
    brandIntro:
      '蜜雪冰城创立于 1997 年，以高性价比冰淇淋和茶饮闻名，门店遍布全国各线城市。',
    storeCount: 36000,
    mainDistricts: ['金水区', '二七区', '中原区'],
    heatTrend: 'up',
    createdAt: '2024-01-08',
  },
  {
    id: 'cp-006',
    name: '喜茶',
    city: '深圳',
    score: 4.4,
    priceMin: 20,
    priceMax: 45,
    douyinHeat: 82,
    category: '咖啡茶饮',
    description: '新茶饮头部品牌，创新引领者',
    brandIntro:
      '喜茶是高端新茶饮品牌代表，以“灵感之茶”为品牌理念，持续推出市场爆款。',
    storeCount: 3500,
    mainDistricts: ['南山区', '福田区', '宝安区'],
    heatTrend: 'stable',
    createdAt: '2024-02-14',
  },
  {
    id: 'cp-007',
    name: '奈雪的茶',
    city: '深圳',
    score: 4.0,
    priceMin: 22,
    priceMax: 48,
    douyinHeat: 70,
    category: '咖啡茶饮',
    description: '茶饮加烘焙复合业态',
    brandIntro:
      '奈雪的茶创立于 2015 年，定位高端茶饮品牌，开创“茶饮加烘焙”复合业态模式。',
    storeCount: 1800,
    mainDistricts: ['南山区', '福田区', '罗湖区'],
    heatTrend: 'down',
    createdAt: '2024-02-18',
  },
  {
    id: 'cp-008',
    name: '幸运咖',
    city: '成都',
    score: 3.9,
    priceMin: 5,
    priceMax: 18,
    douyinHeat: 65,
    category: '咖啡茶饮',
    description: '平价咖啡新势力，下沉市场扩张',
    brandIntro:
      '幸运咖是蜜雪冰城旗下咖啡品牌，主打极致性价比咖啡，目标下沉市场年轻消费者。',
    storeCount: 2800,
    mainDistricts: ['锦江区', '青羊区', '武侯区'],
    heatTrend: 'up',
    createdAt: '2024-04-01',
  },
  {
    id: 'cp-009',
    name: '一点点',
    city: '杭州',
    score: 3.5,
    priceMin: 10,
    priceMax: 22,
    douyinHeat: 55,
    category: '咖啡茶饮',
    description: '传统奶茶品牌，经典口味',
    brandIntro:
      '一点点是台湾 50 岚在内地的品牌授权，以经典奶茶和波霸系列产品受到消费者欢迎。',
    storeCount: 4000,
    mainDistricts: ['西湖区', '上城区', '拱墅区'],
    heatTrend: 'down',
    createdAt: '2024-01-20',
  },
  {
    id: 'cp-010',
    name: '库迪咖啡',
    city: '武汉',
    score: 3.7,
    priceMin: 8,
    priceMax: 25,
    douyinHeat: 88,
    category: '咖啡茶饮',
    description: '快速扩张的咖啡新生力量',
    brandIntro:
      '库迪咖啡由瑞幸咖啡原核心团队创立，以“全时段咖啡”理念快速扩张，主打高性价比。',
    storeCount: 8000,
    mainDistricts: ['武昌区', '洪山区', '江汉区'],
    heatTrend: 'up',
    createdAt: '2024-05-10',
  },
]

export const CITIES = Array.from(new Set(DEFAULT_COMPETITORS.map((item) => item.city))).sort()

export const SCORE_LABELS: Record<ScoreLevel, string> = {
  high: '高 (>= 4.0)',
  medium: '中 (3.0-3.9)',
  low: '低 (< 3.0)',
}

export const TREND_LABEL: Record<CompetitorRecord['heatTrend'], string> = {
  up: '上升',
  stable: '平稳',
  down: '下降',
}

export function formatPrice(min: number, max: number): string {
  return `¥${min} ~ ¥${max}`
}

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 4.0) return 'high'
  if (score >= 3.0) return 'medium'
  return 'low'
}

export function filterCompetitors(
  items: CompetitorRecord[],
  search: string,
  cityFilter: string,
  scoreFilter: ScoreLevel | 'all',
): CompetitorRecord[] {
  let result = items
  if (search.trim()) {
    const query = search.trim().toLowerCase()
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.city.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query),
    )
  }
  if (cityFilter !== 'all') {
    result = result.filter((item) => item.city === cityFilter)
  }
  if (scoreFilter !== 'all') {
    result = result.filter((item) => getScoreLevel(item.score) === scoreFilter)
  }
  return result
}

export async function loadCompetitorTrackSnapshot(): Promise<CompetitorTrackSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'competitor-track-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadCompetitorTrackSnapshot -> local E54 competitor snapshot shell',
    businessDataSource: 'DEFAULT_COMPETITORS benchmark samples',
    refreshPath: 'CompetitorTrackPage -> loadCompetitorTrackSnapshot',
    note: '当前竞品跟踪页仍展示本地样本，用于完成 E54 三层收口与来源态透明化。',
    competitors: DEFAULT_COMPETITORS,
    cities: CITIES,
  }
}
