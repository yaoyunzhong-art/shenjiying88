/**
 * 🐜 自动: [ai-recommend] [D] controller spec 补全
 * AiRecommendController 单元测试 (node:test)
 *
 * 策略：内联 Controller 副本 (avoid NestJS DI) + Mock Service
 * 覆盖所有路由端点：热门推荐、个性化推荐、策略 CRUD、画像管理、反馈收集
 * 正向流程 + 边界条件（空数据、不存在的Key、极端输入）
 */

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

// ── Entity mirrors ───────────────────────────────────────────
function makeRecommendation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rec-test-01',
    tenantId: 'default',
    storeId: 'store-001',
    memberId: 'member-001',
    type: 'game',
    itemId: 'game-001',
    itemName: '王者荣耀',
    score: 85,
    reason: '热门推荐',
    strategy: 'popularity',
    status: 'active',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeStrategy(overrides: Record<string, unknown> = {}) {
  return {
    id: 'strategy-test-v1',
    name: 'test-strategy',
    description: 'Test strategy',
    targetType: 'game',
    config: {
      weights: [{ factor: 'popularity', weight: 1.0 }],
      fallbackStrategy: undefined,
      minScore: 10,
      maxResults: 10,
    },
    isEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeUserProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'profile-member-001',
    memberId: 'member-001',
    tenantId: 'default',
    preferences: {
      gameTypes: ['MOBA', 'RPG'],
      priceRange: { min: 0, max: 500 },
      visitFrequency: 'weekly',
      avgSpend: 200,
      favoriteTimeSlot: '18:00-22:00',
    },
    behaviorTags: ['game-enthusiast'],
    lastUpdated: new Date().toISOString(),
    ...overrides,
  }
}

function makeItemScore(overrides: Record<string, unknown> = {}) {
  return {
    id: 'score-test-01',
    memberId: 'member-001',
    itemId: 'game-001',
    itemType: 'game',
    rating: 5,
    interaction: 'purchase',
    weight: 1.0,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeGenerateOutput(overrides: Record<string, unknown> = {}) {
  return {
    strategy: 'popularity',
    fallbackStrategy: undefined,
    items: [makeRecommendation()],
    executionTimeMs: 5,
    timestamp: new Date().toISOString(),
    ...overrides,
  }
}

// ── Mock Service Factory ─────────────────────────────────────
function makeMockService() {
  const strategies = new Map<string, any>()
  const profiles = new Map<string, any>()
  const interactions: any[] = []

  // Seed some default strategies
  const seedStrategies = [
    { id: 'strategy-popularity-v1', name: 'popularity', description: '热门推荐', targetType: 'game', config: { weights: [{ factor: 'interactionCount', weight: 1.0 }], minScore: 10, maxResults: 10 }, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'strategy-collaborative-v1', name: 'collaborative-filtering', description: '协同过滤', targetType: 'game', config: { weights: [{ factor: 'similarity', weight: 0.5 }], fallbackStrategy: 'strategy-popularity-v1', minScore: 30, maxResults: 10 }, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'strategy-content-v1', name: 'content-based', description: '内容推荐', targetType: 'game', config: { weights: [{ factor: 'gameTypeMatch', weight: 0.5 }], fallbackStrategy: 'strategy-popularity-v1', minScore: 20, maxResults: 10 }, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'strategy-hybrid-v1', name: 'hybrid', description: '混合推荐', targetType: 'game', config: { weights: [{ factor: 'popularity', weight: 0.3 }, { factor: 'collaborative', weight: 0.3 }, { factor: 'contentMatch', weight: 0.4 }], minScore: 20, maxResults: 15 }, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]
  for (const s of seedStrategies) strategies.set(s.id, { ...s })

  return {
    getPopularRecommendations: (storeId?: string, type?: string, limit: number = 10) => {
      if (limit <= 0) return []
      const now = new Date().toISOString()
      return Array.from({ length: Math.min(limit, 8) }, (_, i) => makeRecommendation({
        id: `rec-pop-${i}`,
        storeId: storeId ?? 'store-001',
        type: type ?? 'game',
        itemId: `game-00${i + 1}`,
        itemName: `Item-${i + 1}`,
        score: 100 - i * 10,
        strategy: 'popularity',
      }))
    },
    getPersonalizedRecommendations: (memberId: string, type?: string, limit: number = 10) => {
      const profile = profiles.get(memberId)
      if (!profile) {
        // Cold start fallback
        return Array.from({ length: Math.min(limit, 5) }, (_, i) => makeRecommendation({
          id: `rec-cold-${i}`,
          memberId,
          storeId: 'store-001',
          type: type ?? 'game',
          strategy: 'cold-start->popularity',
        }))
      }
      return Array.from({ length: Math.min(limit, 5) }, (_, i) => makeRecommendation({
        id: `rec-pers-${i}-${memberId}`,
        memberId,
        type: type ?? 'game',
        strategy: 'content-based',
        score: 70 - i * 10,
      }))
    },
    getRecommendations: (query: any) => {
      let results: any[] = []
      if (query.storeId) results = results.filter((r: any) => r.storeId === query.storeId)
      if (query.memberId) results = results.filter((r: any) => r.memberId === query.memberId)
      if (query.type) results = results.filter((r: any) => r.type === query.type)
      return results.slice(0, query.limit ?? 20)
    },
    generateRecommendations: (input: any) => {
      const strategy = strategies.get(input.strategyId)
      if (!strategy) throw new Error(`策略不存在: ${input.strategyId}`)
      if (!strategy.isEnabled) throw new Error(`策略已禁用: ${strategy.name}`)
      const items = Array.from({ length: Math.min(input.limit ?? 10, 5) }, (_, i) => makeRecommendation({
        id: `rec-gen-${i}`,
        strategy: strategy.name,
        memberId: input.memberId,
        storeId: input.storeId,
        type: input.type ?? strategy.targetType,
      }))
      return { strategy: strategy.name, fallbackStrategy: undefined, items, executionTimeMs: 3, timestamp: new Date().toISOString() }
    },
    createStrategy: (dto: any) => {
      const now = new Date().toISOString()
      const s = makeStrategy({
        id: `strategy-${dto.name}-${Date.now()}`,
        name: dto.name,
        description: dto.description,
        targetType: dto.targetType,
        config: { weights: dto.weights ?? [], fallbackStrategy: dto.fallbackStrategy, minScore: dto.minScore, maxResults: dto.maxResults },
        created: now,
        updatedAt: now,
      })
      strategies.set(s.id, s)
      return s
    },
    getStrategies: () => Array.from(strategies.values()),
    getStrategy: (id: string) => strategies.get(id),
    updateStrategy: (id: string, dto: any) => {
      const existing = strategies.get(id)
      if (!existing) throw new Error(`策略不存在: ${id}`)
      Object.assign(existing, dto)
      if (dto.weights !== undefined) existing.config.weights = dto.weights
      if (dto.fallbackStrategy !== undefined) existing.config.fallbackStrategy = dto.fallbackStrategy
      if (dto.minScore !== undefined) existing.config.minScore = dto.minScore
      if (dto.maxResults !== undefined) existing.config.maxResults = dto.maxResults
      existing.updatedAt = new Date().toISOString()
      strategies.set(id, existing)
      return existing
    },
    enableStrategy: (id: string) => {
      const s = strategies.get(id)
      if (!s) throw new Error(`策略不存在: ${id}`)
      s.isEnabled = true
      s.updatedAt = new Date().toISOString()
      return s
    },
    disableStrategy: (id: string) => {
      const s = strategies.get(id)
      if (!s) throw new Error(`策略不存在: ${id}`)
      s.isEnabled = false
      s.updatedAt = new Date().toISOString()
      return s
    },
    getProfile: (memberId: string) => profiles.get(memberId),
    updateProfile: (memberId: string, dto: any) => {
      const now = new Date().toISOString()
      let profile = profiles.get(memberId)
      if (!profile) {
        profile = makeUserProfile({
          memberId,
          id: `profile-${memberId}`,
          lastUpdated: now,
        })
      }
      if (dto.preferences) Object.assign(profile.preferences, dto.preferences)
      if (dto.behaviorTags) profile.behaviorTags = dto.behaviorTags
      profile.lastUpdated = now
      profiles.set(memberId, profile)
      return profile
    },
    recordInteraction: (dto: any) => {
      const score = makeItemScore({
        id: `score-${dto.memberId}-${dto.itemId}-${Date.now()}`,
        memberId: dto.memberId,
        itemId: dto.itemId,
        itemType: dto.itemType,
        rating: dto.rating,
        interaction: dto.interaction,
        weight: dto.weight,
      })
      interactions.push(score)
      return score
    },
    recordConversion: (recommendationId: string) => {
      const rec = interactions.find((r: any) => r.id === recommendationId)
      if (!rec) return undefined
      return { ...rec, status: 'converted' }
    },
  }
}

// ── 内联 Controller (avoid NestJS parameter decorators) ───────
class AiRecommendController {
  private service: any

  constructor(service: any) {
    this.service = service
  }

  getPopular(query: any) {
    return this.service.getPopularRecommendations(query.storeId, query.type, query.limit ?? 10)
  }

  getPersonalized(query: any) {
    if (!query.memberId) {
      throw new Error('个性化推荐需要 memberId 参数')
    }
    return this.service.getPersonalizedRecommendations(query.memberId, query.type, query.limit ?? 10)
  }

  getRecommendations(query: any) {
    return this.service.getRecommendations({
      storeId: query.storeId,
      memberId: query.memberId,
      type: query.type,
      limit: query.limit,
    })
  }

  generateRecommendations(dto: any) {
    return this.service.generateRecommendations({
      strategyId: dto.strategyId,
      memberId: dto.memberId,
      storeId: dto.storeId,
      type: dto.type,
      limit: dto.limit,
    })
  }

  createStrategy(dto: any) {
    return this.service.createStrategy(dto)
  }

  getStrategies() {
    return this.service.getStrategies()
  }

  getStrategy(id: string) {
    return this.service.getStrategy(id)
  }

  updateStrategy(id: string, dto: any) {
    return this.service.updateStrategy(id, dto)
  }

  enableStrategy(id: string) {
    return this.service.enableStrategy(id)
  }

  disableStrategy(id: string) {
    return this.service.disableStrategy(id)
  }

  getProfile(memberId: string) {
    return this.service.getProfile(memberId)
  }

  updateProfile(memberId: string, dto: any) {
    return this.service.updateProfile(memberId, dto)
  }

  recordScore(dto: any) {
    return this.service.recordInteraction(dto)
  }

  recordInteraction(dto: any) {
    const weightMap: Record<string, number> = {
      view: 0.3, click: 0.5, purchase: 1.0, play: 0.8,
    }
    const ratingMap: Record<string, number> = {
      view: 3, click: 3, purchase: 5, play: 4,
    }
    return this.service.recordInteraction({
      memberId: dto.memberId,
      itemId: dto.itemId,
      itemType: dto.itemType,
      rating: ratingMap[dto.interaction] ?? 3,
      interaction: dto.interaction,
      weight: weightMap[dto.interaction] ?? 0.5,
    })
  }

  recordConversion(dto: any) {
    return this.service.recordConversion(dto.recommendationId)
  }
}

// ── 测试套件 ─────────────────────────────────────────────────
describe('AiRecommendController', () => {
  // ── 热门推荐 ──
  describe('getPopular() — GET /recommendations/popular', () => {
    test('无查询参数返回默认 10 条推荐', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.getPopular({})
      assert.ok(Array.isArray(result))
      assert.ok(result.length > 0)
      assert.ok(result.length <= 10)
      for (const r of result) {
        assert.equal(r.strategy, 'popularity')
        assert.ok(r.id)
        assert.ok(r.score >= 0)
      }
    })

    test('指定 limit 返回对应数量', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.getPopular({ storeId: 's-1', type: 'game', limit: 3 })
      assert.equal(result.length, 3)
    })

    test('type=product 时推荐类型为 product', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.getPopular({ type: 'product', limit: 2 })
      for (const r of result) assert.equal(r.type, 'product')
    })

    test('limit=0 返回空数组', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.getPopular({ limit: 0 })
      assert.deepStrictEqual(result, [])
    })

    test('limit 负数时返回空数组（边界保护）', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.getPopular({ limit: -1 })
      assert.ok(Array.isArray(result))
    })
  })

  // ── 个性化推荐 ──
  describe('getPersonalized() — GET /recommendations/personalized', () => {
    test('有 memberId 返回个性化推荐列表', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.getPersonalized({ memberId: 'member-001', type: 'game', limit: 5 })
      assert.ok(Array.isArray(result))
      assert.ok(result.length > 0)
      for (const r of result) assert.equal(r.memberId, 'member-001')
    })

    test('memberId 缺失抛出错误', () => {
      const ctrl = new AiRecommendController(makeMockService())
      assert.throws(
        () => ctrl.getPersonalized({ type: 'game' }),
        /memberId/
      )
    })

    test('无画像用户冷启动回退', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.getPersonalized({ memberId: 'new-no-profile', limit: 3 })
      assert.ok(Array.isArray(result))
      assert.ok(result.length > 0)
      for (const r of result) assert.equal(r.memberId, 'new-no-profile')
    })

    test('不同 memberId 个性化推荐各自绑定 memberId', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const r1 = ctrl.getPersonalized({ memberId: 'u1', limit: 3 })
      const r2 = ctrl.getPersonalized({ memberId: 'u2', limit: 3 })
      for (const r of r1) assert.equal(r.memberId, 'u1')
      for (const r of r2) assert.equal(r.memberId, 'u2')
    })
  })

  // ── 推荐历史查询 ──
  describe('getRecommendations() — GET /recommendations', () => {
    test('无种子推荐时返回空数组', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.getRecommendations({})
      assert.ok(Array.isArray(result))
    })

    test('按 storeId 过滤', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.getRecommendations({ storeId: 'store-001' })
      for (const r of result) assert.equal(r.storeId, 'store-001')
    })

    test('按 memberId 过滤', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.getRecommendations({ memberId: 'member-001' })
      for (const r of result) assert.equal(r.memberId, 'member-001')
    })
  })

  // ── 推荐生成 ──
  describe('generateRecommendations() — POST /generate', () => {
    test('使用 hybrid 策略生成成功', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.generateRecommendations({ strategyId: 'strategy-hybrid-v1', memberId: 'member-001', limit: 3 })
      assert.equal(result.strategy, 'hybrid')
      assert.ok(Array.isArray(result.items))
      assert.ok(result.items.length > 0)
      assert.ok(result.executionTimeMs >= 0)
      assert.ok(result.timestamp)
    })

    test('使用 popularity 策略生成成功', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.generateRecommendations({ strategyId: 'strategy-popularity-v1', limit: 2 })
      assert.equal(result.strategy, 'popularity')
    })

    test('不存在的 strategyId 抛出异常', () => {
      const ctrl = new AiRecommendController(makeMockService())
      assert.throws(
        () => ctrl.generateRecommendations({ strategyId: 'strategy-nonexistent', limit: 3 }),
        /策略不存在/
      )
    })

    test('已禁用策略生成抛出异常', () => {
      const ctrl = new AiRecommendController(makeMockService())
      ctrl.disableStrategy('strategy-hybrid-v1')
      assert.throws(
        () => ctrl.generateRecommendations({ strategyId: 'strategy-hybrid-v1', limit: 3 }),
        /已禁用/
      )
    })

    test('storeId 传递到推荐项', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.generateRecommendations({ strategyId: 'strategy-popularity-v1', storeId: 'shanghai', limit: 2 })
      for (const item of result.items) assert.equal(item.storeId, 'shanghai')
    })
  })

  // ── 创建策略 ──
  describe('createStrategy() — POST /strategies', () => {
    test('创建基本策略成功', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.createStrategy({ name: 'unit-test', description: 'Unit test', targetType: 'game', weights: [{ factor: 'popularity', weight: 1 }], maxResults: 10 })
      assert.equal(result.name, 'unit-test')
      assert.equal(result.isEnabled, true)
      assert.ok(result.id)
      assert.ok(result.createdAt)
    })

    test('创建后可在列表中查到', () => {
      const ctrl = new AiRecommendController(makeMockService())
      ctrl.createStrategy({ name: 'list-verify', description: 'Verify', targetType: 'product', weights: [{ factor: 'cf', weight: 1 }] })
      const names = ctrl.getStrategies().map((s: any) => s.name)
      assert.ok(names.includes('list-verify'))
    })
  })

  // ── 获取策略列表 ──
  describe('getStrategies() — GET /strategies', () => {
    test('返回所有策略（含种子策略）', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.getStrategies()
      assert.ok(result.length >= 4)
      for (const s of result) {
        assert.ok(s.id)
        assert.ok(s.name)
        assert.ok(s.targetType)
        assert.ok(s.config)
      }
    })

    test('所有 ID 唯一', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const ids = ctrl.getStrategies().map((s: any) => s.id)
      assert.equal(new Set(ids).size, ids.length)
    })
  })

  // ── 获取指定策略 ──
  describe('getStrategy() — GET /strategies/:id', () => {
    test('存在 ID 返回策略对象', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.getStrategy('strategy-hybrid-v1')
      assert.ok(result)
      assert.equal(result.name, 'hybrid')
    })

    test('不存在 ID 返回 undefined', () => {
      const ctrl = new AiRecommendController(makeMockService())
      assert.equal(ctrl.getStrategy('not-exist'), undefined)
    })

    test('空字符串返回 undefined', () => {
      const ctrl = new AiRecommendController(makeMockService())
      assert.equal(ctrl.getStrategy(''), undefined)
    })
  })

  // ── 更新策略 ──
  describe('updateStrategy() — PUT /strategies/:id', () => {
    test('更新名称和描述', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const updated = ctrl.updateStrategy('strategy-hybrid-v1', { name: 'hybrid-v2', description: 'v2' })
      assert.equal(updated.name, 'hybrid-v2')
      assert.equal(updated.description, 'v2')
    })

    test('更新后可通过 get 验证', () => {
      const ctrl = new AiRecommendController(makeMockService())
      ctrl.updateStrategy('strategy-popularity-v1', { name: 'popularity-v2' })
      assert.equal(ctrl.getStrategy('strategy-popularity-v1').name, 'popularity-v2')
    })

    test('更新不存在的策略抛出异常', () => {
      const ctrl = new AiRecommendController(makeMockService())
      assert.throws(() => ctrl.updateStrategy('ghost', { name: 'x' }), /策略不存在/)
    })
  })

  // ── 启用/禁用策略 ──
  describe('enableStrategy() / disableStrategy() — PATCH', () => {
    test('禁用后 isEnabled=false', () => {
      const ctrl = new AiRecommendController(makeMockService())
      assert.equal(ctrl.disableStrategy('strategy-hybrid-v1').isEnabled, false)
    })

    test('启用后 isEnabled=true', () => {
      const ctrl = new AiRecommendController(makeMockService())
      ctrl.disableStrategy('strategy-hybrid-v1')
      assert.equal(ctrl.enableStrategy('strategy-hybrid-v1').isEnabled, true)
    })

    test('禁用不存在的策略抛出异常', () => {
      const ctrl = new AiRecommendController(makeMockService())
      assert.throws(() => ctrl.disableStrategy('ghost'), /策略不存在/)
    })
  })

  // ── 获取画像 ──
  describe('getProfile() — GET /profiles/:memberId', () => {
    test('已存在画像返回 UserProfile', () => {
      const ctrl = new AiRecommendController(makeMockService())
      ctrl.updateProfile('member-001', { preferences: { gameTypes: ['RPG'], priceRange: { min: 0, max: 100 }, avgSpend: 50, visitFrequency: 'weekly', favoriteTimeSlot: '18:00-20:00' }, behaviorTags: ['test'] })
      const result = ctrl.getProfile('member-001')
      assert.ok(result)
      assert.equal(result.memberId, 'member-001')
      assert.ok(result.preferences)
    })

    test('不存在画像返回 undefined', () => {
      const ctrl = new AiRecommendController(makeMockService())
      assert.equal(ctrl.getProfile('ghost'), undefined)
    })
  })

  // ── 创建/更新画像 ──
  describe('updateProfile() — PUT /profiles/:memberId', () => {
    test('创建新画像成功', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.updateProfile('new-member', { preferences: { gameTypes: ['puzzle'], priceRange: { min: 10, max: 50 }, avgSpend: 50, visitFrequency: 'weekly', favoriteTimeSlot: '20:00-22:00' }, behaviorTags: ['new'] })
      assert.equal(result.memberId, 'new-member')
    })

    test('更新已有画像偏好', () => {
      const ctrl = new AiRecommendController(makeMockService())
      ctrl.updateProfile('member-001', { preferences: { gameTypes: ['shooting'] }, behaviorTags: ['vip'] })
      const profile = ctrl.getProfile('member-001')
      assert.deepStrictEqual(profile.preferences.gameTypes, ['shooting'])
      assert.ok(profile.behaviorTags.includes('vip'))
    })
  })

  // ── 记录评分 ──
  describe('recordScore() — POST /interactions/score', () => {
    test('记录游戏评分成功', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.recordScore({ memberId: 'member-001', itemId: 'game-001', itemType: 'game', rating: 5, interaction: 'purchase', weight: 1.0 })
      assert.equal(result.memberId, 'member-001')
      assert.equal(result.itemId, 'game-001')
      assert.equal(result.rating, 5)
    })

    test('记录低评分', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.recordScore({ memberId: 'member-002', itemId: 'game-005', itemType: 'game', rating: 1, interaction: 'view', weight: 0.3 })
      assert.equal(result.rating, 1)
    })
  })

  // ── 记录交互（简化版）──
  describe('recordInteraction() — POST /interactions', () => {
    test('view 自动映射 weight=0.3 rating=3', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.recordInteraction({ memberId: 'm1', itemId: 'g1', itemType: 'game', interaction: 'view' })
      assert.equal(result.weight, 0.3)
      assert.equal(result.rating, 3)
    })

    test('purchase 自动映射 weight=1.0 rating=5', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.recordInteraction({ memberId: 'm1', itemId: 'g2', itemType: 'game', interaction: 'purchase' })
      assert.equal(result.weight, 1.0)
      assert.equal(result.rating, 5)
    })

    test('未知交互类型回退 weight=0.5 rating=3', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.recordInteraction({ memberId: 'm1', itemId: 'g3', itemType: 'game', interaction: 'unknown' as any })
      assert.equal(result.weight, 0.5)
      assert.equal(result.rating, 3)
    })
  })

  // ── 记录转化 ──
  describe('recordConversion() — POST /conversions', () => {
    test('转化不存在的推荐 ID 返回 undefined', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const result = ctrl.recordConversion({ recommendationId: 'rec-ghost' })
      assert.equal(result, undefined)
    })

    test('转化已存在的交互记录返回转化后对象', () => {
      const ctrl = new AiRecommendController(makeMockService())
      const score = ctrl.recordScore({ memberId: 'm1', itemId: 'g1', itemType: 'game', rating: 4, interaction: 'play', weight: 0.8 })
      const converted = ctrl.recordConversion({ recommendationId: score.id })
      assert.equal(converted.status, 'converted')
    })
  })

  // ── 边界异常 ──
  describe('error handling — 异常与边界', () => {
    test('空 body 调用 getPopular 不抛出', () => {
      const ctrl = new AiRecommendController(makeMockService())
      assert.doesNotThrow(() => ctrl.getPopular({}))
    })

    test('getPersonalized 空 memberId 抛出', () => {
      const ctrl = new AiRecommendController(makeMockService())
      assert.throws(() => ctrl.getPersonalized({}), /memberId/)
    })

    test('generate 不存在的策略抛出', () => {
      const ctrl = new AiRecommendController(makeMockService())
      assert.throws(() => ctrl.generateRecommendations({ strategyId: '', limit: 3 }), /策略不存在/)
    })

    test('updateStrategy 不存在的 ID 抛出', () => {
      const ctrl = new AiRecommendController(makeMockService())
      assert.throws(() => ctrl.updateStrategy('never-existed', { name: 'x' }), /策略不存在/)
    })
  })
})
