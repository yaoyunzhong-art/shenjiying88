/**
 * d3.service.ts — D3 智能推荐引擎
 *
 * D3 = Discovery + Decision + Delivery
 *
 * - Discovery: 基于用户行为画像生成推荐候选项
 * - Decision: 基于规则和约束过滤/排序推荐
 * - Delivery: 推荐结果分发
 */

import { Injectable } from '@nestjs/common'
import { RecommendContext, RecommendPeriod, RecommendChannel, FilterRuleType } from './d3.dto'

// ─── Type Definitions ──────────────────────────────────────────

export interface RecommendItem {
  id: string
  title: string
  type: string
  score: number
  reason: string
  tags: string[]
  category: string
  price: number
  rating: number
  imageUrl: string
}

export interface RecommendResult {
  items: RecommendItem[]
  context: RecommendContext
  total: number
  generatedAt: string
}

export interface TrendingResult {
  items: RecommendItem[]
  type: string
  period: RecommendPeriod
  total: number
}

export interface PersonalPick {
  id: string
  title: string
  type: string
  score: number
  reason: string
}

export interface FilterRule {
  type: FilterRuleType
  value: string
}

export interface ScoredItem {
  id: string
  originalScore: number
  adjustedScore: number
  factors: string[]
}

export interface Explanation {
  itemId: string
  score: number
  reasons: string[]
  confidence: number
  factors: { name: string; contribution: number }[]
}

export interface Delivery {
  id: string
  userId: string
  itemIds: string[]
  channel: RecommendChannel
  status: 'pending' | 'sent' | 'seen' | 'clicked' | 'converted'
  sentAt: string
  seenAt?: string
  clickedAt?: string
}

export interface ChannelInfo {
  channel: RecommendChannel
  name: string
  description: string
  maxItems: number
  supported: boolean
}

// ─── Internal Types ────────────────────────────────────────────

interface UserProfile {
  userId: string
  favoriteCategories: string[]
  viewedTags: string[]
  priceRange: { min: number; max: number }
}

// ─── In-memory store (simulation) ──────────────────────────────

const MOCK_ITEMS: RecommendItem[] = [
  { id: 'item-001', title: '智能手表 Pro', type: 'electronics', score: 95, reason: '高匹配度', tags: ['wearable', 'smart'], category: 'electronics', price: 2999, rating: 4.8, imageUrl: 'https://example.com/watch.jpg' },
  { id: 'item-002', title: '无线降噪耳机', type: 'electronics', score: 88, reason: '近期热门', tags: ['audio', 'noise-cancelling'], category: 'electronics', price: 1299, rating: 4.6, imageUrl: 'https://example.com/headphones.jpg' },
  { id: 'item-003', title: '运动跑鞋 Air', type: 'sports', score: 82, reason: '分类偏好', tags: ['running', 'sports'], category: 'sports', price: 899, rating: 4.5, imageUrl: 'https://example.com/shoes.jpg' },
  { id: 'item-004', title: '有机绿茶礼盒', type: 'food', score: 76, reason: '季节推荐', tags: ['tea', 'organic'], category: 'food', price: 268, rating: 4.7, imageUrl: 'https://example.com/tea.jpg' },
  { id: 'item-005', title: '机械键盘 K8', type: 'electronics', score: 91, reason: '浏览历史', tags: ['keyboard', 'mechanical'], category: 'electronics', price: 599, rating: 4.4, imageUrl: 'https://example.com/keyboard.jpg' },
  { id: 'item-006', title: '瑜伽垫加厚版', type: 'sports', score: 73, reason: '相关推荐', tags: ['yoga', 'fitness'], category: 'sports', price: 199, rating: 4.3, imageUrl: 'https://example.com/yogamat.jpg' },
  { id: 'item-007', title: '充电宝 20000mAh', type: 'electronics', score: 70, reason: '常购品类', tags: ['charger', 'portable'], category: 'electronics', price: 159, rating: 4.2, imageUrl: 'https://example.com/powerbank.jpg' },
  { id: 'item-008', title: '保温杯 500ml', type: 'daily', score: 65, reason: '季节推荐', tags: ['hydration', 'travel'], category: 'daily', price: 129, rating: 4.1, imageUrl: 'https://example.com/bottle.jpg' },
  { id: 'item-009', title: '蓝牙音箱', type: 'electronics', score: 85, reason: '热门推荐', tags: ['audio', 'wireless'], category: 'electronics', price: 399, rating: 4.5, imageUrl: 'https://example.com/speaker.jpg' },
  { id: 'item-010', title: '护眼台灯', type: 'daily', score: 60, reason: '常购品类', tags: ['lighting', 'desk'], category: 'daily', price: 349, rating: 4.0, imageUrl: 'https://example.com/lamp.jpg' },
]

const MOCK_PROFILES: Record<string, UserProfile> = {
  'user-001': { userId: 'user-001', favoriteCategories: ['electronics', 'sports'], viewedTags: ['wearable', 'audio', 'mechanical'], priceRange: { min: 100, max: 5000 } },
  'user-002': { userId: 'user-002', favoriteCategories: ['food', 'daily'], viewedTags: ['tea', 'organic', 'hydration'], priceRange: { min: 50, max: 1000 } },
}

const MOCK_DELIVERIES: Delivery[] = [
  { id: 'del-001', userId: 'user-001', itemIds: ['item-001', 'item-002'], channel: RecommendChannel.PUSH, status: 'sent', sentAt: '2026-07-15T10:00:00Z' },
  { id: 'del-002', userId: 'user-001', itemIds: ['item-005'], channel: RecommendChannel.POPUP, status: 'pending', sentAt: '2026-07-15T12:00:00Z' },
  { id: 'del-003', userId: 'user-002', itemIds: ['item-004', 'item-008'], channel: RecommendChannel.PULL, status: 'clicked', sentAt: '2026-07-15T08:00:00Z', clickedAt: '2026-07-15T09:30:00Z' },
]

// ─── Service ───────────────────────────────────────────────────

@Injectable()
export class D3Service {
  // ═══════════════════════════════════════════════════════════════
  // ✨ Discovery — 推荐候选生成
  // ═══════════════════════════════════════════════════════════════

  /**
   * 上下感知推荐：基于用户行为画像与当前上下文生成推荐
   */
  getRecommendations(userId: string, context: RecommendContext = RecommendContext.HOME, limit: number = 10): RecommendResult {
    if (limit < 1) {
      limit = 1
    }

    const profile = MOCK_PROFILES[userId]
    const candidates = MOCK_ITEMS.filter((item) => {
      if (!profile) {
        return item.score >= 70
      }
      const catMatch = profile.favoriteCategories.includes(item.category)
      const tagMatch = item.tags.some((t) => profile.viewedTags.includes(t))
      const priceMatch = item.price >= profile.priceRange.min && item.price <= profile.priceRange.max
      return (catMatch || tagMatch) && priceMatch
    })

    const scored = candidates
      .map((item) => ({
        ...item,
        score: this.adjustScoreForContext(item.score, context),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return {
      items: scored,
      context,
      total: scored.length,
      generatedAt: new Date().toISOString(),
    }
  }

  /**
   * 热门推荐：基于类型和时间周期获取热门商品
   */
  getTrendingItems(type: string, period: RecommendPeriod = RecommendPeriod.WEEK): TrendingResult {
    if (type.length === 0) {
      return { items: [], type, period, total: 0 }
    }

    const items = MOCK_ITEMS
      .filter((item) => item.type === type)
      .sort((a, b) => {
        const periodBonus = this.getPeriodBonus(b, period) - this.getPeriodBonus(a, period)
        return periodBonus !== 0 ? periodBonus : b.score - a.score
      })

    return {
      items,
      type,
      period,
      total: items.length,
    }
  }

  /**
   * 个性化选品：为用户推荐个性化商品
   */
  getPersonalPicks(userId: string): PersonalPick[] {
    const profile = MOCK_PROFILES[userId]
    if (!profile) {
      return MOCK_ITEMS.slice(0, 3).map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        score: item.score,
        reason: '默认推荐',
      }))
    }

    const picks = MOCK_ITEMS
      .filter((item) => {
        const catMatch = profile.favoriteCategories.includes(item.category)
        const tagMatch = item.tags.some((t) => profile.viewedTags.includes(t))
        const priceMatch = item.price >= profile.priceRange.min && item.price <= profile.priceRange.max
        return (catMatch || tagMatch) && priceMatch
      })
      .map((item) => {
        const reasons: string[] = []
        if (profile.favoriteCategories.includes(item.category)) {
          reasons.push('匹配偏好分类')
        }
        if (item.tags.some((t) => profile.viewedTags.includes(t))) {
          reasons.push('匹配浏览标签')
        }
        return {
          id: item.id,
          title: item.title,
          type: item.type,
          score: item.score + (reasons.length > 0 ? 5 : 0),
          reason: reasons.join('; ') || '系统推荐',
        }
      })
      .sort((a, b) => b.score - a.score)

    return picks
  }

  // ═══════════════════════════════════════════════════════════════
  // 💡 Decision — 规则过滤 & 评分排序
  // ═══════════════════════════════════════════════════════════════

  /**
   * 规则过滤：基于过滤规则筛选推荐候选
   */
  applyFilters(candidates: string[], rules: FilterRule[]): string[] {
    const items = MOCK_ITEMS.filter((item) => candidates.includes(item.id))
    if (items.length === 0) {
      return []
    }

    let filtered = [...items]
    for (const rule of rules) {
      switch (rule.type) {
        case FilterRuleType.CATEGORY:
          filtered = filtered.filter((item) => item.category === rule.value)
          break
        case FilterRuleType.PRICE_RANGE: {
          const [minStr, maxStr] = rule.value.split('-')
          const min = Number(minStr) || 0
          const max = Number(maxStr) || Infinity
          filtered = filtered.filter((item) => item.price >= min && item.price <= max)
          break
        }
        case FilterRuleType.BRAND:
          filtered = filtered.filter((item) => item.title.includes(rule.value))
          break
        case FilterRuleType.TAG:
          filtered = filtered.filter((item) => item.tags.includes(rule.value))
          break
        case FilterRuleType.RATING: {
          const minRating = Number(rule.value) || 0
          filtered = filtered.filter((item) => item.rating >= minRating)
          break
        }
        default:
          break
      }
    }

    return filtered.map((item) => item.id)
  }

  /**
   * 评分排序：对推荐项进行综合评分排序
   */
  scoreItems(items: string[], userId: string): ScoredItem[] {
    const mockItems = MOCK_ITEMS.filter((item) => items.includes(item.id))
    const profile = MOCK_PROFILES[userId]

    return mockItems.map((item) => {
      const factors: string[] = []
      let adjustedScore = item.score

      if (profile) {
        const catMatch = profile.favoriteCategories.includes(item.category)
        const tagMatch = item.tags.some((t) => profile.viewedTags.includes(t))
        const priceMatch = item.price >= profile.priceRange.min && item.price <= profile.priceRange.max

        if (catMatch) {
          adjustedScore += 10
          factors.push('品类偏好+10')
        }
        if (tagMatch) {
          adjustedScore += 5
          factors.push('标签匹配+5')
        }
        if (!priceMatch) {
          adjustedScore -= 15
          factors.push('价格不匹配-15')
        }
      }

      return {
        id: item.id,
        originalScore: item.score,
        adjustedScore: Math.max(0, adjustedScore),
        factors,
      }
    }).sort((a, b) => b.adjustedScore - a.adjustedScore)
  }

  /**
   * 推荐解释：生成推荐结果的解释信息
   */
  getExplanation(itemId: string, score: number): Explanation {
    const item = MOCK_ITEMS.find((i) => i.id === itemId)
    if (!item) {
      return {
        itemId,
        score: 0,
        reasons: [],
        confidence: 0,
        factors: [],
      }
    }

    const reasons: string[] = [item.reason]
    const factors: { name: string; contribution: number }[] = [
      { name: '基础分', contribution: item.score * 0.6 },
      { name: '时效加成', contribution: 10 },
      { name: '用户画像匹配', contribution: 15 },
    ]

    if (item.rating >= 4.5) {
      factors.push({ name: '评分加成', contribution: 5 })
      reasons.push('高评分商品')
    }

    const confidence = Math.min(100, Math.round((item.score / 100) * 70 + 30))

    return {
      itemId,
      score,
      reasons,
      confidence,
      factors,
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 📦 Delivery — 推荐结果分发
  // ═══════════════════════════════════════════════════════════════

  /**
   * 查看推荐分发历史
   */
  getDeliveries(userId: string): Delivery[] {
    if (userId.length === 0) {
      return []
    }
    return MOCK_DELIVERIES.filter((d) => d.userId === userId)
  }

  /**
   * 标记已送达
   */
  markDelivered(deliveryId: string): Delivery | null {
    const delivery = MOCK_DELIVERIES.find((d) => d.id === deliveryId)
    if (!delivery) {
      return null
    }
    if (delivery.status !== 'pending') {
      return delivery
    }
    const updated: Delivery = { ...delivery, status: 'sent', sentAt: new Date().toISOString() }
    return updated
  }

  /**
   * 分发渠道信息
   */
  getChannel(channel: RecommendChannel): ChannelInfo {
    const channels: Record<RecommendChannel, ChannelInfo> = {
      [RecommendChannel.PUSH]: { channel, name: '推送通知', description: '通过推送通知分发推荐', maxItems: 3, supported: true },
      [RecommendChannel.PULL]: { channel, name: '信息流', description: '用户在信息流中拉取推荐', maxItems: 20, supported: true },
      [RecommendChannel.POPUP]: { channel, name: '弹窗', description: '通过弹窗展示推荐', maxItems: 1, supported: true },
    }
    return channels[channel] ?? { channel, name: '未知渠道', description: '', maxItems: 0, supported: false }
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔧 Internal Helpers
  // ═══════════════════════════════════════════════════════════════

  private adjustScoreForContext(score: number, context: RecommendContext): number {
    const bonuses: Partial<Record<RecommendContext, number>> = {
      [RecommendContext.HOME]: 0,
      [RecommendContext.SEARCH]: 5,
      [RecommendContext.DETAIL]: 10,
      [RecommendContext.CART]: 15,
      [RecommendContext.CHECKOUT]: 20,
      [RecommendContext.PROFILE]: 3,
    }
    return score + (bonuses[context] ?? 0)
  }

  private getPeriodBonus(item: RecommendItem, period: RecommendPeriod): number {
    const bonuses: Record<RecommendPeriod, number> = {
      [RecommendPeriod.TODAY]: item.score * 0.2,
      [RecommendPeriod.WEEK]: item.score * 0.1,
      [RecommendPeriod.MONTH]: item.score * 0.05,
      [RecommendPeriod.QUARTER]: 0,
    }
    return bonuses[period]
  }
}
