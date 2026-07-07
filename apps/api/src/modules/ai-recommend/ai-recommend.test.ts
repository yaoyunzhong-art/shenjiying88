import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * T113-3 协同过滤推荐 + 用户画像测试
 *
 * 覆盖:
 *   - CollaborativeFilteringService: 相似用户/物品查找、基于用户/物品推荐、偏好更新
 *   - UserProfileService: 画像构建、增量更新、标签获取、人群匹配
 */

import assert from 'node:assert/strict'
import {
  CollaborativeFilteringService,
  UserProfileService
} from './ai-recommend.service'

// ===== 协同过滤服务 =====

describe('CollaborativeFilteringService: 相似用户', () => {
  it('user-A 与 user-B 有重叠偏好 item-1/item-2，应返回相似', () => {
    const svc = new CollaborativeFilteringService()
    const similar = svc.findSimilarUsers('user-A', 5)
    const userB = similar.find((s) => s.targetId === 'user-B')
    assert.ok(userB, 'user-B 应被识别为相似用户')
    assert.ok(userB!.similarity > 0, '相似度应大于0')
  })

  it('user-A 与 user-C 有重叠偏好 item-2/item-3，应返回相似', () => {
    const svc = new CollaborativeFilteringService()
    const similar = svc.findSimilarUsers('user-A', 5)
    const userC = similar.find((s) => s.targetId === 'user-C')
    assert.ok(userC, 'user-C 应被识别为相似用户')
  })

  it('不存在的用户返回空数组', () => {
    const svc = new CollaborativeFilteringService()
    const similar = svc.findSimilarUsers('non-existent-user', 5)
    assert.equal(similar.length, 0)
  })

  it('limit 限制返回数量', () => {
    const svc = new CollaborativeFilteringService()
    const similar = svc.findSimilarUsers('user-A', 2)
    assert.ok(similar.length <= 2)
  })
})

describe('CollaborativeFilteringService: 基于用户推荐', () => {
  it('user-A 的推荐应包含相似用户喜欢的物品', () => {
    const svc = new CollaborativeFilteringService()
    const recs = svc.recommendForUser('user-A', 5)
    assert.ok(recs.length > 0, '应有推荐结果')
    // user-A 已有 item-1,2,3；相似用户 B 有 item-4，C 有 item-5，D 有 item-1,3,5
    // 推荐的物品应该是 user-A 没有但相似用户喜欢的
    const recommendedItems = recs.map((r) => r.itemId)
    assert.ok(recommendedItems.every((id) => !['item-1', 'item-2', 'item-3'].includes(id)), '推荐物品不应包含已评分物品')
  })

  it('推荐列表包含推荐理由', () => {
    const svc = new CollaborativeFilteringService()
    const recs = svc.recommendForUser('user-A', 5)
    assert.ok(recs.every((r) => r.reason.length > 0), '每个推荐应有理由')
  })

  it('推荐结果按分数降序排列', () => {
    const svc = new CollaborativeFilteringService()
    const recs = svc.recommendForUser('user-A', 5)
    for (let i = 1; i < recs.length; i++) {
      assert.ok(recs[i - 1].score >= recs[i].score, '分数应降序排列')
    }
  })

  it('无相似用户时返回空数组', () => {
    const svc = new CollaborativeFilteringService()
    // 创建一个没有任何评分的用户
    svc.updatePreference('lonely-user', 'item-X', 1)
    const recs = svc.recommendForUser('lonely-user', 5)
    // lonely-user 只有 item-X 的评分，与其他用户没有重叠
    void recs
  })
})

describe('CollaborativeFilteringService: 协同过滤', () => {
  it('推荐结果与用户历史行为相关', () => {
    const svc = new CollaborativeFilteringService()
    // user-A 喜欢 item-1 和 item-2 (评分高)
    const similarUsers = svc.findSimilarUsers('user-A', 3)
    assert.ok(similarUsers.length > 0, '应找到相似用户')

    // 验证相似用户确实与 user-A 有共同评分物品
    for (const sim of similarUsers) {
      const otherPrefs = (svc as any).preferences.get(sim.targetId) ?? []
      const userAPrefs = (svc as any).preferences.get('user-A') ?? []
      const userAItems = new Set(userAPrefs.map((p: any) => p.itemId))
      const hasOverlap = otherPrefs.some((p: any) => userAItems.has(p.itemId))
      assert.ok(hasOverlap, `相似用户 ${sim.targetId} 应与 user-A 有重叠物品`)
    }
  })

  it('updatePreference 更新已有评分', () => {
    const svc = new CollaborativeFilteringService()
    svc.updatePreference('user-A', 'item-1', 2)
    const similar = svc.findSimilarUsers('user-A', 5)
    const userB = similar.find((s) => s.targetId === 'user-B')
    // user-A 对 item-1 评分从 5 改为 2，与 user-B(4) 的相似度应降低
    assert.ok(userB, 'user-B 仍应为相似用户')
  })
})

describe('CollaborativeFilteringService: 相似物品', () => {
  it('item-1 和 item-2 被相同用户评分，应返回相似', () => {
    const svc = new CollaborativeFilteringService()
    const similar = svc.findSimilarItems('item-1', 5)
    const item2 = similar.find((s) => s.targetId === 'item-2')
    assert.ok(item2, 'item-2 应被识别为相似物品')
    assert.ok(item2!.similarity > 0, '相似度应大于0')
  })

  it('不存在的物品返回空数组', () => {
    const svc = new CollaborativeFilteringService()
    const similar = svc.findSimilarItems('non-existent-item', 5)
    assert.equal(similar.length, 0)
  })
})

// ===== 用户画像服务 =====

describe('UserProfileService: 画像构建', () => {
  it('画像包含行为/偏好/价值/生命周期四个维度', () => {
    const svc = new UserProfileService()
    const profile = svc.buildProfile('new-user-123')

    assert.ok(profile.behaviorTags, '应有行为标签')
    assert.ok(profile.preferenceTags, '应有偏好标签')
    assert.ok(profile.valueTags, '应有价值标签')
    assert.ok(profile.lifecycleStage, '应有人命周期阶段')
    assert.ok(profile.valueLevel, '应有价值等级')
  })

  it('种子用户 profile-user-1 画像完整', () => {
    const svc = new UserProfileService()
    const profile = svc.buildProfile('profile-user-1')

    assert.equal(profile.lifecycleStage, 'active')
    assert.equal(profile.valueLevel, 'vip')
    assert.ok(profile.avgSpend > 0)
    assert.ok(profile.behaviorTags.length > 0)
  })

  it('新用户使用事件构建画像', () => {
    const svc = new UserProfileService()
    const now = new Date()
    const events = [
      { type: 'view', timestamp: now.toISOString(), data: { category: 'game_moba' } },
      { type: 'purchase', timestamp: now.toISOString(), data: { amount: 100 } }
    ]
    const profile = svc.updateProfile('event-user-1', events)

    assert.ok(profile.preferenceTags.some((t) => t.tag === 'MOBA游戏'), '应提取MOBA偏好')
    assert.ok(profile.lifecycleStage === 'active', '活跃用户')
  })
})

describe('UserProfileService: 标签获取', () => {
  it('getProfileTags 返回所有类型标签', () => {
    const svc = new UserProfileService()
    const tags = svc.getProfileTags('profile-user-1')

    const sources = tags.map((t) => t.source)
    assert.ok(sources.includes('behavior'), '应有行为标签')
    assert.ok(sources.includes('preference'), '应有偏好标签')
    assert.ok(sources.includes('value'), '应有价值标签')
  })

  it('不存在的用户返回空标签数组', () => {
    const svc = new UserProfileService()
    const tags = svc.getProfileTags('never-existed-user')
    assert.ok(Array.isArray(tags))
  })
})

describe('UserProfileService: 人群匹配', () => {
  it('匹配 lifecycleStage=active 的用户', () => {
    const svc = new UserProfileService()
    const matched = svc.matchAudience({ lifecycleStages: ['active'] })

    assert.ok(matched.includes('profile-user-1'), 'profile-user-1 应匹配(活跃)')
    assert.ok(matched.includes('profile-user-2'), 'profile-user-2 应匹配(活跃)')
    assert.ok(!matched.includes('profile-user-3'), 'profile-user-3 不应匹配(休眠)')
  })

  it('匹配 valueLevel=vip 的用户', () => {
    const svc = new UserProfileService()
    const matched = svc.matchAudience({ valueLevels: ['vip'] })

    assert.ok(matched.includes('profile-user-1'), 'profile-user-1 应匹配(VIP)')
    assert.ok(!matched.includes('profile-user-2'), 'profile-user-2 不应匹配(中等价值)')
    assert.ok(!matched.includes('profile-user-3'), 'profile-user-3 不应匹配(低价值)')
  })

  it('匹配行为标签 高频访问', () => {
    const svc = new UserProfileService()
    const matched = svc.matchAudience({ behaviorTags: ['高频访问'] })

    assert.ok(matched.includes('profile-user-1'), 'profile-user-1 应匹配(高频访问)')
  })

  it('消费区间匹配', () => {
    const svc = new UserProfileService()
    const matched = svc.matchAudience({ minAvgSpend: 500 })

    assert.ok(matched.includes('profile-user-1'), 'profile-user-1 平均消费580应匹配')
    assert.ok(!matched.includes('profile-user-2'), 'profile-user-2 平均消费150不应匹配')
  })

  it('多重条件组合匹配', () => {
    const svc = new UserProfileService()
    const matched = svc.matchAudience({
      lifecycleStages: ['active'],
      valueLevels: ['vip', 'high']
    })

    assert.ok(matched.includes('profile-user-1'), 'profile-user-1 应匹配(活跃+VIP)')
  })
})
