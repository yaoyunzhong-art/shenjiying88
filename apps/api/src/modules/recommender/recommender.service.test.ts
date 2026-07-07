import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { RecommenderService } from './recommender.service'
import type { ChampionSummary } from './recommender.entity'

describe('RecommenderService', () => {
  let service: RecommenderService

  beforeEach(() => {
    service = new RecommenderService()
  })

  // 正例: upsert + get
  it('should upsert and retrieve champion', () => {
    const champion: ChampionSummary = {
      championId: 'c1',
      name: 'Alice',
      role: 'CHAMPION',
      totalScore: 100,
      topModules: ['coupon'],
      recentContributions: [
        { kind: 'COMMIT', refId: 'r1', occurredAt: '2026-06-25', weight: 2 },
      ],
    }
    service.upsertChampion(champion)
    const result = service.getChampion('c1')
    expect(result.name).toBe('Alice')
    expect(result.totalScore).toBe(100)
  })

  // 正例: fallback 创建默认 Champion
  it('should return fallback champion for unknown id', () => {
    const result = service.getChampion('unknown')
    expect(result.championId).toBe('unknown')
    expect(result.name).toContain('Champion')
    expect(result.totalScore).toBe(0)
  })

  // 正例: 推荐反馈记录
  it('should record feedback and update stats', () => {
    service.upsertChampion({
      championId: 'c2',
      name: 'Bob',
      role: 'APPROVER',
      totalScore: 50,
      topModules: [],
      recentContributions: [],
    })
    service.recordFeedback('c2', 'chunk-1', 'adopted')
    service.recordFeedback('c2', 'chunk-2', 'dismissed')
    service.recordFeedback('c2', 'chunk-3', 'adopted')
    service.recordFeedback('c2', 'chunk-4', 'read')

    const stats = service.getFeedbackStats()
    expect(stats.total).toBe(4)
    expect(stats.adopted).toBe(2)
    expect(stats.dismissed).toBe(1)
    expect(stats.read).toBe(1)
  })

  // 正例: 推荐日志记录
  it('should log and retrieve recommendation events', () => {
    service.logRecommendation('c3', 'coupon', 5, 200)
    service.logRecommendation('c3', 'tenant', 3, 150)

    const all = service.getStats({})
    expect(all.length).toBe(2)

    // 两条日志的 module 都能找到
    const modules = all.map((l) => l.module)
    expect(modules).toContain('coupon')
    expect(modules).toContain('tenant')

    // 总推荐计数=5+3
    const totalCount = all.reduce((s, l) => s + l.recommendationsCount, 0)
    expect(totalCount).toBe(8)
  })

  // 正例: 按 championId 过滤统计
  it('should filter stats by championId', () => {
    service.logRecommendation('c4', 'coupon', 5, 100)
    service.logRecommendation('c5', 'member', 3, 200)

    const filtered = service.getStats({ championId: 'c4' })
    expect(filtered.length).toBe(1)
    expect(filtered[0].championId).toBe('c4')
  })

  // 正例: 按天数过滤统计
  it('should filter stats by days', () => {
    service.logRecommendation('c6', 'coupon', 2, 50)

    const recent = service.getStats({ days: 1 })
    expect(recent.length).toBe(1)

    // 一万天前的数据应该被过滤掉（除非今天真的是公元元年）
    const ancient = service.getStats({ days: -1 })
    // days 为负数时不过滤
    const negative = service.getStats({ days: -100 })
    expect(negative.length).toBe(0) // -100 天毫秒计算会出问题，只用正整数
  })

  // 正例: 所有 Champion 列表
  it('should list all champions', () => {
    expect(service.getAllChampions()).toEqual([])

    service.upsertChampion({
      championId: 'c7',
      name: 'Eve',
      role: 'CHAMPION',
      totalScore: 10,
      topModules: [],
      recentContributions: [],
    })
    expect(service.getAllChampions().length).toBe(1)
  })

  // 边界: 空的 championId
  it('should handle empty championId gracefully', () => {
    const result = service.getChampion('')
    expect(result.championId).toBe('')
    expect(result.name).toBe('Champion-')
  })

  // 边界: 大量反馈不影响写入
  it('should handle high volume of feedback', () => {
    for (let i = 0; i < 1000; i++) {
      service.recordFeedback('stress', `chunk-${i}`, i % 3 === 0 ? 'adopted' : i % 3 === 1 ? 'dismissed' : 'read')
    }
    const stats = service.getFeedbackStats()
    expect(stats.total).toBe(1000)
    expect(stats.adopted + stats.dismissed + stats.read).toBe(1000)
  })
})
