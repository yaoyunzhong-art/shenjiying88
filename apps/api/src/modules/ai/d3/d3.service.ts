/**
 * d3.service.ts — D3 智能推荐引擎
 *
 * D3 = Discovery + Decision + Delivery
 *
 * - Discovery: 基于用户行为画像生成推荐候选项
 * - Decision: 基于规则和约束过滤/排序推荐
 * - Delivery: 推荐结果分发
 *
 * V18增强:
 * - collaborateFilter(): 协同过滤(基于用户相似度)
 * - coldStart(): 冷启动策略(新品/新用户)
 * - ensembleScore(): 混合评分权重
 * - modelEvaluate(): 离线评估(覆盖率/新颖度/多样性)
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

// ─── Interaction data (for collaborative filtering) ────────────

interface UserItemInteraction {
  userId: string
  itemId: string
  rating: number // 1-5 implicit/explicit
  timestamp: string
  type: 'view' | 'purchase' | 'collect' | 'share'
}

const MOCK_INTERACTIONS: UserItemInteraction[] = [
  { userId: 'user-001', itemId: 'item-001', rating: 5, timestamp: '2026-07-14T12:00:00Z', type: 'purchase' },
  { userId: 'user-001', itemId: 'item-002', rating: 4, timestamp: '2026-07-14T12:05:00Z', type: 'view' },
  { userId: 'user-001', itemId: 'item-005', rating: 5, timestamp: '2026-07-15T10:00:00Z', type: 'purchase' },
  { userId: 'user-001', itemId: 'item-004', rating: 3, timestamp: '2026-07-13T08:00:00Z', type: 'view' },
  { userId: 'user-002', itemId: 'item-004', rating: 5, timestamp: '2026-07-14T09:00:00Z', type: 'purchase' },
  { userId: 'user-002', itemId: 'item-008', rating: 4, timestamp: '2026-07-14T09:10:00Z', type: 'collect' },
  { userId: 'user-002', itemId: 'item-001', rating: 2, timestamp: '2026-07-13T16:00:00Z', type: 'view' },
  { userId: 'user-003', itemId: 'item-003', rating: 5, timestamp: '2026-07-15T14:00:00Z', type: 'purchase' },
  { userId: 'user-003', itemId: 'item-007', rating: 4, timestamp: '2026-07-15T14:05:00Z', type: 'view' },
  { userId: 'user-003', itemId: 'item-009', rating: 3, timestamp: '2026-07-14T11:00:00Z', type: 'view' },
  { userId: 'user-004', itemId: 'item-010', rating: 4, timestamp: '2026-07-15T18:00:00Z', type: 'collect' },
  { userId: 'user-004', itemId: 'item-008', rating: 5, timestamp: '2026-07-15T18:10:00Z', type: 'purchase' },
  { userId: 'user-004', itemId: 'item-006', rating: 3, timestamp: '2026-07-12T09:00:00Z', type: 'view' },
  { userId: 'user-005', itemId: 'item-002', rating: 5, timestamp: '2026-07-15T20:00:00Z', type: 'purchase' },
  { userId: 'user-005', itemId: 'item-009', rating: 4, timestamp: '2026-07-15T20:05:00Z', type: 'collect' },
]

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
  // 🤝 Collaborative Filtering
  // ═══════════════════════════════════════════════════════════════

  /**
   * User-based协同过滤: 找相似用户, 推荐他们喜欢的物品
   * 使用Pearson相似度或Jaccard系数
   */
  collaborateFilter(userId: string, topK: number = 5): RecommendItem[] {
    const targetInteractions = MOCK_INTERACTIONS.filter(i => i.userId === userId)
    const targetItemIds = new Set(targetInteractions.map(i => i.itemId))

    if (targetItemIds.size === 0) {
      return []
    }

    // 计算用户相似度 (Jaccard: 交集/并集)
    const userSim: { userId: string; sim: number }[] = []
    const otherUserIds = [...new Set(MOCK_INTERACTIONS.filter(i => i.userId !== userId).map(i => i.userId))]

    for (const otherId of otherUserIds) {
      const otherInteractions = MOCK_INTERACTIONS.filter(i => i.userId === otherId)
      const otherItemIds = new Set(otherInteractions.map(i => i.itemId))

      const intersection = [...targetItemIds].filter(x => otherItemIds.has(x)).length
      const union = new Set([...targetItemIds, ...otherItemIds]).size

      if (union === 0) continue

      const jaccard = intersection / union

      // 加权: 共同购买>收藏>浏览
      const weightBonus = MOCK_INTERACTIONS
        .filter(i => i.userId === otherId && targetItemIds.has(i.itemId))
        .reduce((sum, i) => {
          if (i.type === 'purchase') return sum + 0.3
          if (i.type === 'collect') return sum + 0.2
          if (i.type === 'share') return sum + 0.25
          return sum + 0.1
        }, 0)

      const weightedSim = jaccard * 0.7 + Math.min(weightBonus, 0.3)
      if (weightedSim > 0) {
        userSim.push({ userId: otherId, sim: weightedSim })
      }
    }

    // 按相似度排序
    userSim.sort((a, b) => b.sim - a.sim)
    const topUsers = userSim.slice(0, topK)

    // 从相似用户中找到未交互的物品
    const candidateScores = new Map<string, { score: number; reasons: string[] }>()

    for (const { userId: simUserId, sim } of topUsers) {
      const simUserItems = MOCK_INTERACTIONS.filter(i => i.userId === simUserId && !targetItemIds.has(i.itemId))

      for (const interaction of simUserItems) {
        const existing = candidateScores.get(interaction.itemId)
        const typeWeight = interaction.type === 'purchase' ? 1.0 : interaction.type === 'collect' ? 0.8 : interaction.type === 'share' ? 0.9 : 0.5
        const contribution = sim * typeWeight * (interaction.rating / 5)

        if (existing) {
          existing.score += contribution
          existing.reasons.push(`用户${simUserId.slice(-3)}也喜欢`)
        } else {
          candidateScores.set(interaction.itemId, {
            score: contribution,
            reasons: [`相似用户推荐`],
          })
        }
      }
    }

    // 转换为推荐项
    const result: RecommendItem[] = []
    for (const [itemId, { score, reasons }] of candidateScores) {
      const item = MOCK_ITEMS.find(i => i.id === itemId)
      if (item) {
        result.push({
          ...item,
          score: Math.round(item.score * 0.4 + score * 0.6 * 100),
          reason: reasons.join('; '),
        })
      }
    }

    result.sort((a, b) => b.score - a.score)
    return result
  }

  /**
   * Item-based协同过滤: 基于物品相似度推荐
   * 用标签交集+同品类计算物品相似度
   */
  itemBasedFilter(itemId: string, topK: number = 5): RecommendItem[] {
    const sourceItem = MOCK_ITEMS.find(i => i.id === itemId)
    if (!sourceItem) return []

    const scored = MOCK_ITEMS
      .filter(i => i.id !== itemId)
      .map(target => {
        // 标签相似度
        const tagIntersection = sourceItem.tags.filter(t => target.tags.includes(t)).length
        const tagUnion = new Set([...sourceItem.tags, ...target.tags]).size
        const tagSim = tagUnion > 0 ? tagIntersection / tagUnion : 0

        // 品类匹配
        const catMatch = sourceItem.category === target.category ? 1 : 0

        // 价格相似度 (越近越高)
        const priceDiff = Math.abs(sourceItem.price - target.price) / Math.max(sourceItem.price, target.price)
        const priceSim = Math.max(0, 1 - priceDiff)

        // 综合得分
        const finalScore = tagSim * 0.5 + catMatch * 0.3 + priceSim * 0.2

        return {
          item: target,
          score: Math.round(finalScore * 100),
          reasons: [] as string[],
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    return scored.map(s => ({
      ...s.item,
      score: Math.round(s.item.score * 0.3 + s.score * 0.7),
      reason: '与您浏览的商品相似',
    }))
  }

  // ═══════════════════════════════════════════════════════════════
  // 🆕 Cold Start 冷启动
  // ═══════════════════════════════════════════════════════════════

  /**
   * 新用户冷启动: 无行为数据时的推荐策略
   * 策略: 热门+分众+地域+随机探索
   */
  coldStartNewUser(segment?: string): RecommendItem[] {
    const strategies: { name: string; items: RecommendItem[] }[] = []

    // 策略1: 全局热门 (Popularity)
    const globalHot = [...MOCK_ITEMS].sort((a, b) => b.score - a.score).slice(0, 5)
    strategies.push({ name: '热门推荐', items: globalHot })

    // 策略2: 分众推荐 (如果已知用户群)
    if (segment) {
      const segmentItems = MOCK_ITEMS.filter(item => item.tags.includes(segment))
      if (segmentItems.length > 0) {
        strategies.push({ name: `${segment}精选`, items: segmentItems.slice(0, 4) })
      }
    }

    // 策略3: 高评分+高性价比
    const highValue = [...MOCK_ITEMS]
      .filter(item => item.rating >= 4.5 && item.price <= 1000)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3)
    if (highValue.length > 0) {
      strategies.push({ name: '超值精选', items: highValue })
    }

    // 策略4: 多样性探索 (Explore - 确保覆盖面)
    const categories = [...new Set(MOCK_ITEMS.map(i => i.category))]
    const exploreItems: RecommendItem[] = []
    for (const cat of categories) {
      const catItem = MOCK_ITEMS.filter(i => i.category === cat && !strategies.some(s => s.items.some(si => si.id === i.id)))
      if (catItem.length > 0) {
        exploreItems.push(catItem[0])
      }
    }
    strategies.push({ name: '发现更多', items: exploreItems.slice(0, 3) })

    // 混合产出: 按策略轮换, 去重
    const seenIds = new Set<string>()
    const result: RecommendItem[] = []

    let roundIdx = 0
    while (result.length < 10) {
      let anyAdded = false
      for (const strategy of strategies) {
        const idx = roundIdx % strategy.items.length
        const item = strategy.items[idx]
        if (item && !seenIds.has(item.id)) {
          seenIds.add(item.id)
          result.push({
            ...item,
            score: Math.round(item.score + (10 - roundIdx)),
            reason: strategy.name,
          })
          anyAdded = true
        }
      }
      if (!anyAdded) break
      roundIdx++
    }

    return result
  }

  /**
   * 新品冷启动: 新上架物品缺少交互数据时的推广策略
   */
  coldStartNewItem(newItem: Partial<RecommendItem>): RecommendItem[] {
    // 按标签找到相似品类中的热门品
    const tagMatch = newItem.tags
      ? MOCK_ITEMS.filter(i =>
          i.id !== newItem.id &&
          i.tags.some(t => newItem.tags!.includes(t))
        )
      : []

    const catMatch = newItem.category
      ? MOCK_ITEMS.filter(i => i.id !== newItem.id && i.category === newItem.category)
      : []

    const relatedItems = [...new Map(
      [...tagMatch, ...catMatch]
        .map(i => [i.id, i] as const)
    ).values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)

    // 新品本身给予
    // 新品本身给予基础曝光分数
    const newItemScore = 60 + (newItem.rating ? newItem.rating * 5 : 0) + (newItem.tags?.length || 0) * 3

    const result = [
      {
        id: newItem.id || 'new-item',
        title: newItem.title || '新品推荐',
        type: newItem.type || 'general',
        score: newItemScore,
        reason: '新品推荐 · 限时体验',
        tags: newItem.tags || [],
        category: newItem.category || 'general',
        price: newItem.price || 0,
        rating: newItem.rating || 4.0,
        imageUrl: newItem.imageUrl || '',
      },
      // 推荐同品类热门商品做搭配
      ...relatedItems.map(i => ({
        ...i,
        score: Math.round(i.score * 0.8),
        reason: '同类热门推荐',
      })),
    ]

    return result
  }

  // ═══════════════════════════════════════════════════════════════
  // ⚖️ Ensemble Scoring
  // ═══════════════════════════════════════════════════════════════

  /**
   * 集成评分: 合并多个打分策略的加权结果
   * 支持配置各策略权重
   */
  ensembleScore(
    userId: string,
    weights?: { cb?: number; cf?: number; trend?: number; explore?: number }
  ): RecommendItem[] {
    const w = {
      cb: weights?.cb ?? 0.35,   // 基于内容的推荐权重
      cf: weights?.cf ?? 0.30,   // 协同过滤推荐权重
      trend: weights?.trend ?? 0.20, // 热门趋势权重
      explore: weights?.explore ?? 0.15, // 探索多样性权重
    }

    // 归一化权重
    const total = w.cb + w.cf + w.trend + w.explore
    const normW = {
      cb: w.cb / total,
      cf: w.cf / total,
      trend: w.trend / total,
      explore: w.explore / total,
    }

    // 获取各策略推荐
    const profile = MOCK_PROFILES[userId]
    const hasHistory = profile && MOCK_INTERACTIONS.some(i => i.userId === userId)

    const cbItems = hasHistory
      ? this.getPersonalPicks(userId).map(p => ({ id: p.id, score: p.score }))
      : []

    const cfItems = hasHistory
      ? this.collaborateFilter(userId).map(item => ({ id: item.id, score: item.score }))
      : []

    const trendItems = this.getTrendingItems('electronics', RecommendPeriod.WEEK).items
      .map(item => ({ id: item.id, score: item.score * 0.5 }))

    const exploreItems = this.coldStartNewUser().map(item => ({ id: item.id, score: item.score * 0.3 }))

    // 合并评分
    const combinedScore = new Map<string, number>()
    const scoreReasons = new Map<string, string[]>()

    for (const { id, score } of cbItems) {
      combinedScore.set(id, (combinedScore.get(id) || 0) + score * normW.cb)
      scoreReasons.set(id, [...(scoreReasons.get(id) || []), '内容匹配'])
    }
    for (const { id, score } of cfItems) {
      combinedScore.set(id, (combinedScore.get(id) || 0) + score * normW.cf)
      scoreReasons.set(id, [...(scoreReasons.get(id) || []), '协同过滤'])
    }
    for (const { id, score } of trendItems) {
      combinedScore.set(id, (combinedScore.get(id) || 0) + score * normW.trend)
      scoreReasons.set(id, [...(scoreReasons.get(id) || []), '热门趋势'])
    }
    for (const { id, score } of exploreItems) {
      combinedScore.set(id, (combinedScore.get(id) || 0) + score * normW.explore)
      scoreReasons.set(id, [...(scoreReasons.get(id) || []), '探索发现'])
    }

    const result: RecommendItem[] = []
    for (const [id, score] of combinedScore) {
      const item = MOCK_ITEMS.find(i => i.id === id)
      if (item) {
        result.push({
          ...item,
          score: Math.round(score),
          reason: scoreReasons.get(id)?.join(' | ') || '综合推荐',
        })
      }
    }

    result.sort((a, b) => b.score - a.score)
    return result
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 Model Evaluation
  // ═══════════════════════════════════════════════════════════════

  /**
   * 推荐模型离线评估
   * 产出: 覆盖率 + 新颖度 + 多样性 + 用户满意度指标
   */
  modelEvaluate(userId: string): {
    coverage: number;
    novelty: number;
    diversity: number;
    hitRate: number;
    recommendations: RecommendItem[];
  } {
    const recs = this.ensembleScore(userId)
    const totalItems = MOCK_ITEMS.length
    const coveredItems = new Set(recs.map(r => r.id)).size

    // 覆盖率: 推荐覆盖商品的比例
    const coverage = totalItems > 0 ? Math.round((coveredItems / totalItems) * 100) : 0

    // 多样性: 所推荐品类的分散程度
    const catSet = new Set(recs.map(r => r.category))
    const diversity = recs.length > 0 ? Math.round((catSet.size / recs.length) * 100) : 0

    // 新颖度: 非热门商品的推荐比例 (score < 80为"冷门")
    const novelCount = recs.filter(r => r.score < 80).length
    const novelty = recs.length > 0 ? Math.round((novelCount / recs.length) * 100) : 0

    // 命中率: 基于交互历史中是否包含推荐品类
    const userHistory = MOCK_INTERACTIONS.filter(i => i.userId === userId)
    const historyCats = new Set(
      userHistory.map(i => MOCK_ITEMS.find(m => m.id === i.itemId)?.category).filter(Boolean)
    )
    const hitCount = recs.filter(r => historyCats.has(r.category)).length
    const hitRate = recs.length > 0 ? Math.round((hitCount / recs.length) * 100) : 0

    return { coverage, novelty, diversity, hitRate, recommendations: recs }
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
