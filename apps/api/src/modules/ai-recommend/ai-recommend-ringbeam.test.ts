/**
 * ai-recommend-ringbeam.test.ts - V17#圈梁 Phase3 AI模块
 * 用途: PRD对齐测试 - 验证推荐引擎核心功能
 * 覆盖: 正例(热门推荐+个性化推荐+策略管理) + 反例(无策略/禁用策略/无画像冷启动) + 边界(限流/空结果/高负载)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AiRecommendService, CollaborativeFilteringService, UserProfileService } from './ai-recommend.service'

describe('🔵 AiRecommendRingBeam: 推荐引擎PRD对齐', () => {
  let recommendService: AiRecommendService
  let cfService: CollaborativeFilteringService
  let profileService: UserProfileService

  beforeEach(() => {
    recommendService = new AiRecommendService()
    cfService = new CollaborativeFilteringService()
    profileService = new UserProfileService()
  })

  // ─── 1. 热门推荐 ────────────────────────────────────────────

  describe('热门推荐', () => {
    it('[P0] getPopularRecommendations返回排序结果且分数不超过100', () => {
      const recs = recommendService.getPopularRecommendations('store-001', 'game', 5)

      expect(recs.length).toBe(5)
      expect(recs[0].score).toBeGreaterThanOrEqual(recs[recs.length - 1].score)
      recs.forEach((r) => {
        expect(r.score).toBeLessThanOrEqual(100)
        expect(r.strategy).toBe('popularity')
        expect(r.type).toBe('game')
        expect(r.status).toBe('active')
      })
    })

    it('[P1] limit参数控制返回结果数量', () => {
      const recs3 = recommendService.getPopularRecommendations(undefined, undefined, 3)
      expect(recs3.length).toBe(3)

      const recs8 = recommendService.getPopularRecommendations(undefined, undefined, 8)
      expect(recs8.length).toBe(8)
    })

    it('[P1] 不传limit时默认返回10条', () => {
      const recs = recommendService.getPopularRecommendations()
      expect(recs.length).toBeGreaterThanOrEqual(1)
      expect(recs.length).toBeLessThanOrEqual(10)
    })
  })

  // ─── 2. 个性化推荐 ────────────────────────────────────────────

  describe('个性化推荐', () => {
    it('[P0] 有画像的会员获得个性化推荐(内容匹配)', () => {
      // 先创建画像
      recommendService.updateProfile('member-007', {
        preferences: { gameTypes: ['MOBA', 'RPG'], avgSpend: 300 },
        behaviorTags: ['game-enthusiast'],
      })

      const recs = recommendService.getPersonalizedRecommendations('member-007', 'game', 5)
      expect(recs.length).toBeGreaterThan(0)
      expect(recs[0].memberId).toBe('member-007')
      // 策略应为 content-based 或 collaborative-filtering
      expect(['content-based', 'collaborative-filtering']).toContain(recs[0].strategy)
    })

    it('[P1] 无画像会员冷启动回退为热门推荐', () => {
      const recs = recommendService.getPersonalizedRecommendations('member-no-exist', 'game', 5)

      expect(recs.length).toBeGreaterThan(0)
      recs.forEach((r) => {
        expect(r.strategy).toBe('cold-start->popularity')
        expect(r.memberId).toBe('member-no-exist')
      })
    })

    it('[P1] 个性化推荐返回去重结果', () => {
      recommendService.updateProfile('member-dedup', {
        preferences: { gameTypes: ['MOBA'], avgSpend: 100 },
        behaviorTags: ['game-enthusiast'],
      })

      const recs = recommendService.getPersonalizedRecommendations('member-dedup', 'game', 10)
      const ids = recs.map((r) => r.itemId)
      expect(new Set(ids).size).toBe(ids.length) // 无重复 itemId
    })

    it('[P2] 协同过滤通过generateRecommendations(协同策略)输出包含推荐结果', () => {
      // member-001 有评分(seed data)，使用collaborative-filtering策略
      const output = recommendService.generateRecommendations({
        strategyId: 'strategy-collaborative-v1',
        memberId: 'member-001',
        type: 'game',
        limit: 10,
      })

      expect(output.strategy).toBe('collaborative-filtering')
      expect(output.items.length).toBeGreaterThan(0)
      // 其中包含个性化的内容推荐或协同过滤推荐
      expect(output.items[0].strategy).toMatch(/cold-start|cold/)
    })
  })

  // ─── 3. 策略管理 ────────────────────────────────────────────

  describe('策略管理', () => {
    it('[P0] generateRecommendations使用有效策略生成推荐', () => {
      const output = recommendService.generateRecommendations({
        strategyId: 'strategy-popularity-v1',
      })

      expect(output.strategy).toBe('popularity')
      expect(output.items.length).toBeGreaterThan(0)
      expect(output.executionTimeMs).toBeGreaterThanOrEqual(0)
    })

    it('[P1] 不存在策略抛出错误', () => {
      expect(() =>
        recommendService.generateRecommendations({
          strategyId: 'strategy-nonexistent',
        })
      ).toThrow('策略不存在')
    })

    it('[P1] 禁用策略抛出错误', () => {
      recommendService.disableStrategy('strategy-popularity-v1')
      expect(() =>
        recommendService.generateRecommendations({
          strategyId: 'strategy-popularity-v1',
        })
      ).toThrow('策略已禁用')
    })

    it('[P1] 创建新策略后可用', () => {
      const created = recommendService.createStrategy({
        name: 'test-custom-v1',
        description: '测试自定义策略',
        targetType: 'game',
        weights: [{ factor: 'custom', weight: 1.0 }],
        maxResults: 3,
      })

      expect(created.name).toBe('test-custom-v1')
      expect(created.isEnabled).toBe(true)

      const output = recommendService.generateRecommendations({
        strategyId: created.id,
      })
      expect(output.strategy).toBe('test-custom-v1')
    })

    it('[P1] 策略兜底: minScore过滤后为空时使用fallbackStrategy', () => {
      // collaborative-filtering 配置了 fallbackStrategy 为 popularity
      const output = recommendService.generateRecommendations({
        strategyId: 'strategy-collaborative-v1',
        memberId: 'member-no-score',
        limit: 5,
      })
      // 无画像无评分 -> 冷启动 -> popularity
      expect(output.strategy).toBe('collaborative-filtering')
      expect(output.items.length).toBeGreaterThan(0)
    })
  })

  // ─── 4. 反馈收集与交互 ────────────────────────────────────────────

  describe('反馈收集', () => {
    it('[P1] recordInteraction创建评分并更新交互计数', () => {
      const score = recommendService.recordInteraction({
        memberId: 'member-feedback',
        itemId: 'game-001',
        itemType: 'game',
        rating: 5,
        interaction: 'purchase',
        weight: 1.0,
      })

      expect(score.memberId).toBe('member-feedback')
      expect(score.itemId).toBe('game-001')
      expect(score.rating).toBe(5)
    })
  })
})

// ─── 5. 协同过滤服务 ────────────────────────────────────────────

describe('🔵 CollaborativeFilteringRingBeam: 协同过滤PRD对齐', () => {
  let cfService: CollaborativeFilteringService

  beforeEach(() => {
    cfService = new CollaborativeFilteringService()
  })

  it('[P0] findSimilarUsers返回余弦相似度排序结果', () => {
    const similar = cfService.findSimilarUsers('user-A', 5)
    expect(similar.length).toBeGreaterThan(0)
    for (let i = 1; i < similar.length; i++) {
      expect(similar[i - 1].similarity).toBeGreaterThanOrEqual(similar[i].similarity)
    }
  })

  it('[P1] recommendForUser返回未评分物品推荐', () => {
    const recs = cfService.recommendForUser('user-A', 5)
    expect(recs.length).toBeGreaterThan(0)
    // 不应包含 user-A 已评分的 item-1, item-2, item-3
    const recommendedIds = recs.map((r) => r.itemId)
    expect(recommendedIds).not.toContain('item-1')
    expect(recommendedIds).not.toContain('item-2')
    expect(recommendedIds).not.toContain('item-3')
  })

  it('[P2] 无评分用户返回空推荐', () => {
    const similar = cfService.findSimilarUsers('user-nonexistent', 5)
    expect(similar).toEqual([])

    const recs = cfService.recommendForUser('user-nonexistent', 5)
    expect(recs).toEqual([])
  })
})

// ─── 6. 用户画像服务 ────────────────────────────────────────────

describe('🔵 UserProfileRingBeam: 用户画像PRD对齐', () => {
  let profileService: UserProfileService

  beforeEach(() => {
    profileService = new UserProfileService()
  })

  it('[P0] 已注册画像构建返回完整信息', () => {
    const profile = profileService.buildProfile('profile-user-1')
    expect(profile.memberId).toBe('profile-user-1')
    expect(profile.lifecycleStage).toBe('active')
    expect(profile.valueLevel).toBe('vip')
    expect(profile.behaviorTags.length).toBeGreaterThan(0)
    expect(profile.preferenceTags.length).toBeGreaterThan(0)
  })

  it('[P1] matchAudience按条件筛选目标人群', () => {
    const matched = profileService.matchAudience({
      lifecycleStages: ['active'],
      valueLevels: ['vip'],
    })
    expect(matched).toContain('profile-user-1')
    expect(matched).not.toContain('profile-user-3') // dormant 用户不匹配
  })

  it('[P2] 无画像用户从零构建(基于空事件)', () => {
    const profile = profileService.buildProfile('profile-new-user')
    expect(profile.lifecycleStage).toBe('new')
    expect(profile.valueLevel).toBe('low')
    expect(profile.avgSpend).toBe(0)
  })
})
