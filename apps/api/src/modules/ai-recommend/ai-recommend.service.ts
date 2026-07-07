import { Injectable } from '@nestjs/common'
import {
  type Recommendation,
  type UserProfile,
  type ItemScore,
  type RecommendationStrategy,
  type RecommendType,
  type StrategyWeightFactor,
  type GenerateRecommendationsInput,
  type GenerateRecommendationsOutput
} from './ai-recommend.entity'

@Injectable()
export class AiRecommendService {
  // ---- 内存存储 ----
  private recommendations: Recommendation[] = []
  private profiles: Map<string, UserProfile> = new Map()
  private itemScores: ItemScore[] = []
  private strategies: Map<string, RecommendationStrategy> = new Map()

  // ---- 冷启动：模拟交互计数 ----
  private itemInteractionCounts: Map<string, number> = new Map()

  constructor() {
    this.seedDefaultStrategies()
    this.seedMockInteractions()
  }

  // ===== 种子数据 =====

  private seedDefaultStrategies(): void {
    const now = new Date().toISOString()

    const popularity: RecommendationStrategy = {
      id: 'strategy-popularity-v1',
      name: 'popularity',
      description: '热门推荐：基于物品交互次数排序',
      targetType: 'game',
      config: {
        weights: [{ factor: 'interactionCount', weight: 1.0 }],
        minScore: 10,
        maxResults: 10
      },
      isEnabled: true,
      createdAt: now,
      updatedAt: now
    }
    this.strategies.set(popularity.id, popularity)

    const collaborative: RecommendationStrategy = {
      id: 'strategy-collaborative-v1',
      name: 'collaborative-filtering',
      description: '协同过滤：相似用户也喜欢的物品',
      targetType: 'game',
      config: {
        weights: [
          { factor: 'similarity', weight: 0.5 },
          { factor: 'rating', weight: 0.3 },
          { factor: 'recency', weight: 0.2 }
        ],
        fallbackStrategy: 'strategy-popularity-v1',
        minScore: 30,
        maxResults: 10
      },
      isEnabled: true,
      createdAt: now,
      updatedAt: now
    }
    this.strategies.set(collaborative.id, collaborative)

    const contentBased: RecommendationStrategy = {
      id: 'strategy-content-v1',
      name: 'content-based',
      description: '内容推荐：基于用户画像偏好匹配',
      targetType: 'game',
      config: {
        weights: [
          { factor: 'gameTypeMatch', weight: 0.5 },
          { factor: 'priceMatch', weight: 0.3 },
          { factor: 'timeSlotMatch', weight: 0.2 }
        ],
        fallbackStrategy: 'strategy-popularity-v1',
        minScore: 20,
        maxResults: 10
      },
      isEnabled: true,
      createdAt: now,
      updatedAt: now
    }
    this.strategies.set(contentBased.id, contentBased)

    const hybrid: RecommendationStrategy = {
      id: 'strategy-hybrid-v1',
      name: 'hybrid',
      description: '混合推荐：热门+协同过滤+内容推荐加权融合',
      targetType: 'game',
      config: {
        weights: [
          { factor: 'popularity', weight: 0.3 },
          { factor: 'collaborative', weight: 0.3 },
          { factor: 'contentMatch', weight: 0.4 }
        ],
        minScore: 20,
        maxResults: 15
      },
      isEnabled: true,
      createdAt: now,
      updatedAt: now
    }
    this.strategies.set(hybrid.id, hybrid)
  }

  private seedMockInteractions(): void {
    // 模拟物品交互计数（用于热门推荐冷启动）
    const now = new Date().toISOString()
    const games = [
      { id: 'game-001', name: '王者荣耀', type: 'MOBA' },
      { id: 'game-002', name: '原神', type: 'RPG' },
      { id: 'game-003', name: '英雄联盟', type: 'MOBA' },
      { id: 'game-004', name: '和平精英', type: 'FPS' },
      { id: 'game-005', name: '崩坏：星穹铁道', type: 'RPG' },
      { id: 'game-006', name: '绝区零', type: 'ARPG' },
      { id: 'game-007', name: '第五人格', type: 'Survival' },
      { id: 'game-008', name: '蛋仔派对', type: 'Party' }
    ]

    games.forEach((g, i) => {
      this.itemInteractionCounts.set(g.id, (games.length - i) * 10 + 5)
    })

    // 模拟物品评分（用于协同过滤）
    games.slice(0, 4).forEach((g, i) => {
      this.itemScores.push({
        id: `score-${i + 1}`,
        memberId: 'member-001',
        itemId: g.id,
        itemType: 'game',
        rating: 4 + (i % 2),
        interaction: 'play',
        weight: 1.0,
        createdAt: now
      })
    })

    games.slice(2, 6).forEach((g, i) => {
      this.itemScores.push({
        id: `score-${i + 10}`,
        memberId: 'member-002',
        itemId: g.id,
        itemType: 'game',
        rating: 3 + (i % 3),
        interaction: 'play',
        weight: 1.0,
        createdAt: now
      })
    })
  }

  // ===== 热门推荐 =====

  /**
   * 热门推荐：按交互次数排序，返回 top-N
   */
  getPopularRecommendations(
    storeId?: string,
    type?: RecommendType,
    limit: number = 10
  ): Recommendation[] {
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const sorted = Array.from(this.itemInteractionCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)

    return sorted.map(([itemId, count]) => ({
      id: `rec-pop-${itemId}`,
      tenantId: 'default',
      storeId,
      type: type ?? 'game',
      itemId,
      itemName: `Item-${itemId}`,
      score: Math.min(count, 100),
      reason: `热门推荐：${count} 次交互`,
      strategy: 'popularity',
      status: 'active',
      expiresAt,
      createdAt: now
    }))
  }

  // ===== 个性化推荐 =====

  /**
   * 个性化推荐：基于用户画像进行内容匹配推荐
   * 冷启动处理：无画像时回退到热门推荐
   */
  getPersonalizedRecommendations(
    memberId: string,
    type?: RecommendType,
    limit: number = 10
  ): Recommendation[] {
    const profile = this.profiles.get(memberId)

    // 冷启动：无画像 → 回退热门推荐
    if (!profile) {
      return this.getPopularRecommendations(undefined, type, limit).map((rec) => ({
        ...rec,
        id: rec.id.replace('rec-pop-', 'rec-cold-'),
        memberId,
        reason: '新用户冷启动：' + rec.reason,
        strategy: 'cold-start->popularity'
      }))
    }

    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // 内容匹配：偏好 gameTypes + 价格区间
    const items = Array.from(this.itemInteractionCounts.keys())
    const typeSuffixes: Record<string, string> = {
      'game-001': '王者荣耀',
      'game-002': '原神',
      'game-003': '英雄联盟',
      'game-004': '和平精英',
      'game-005': '崩坏：星穹铁道',
      'game-006': '绝区零',
      'game-007': '第五人格',
      'game-008': '蛋仔派对'
    }

    const scored = items.map((itemId) => {
      let score = 0
      const reasons: string[] = []

      // 游戏类型匹配
      const gameType = this.getItemGameType(itemId)
      if (profile.preferences.gameTypes.includes(gameType)) {
        score += 50
        reasons.push(`匹配偏好类型 ${gameType}`)
      }

      // 价格区间匹配（简化：用交互次数模拟价格）
      const itemPopularity = this.itemInteractionCounts.get(itemId) ?? 0
      if (profile.preferences.avgSpend > 50 && itemPopularity > 30) {
        score += 20
        reasons.push('匹配消费水平')
      }

      // 时间段匹配
      const currentHour = new Date().getHours()
      const isEvening = currentHour >= 18 && currentHour < 22
      if (profile.preferences.favoriteTimeSlot.includes('18:00') && isEvening) {
        score += 15
        reasons.push('匹配偏好时间段')
      }

      // 行为标签加权
      if (profile.behaviorTags.includes('game-enthusiast')) {
        score += 15
        reasons.push('游戏爱好者加成')
      }

      return { itemId, score: Math.min(score, 100), reasons }
    })

    const results: Recommendation[] = scored
      .filter((s) => s.score > 10)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => ({
        id: `rec-pers-${s.itemId}-${memberId}`,
        tenantId: profile.tenantId,
        memberId,
        type: type ?? 'game',
        itemId: s.itemId,
        itemName: typeSuffixes[s.itemId] ?? `Item-${s.itemId}`,
        score: s.score,
        reason: s.reasons.join('；'),
        strategy: 'content-based',
        status: 'active' as const,
        expiresAt,
        createdAt: now
      }))

    // 协同过滤增强：找到相似用户也喜欢的物品
    const similarUserItems = this.getSimilarUserRecommendations(memberId, limit)
    results.push(...similarUserItems)

    // 去重并排序
    const seen = new Set<string>()
    return results
      .filter((r) => {
        if (seen.has(r.itemId)) return false
        seen.add(r.itemId)
        return true
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  /**
   * 协同过滤：找到相似用户也喜欢的物品
   */
  private getSimilarUserRecommendations(
    memberId: string,
    limit: number
  ): Recommendation[] {
    const myScores = this.itemScores.filter((s) => s.memberId === memberId)
    if (myScores.length === 0) return []

    const myItems = new Set(myScores.map((s) => s.itemId))

    // 找到与当前用户评分过相同物品的其他用户
    const otherUserScores = this.itemScores.filter(
      (s) => s.memberId !== memberId && myItems.has(s.itemId)
    )
    const otherMemberIds = new Set(otherUserScores.map((s) => s.memberId))

    // 收集这些用户评分过但我没评分过的物品
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const recommendations: Recommendation[] = []
    for (const otherId of otherMemberIds) {
      const otherScores = this.itemScores.filter(
        (s) => s.memberId === otherId && !myItems.has(s.itemId) && s.rating >= 4
      )
      for (const score of otherScores) {
        recommendations.push({
          id: `rec-cf-${score.itemId}-${memberId}`,
          tenantId: 'default',
          memberId,
          type: 'game',
          itemId: score.itemId,
          itemName: `Item-${score.itemId}`,
          score: score.rating * 15,
          reason: `协同过滤：相似用户也喜欢 (评分 ${score.rating})`,
          strategy: 'collaborative-filtering',
          status: 'active',
          expiresAt,
          createdAt: now
        })
      }
    }

    return recommendations.slice(0, limit)
  }

  private getItemGameType(itemId: string): string {
    const mapping: Record<string, string> = {
      'game-001': 'MOBA',
      'game-002': 'RPG',
      'game-003': 'MOBA',
      'game-004': 'FPS',
      'game-005': 'RPG',
      'game-006': 'ARPG',
      'game-007': 'Survival',
      'game-008': 'Party'
    }
    return mapping[itemId] ?? 'Unknown'
  }

  // ===== 推荐生成 =====

  /**
   * 按策略批量生成推荐
   */
  generateRecommendations(
    input: GenerateRecommendationsInput
  ): GenerateRecommendationsOutput {
    const start = Date.now()

    const strategy = this.strategies.get(input.strategyId)
    if (!strategy) {
      throw new Error(`策略不存在: ${input.strategyId}`)
    }

    if (!strategy.isEnabled) {
      throw new Error(`策略已禁用: ${strategy.name}`)
    }

    const targetType = input.type ?? strategy.targetType
    const maxResults = input.limit ?? strategy.config.maxResults ?? 10
    const minScore = strategy.config.minScore ?? 0

    let items: Recommendation[] = []
    let fallbackStrategy: string | undefined

    switch (strategy.name) {
      case 'popularity':
        items = this.getPopularRecommendations(input.storeId, targetType, maxResults)
        break

      case 'collaborative-filtering':
        if (!input.memberId) {
          items = this.getPopularRecommendations(input.storeId, targetType, maxResults)
        } else {
          items = this.getPersonalizedRecommendations(input.memberId, targetType, maxResults)
        }
        break

      case 'content-based':
        if (!input.memberId) {
          items = this.getPopularRecommendations(input.storeId, targetType, maxResults)
        } else {
          items = this.getPersonalizedRecommendations(input.memberId, targetType, maxResults)
        }
        break

      case 'hybrid':
        if (input.memberId) {
          // 混合：热门 + 个性化 各取一半
          const popular = this.getPopularRecommendations(
            input.storeId,
            targetType,
            Math.ceil(maxResults / 2)
          )
          const personalized = this.getPersonalizedRecommendations(
            input.memberId,
            targetType,
            Math.ceil(maxResults / 2)
          )
          const seen = new Set(popular.map((r) => r.itemId))
          const dedupedPersonalized = personalized.filter((r) => !seen.has(r.itemId))
          items = [...popular, ...dedupedPersonalized]
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults)
        } else {
          items = this.getPopularRecommendations(input.storeId, targetType, maxResults)
        }
        break

      default:
        items = this.getPopularRecommendations(input.storeId, targetType, maxResults)
    }

    // 按最低分数过滤
    const filtered = items.filter((r) => r.score >= minScore)

    // 兜底策略
    if (filtered.length === 0 && strategy.config.fallbackStrategy) {
      fallbackStrategy = strategy.config.fallbackStrategy
      const fallback = this.strategies.get(fallbackStrategy)
      if (fallback && fallback.isEnabled) {
        items = this.generateRecommendations({
          ...input,
          strategyId: fallbackStrategy,
          limit: maxResults
        }).items
      }
    } else {
      items = filtered
    }

    return {
      strategy: strategy.name,
      fallbackStrategy,
      items,
      executionTimeMs: Date.now() - start,
      timestamp: new Date().toISOString()
    }
  }

  // ===== 策略管理 =====

  createStrategy(dto: {
    name: string
    description: string
    targetType: RecommendType
    weights: StrategyWeightFactor[]
    fallbackStrategy?: string
    minScore?: number
    maxResults?: number
  }): RecommendationStrategy {
    const now = new Date().toISOString()
    const id = `strategy-${dto.name}-${Date.now()}`
    const strategy: RecommendationStrategy = {
      id,
      name: dto.name,
      description: dto.description,
      targetType: dto.targetType,
      config: {
        weights: dto.weights,
        fallbackStrategy: dto.fallbackStrategy,
        minScore: dto.minScore,
        maxResults: dto.maxResults
      },
      isEnabled: true,
      createdAt: now,
      updatedAt: now
    }
    this.strategies.set(id, strategy)
    return strategy
  }

  getStrategies(): RecommendationStrategy[] {
    return Array.from(this.strategies.values())
  }

  getStrategy(id: string): RecommendationStrategy | undefined {
    return this.strategies.get(id)
  }

  updateStrategy(
    id: string,
    dto: Partial<{
      name: string
      description: string
      targetType: RecommendType
      weights: StrategyWeightFactor[]
      fallbackStrategy?: string
      minScore?: number
      maxResults?: number
    }>
  ): RecommendationStrategy {
    const existing = this.strategies.get(id)
    if (!existing) {
      throw new Error(`策略不存在: ${id}`)
    }

    if (dto.name !== undefined) existing.name = dto.name
    if (dto.description !== undefined) existing.description = dto.description
    if (dto.targetType !== undefined) existing.targetType = dto.targetType
    if (dto.weights !== undefined) existing.config.weights = dto.weights
    if (dto.fallbackStrategy !== undefined) existing.config.fallbackStrategy = dto.fallbackStrategy
    if (dto.minScore !== undefined) existing.config.minScore = dto.minScore
    if (dto.maxResults !== undefined) existing.config.maxResults = dto.maxResults
    existing.updatedAt = new Date().toISOString()

    this.strategies.set(id, existing)
    return existing
  }

  enableStrategy(id: string): RecommendationStrategy {
    const strategy = this.strategies.get(id)
    if (!strategy) {
      throw new Error(`策略不存在: ${id}`)
    }
    strategy.isEnabled = true
    strategy.updatedAt = new Date().toISOString()
    return strategy
  }

  disableStrategy(id: string): RecommendationStrategy {
    const strategy = this.strategies.get(id)
    if (!strategy) {
      throw new Error(`策略不存在: ${id}`)
    }
    strategy.isEnabled = false
    strategy.updatedAt = new Date().toISOString()
    return strategy
  }

  // ===== 反馈收集 =====

  /**
   * 记录物品交互/评分
   */
  recordInteraction(dto: {
    memberId: string
    itemId: string
    itemType: 'game' | 'product' | 'activity'
    rating: number
    interaction: 'view' | 'click' | 'purchase' | 'play'
    weight: number
  }): ItemScore {
    const now = new Date().toISOString()
    const score: ItemScore = {
      id: `score-${dto.memberId}-${dto.itemId}-${Date.now()}`,
      memberId: dto.memberId,
      itemId: dto.itemId,
      itemType: dto.itemType,
      rating: dto.rating,
      interaction: dto.interaction,
      weight: dto.weight,
      createdAt: now
    }
    this.itemScores.push(score)

    // 同时更新物品交互计数
    const current = this.itemInteractionCounts.get(dto.itemId) ?? 0
    this.itemInteractionCounts.set(dto.itemId, current + 1)

    // 同时更新用户画像
    this.updateProfileFromInteraction(dto.memberId, dto)

    return score
  }

  /**
   * 记录推荐转化
   */
  recordConversion(recommendationId: string): Recommendation | undefined {
    const rec = this.recommendations.find((r) => r.id === recommendationId)
    if (!rec) return undefined

    // 仅 active 状态可转化
    if (rec.status !== 'active') return rec

    rec.status = 'converted'
    return rec
  }

  // ===== 画像管理 =====

  /**
   * 从交互自动更新用户画像
   */
  private updateProfileFromInteraction(
    memberId: string,
    interaction: { itemId: string; itemType: string; rating: number; interaction: string }
  ): void {
    let profile = this.profiles.get(memberId)
    const now = new Date().toISOString()

    if (!profile) {
      // 新建画像
      profile = {
        id: `profile-${memberId}`,
        memberId,
        tenantId: 'default',
        preferences: {
          gameTypes: [],
          priceRange: { min: 0, max: 500 },
          visitFrequency: 'occasional',
          avgSpend: 0,
          favoriteTimeSlot: '18:00-22:00'
        },
        behaviorTags: [],
        lastUpdated: now
      }
    }

    // 根据互动更新偏好
    if (interaction.interaction === 'play' || interaction.interaction === 'purchase') {
      const gameType = this.getItemGameType(interaction.itemId)
      if (gameType !== 'Unknown' && !profile.preferences.gameTypes.includes(gameType)) {
        profile.preferences.gameTypes.push(gameType)
      }
    }

    if (interaction.interaction === 'purchase') {
      profile.preferences.avgSpend =
        (profile.preferences.avgSpend + interaction.rating * 20) / 2
    }

    if (interaction.rating >= 4) {
      if (!profile.behaviorTags.includes('game-enthusiast')) {
        profile.behaviorTags.push('game-enthusiast')
      }
    }

    profile.lastUpdated = now
    this.profiles.set(memberId, profile)
  }

  /**
   * 更新用户画像
   */
  updateProfile(
    memberId: string,
    dto: {
      preferences?: {
        gameTypes?: string[]
        priceRange?: { min: number; max: number }
        visitFrequency?: 'daily' | 'weekly' | 'monthly' | 'occasional'
        avgSpend?: number
        favoriteTimeSlot?: string
      }
      behaviorTags?: string[]
    }
  ): UserProfile {
    let profile = this.profiles.get(memberId)
    const now = new Date().toISOString()

    if (!profile) {
      profile = {
        id: `profile-${memberId}`,
        memberId,
        tenantId: 'default',
        preferences: {
          gameTypes: [],
          priceRange: { min: 0, max: 500 },
          visitFrequency: 'occasional',
          avgSpend: 0,
          favoriteTimeSlot: '18:00-22:00'
        },
        behaviorTags: [],
        lastUpdated: now
      }
    }

    if (dto.preferences) {
      if (dto.preferences.gameTypes) profile.preferences.gameTypes = dto.preferences.gameTypes
      if (dto.preferences.priceRange) profile.preferences.priceRange = dto.preferences.priceRange
      if (dto.preferences.visitFrequency) profile.preferences.visitFrequency = dto.preferences.visitFrequency
      if (dto.preferences.avgSpend !== undefined) profile.preferences.avgSpend = dto.preferences.avgSpend
      if (dto.preferences.favoriteTimeSlot) profile.preferences.favoriteTimeSlot = dto.preferences.favoriteTimeSlot
    }
    if (dto.behaviorTags) profile.behaviorTags = dto.behaviorTags

    profile.lastUpdated = now
    this.profiles.set(memberId, profile)

    return profile
  }

  getProfile(memberId: string): UserProfile | undefined {
    return this.profiles.get(memberId)
  }

  // ===== 推荐历史查询 =====

  getRecommendations(query: {
    storeId?: string
    memberId?: string
    type?: RecommendType
    limit?: number
  }): Recommendation[] {
    let results = Array.from(this.recommendations)

    if (query.storeId) {
      results = results.filter((r) => r.storeId === query.storeId)
    }
    if (query.memberId) {
      results = results.filter((r) => r.memberId === query.memberId)
    }
    if (query.type) {
      results = results.filter((r) => r.type === query.type)
    }

    return results
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, query.limit ?? 20)
  }
}

// ===== P2-15 协同过滤推荐服务 =====

interface UserPreference {
  memberId: string
  itemId: string
  rating: number
  weight: number
  timestamp: string
}

interface SimilarityResult {
  targetId: string
  similarity: number
}

interface RecommendationItem {
  itemId: string
  score: number
  reason: string
}

@Injectable()
export class CollaborativeFilteringService {
  // 内存存储：用户-物品评分矩阵
  private preferences: Map<string, UserPreference[]> = new Map()
  // 物品-用户倒排索引
  private itemUsers: Map<string, Set<string>> = new Map()
  // 物品相似度缓存
  private itemSimilarityCache: Map<string, Map<string, number>> = new Map()

  constructor() {
    this.seedMockData()
  }

  private seedMockData(): void {
    const now = new Date().toISOString()
    // 模拟用户评分数据
    const mockData: UserPreference[] = [
      { memberId: 'user-A', itemId: 'item-1', rating: 5, weight: 1.0, timestamp: now },
      { memberId: 'user-A', itemId: 'item-2', rating: 4, weight: 1.0, timestamp: now },
      { memberId: 'user-A', itemId: 'item-3', rating: 3, weight: 1.0, timestamp: now },
      { memberId: 'user-B', itemId: 'item-1', rating: 4, weight: 1.0, timestamp: now },
      { memberId: 'user-B', itemId: 'item-2', rating: 5, weight: 1.0, timestamp: now },
      { memberId: 'user-B', itemId: 'item-4', rating: 4, weight: 1.0, timestamp: now },
      { memberId: 'user-C', itemId: 'item-2', rating: 3, weight: 1.0, timestamp: now },
      { memberId: 'user-C', itemId: 'item-3', rating: 5, weight: 1.0, timestamp: now },
      { memberId: 'user-C', itemId: 'item-5', rating: 4, weight: 1.0, timestamp: now },
      { memberId: 'user-D', itemId: 'item-1', rating: 2, weight: 1.0, timestamp: now },
      { memberId: 'user-D', itemId: 'item-3', rating: 4, weight: 1.0, timestamp: now },
      { memberId: 'user-D', itemId: 'item-5', rating: 3, weight: 1.0, timestamp: now }
    ]

    for (const pref of mockData) {
      this.updatePreference(pref.memberId, pref.itemId, pref.rating)
    }
  }

  /**
   * 找相似用户（基于共同评分物品的余弦相似度）
   */
  findSimilarUsers(memberId: string, limit: number = 10): SimilarityResult[] {
    const targetPrefs = this.preferences.get(memberId)
    if (!targetPrefs || targetPrefs.length === 0) return []

    const targetItems = new Set(targetPrefs.map((p) => p.itemId))
    const allUsers = new Set<string>()

    for (const itemId of targetItems) {
      const users = this.itemUsers.get(itemId)
      if (users) {
        for (const uid of users) {
          if (uid !== memberId) allUsers.add(uid)
        }
      }
    }

    const similarities: SimilarityResult[] = []
    for (const otherId of allUsers) {
      const otherPrefs = this.preferences.get(otherId)
      if (!otherPrefs) continue

      const similarity = this.calculateCosineSimilarity(targetPrefs, otherPrefs, targetItems)
      if (similarity > 0) {
        similarities.push({ targetId: otherId, similarity })
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit)
  }

  /**
   * 找相似物品（基于共同评分用户的余弦相似度）
   */
  findSimilarItems(itemId: string, limit: number = 10): SimilarityResult[] {
    const itemUsersSet = this.itemUsers.get(itemId)
    if (!itemUsersSet || itemUsersSet.size === 0) return []

    const allItems = new Set<string>()
    for (const userId of itemUsersSet) {
      const prefs = this.preferences.get(userId)
      if (prefs) {
        for (const p of prefs) {
          if (p.itemId !== itemId) allItems.add(p.itemId)
        }
      }
    }

    const similarities: SimilarityResult[] = []
    for (const otherItemId of allItems) {
      const similarity = this.calculateItemSimilarity(itemId, otherItemId)
      if (similarity > 0) {
        similarities.push({ targetId: otherItemId, similarity })
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit)
  }

  /**
   * 基于用户的推荐：为用户推荐相似用户喜欢的物品
   */
  recommendForUser(memberId: string, limit: number = 10): RecommendationItem[] {
    const similarUsers = this.findSimilarUsers(memberId, 5)
    if (similarUsers.length === 0) return []

    const targetPrefs = this.preferences.get(memberId)
    const targetItems = new Set(targetPrefs?.map((p) => p.itemId) ?? [])

    const scores: Map<string, { score: number; reasons: string[] }> = new Map()

    for (const { targetId: similarId, similarity } of similarUsers) {
      const similarPrefs = this.preferences.get(similarId)
      if (!similarPrefs) continue

      for (const pref of similarPrefs) {
        if (targetItems.has(pref.itemId)) continue // 排除已评分物品

        const existing = scores.get(pref.itemId)
        const reason = `相似用户 ${similarId} 评分 ${pref.rating}`
        if (existing) {
          existing.score += similarity * pref.rating
          existing.reasons.push(reason)
        } else {
          scores.set(pref.itemId, {
            score: similarity * pref.rating,
            reasons: [reason]
          })
        }
      }
    }

    const results: RecommendationItem[] = []
    for (const [itemId, data] of scores.entries()) {
      results.push({
        itemId,
        score: Math.round(data.score * 100) / 100,
        reason: data.reasons.join('; ')
      })
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  /**
   * 基于物品的推荐：基于相似物品进行推荐
   */
  recommendForItem(itemId: string, limit: number = 10): RecommendationItem[] {
    const similarItems = this.findSimilarItems(itemId, limit)
    const targetPrefs = this.preferences.get(itemId)
    const targetUsersSet = new Set(targetPrefs?.map((p) => p.memberId) ?? [])

    const scores: Map<string, { score: number; reasons: string[] }> = new Map()

    for (const { targetId: similarItemId, similarity } of similarItems) {
      const similarPrefs = this.preferences.get(similarItemId)
      if (!similarPrefs) continue

      for (const pref of similarPrefs) {
        if (targetUsersSet.has(pref.memberId)) continue

        const existing = scores.get(similarItemId)
        const reason = `与 ${itemId} 相似度 ${Math.round(similarity * 100)}%`
        if (existing) {
          existing.score += similarity * pref.rating
          existing.reasons.push(reason)
        } else {
          scores.set(similarItemId, {
            score: similarity * pref.rating,
            reasons: [reason]
          })
        }
      }
    }

    const results: RecommendationItem[] = []
    for (const [itemIdResult, data] of scores.entries()) {
      results.push({
        itemId: itemIdResult,
        score: Math.round(data.score * 100) / 100,
        reason: data.reasons[0] ?? ''
      })
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  /**
   * 更新用户偏好
   */
  updatePreference(memberId: string, itemId: string, rating: number): void {
    const prefs = this.preferences.get(memberId) ?? []
    const existingIndex = prefs.findIndex((p) => p.itemId === itemId)

    if (existingIndex >= 0) {
      prefs[existingIndex].rating = rating
      prefs[existingIndex].timestamp = new Date().toISOString()
    } else {
      prefs.push({
        memberId,
        itemId,
        rating,
        weight: 1.0,
        timestamp: new Date().toISOString()
      })
    }

    this.preferences.set(memberId, prefs)

    // 更新物品-用户倒排索引
    let users = this.itemUsers.get(itemId)
    if (!users) {
      users = new Set()
      this.itemUsers.set(itemId, users)
    }
    users.add(memberId)

    // 清除物品相似度缓存
    this.itemSimilarityCache.delete(itemId)
  }

  private calculateCosineSimilarity(
    prefsA: UserPreference[],
    prefsB: UserPreference[],
    commonItems: Set<string>
  ): number {
    if (commonItems.size === 0) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (const itemId of commonItems) {
      const ratingA = prefsA.find((p) => p.itemId === itemId)?.rating ?? 0
      const ratingB = prefsB.find((p) => p.itemId === itemId)?.rating ?? 0

      dotProduct += ratingA * ratingB
      normA += ratingA * ratingA
      normB += ratingB * ratingB
    }

    if (normA === 0 || normB === 0) return 0
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  private calculateItemSimilarity(itemA: string, itemB: string): number {
    // 检查缓存
    const cacheA = this.itemSimilarityCache.get(itemA)
    if (cacheA?.has(itemB)) {
      return cacheA.get(itemB)!
    }

    const usersA = this.itemUsers.get(itemA)
    const usersB = this.itemUsers.get(itemB)
    if (!usersA || !usersB) return 0

    const commonUsers = new Set([...usersA].filter((u) => usersB.has(u)))
    if (commonUsers.size === 0) return 0

    const prefsA: number[] = []
    const prefsB: number[] = []
    for (const userId of commonUsers) {
      const userPrefs = this.preferences.get(userId)
      if (userPrefs) {
        const pa = userPrefs.find((p) => p.itemId === itemA)
        const pb = userPrefs.find((p) => p.itemId === itemB)
        if (pa && pb) {
          prefsA.push(pa.rating)
          prefsB.push(pb.rating)
        }
      }
    }

    const similarity = this.calculateCosineSimilarityFromArrays(prefsA, prefsB)

    // 写入缓存
    if (!this.itemSimilarityCache.has(itemA)) {
      this.itemSimilarityCache.set(itemA, new Map())
    }
    this.itemSimilarityCache.get(itemA)!.set(itemB, similarity)

    return similarity
  }

  private calculateCosineSimilarityFromArrays(ratingsA: number[], ratingsB: number[]): number {
    if (ratingsA.length === 0 || ratingsB.length === 0 || ratingsA.length !== ratingsB.length) {
      return 0
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < ratingsA.length; i++) {
      dotProduct += ratingsA[i] * ratingsB[i]
      normA += ratingsA[i] * ratingsA[i]
      normB += ratingsB[i] * ratingsB[i]
    }

    if (normA === 0 || normB === 0) return 0
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
}

// ===== 用户画像服务 =====

type LifeCycleStage = 'new' | 'active' | 'dormant' | '流失'
type UserValueLevel = 'low' | 'medium' | 'high' | 'vip'

interface UserProfileTag {
  tag: string
  source: 'behavior' | 'preference' | 'value' | 'lifecycle'
  confidence: number
}

interface SegmentCriteria {
  lifecycleStages?: LifeCycleStage[]
  valueLevels?: UserValueLevel[]
  behaviorTags?: string[]
  minAvgSpend?: number
  maxAvgSpend?: number
}

interface EnrichedUserProfile {
  memberId: string
  behaviorTags: UserProfileTag[]
  preferenceTags: UserProfileTag[]
  valueTags: UserProfileTag[]
  lifecycleStage: LifeCycleStage
  valueLevel: UserValueLevel
  avgSpend: number
  totalOrders: number
  lastActiveDays: number
  registerDays: number
}

@Injectable()
export class UserProfileService {
  // 用户画像存储
  private profiles: Map<string, EnrichedUserProfile> = new Map()
  // 用户行为事件
  private events: Map<string, Array<{ type: string; timestamp: string; data?: Record<string, unknown> }>> = new Map()

  constructor() {
    this.seedMockProfiles()
  }

  private seedMockProfiles(): void {
    const now = new Date()
    this.profiles.set('profile-user-1', {
      memberId: 'profile-user-1',
      behaviorTags: [
        { tag: '高频访问', source: 'behavior', confidence: 0.95 },
        { tag: '夜猫子', source: 'behavior', confidence: 0.88 },
        { tag: '游戏爱好者', source: 'behavior', confidence: 0.92 }
      ],
      preferenceTags: [
        { tag: 'MOBA游戏', source: 'preference', confidence: 0.90 },
        { tag: '高消费', source: 'preference', confidence: 0.85 }
      ],
      valueTags: [
        { tag: '高价值用户', source: 'value', confidence: 0.95 },
        { tag: '高客单价', source: 'value', confidence: 0.88 }
      ],
      lifecycleStage: 'active',
      valueLevel: 'vip',
      avgSpend: 580,
      totalOrders: 45,
      lastActiveDays: 1,
      registerDays: 180
    })

    this.profiles.set('profile-user-2', {
      memberId: 'profile-user-2',
      behaviorTags: [
        { tag: '周末活跃', source: 'behavior', confidence: 0.82 }
      ],
      preferenceTags: [
        { tag: '休闲游戏', source: 'preference', confidence: 0.75 },
        { tag: '中等消费', source: 'preference', confidence: 0.80 }
      ],
      valueTags: [
        { tag: '中等价值', source: 'value', confidence: 0.85 }
      ],
      lifecycleStage: 'active',
      valueLevel: 'medium',
      avgSpend: 150,
      totalOrders: 12,
      lastActiveDays: 3,
      registerDays: 90
    })

    this.profiles.set('profile-user-3', {
      memberId: 'profile-user-3',
      behaviorTags: [
        { tag: '低频访问', source: 'behavior', confidence: 0.90 }
      ],
      preferenceTags: [
        { tag: '低消费', source: 'preference', confidence: 0.85 }
      ],
      valueTags: [
        { tag: '低价值用户', source: 'value', confidence: 0.88 }
      ],
      lifecycleStage: 'dormant',
      valueLevel: 'low',
      avgSpend: 30,
      totalOrders: 2,
      lastActiveDays: 45,
      registerDays: 120
    })
  }

  /**
   * 构建用户画像（行为/偏好/价值/生命周期四个维度）
   */
  buildProfile(memberId: string): EnrichedUserProfile {
    const existing = this.profiles.get(memberId)
    if (existing) return existing

    const events = this.events.get(memberId) ?? []
    const now = new Date()

    // 计算行为标签
    const behaviorTags = this.extractBehaviorTags(events)
    // 计算偏好标签
    const preferenceTags = this.extractPreferenceTags(events)
    // 计算价值标签
    const valueTags = this.extractValueTags(events)
    // 判断生命周期阶段
    const lifecycleStage = this.determineLifecycleStage(events, now)
    // 判断用户价值等级
    const valueLevel = this.determineValueLevel(events)

    const profile: EnrichedUserProfile = {
      memberId,
      behaviorTags,
      preferenceTags,
      valueTags,
      lifecycleStage,
      valueLevel,
      avgSpend: this.calculateAvgSpend(events),
      totalOrders: events.filter((e) => e.type === 'purchase').length,
      lastActiveDays: this.calculateLastActiveDays(events, now),
      registerDays: 0
    }

    this.profiles.set(memberId, profile)
    return profile
  }

  /**
   * 增量更新画像
   */
  updateProfile(memberId: string, events: Array<{ type: string; timestamp: string; data?: Record<string, unknown> }>): EnrichedUserProfile {
    const existingEvents = this.events.get(memberId) ?? []
    this.events.set(memberId, [...existingEvents, ...events])

    return this.buildProfile(memberId)
  }

  /**
   * 获取用户标签
   */
  getProfileTags(memberId: string): UserProfileTag[] {
    const profile = this.profiles.get(memberId)
    if (!profile) {
      // 尝试从事件构建
      const built = this.buildProfile(memberId)
      return [...built.behaviorTags, ...built.preferenceTags, ...built.valueTags]
    }

    return [
      ...profile.behaviorTags,
      ...profile.preferenceTags,
      ...profile.valueTags
    ]
  }

  /**
   * 匹配目标人群
   */
  matchAudience(criteria: SegmentCriteria): string[] {
    const results: Array<{ memberId: string; matchScore: number }> = []

    for (const [memberId, profile] of this.profiles.entries()) {
      let matchScore = 0
      let isMatch = true

      // 生命周期阶段匹配
      if (criteria.lifecycleStages && criteria.lifecycleStages.length > 0) {
        if (!criteria.lifecycleStages.includes(profile.lifecycleStage)) {
          isMatch = false
        } else {
          matchScore += 25
        }
      }

      // 价值等级匹配
      if (criteria.valueLevels && criteria.valueLevels.length > 0) {
        if (!criteria.valueLevels.includes(profile.valueLevel)) {
          isMatch = false
        } else {
          matchScore += 25
        }
      }

      // 行为标签匹配
      if (criteria.behaviorTags && criteria.behaviorTags.length > 0) {
        const profileTags = profile.behaviorTags.map((t) => t.tag)
        const hasAllTags = criteria.behaviorTags.every((t) => profileTags.includes(t))
        if (!hasAllTags) {
          isMatch = false
        } else {
          matchScore += 25
        }
      }

      // 消费区间匹配
      if (criteria.minAvgSpend !== undefined && profile.avgSpend < criteria.minAvgSpend) {
        isMatch = false
      }
      if (criteria.maxAvgSpend !== undefined && profile.avgSpend > criteria.maxAvgSpend) {
        isMatch = false
      }
      if (isMatch && (criteria.minAvgSpend !== undefined || criteria.maxAvgSpend !== undefined)) {
        matchScore += 25
      }

      if (isMatch) {
        results.push({ memberId, matchScore })
      }
    }

    return results.sort((a, b) => b.matchScore - a.matchScore).map((r) => r.memberId)
  }

  private extractBehaviorTags(events: Array<{ type: string; timestamp: string }>): UserProfileTag[] {
    const tags: UserProfileTag[] = []
    const now = new Date()

    if (events.length === 0) return tags

    // 分析访问频率
    const dayCounts = new Map<string, number>()
    for (const event of events) {
      const date = event.timestamp.split('T')[0]
      dayCounts.set(date, (dayCounts.get(date) ?? 0) + 1)
    }

    const avgDailyVisits = events.length / (dayCounts.size || 1)
    if (avgDailyVisits > 2) {
      tags.push({ tag: '高频访问', source: 'behavior', confidence: Math.min(0.95, avgDailyVisits * 0.4) })
    } else if (avgDailyVisits < 0.3) {
      tags.push({ tag: '低频访问', source: 'behavior', confidence: 0.9 })
    }

    // 分析时间段
    const hourCounts = new Map<number, number>()
    for (const event of events) {
      const hour = new Date(event.timestamp).getHours()
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1)
    }

    let peakHour = 0
    let maxCount = 0
    for (const [hour, count] of hourCounts.entries()) {
      if (count > maxCount) {
        maxCount = count
        peakHour = hour
      }
    }

    if (peakHour >= 22 || peakHour <= 5) {
      tags.push({ tag: '夜猫子', source: 'behavior', confidence: 0.85 })
    } else if (peakHour >= 9 && peakHour <= 12) {
      tags.push({ tag: '早起的鸟儿', source: 'behavior', confidence: 0.80 })
    }

    return tags
  }

  private extractPreferenceTags(events: Array<{ type: string; data?: Record<string, unknown> }>): UserProfileTag[] {
    const tags: UserProfileTag[] = []

    for (const event of events) {
      if (event.type === 'view' && event.data?.['category']) {
        const category = event.data['category'] as string
        if (category === 'game_moba') {
          tags.push({ tag: 'MOBA游戏', source: 'preference', confidence: 0.75 })
        } else if (category === 'game_rpg') {
          tags.push({ tag: 'RPG游戏', source: 'preference', confidence: 0.75 })
        }
      }
    }

    return tags
  }

  private extractValueTags(events: Array<{ type: string; data?: Record<string, unknown> }>): UserProfileTag[] {
    const tags: UserProfileTag[] = []
    const purchases = events.filter((e) => e.type === 'purchase')

    if (purchases.length > 20) {
      tags.push({ tag: '高价值用户', source: 'value', confidence: 0.92 })
    } else if (purchases.length > 5) {
      tags.push({ tag: '中等价值', source: 'value', confidence: 0.85 })
    } else if (purchases.length > 0) {
      tags.push({ tag: '低价值用户', source: 'value', confidence: 0.80 })
    }

    return tags
  }

  private determineLifecycleStage(
    events: Array<{ type: string; timestamp: string }>,
    now: Date
  ): LifeCycleStage {
    if (events.length === 0) return 'new'

    const lastActive = this.calculateLastActiveDays(events, now)

    if (lastActive <= 7) return 'active'
    if (lastActive <= 30) return 'dormant'
    return '流失'
  }

  private determineValueLevel(events: Array<{ type: string; data?: Record<string, unknown> }>): UserValueLevel {
    const purchases = events.filter((e) => e.type === 'purchase')
    const avgSpend = this.calculateAvgSpend(events)

    if (purchases.length > 30 || avgSpend > 500) return 'vip'
    if (purchases.length > 10 || avgSpend > 200) return 'high'
    if (purchases.length > 3 || avgSpend > 50) return 'medium'
    return 'low'
  }

  private calculateAvgSpend(events: Array<{ type: string; data?: Record<string, unknown> }>): number {
    const purchases = events.filter((e) => e.type === 'purchase' && e.data?.['amount'])
    if (purchases.length === 0) return 0

    const total = purchases.reduce((sum, e) => sum + ((e.data?.['amount'] as number) ?? 0), 0)
    return Math.round(total / purchases.length)
  }

  private calculateLastActiveDays(
    events: Array<{ type: string; timestamp: string }>,
    now: Date
  ): number {
    if (events.length === 0) return 999

    const sorted = [...events].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    const lastEvent = sorted[0]
    const lastTime = new Date(lastEvent.timestamp).getTime()
    return Math.floor((now.getTime() - lastTime) / (1000 * 60 * 60 * 24))
  }
}
