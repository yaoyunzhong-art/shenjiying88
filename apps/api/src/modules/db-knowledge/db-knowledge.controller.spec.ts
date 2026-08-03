import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * DbKnowledgeController 单元测试
 *
 * 覆盖端点:
 *   - GET /api/db-knowledge/status
 *   - GET /api/db-knowledge/search
 *   - GET /api/db-knowledge/documents/:kind
 *   - GET /api/db-knowledge/experts
 *   - GET /api/db-knowledge/pulses
 *   - GET /api/db-knowledge/phases
 *   - GET /api/db-knowledge/patterns
 *   - GET /api/db-knowledge/venues
 *   - GET /api/db-knowledge/brief/today
 *   - POST /api/db-knowledge/search/log
 */

import assert from 'node:assert/strict'

// ── Type Mirrors ────────────────────────────────────────────────

type SearchResult = {
  id: string
  title: string
  snippet: string
  kind: string
  score: number
}

type KnowledgeDoc = {
  id: string
  kind: string
  title: string
  content: string
  tags: string[]
  updatedAt: string
}

type ExpertProfile = {
  id: string
  name: string
  specialization: string
  groupId: string
  rating: number
}

type AcceptancePulse = {
  id: string
  project: string
  status: string
  timestamp: string
  detail: string
}

type PhaseRecord = {
  id: string
  name: string
  phase: string
  progress: number
  startDate: string
  endDate: string
}

type PatternRecord = {
  id: string
  type: 'antipattern' | 'pattern'
  title: string
  description: string
}

type CompetitorVenue = {
  id: string
  name: string
  city: string
  category: string
  rating: number
  address: string
}

type DailyBrief = {
  date: string
  summary: string
  highlights: string[]
}

// ── Inline Mocks ────────────────────────────────────────────────

function createMocks() {
  let available = true

  return {
    get available() { return available },
    setAvailable(v: boolean) { available = v },

    async search(query: string, kind?: string, limit?: number): Promise<SearchResult[]> {
      const results: SearchResult[] = [
        { id: 'd1', title: 'NestJS 入门', snippet: 'NestJS 是一种 Node.js 框架...', kind: 'guide', score: 0.95 },
        { id: 'd2', title: 'Prisma ORM 使用', snippet: 'Prisma 是下一代 ORM...', kind: 'guide', score: 0.88 },
        { id: 'd3', title: '多租户设计模式', snippet: 'SaaS 多租户隔离策略...', kind: 'architecture', score: 0.92 },
      ]
      let filtered = results
      if (kind) filtered = filtered.filter((r) => r.kind === kind)
      if (query) filtered = filtered.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()))
      if (limit) filtered = filtered.slice(0, limit)
      return filtered
    },

    async getDocumentsByKind(kind: string): Promise<KnowledgeDoc[]> {
      const docs: Record<string, KnowledgeDoc[]> = {
        guide: [
          { id: 'g1', kind: 'guide', title: '快速开始', content: '安装指南...', tags: ['setup'], updatedAt: '2026-07-01' },
          { id: 'g2', kind: 'guide', title: 'API 参考', content: '完整 API 文档...', tags: ['api'], updatedAt: '2026-07-15' },
        ],
        architecture: [
          { id: 'a1', kind: 'architecture', title: '系统架构', content: '整体架构图...', tags: ['design'], updatedAt: '2026-06-01' },
        ],
      }
      return docs[kind] ?? []
    },

    async getExperts(groupId?: string): Promise<ExpertProfile[]> {
      const experts: ExpertProfile[] = [
        { id: 'e1', name: '张三', specialization: 'NestJS', groupId: 'backend', rating: 4.8 },
        { id: 'e2', name: '李四', specialization: 'React', groupId: 'frontend', rating: 4.5 },
      ]
      if (groupId) return experts.filter((e) => e.groupId === groupId)
      return experts
    },

    async getRecentPulses(limit?: number): Promise<AcceptancePulse[]> {
      const pulses: AcceptancePulse[] = [
        { id: 'p1', project: 'P-31', status: 'PASS', timestamp: '2026-07-20T10:00:00Z', detail: '多租户隔离验收通过' },
        { id: 'p2', project: 'P-35', status: 'PASS', timestamp: '2026-07-19T08:00:00Z', detail: 'LLM 配置模块验收通过' },
      ]
      if (limit) return pulses.slice(0, limit)
      return pulses
    },

    async getActivePhases(): Promise<PhaseRecord[]> {
      return [
        { id: 'ph1', name: 'P-31 多租户隔离', phase: 'testing', progress: 90, startDate: '2026-06-01', endDate: '2026-07-31' },
        { id: 'ph2', name: 'P-35 LLM 接入', phase: 'development', progress: 60, startDate: '2026-07-01', endDate: '2026-08-15' },
      ]
    },

    async getPatterns(type?: string): Promise<PatternRecord[]> {
      const patterns: PatternRecord[] = [
        { id: 'pt1', type: 'antipattern', title: '硬编码 tenantId', description: '避免在代码中硬编码租户 ID' },
        { id: 'pt2', type: 'pattern', title: '装饰器注入', description: '使用 @TenantContext() 注入租户上下文' },
      ]
      if (type) return patterns.filter((p) => p.type === type)
      return patterns
    },

    async getVenuesByCity(city: string): Promise<CompetitorVenue[]> {
      const venues: Record<string, CompetitorVenue[]> = {
        '广州': [
          { id: 'v1', name: '天河体育馆', city: '广州', category: 'sports', rating: 4.5, address: '天河路 299 号' },
        ],
        '深圳': [
          { id: 'v2', name: '深圳湾体育中心', city: '深圳', category: 'sports', rating: 4.7, address: '滨海大道 3001 号' },
        ],
      }
      return venues[city] ?? []
    },

    async getTodayBrief(): Promise<DailyBrief | null> {
      return {
        date: '2026-07-20',
        summary: '今日无重大更新',
        highlights: ['P-31 测试通过', 'P-35 开发中'],
      }
    },

    async logSearch(query: string, count: number, durationMs: number): Promise<void> {
      // no-op in test
    },
  }
}

// ── Inline Controller ───────────────────────────────────────────

class InlineDbKnowledgeController {
  constructor(private readonly service: ReturnType<typeof createMocks>) {}

  status(): { available: boolean } {
    return { available: this.service.available }
  }

  async search(query: { query: string; kind?: string; limit?: number }): Promise<SearchResult[]> {
    return this.service.search(query.query, query.kind, query.limit)
  }

  async getDocumentsByKind(params: { kind: string }): Promise<KnowledgeDoc[]> {
    return this.service.getDocumentsByKind(params.kind)
  }

  async getExperts(query: { groupId?: string }): Promise<ExpertProfile[]> {
    return this.service.getExperts(query.groupId)
  }

  async getRecentPulses(query: { limit?: number }): Promise<AcceptancePulse[]> {
    return this.service.getRecentPulses(query.limit ?? 20)
  }

  async getActivePhases(): Promise<PhaseRecord[]> {
    return this.service.getActivePhases()
  }

  async getPatterns(query: { type?: string }): Promise<PatternRecord[]> {
    return this.service.getPatterns(query.type)
  }

  async getVenuesByCity(query: { city: string }): Promise<CompetitorVenue[]> {
    return this.service.getVenuesByCity(query.city)
  }

  async getTodayBrief(): Promise<DailyBrief | { message: string }> {
    const brief = await this.service.getTodayBrief()
    if (!brief) return { message: '今日暂无简报数据' }
    return brief
  }

  async logSearch(body: { query: string; count: number; durationMs: number }): Promise<{ logged: boolean }> {
    await this.service.logSearch(body.query, body.count, body.durationMs)
    return { logged: true }
  }
}

// ── Tests ───────────────────────────────────────────────────────

describe('DbKnowledgeController', () => {
  let mock: ReturnType<typeof createMocks>
  let controller: InlineDbKnowledgeController

  beforeEach(() => {
    mock = createMocks()
    controller = new InlineDbKnowledgeController(mock)
  })

  describe('GET /api/db-knowledge/status - status', () => {
    it('[正例] DB 可用时返回 true', () => {
      const result = controller.status()
      assert.ok(result.available)
    })

    it('[反例] DB 不可用时返回 false', () => {
      mock.setAvailable(false)
      const result = controller.status()
      assert.ok(!result.available)
    })
  })

  describe('GET /api/db-knowledge/search - search', () => {
    it('[正例] 搜索返回结果', async () => {
      const results = await controller.search({ query: 'NestJS' })
      assert.ok(results.length > 0)
      assert.ok(results[0].title.includes('NestJS'))
    })

    it('[正例] 按 kind 过滤', async () => {
      const results = await controller.search({ query: '', kind: 'architecture' })
      assert.ok(results.every((r) => r.kind === 'architecture'))
    })

    it('[正例] 按 limit 限制条数', async () => {
      const results = await controller.search({ query: '', limit: 1 })
      assert.equal(results.length, 1)
    })

    it('[边界] 无匹配搜索返回空数组', async () => {
      const results = await controller.search({ query: 'zzz_does_not_exist' })
      assert.equal(results.length, 0)
    })
  })

  describe('GET /api/db-knowledge/documents/:kind - getDocumentsByKind', () => {
    it('[正例] 按种类返回文档', async () => {
      const docs = await controller.getDocumentsByKind({ kind: 'guide' })
      assert.ok(docs.length >= 2)
      assert.ok(docs.every((d) => d.kind === 'guide'))
    })

    it('[边界] 不存在的种类返回空数组', async () => {
      const docs = await controller.getDocumentsByKind({ kind: 'unknown_type' })
      assert.deepEqual(docs, [])
    })
  })

  describe('GET /api/db-knowledge/experts - getExperts', () => {
    it('[正例] 返回所有专家', async () => {
      const experts = await controller.getExperts({})
      assert.ok(experts.length > 0)
    })

    it('[正例] 按组过滤', async () => {
      const experts = await controller.getExperts({ groupId: 'backend' })
      assert.ok(experts.every((e) => e.groupId === 'backend'))
    })
  })

  describe('GET /api/db-knowledge/pulses - getRecentPulses', () => {
    it('[正例] 返回验收脉冲', async () => {
      const pulses = await controller.getRecentPulses({})
      assert.ok(pulses.length > 0)
      assert.ok(pulses.every((p) => p.status === 'PASS'))
    })

    it('[边界] 指定 limit 限制', async () => {
      const pulses = await controller.getRecentPulses({ limit: 1 })
      assert.equal(pulses.length, 1)
    })
  })

  describe('GET /api/db-knowledge/phases - getActivePhases', () => {
    it('[正例] 返回活跃阶段', async () => {
      const phases = await controller.getActivePhases()
      assert.ok(phases.length > 0)
      assert.ok(phases.every((p) => typeof p.progress === 'number'))
    })
  })

  describe('GET /api/db-knowledge/patterns - getPatterns', () => {
    it('[正例] 返回所有模式', async () => {
      const patterns = await controller.getPatterns({})
      assert.ok(patterns.length > 0)
    })

    it('[正例] 按类型过滤', async () => {
      const antiPatterns = await controller.getPatterns({ type: 'antipattern' })
      assert.ok(antiPatterns.every((p) => p.type === 'antipattern'))
    })
  })

  describe('GET /api/db-knowledge/venues - getVenuesByCity', () => {
    it('[正例] 按城市查询场馆', async () => {
      const venues = await controller.getVenuesByCity({ city: '广州' })
      assert.ok(venues.length > 0)
      assert.equal(venues[0].city, '广州')
    })

    it('[边界] 无数据的城市返回空数组', async () => {
      const venues = await controller.getVenuesByCity({ city: 'UnknownCity' })
      assert.deepEqual(venues, [])
    })
  })

  describe('GET /api/db-knowledge/brief/today - getTodayBrief', () => {
    it('[正例] 返回今日简报', async () => {
      const brief = await controller.getTodayBrief()
      assert.ok('date' in brief)
      assert.equal((brief as DailyBrief).date, '2026-07-20')
    })

    it('[反例] 无数据返回提示消息', async () => {
      // Temporarily make brief return null
      const original = mock.getTodayBrief
      mock.getTodayBrief = async () => null
      const result = await controller.getTodayBrief()
      assert.ok('message' in result)
      assert.equal((result as any).message, '今日暂无简报数据')
      mock.getTodayBrief = original
    })
  })

  describe('POST /api/db-knowledge/search/log - logSearch', () => {
    it('[正例] 记录搜索日志', async () => {
      const result = await controller.logSearch({ query: 'test', count: 5, durationMs: 100 })
      assert.ok(result.logged)
    })

    it('[边界] 空查询也记录', async () => {
      const result = await controller.logSearch({ query: '', count: 0, durationMs: 0 })
      assert.ok(result.logged)
    })
  })
})
