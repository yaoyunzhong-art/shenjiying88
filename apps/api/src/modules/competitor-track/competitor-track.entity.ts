/**
 * 竞品跟踪 实体定义
 *
 * 跟踪竞品信息，用于竞品对比分析
 */

/** 竞品分类 */
export enum CompetitorCategory {
  ARCADE = 'arcade',
  GAME = 'game',
  SPORTS = 'sports',
  ENTERTAINMENT = 'entertainment'
}

/** 竞品信息 */
export interface Competitor {
  id: string
  competitorName: string
  city: string
  category: CompetitorCategory
  priceLevel: number
  rating: number
  visitorCount: number
  advantage: string
  weakness: string
  lastUpdated: string
}
