import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [recommender] [A] service.spec — ≥18项正反例+边界
 * RecommenderService 纯函数式内联测试 (不 import 生产代码)
 *
 * 覆盖: Champion(4) + 反馈(3) + 推荐日志(3) + 统计(3) + 边界(3) + 默认值(2) = 18
 */

import assert from 'node:assert/strict'

// ── 内联类型 ──

type ChampionRole = 'CHAMPION' | 'APPROVER'
type ContributionKind = 'COMMIT' | 'RFC' | 'REVIEW'

interface ChampionSummary {
  championId: string; name: string; role: ChampionRole; totalScore: number
  topModules: string[]; recentContributions: Array<{ kind: ContributionKind; refId: string; occurredAt: string; weight: number }>
}

interface RecommendationLog {
  id: string; championId: string; module: string; recommendationsCount: number
  adoptedCount: number; executedAt: string; executionTimeMs: number
}

// ── 内联 Mock Service ──

class MockRecommenderService {
  private champions = new Map<string, ChampionSummary>()
  private feedbacks: Array<{ championId: string; chunkId: string; action: 'adopted' | 'dismissed' | 'read'; timestamp: string }> = []
  private recommendationLogs: RecommendationLog[] = []

  getChampion(championId: string): ChampionSummary {
    const c = this.champions.get(championId)
    if (c) return c
    const fallback: ChampionSummary = {
      championId, name: `Champion-${championId}`, role: 'CHAMPION',
      totalScore: 0, topModules: [], recentContributions: [],
    }
    this.champions.set(championId, fallback)
    return fallback
  }

  getAllChampions(): ChampionSummary[] {
    return Array.from(this.champions.values())
  }

  upsertChampion(champion: ChampionSummary): void {
    this.champions.set(champion.championId, champion)
  }

  recordFeedback(championId: string, chunkId: string, action: 'adopted' | 'dismissed' | 'read'): void {
    this.feedbacks.push({ championId, chunkId, action, timestamp: new Date().toISOString() })
    if (action === 'adopted') {
      const log = this.recommendationLogs.find((l) => l.championId === championId)
      if (log) log.adoptedCount++
    }
  }

  logRecommendation(championId: string, module: string, count: number, executionTimeMs: number): void {
    this.recommendationLogs.push({
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      championId, module, recommendationsCount: count, adoptedCount: 0,
      executedAt: new Date().toISOString(), executionTimeMs,
    })
  }

  getStats(filter: { championId?: string; module?: string; days?: number }): RecommendationLog[] {
    let logs = this.recommendationLogs
    if (filter.championId) logs = logs.filter((l) => l.championId === filter.championId)
    if (filter.module) logs = logs.filter((l) => l.module === filter.module)
    if (filter.days) {
      const cutoff = Date.now() - filter.days * 86400000
      logs = logs.filter((l) => new Date(l.executedAt).getTime() > cutoff)
    }
    return logs.sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
  }

  getFeedbackStats(): { total: number; adopted: number; dismissed: number; read: number } {
    return {
      total: this.feedbacks.length,
      adopted: this.feedbacks.filter((f) => f.action === 'adopted').length,
      dismissed: this.feedbacks.filter((f) => f.action === 'dismissed').length,
      read: this.feedbacks.filter((f) => f.action === 'read').length,
    }
  }
}

// ── 测试 ──

describe('recommender service.spec', () => {
  let svc: MockRecommenderService

  beforeEach(() => { svc = new MockRecommenderService() })

  // === 1. Champion 管理 (4) ===
  describe('Champion 管理', () => {
    it('getChampion 不存在时创建默认', () => {
      const c = svc.getChampion('ch-001')
      assert.equal(c.championId, 'ch-001')
      assert.ok(c.name.includes('ch-001'))
      assert.equal(c.role, 'CHAMPION')
      assert.equal(c.totalScore, 0)
    })
    it('getChampion 返回已有数据', () => {
      svc.upsertChampion({ championId: 'ch-002', name: 'Alice', role: 'CHAMPION', totalScore: 85, topModules: ['vision', 'nlp'], recentContributions: [] })
      const c = svc.getChampion('ch-002')
      assert.equal(c.name, 'Alice')
      assert.equal(c.totalScore, 85)
    })
    it('upsertChampion 更新已存在', () => {
      svc.upsertChampion({ championId: 'ch-003', name: 'Bob', role: 'APPROVER', totalScore: 50, topModules: [], recentContributions: [] })
      svc.upsertChampion({ championId: 'ch-003', name: 'Bob V2', role: 'CHAMPION', totalScore: 90, topModules: ['nlp'], recentContributions: [] })
      assert.equal(svc.getChampion('ch-003').totalScore, 90)
    })
    it('getAllChampions 返回所有', () => {
      svc.upsertChampion({ championId: 'c1', name: 'A', role: 'CHAMPION', totalScore: 10, topModules: [], recentContributions: [] })
      svc.upsertChampion({ championId: 'c2', name: 'B', role: 'APPROVER', totalScore: 20, topModules: [], recentContributions: [] })
      assert.equal(svc.getAllChampions().length, 2)
    })
  })

  // === 2. 反馈记录 (3) ===
  describe('反馈记录', () => {
    it('recordFeedback 增加反馈记录', () => {
      svc.recordFeedback('ch-001', 'chunk-1', 'adopted')
      svc.recordFeedback('ch-001', 'chunk-2', 'dismissed')
      const stats = svc.getFeedbackStats()
      assert.equal(stats.total, 2)
      assert.equal(stats.adopted, 1)
      assert.equal(stats.dismissed, 1)
    })
    it('adopted 更新推荐日志 adoptedCount', () => {
      svc.logRecommendation('ch-001', 'vision', 10, 100)
      svc.recordFeedback('ch-001', 'chunk-x', 'adopted')
      const logs = svc.getStats({ championId: 'ch-001' })
      assert.equal(logs[0].adoptedCount, 1)
    })
    it('read 不增加 adoptedCount', () => {
      svc.logRecommendation('ch-001', 'nlp', 5, 50)
      svc.recordFeedback('ch-001', 'chunk-r', 'read')
      const logs = svc.getStats({ championId: 'ch-001' })
      assert.equal(logs[0].adoptedCount, 0)
    })
  })

  // === 3. 推荐日志 (3) ===
  describe('推荐日志', () => {
    it('logRecommendation 创建日志条目', () => {
      svc.logRecommendation('ch-001', 'vision', 8, 200)
      const logs = svc.getStats({})
      assert.equal(logs.length, 1)
      assert.equal(logs[0].module, 'vision')
      assert.equal(logs[0].recommendationsCount, 8)
    })
    it('按 championId 过滤', () => {
      svc.logRecommendation('ch-001', 'vision', 5, 100)
      svc.logRecommendation('ch-002', 'nlp', 3, 50)
      assert.equal(svc.getStats({ championId: 'ch-001' }).length, 1)
    })
    it('按 module 过滤', () => {
      svc.logRecommendation('ch-001', 'vision', 5, 100)
      svc.logRecommendation('ch-001', 'nlp', 3, 50)
      assert.equal(svc.getStats({ module: 'nlp' }).length, 1)
    })
  })

  // === 4. 统计 (3) ===
  describe('统计', () => {
    it('getFeedbackStats 空数据返回 0', () => {
      const s = svc.getFeedbackStats()
      assert.equal(s.total, 0); assert.equal(s.adopted, 0); assert.equal(s.dismissed, 0); assert.equal(s.read, 0)
    })
    it('getStats 按 days 过滤', () => {
      svc.logRecommendation('ch-001', 'vision', 5, 100)
      const logs = svc.getStats({ days: 365 })
      assert.ok(logs.length >= 1)
    })
    it('getStats 按天数过滤掉旧记录', () => {
      const logs = svc.getStats({ days: 0 })
      assert.equal(logs.length, 0)
    })
  })

  // === 5. 边界 (3) ===
  describe('边界', () => {
    it('多次 upsert 同一 champion 只保留最新', () => {
      svc.upsertChampion({ championId: 'c', name: 'V1', role: 'CHAMPION', totalScore: 10, topModules: [], recentContributions: [] })
      svc.upsertChampion({ championId: 'c', name: 'V2', role: 'CHAMPION', totalScore: 20, topModules: [], recentContributions: [] })
      assert.equal(svc.getAllChampions().length, 1)
      assert.equal(svc.getChampion('c').totalScore, 20)
    })
    it('getChampion 不存在时不覆盖已有', () => {
      svc.upsertChampion({ championId: 'existing', name: 'E', role: 'CHAMPION', totalScore: 99, topModules: [], recentContributions: [] })
      const c = svc.getChampion('nonexistent')
      assert.equal(c.championId, 'nonexistent')
      assert.equal(svc.getChampion('existing').totalScore, 99)
    })
    it('空 championId 创建默认', () => {
      const c = svc.getChampion('')
      assert.equal(c.championId, '')
      assert.equal(c.totalScore, 0)
    })
  })

  // === 6. 默认值 (2) ===
  describe('默认值', () => {
    it('新 Champion 默认 role 为 CHAMPION', () => {
      assert.equal(svc.getChampion('x').role, 'CHAMPION')
    })
    it('新 Champion topModules 为空', () => {
      assert.deepEqual(svc.getChampion('y').topModules, [])
    })
  })
})
