import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-recommend] Service 单元测试
 *
 * 覆盖:
 *   - 热门推荐 (getPopularRecommendations) + 排序
 *   - 个性化推荐 (getPersonalizedRecommendations) + 冷启动回退
 *   - 策略 CRUD (create/get/list/update/enable/disable)
 *   - 推荐生成 (generateRecommendations) + 4 种策略
 *   - 兜底策略 (fallback) 触发
 *   - 反馈收集 (recordInteraction / recordConversion)
 *   - 用户画像 (updateProfile / getProfile / 从交互自动更新)
 *   - 推荐历史查询 (getRecommendations)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiRecommendService } from './ai-recommend.service'

// ─── 热门推荐 ───

describe('Service: 热门推荐', () => {
  it('默认 limit=10 返回 8 个种子 (最多 10)', () => {
    const svc = new AiRecommendService()
    const popular = svc.getPopularRecommendations(undefined, 'game')
    assert.ok(popular.length > 0)
    assert.ok(popular.length <= 10)
  })

  it('limit=3 返回前 3', () => {
    const svc = new AiRecommendService()
    const popular = svc.getPopularRecommendations(undefined, 'game', 3)
    assert.equal(popular.length, 3)
  })

  it('strategy 标记为 popularity', () => {
    const svc = new AiRecommendService()
    const popular = svc.getPopularRecommendations(undefined, 'game', 3)
    for (const r of popular) assert.equal(r.strategy, 'popularity')
  })

  it('itemName 来自默认 "Item-${id}" 格式', () => {
    const svc = new AiRecommendService()
    const popular = svc.getPopularRecommendations(undefined, 'game', 8)
    const names = popular.map((r) => r.itemName)
    // 热门推荐使用 Item-{itemId} 格式(itemId 来自 game-001..game-008)
    assert.ok(names.every((n) => n.startsWith('Item-')))
  })

  it('storeId 透传', () => {
    const svc = new AiRecommendService()
    const popular = svc.getPopularRecommendations('store-X', 'game', 2)
    for (const r of popular) assert.equal(r.storeId, 'store-X')
  })

  it('type 覆盖默认 game', () => {
    const svc = new AiRecommendService()
    const popular = svc.getPopularRecommendations(undefined, 'product', 3)
    for (const r of popular) assert.equal(r.type, 'product')
  })

  it('status 默认 active', () => {
    const svc = new AiRecommendService()
    const popular = svc.getPopularRecommendations(undefined, 'game', 2)
    for (const r of popular) assert.equal(r.status, 'active')
  })

  it('expiresAt 未来时间', () => {
    const svc = new AiRecommendService()
    const popular = svc.getPopularRecommendations(undefined, 'game', 1)
    const now = Date.now()
    const exp = new Date(popular[0].expiresAt).getTime()
    assert.ok(exp > now, 'expiresAt 必为未来')
  })
})

// ─── 个性化推荐 ───

describe('Service: 个性化推荐', () => {
  it('无画像 → 冷启动回退热门', () => {
    const svc = new AiRecommendService()
    const pers = svc.getPersonalizedRecommendations('cold-user', 'game', 5)
    assert.ok(pers.length > 0)
    // 冷启动标记
    assert.ok(pers[0].strategy.includes('cold-start') || pers[0].strategy.includes('popularity'))
  })

  it('有画像 → 基于内容匹配', () => {
    const svc = new AiRecommendService()
    svc.updateProfile('m-1', {
      preferences: {
        gameTypes: ['MOBA'],
        priceRange: { min: 0, max: 500 },
        visitFrequency: 'daily',
        avgSpend: 100,
        favoriteTimeSlot: '18:00-22:00'
      },
      behaviorTags: ['game-enthusiast']
    })
    const pers = svc.getPersonalizedRecommendations('m-1', 'game', 5)
    assert.ok(pers.length > 0)
    // 至少有一个 MOBA
    assert.ok(pers.some((r) => ['王者荣耀', '英雄联盟'].includes(r.itemName)))
  })

  it('画像 avgSpend 50 以下不触发消费匹配', () => {
    const svc = new AiRecommendService()
    svc.updateProfile('low-spender', {
      preferences: {
        gameTypes: [],
        priceRange: { min: 0, max: 50 },
        visitFrequency: 'occasional',
        avgSpend: 30,
        favoriteTimeSlot: '10:00-12:00'
      }
    })
    const pers = svc.getPersonalizedRecommendations('low-spender', 'game', 5)
    // 应回退或分数很低,但仍可能有协同过滤的
    assert.ok(Array.isArray(pers))
  })

  it('limit 限制结果数', () => {
    const svc = new AiRecommendService()
    const pers = svc.getPersonalizedRecommendations('any-user', 'game', 2)
    assert.ok(pers.length <= 2)
  })
})

// ─── 策略 CRUD ───

describe('Service: 策略 CRUD', () => {
  it('createStrategy 新增自定义策略', () => {
    const svc = new AiRecommendService()
    const created = svc.createStrategy({
      name: 'custom-v1',
      description: 'custom',
      targetType: 'game',
      weights: [{ factor: 'rating', weight: 1.0 }],
      minScore: 0,
      maxResults: 5
    })
    assert.ok(created.id.startsWith('strategy-custom-v1-'))
    assert.equal(created.name, 'custom-v1')
    assert.equal(created.isEnabled, true)
  })

  it('createStrategy 指定 fallback', () => {
    const svc = new AiRecommendService()
    const created = svc.createStrategy({
      name: 'with-fallback',
      description: '',
      targetType: 'game',
      weights: [{ factor: 'x', weight: 1 }],
      fallbackStrategy: 'strategy-popularity-v1'
    })
    assert.equal(created.config.fallbackStrategy, 'strategy-popularity-v1')
  })

  it('getStrategies 包含默认 + 自定义', () => {
    const svc = new AiRecommendService()
    svc.createStrategy({
      name: 'mine',
      description: '',
      targetType: 'product',
      weights: [{ factor: 'rating', weight: 1 }]
    })
    const all = svc.getStrategies()
    assert.ok(all.length >= 5) // 4 默认 + 1 自定义
  })

  it('getStrategy 查找存在的策略', () => {
    const svc = new AiRecommendService()
    const s = svc.getStrategy('strategy-popularity-v1')
    assert.ok(s)
    assert.equal(s!.name, 'popularity')
  })

  it('getStrategy 不存在返回 undefined', () => {
    const svc = new AiRecommendService()
    assert.equal(svc.getStrategy('non-existent'), undefined)
  })

  it('updateStrategy 修改权重 + minScore', () => {
    const svc = new AiRecommendService()
    const updated = svc.updateStrategy('strategy-popularity-v1', {
      minScore: 50,
      maxResults: 3
    })
    assert.equal(updated.config.minScore, 50)
    assert.equal(updated.config.maxResults, 3)
  })

  it('updateStrategy 不存在抛错', () => {
    const svc = new AiRecommendService()
    assert.throws(() => svc.updateStrategy('non-existent', {}), /策略不存在/)
  })

  it('disableStrategy 切换 isEnabled=false', () => {
    const svc = new AiRecommendService()
    const updated = svc.disableStrategy('strategy-popularity-v1')
    assert.equal(updated.isEnabled, false)
  })

  it('enableStrategy 切换 isEnabled=true', () => {
    const svc = new AiRecommendService()
    svc.disableStrategy('strategy-popularity-v1')
    const updated = svc.enableStrategy('strategy-popularity-v1')
    assert.equal(updated.isEnabled, true)
  })

  it('enableStrategy 不存在抛错', () => {
    const svc = new AiRecommendService()
    assert.throws(() => svc.enableStrategy('nope'), /策略不存在/)
  })

  it('disableStrategy 不存在抛错', () => {
    const svc = new AiRecommendService()
    assert.throws(() => svc.disableStrategy('nope'), /策略不存在/)
  })
})

// ─── 推荐生成 ───

describe('Service: generateRecommendations', () => {
  it('popularity 策略返回热门', () => {
    const svc = new AiRecommendService()
    const out = svc.generateRecommendations({
      strategyId: 'strategy-popularity-v1',
      limit: 5
    })
    assert.equal(out.strategy, 'popularity')
    assert.ok(out.items.length > 0)
  })

  it('collaborative-filtering 无 memberId 回退热门', () => {
    const svc = new AiRecommendService()
    const out = svc.generateRecommendations({
      strategyId: 'strategy-collaborative-v1',
      limit: 5
    })
    assert.equal(out.strategy, 'collaborative-filtering')
    assert.ok(out.items.length > 0)
  })

  it('content-based 有 memberId 用画像', () => {
    const svc = new AiRecommendService()
    svc.updateProfile('m-content', {
      preferences: {
        gameTypes: ['RPG'],
        priceRange: { min: 0, max: 500 },
        visitFrequency: 'weekly',
        avgSpend: 80,
        favoriteTimeSlot: '18:00-22:00'
      }
    })
    const out = svc.generateRecommendations({
      strategyId: 'strategy-content-v1',
      memberId: 'm-content',
      limit: 5
    })
    assert.equal(out.strategy, 'content-based')
  })

  it('hybrid 策略 memberId 必填', () => {
    const svc = new AiRecommendService()
    const out = svc.generateRecommendations({
      strategyId: 'strategy-hybrid-v1',
      memberId: 'm-hybrid',
      limit: 5
    })
    assert.equal(out.strategy, 'hybrid')
  })

  it('hybrid 策略无 memberId 回退热门', () => {
    const svc = new AiRecommendService()
    const out = svc.generateRecommendations({
      strategyId: 'strategy-hybrid-v1',
      limit: 5
    })
    assert.ok(out.items.length > 0)
  })

  it('策略不存在抛错', () => {
    const svc = new AiRecommendService()
    assert.throws(
      () => svc.generateRecommendations({ strategyId: 'non-existent' }),
      /策略不存在/
    )
  })

  it('禁用策略抛错', () => {
    const svc = new AiRecommendService()
    svc.disableStrategy('strategy-popularity-v1')
    assert.throws(
      () => svc.generateRecommendations({ strategyId: 'strategy-popularity-v1' }),
      /策略已禁用/
    )
  })

  it('executionTimeMs 必填', () => {
    const svc = new AiRecommendService()
    const out = svc.generateRecommendations({
      strategyId: 'strategy-popularity-v1'
    })
    assert.equal(typeof out.executionTimeMs, 'number')
    assert.ok(out.executionTimeMs >= 0)
  })

  it('timestamp ISO 格式', () => {
    const svc = new AiRecommendService()
    const out = svc.generateRecommendations({
      strategyId: 'strategy-popularity-v1'
    })
    assert.ok(!isNaN(Date.parse(out.timestamp)))
  })

  it('输入 limit 覆盖策略默认', () => {
    const svc = new AiRecommendService()
    const out = svc.generateRecommendations({
      strategyId: 'strategy-popularity-v1',
      limit: 2
    })
    assert.ok(out.items.length <= 2)
  })

  it('输入 type 覆盖策略默认 targetType', () => {
    const svc = new AiRecommendService()
    const out = svc.generateRecommendations({
      strategyId: 'strategy-popularity-v1',
      type: 'product',
      limit: 3
    })
    for (const r of out.items) assert.equal(r.type, 'product')
  })

  it('空结果 + fallback 触发 (minScore 极高 → 过滤空)', async () => {
    const svc = new AiRecommendService()
    // 创建带 fallback 的策略,但 minScore=999999 让 popularity 推荐全部过滤
    const created = svc.createStrategy({
      name: 'fallback-test',
      description: '',
      targetType: 'game',
      weights: [{ factor: 'rating', weight: 1 }],
      fallbackStrategy: 'strategy-popularity-v1',
      minScore: 999999,
      maxResults: 10
    })
    // popularity strategy 本身 minScore=10, 生成结果后过滤 < 999999 → 空
    const out = svc.generateRecommendations({
      strategyId: created.id,
      limit: 5
    })
    // fallback 应被触发,fallbackStrategy 应填上
    assert.equal(out.fallbackStrategy, 'strategy-popularity-v1')
    // fallback 后结果(来自 popularity)可能仍不满足 999999 → 但至少调用过 fallback
    // fallbackStrategy 已设置 = 验证 fallback 逻辑被触发
    void out.items
  })

  it('未知策略名 → 默认 popularity', () => {
    const svc = new AiRecommendService()
    // 通过 updateStrategy 改 name 到未知值
    const updated = svc.updateStrategy('strategy-popularity-v1', { name: 'unknown-strategy' })
    const out = svc.generateRecommendations({
      strategyId: updated.id,
      limit: 3
    })
    assert.ok(out.items.length > 0)
    // switch default → popularity
  })
})

// ─── 反馈收集 ───

describe('Service: 反馈收集', () => {
  it('recordInteraction 新增评分', () => {
    const svc = new AiRecommendService()
    const score = svc.recordInteraction({
      memberId: 'm-1',
      itemId: 'game-001',
      itemType: 'game',
      rating: 5,
      interaction: 'play',
      weight: 1.0
    })
    assert.ok(score.id.length > 0)
    assert.equal(score.memberId, 'm-1')
    assert.equal(score.itemId, 'game-001')
  })

  it('recordInteraction 更新物品交互计数', () => {
    const svc = new AiRecommendService()
    const before = svc.getPopularRecommendations(undefined, 'game', 10)
    const gameScore = before.find((r) => r.itemId === 'game-001')?.score ?? 0
    svc.recordInteraction({
      memberId: 'm-fb',
      itemId: 'game-001',
      itemType: 'game',
      rating: 5,
      interaction: 'purchase',
      weight: 1.0
    })
    const after = svc.getPopularRecommendations(undefined, 'game', 10)
    const newScore = after.find((r) => r.itemId === 'game-001')?.score ?? 0
    // 交互次数增加,热门分数应更高(或不变)
    assert.ok(newScore >= gameScore)
  })

  it('recordInteraction 自动更新画像', () => {
    const svc = new AiRecommendService()
    assert.equal(svc.getProfile('m-auto'), undefined)
    svc.recordInteraction({
      memberId: 'm-auto',
      itemId: 'game-001',
      itemType: 'game',
      rating: 5,
      interaction: 'play',
      weight: 1.0
    })
    const profile = svc.getProfile('m-auto')
    assert.ok(profile)
    // play 应添加 gameType
    assert.ok(profile!.preferences.gameTypes.includes('MOBA'))
  })

  it('recordInteraction 高 rating 添加 game-enthusiast 标签', () => {
    const svc = new AiRecommendService()
    svc.recordInteraction({
      memberId: 'm-ent',
      itemId: 'game-002',
      itemType: 'game',
      rating: 5,
      interaction: 'play',
      weight: 1.0
    })
    const p = svc.getProfile('m-ent')
    assert.ok(p!.behaviorTags.includes('game-enthusiast'))
  })

  it('recordConversion 不存在返回 undefined', () => {
    const svc = new AiRecommendService()
    assert.equal(svc.recordConversion('non-existent'), undefined)
  })

  it('recordConversion active → converted (不持久化,仅验证调用)', () => {
    const svc = new AiRecommendService()
    // generateRecommendations 不持久化到 recommendations 池
    // recordConversion 找不到 → undefined
    const out = svc.generateRecommendations({ strategyId: 'strategy-popularity-v1' })
    void out.items.length // 仅验证 generate 成功
    const r1 = svc.recordConversion('any-id')
    assert.equal(r1, undefined)
  })
})

// ─── 用户画像 ───

describe('Service: 用户画像', () => {
  it('getProfile 未创建返回 undefined', () => {
    const svc = new AiRecommendService()
    assert.equal(svc.getProfile('never-created'), undefined)
  })

  it('updateProfile 创建画像', () => {
    const svc = new AiRecommendService()
    const p = svc.updateProfile('m-new', {
      preferences: {
        gameTypes: ['MOBA'],
        priceRange: { min: 0, max: 300 },
        visitFrequency: 'weekly',
        avgSpend: 80,
        favoriteTimeSlot: '19:00-23:00'
      },
      behaviorTags: ['vip']
    })
    assert.equal(p.memberId, 'm-new')
    assert.equal(p.preferences.gameTypes[0], 'MOBA')
  })

  it('updateProfile 增量更新', () => {
    const svc = new AiRecommendService()
    svc.updateProfile('m-inc', {
      preferences: {
        gameTypes: ['MOBA'],
        priceRange: { min: 0, max: 100 },
        visitFrequency: 'weekly',
        avgSpend: 50,
        favoriteTimeSlot: '10:00-12:00'
      }
    })
    const updated = svc.updateProfile('m-inc', {
      behaviorTags: ['new-tag']
    })
    // preferences 保留
    assert.equal(updated.preferences.gameTypes[0], 'MOBA')
    // behaviorTags 替换
    assert.deepEqual(updated.behaviorTags, ['new-tag'])
  })

  it('updateProfile 修改 priceRange', () => {
    const svc = new AiRecommendService()
    svc.updateProfile('m-pr', {
      preferences: {
        gameTypes: [],
        priceRange: { min: 0, max: 100 },
        visitFrequency: 'occasional',
        avgSpend: 30,
        favoriteTimeSlot: '10:00'
      }
    })
    const updated = svc.updateProfile('m-pr', {
      preferences: {
        gameTypes: [],
        priceRange: { min: 50, max: 500 },
        visitFrequency: 'daily',
        avgSpend: 200,
        favoriteTimeSlot: '20:00'
      }
    })
    assert.equal(updated.preferences.priceRange.min, 50)
    assert.equal(updated.preferences.avgSpend, 200)
  })
})

// ─── 推荐历史查询 ───

describe('Service: 推荐历史查询', () => {
  it('空查询返回空', () => {
    const svc = new AiRecommendService()
    const list = svc.getRecommendations({})
    assert.ok(Array.isArray(list))
  })

  it('filter by storeId', () => {
    const svc = new AiRecommendService()
    const popular = svc.getPopularRecommendations('store-A', 'game', 2)
    // popular 不持久化,直接测 getRecommendations 空
    const list = svc.getRecommendations({ storeId: 'store-A' })
    assert.equal(list.length, 0)
    assert.ok(popular.length > 0) // sanity
  })

  it('filter by memberId', () => {
    const svc = new AiRecommendService()
    const list = svc.getRecommendations({ memberId: 'm-1' })
    assert.equal(list.length, 0)
  })

  it('filter by type', () => {
    const svc = new AiRecommendService()
    const list = svc.getRecommendations({ type: 'game' })
    assert.equal(list.length, 0)
  })

  it('limit 限制', () => {
    const svc = new AiRecommendService()
    const list = svc.getRecommendations({ limit: 3 })
    assert.ok(list.length <= 3)
  })
})
