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
