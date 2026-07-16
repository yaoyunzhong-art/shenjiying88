import { Injectable } from '@nestjs/common'
import { CompetitorCategory, type Competitor } from './competitor-track.entity'
import type { CompetitorDto, TrackSummaryDto, CreateCompetitorDto } from './competitor-track.dto'

/** Mock 竞品数据 8条（不同城市） */
const MOCK_COMPETITORS: Competitor[] = [
  {
    id: 'ct-001',
    competitorName: '欢乐电玩城',
    city: '北京',
    category: CompetitorCategory.ARCADE,
    priceLevel: 3,
    rating: 4.2,
    visitorCount: 12500,
    advantage: '位置优越，位于商圈核心，客流量大',
    weakness: '设备老化，更新频率低',
    lastUpdated: '2026-07-10T08:00:00Z'
  },
  {
    id: 'ct-002',
    competitorName: '极速电竞馆',
    city: '上海',
    category: CompetitorCategory.GAME,
    priceLevel: 4,
    rating: 4.5,
    visitorCount: 9800,
    advantage: '高端电竞设备，专业赛事运营',
    weakness: '单价较高，家庭用户比例低',
    lastUpdated: '2026-07-12T10:30:00Z'
  },
  {
    id: 'ct-003',
    competitorName: '浪潮水上乐园',
    city: '广州',
    category: CompetitorCategory.ENTERTAINMENT,
    priceLevel: 3,
    rating: 4.0,
    visitorCount: 22000,
    advantage: '季节性主题活动丰富，拉新能力强',
    weakness: '受天气影响大，冬季客流下降明显',
    lastUpdated: '2026-07-08T14:00:00Z'
  },
  {
    id: 'ct-004',
    competitorName: '星空运动中心',
    city: '深圳',
    category: CompetitorCategory.SPORTS,
    priceLevel: 4,
    rating: 4.3,
    visitorCount: 7600,
    advantage: '综合运动场馆，含攀岩/射箭/蹦床',
    weakness: '缺少餐饮配套，停留时间短',
    lastUpdated: '2026-07-11T09:15:00Z'
  },
  {
    id: 'ct-005',
    competitorName: '儿童探险王国',
    city: '杭州',
    category: CompetitorCategory.ENTERTAINMENT,
    priceLevel: 2,
    rating: 4.6,
    visitorCount: 15800,
    advantage: '亲子主题鲜明，家长复购率高',
    weakness: '场地面积有限，高峰期拥堵',
    lastUpdated: '2026-07-09T16:00:00Z'
  },
  {
    id: 'ct-006',
    competitorName: '雷霆射击俱乐部',
    city: '成都',
    category: CompetitorCategory.SPORTS,
    priceLevel: 5,
    rating: 4.1,
    visitorCount: 4200,
    advantage: '专业射击体验，高端会员制',
    weakness: '客群面窄，获客成本高',
    lastUpdated: '2026-07-07T11:45:00Z'
  },
  {
    id: 'ct-007',
    competitorName: '幻境VR体验馆',
    city: '武汉',
    category: CompetitorCategory.GAME,
    priceLevel: 3,
    rating: 4.4,
    visitorCount: 6100,
    advantage: 'VR技术领先，内容更新快',
    weakness: '设备维护成本高，座位周转率低',
    lastUpdated: '2026-07-13T13:00:00Z'
  },
  {
    id: 'ct-008',
    competitorName: '都市嘉年华',
    city: '南京',
    category: CompetitorCategory.ARCADE,
    priceLevel: 2,
    rating: 3.8,
    visitorCount: 19300,
    advantage: '价格亲民，覆盖全年龄段',
    weakness: '装修陈旧，品牌形象老化',
    lastUpdated: '2026-07-06T10:00:00Z'
  }
]

@Injectable()
export class CompetitorTrackService {
  private competitors: Competitor[] = [...MOCK_COMPETITORS]

  /** 获取竞品列表（支持筛选） */
  async findAll(city?: string, category?: string, minRating?: number): Promise<CompetitorDto[]> {
    let result = [...this.competitors]

    if (city) {
      result = result.filter(c => c.city === city)
    }
    if (category) {
      result = result.filter(c => c.category === category)
    }
    if (minRating !== undefined) {
      result = result.filter(c => c.rating >= minRating)
    }

    return result.map(this.toDto)
  }

  /** 按 ID 获取竞品 */
  async findById(id: string): Promise<CompetitorDto | null> {
    const competitor = this.competitors.find(c => c.id === id)
    return competitor ? this.toDto(competitor) : null
  }

  /** 获取竞品汇总统计 */
  async getSummary(): Promise<TrackSummaryDto> {
    const items = this.competitors

    // 分类分布
    const categoryDistribution: Record<string, number> = {}
    for (const c of items) {
      categoryDistribution[c.category] = (categoryDistribution[c.category] || 0) + 1
    }

    // 城市分布
    const cityDistribution: Record<string, number> = {}
    for (const c of items) {
      cityDistribution[c.city] = (cityDistribution[c.city] || 0) + 1
    }

    // 平均评分和价格水平
    const avgRating = items.reduce((s, c) => s + c.rating, 0) / items.length
    const avgPriceLevel = items.reduce((s, c) => s + c.priceLevel, 0) / items.length

    // 按评分取前 3 名
    const topCompetitors = [...items]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3)
      .map(this.toDto)

    return {
      totalCompetitors: items.length,
      categoryDistribution,
      cityDistribution,
      avgRating: Math.round(avgRating * 100) / 100,
      avgPriceLevel: Math.round(avgPriceLevel * 100) / 100,
      topCompetitors
    }
  }

  /** 创建竞品 */
  async create(dto: CreateCompetitorDto): Promise<CompetitorDto> {
    const newCompetitor: Competitor = {
      id: `ct-${String(this.competitors.length + 1).padStart(3, '0')}`,
      competitorName: dto.competitorName,
      city: dto.city,
      category: dto.category as CompetitorCategory,
      priceLevel: dto.priceLevel,
      rating: dto.rating,
      visitorCount: dto.visitorCount,
      advantage: dto.advantage,
      weakness: dto.weakness,
      lastUpdated: new Date().toISOString()
    }
    this.competitors.push(newCompetitor)
    return this.toDto(newCompetitor)
  }

  /** 竞品对比分析 */
  async getComparison(ids: string[]): Promise<{
    competitors: CompetitorDto[]
    comparison: {
      avgRating: number
      avgPriceLevel: number
      totalVisitors: number
      bestRated: string
      mostVisited: string
    }
  }> {
    const matched = this.competitors.filter(c => ids.includes(c.id))
    const dtos = matched.map(this.toDto)

    if (matched.length === 0) {
      return {
        competitors: [],
        comparison: {
          avgRating: 0,
          avgPriceLevel: 0,
          totalVisitors: 0,
          bestRated: '',
          mostVisited: ''
        }
      }
    }

    const avgRating = matched.reduce((s, c) => s + c.rating, 0) / matched.length
    const avgPriceLevel = matched.reduce((s, c) => s + c.priceLevel, 0) / matched.length
    const totalVisitors = matched.reduce((s, c) => s + c.visitorCount, 0)
    const bestRated = [...matched].sort((a, b) => b.rating - a.rating)[0].competitorName
    const mostVisited = [...matched].sort((a, b) => b.visitorCount - a.visitorCount)[0].competitorName

    return {
      competitors: dtos,
      comparison: {
        avgRating: Math.round(avgRating * 100) / 100,
        avgPriceLevel: Math.round(avgPriceLevel * 100) / 100,
        totalVisitors,
        bestRated,
        mostVisited
      }
    }
  }

  /** 转换为 DTO */
  private toDto(c: Competitor): CompetitorDto {
    return {
      id: c.id,
      competitorName: c.competitorName,
      city: c.city,
      category: c.category,
      priceLevel: c.priceLevel,
      rating: c.rating,
      visitorCount: c.visitorCount,
      advantage: c.advantage,
      weakness: c.weakness,
      lastUpdated: c.lastUpdated
    }
  }
}
