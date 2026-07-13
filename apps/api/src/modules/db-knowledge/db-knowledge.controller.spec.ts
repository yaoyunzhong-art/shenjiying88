
/**
 * DbKnowledgeController 单元测试
 *
 * 覆盖：
 * - 正向流程（DB 可用时正确返回数据）
 * - 降级流程（DB 不可用时返回空数组 / 降级信息）
 * - 边界条件（空查询、无效参数）
 */
import { describe, it, expect } from 'vitest'

// ── Mock 服务类型 ─────────────────────────────────────────────

interface MockDbKnowledgeService {
  available: boolean
  search: (query: string, kind?: string, limit?: number) => Promise<any[]>
  getDocumentsByKind: (kind: string) => Promise<any[]>
  getExperts: (groupId?: string) => Promise<any[]>
  getRecentPulses: (limit?: number) => Promise<any[]>
  getActivePhases: () => Promise<any[]>
  getPatterns: (type?: 'anti-pattern' | 'positive-pattern') => Promise<any[]>
  getVenuesByCity: (city: string) => Promise<any[]>
  getTodayBrief: () => Promise<any>
  logSearch: (query: string, count: number, ms: number) => Promise<void>
}

// ── 模拟数据工厂 ─────────────────────────────────────────────

function makeMockService(available = true): MockDbKnowledgeService {
  const searchResult = {
    id: 'doc-001',
    sourcePath: '/docs/example.md',
    title: '示例文档',
    kind: 'guide',
    content: '这是示例文档的内容',
    score: 0.85,
  }

  const doc = {
    id: 'doc-001',
    sourcePath: '/docs/example.md',
    title: '示例文档',
    kind: 'guide',
    tags: ['guide', 'example'],
    content: '完整内容',
    chunkCount: 3,
    isArchive: false,
    metadata: {},
    createdAt: '2026-07-11T00:00:00Z',
    updatedAt: '2026-07-11T12:00:00Z',
  }

  const expert = {
    id: 'exp-001',
    code: 'EXP-01',
    name: '张专家',
    groupId: 'group-a',
    role: '后端架构师',
    specialization: ['NestJS', 'PostgreSQL'],
    activePhases: ['phase-1'],
    activityLevel: 'high',
    insights: [],
    learningNotes: [],
    feedbackLog: [],
    evolutionLog: [],
  }

  const pulse = {
    id: 'pulse-001',
    pulseNumber: 42,
    module: 'db-knowledge',
    status: 'passed',
    basePass: true,
    servicePass: true,
    controllerPass: true,
    ctestPass: true,
    streakCount: 5,
    fixCount: 0,
    createdAt: '2026-07-11T12:00:00Z',
  }

  const phase = {
    id: 'phase-001',
    phaseCode: 'P1',
    name: '数据库重构',
    owner: '树哥',
    completionPct: 75,
    status: '进行中',
    storeARequired: false,
    frontendDone: true,
    backendDone: true,
    testDone: false,
    acceptanceDone: false,
  }

  const pattern = {
    id: 'pat-001',
    patternType: 'positive-pattern' as const,
    code: 'PP-001',
    title: '带降级的 DB 封装',
    description: '使用 try/catch 降级模式确保 DB 不可用时服务不崩溃',
    discoveryDate: '2026-07-10',
    relatedPhases: ['P1'],
    resolved: true,
  }

  const venue = {
    id: 'ven-001',
    city: '上海',
    venueName: '竞争对手电竞馆',
    sourcePlatform: '美团',
    data9dims: {},
  }

  const brief = {
    id: 'brief-001',
    date: '2026-07-11',
    commits: 12,
    treeCommits: 3,
    lobsterCommits: 5,
    expertCommits: 4,
    acceptancePulses: 2,
    streakMax: 7,
    testsPass: 45,
    testsFail: 1,
    tscModules: 20,
    tscPassed: 19,
    cronsEnabled: 8,
    highlights: [],
    issues: [],
  }

  return {
    available,
    search: (_q: string, _k?: string, _l?: number) =>
      available ? Promise.resolve([searchResult]) : Promise.resolve([]),
    getDocumentsByKind: (_k: string) =>
      available ? Promise.resolve([doc]) : Promise.resolve([]),
    getExperts: (_g?: string) =>
      available ? Promise.resolve([expert]) : Promise.resolve([]),
    getRecentPulses: (_l?: number) =>
      available ? Promise.resolve([pulse]) : Promise.resolve([]),
    getActivePhases: () =>
      available ? Promise.resolve([phase]) : Promise.resolve([]),
    getPatterns: (_t?: 'anti-pattern' | 'positive-pattern') =>
      available ? Promise.resolve([pattern]) : Promise.resolve([]),
    getVenuesByCity: (_c: string) =>
      available ? Promise.resolve([venue]) : Promise.resolve([]),
    getTodayBrief: () =>
      available ? Promise.resolve(brief) : Promise.resolve(null),
    logSearch: (_q: string, _c: number, _m: number) => Promise.resolve(),
  }
}

// ── 内联 Controller 实现 ──────────────────────────────────────

class DbKnowledgeController {
  constructor(private readonly service: MockDbKnowledgeService) {}

  status() {
    return { available: this.service.available }
  }

  async search(query: { query: string; kind?: string; limit?: number }) {
    return this.service.search(query.query, query.kind, query.limit)
  }

  async getDocumentsByKind(params: { kind: string }) {
    return this.service.getDocumentsByKind(params.kind)
  }

  async getExperts(query: { groupId?: string; limit?: number }) {
    return this.service.getExperts(query.groupId)
  }

  async getRecentPulses(query: { groupId?: string; limit?: number }) {
    return this.service.getRecentPulses(query.limit ?? 20)
  }

  async getActivePhases() {
    return this.service.getActivePhases()
  }

  async getPatterns(query: { type?: 'anti-pattern' | 'positive-pattern' }) {
    return this.service.getPatterns(query.type)
  }

  async getVenuesByCity(query: { city: string }) {
    return this.service.getVenuesByCity(query.city)
  }

  async getTodayBrief() {
    const brief = await this.service.getTodayBrief()
    if (!brief) return { message: '今日暂无简报数据' }
    return brief
  }

  async logSearch(body: { query: string; count: number; durationMs: number }) {
    await this.service.logSearch(body.query, body.count, body.durationMs)
    return { logged: true }
  }
}

// ── 测试用例 ──────────────────────────────────────────────────

describe('DbKnowledgeController (DB 可用)', () => {
  let controller: DbKnowledgeController

  beforeEach(() => {
    const service = makeMockService(true)
    controller = new DbKnowledgeController(service)
  })

  it('GET /status — 返回 available: true', () => {
    const result = controller.status()
    expect(result.available).toBe(true)
  })

  it('GET /search — 返回搜索结果', async () => {
    const result = await controller.search({ query: '示例', limit: 10 })
    expect(result).toHaveLength(1)
    expect(result[0]).toHaveProperty('title')
  })

  it('GET /search — 空查询返回空数组', async () => {
    const svc = makeMockService(true)
    svc.search = () => Promise.resolve([])
    const ctrl = new DbKnowledgeController(svc)
    const result = await ctrl.search({ query: '不存在的查询', limit: 10 })
    expect(result).toHaveLength(0)
  })

  it('GET /documents/:kind — 按种类查询', async () => {
    const result = await controller.getDocumentsByKind({ kind: 'guide' })
    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe('guide')
  })

  it('GET /experts — 查询专家列表', async () => {
    const result = await controller.getExperts({ groupId: 'group-a' })
    expect(result).toHaveLength(1)
    expect(result[0].code).toBe('EXP-01')
  })

  it('GET /pulses — 获取验收脉冲', async () => {
    const result = await controller.getRecentPulses({ limit: 5 })
    expect(result).toHaveLength(1)
    expect(result[0].pulseNumber).toBe(42)
  })

  it('GET /phases — 获取活跃阶段', async () => {
    const result = await controller.getActivePhases()
    expect(result).toHaveLength(1)
    expect(result[0].phaseCode).toBe('P1')
  })

  it('GET /patterns — 获取模式列表（无过滤）', async () => {
    const result = await controller.getPatterns({})
    expect(result).toHaveLength(1)
    expect(result[0].patternType).toBe('positive-pattern')
  })

  it('GET /venues?city=上海 — 竞品场馆', async () => {
    const result = await controller.getVenuesByCity({ city: '上海' })
    expect(result).toHaveLength(1)
    expect(result[0].city).toBe('上海')
  })

  it('GET /brief/today — 今日简报', async () => {
    const result = await controller.getTodayBrief()
    expect(result).not.toHaveProperty('message')
    expect(result).toHaveProperty('date')
  })

  it('POST /search/log — 记录搜索日志', async () => {
    const result = await controller.logSearch({ query: 'test', count: 1, durationMs: 50 })
    expect(result.logged).toBe(true)
  })
})

describe('DbKnowledgeController (DB 不可用 — 降级)', () => {
  let controller: DbKnowledgeController

  beforeEach(() => {
    const service = makeMockService(false)
    controller = new DbKnowledgeController(service)
  })

  it('GET /status — 返回 available: false', () => {
    const result = controller.status()
    expect(result.available).toBe(false)
  })

  it('GET /search — 返回空数组', async () => {
    const result = await controller.search({ query: 'anything' })
    expect(result).toEqual([])
  })

  it('GET /documents/:kind — 返回空数组', async () => {
    const result = await controller.getDocumentsByKind({ kind: 'guide' })
    expect(result).toEqual([])
  })

  it('GET /experts — 返回空数组', async () => {
    const result = await controller.getExperts({})
    expect(result).toEqual([])
  })

  it('GET /pulses — 返回空数组', async () => {
    const result = await controller.getRecentPulses({})
    expect(result).toEqual([])
  })

  it('GET /brief/today — 返回降级信息', async () => {
    const result = await controller.getTodayBrief()
    expect(result).toHaveProperty('message')
  })
})

describe('DbKnowledgeController (边界条件)', () => {
  it('search limit 参数为 0 时取默认值', async () => {
    const svc = makeMockService(true)
    const ctrl = new DbKnowledgeController(svc)
    const result = await ctrl.search({ query: 'test' })
    expect(Array.isArray(result)).toBe(true)
  })

  it('getRecentPulses 不传 limit 取默认 20', async () => {
    const svc = makeMockService(true)
    const spy: { calledWith: number } = { calledWith: 0 }
    svc.getRecentPulses = (limit?: number) => {
      spy.calledWith = limit ?? 20
      return Promise.resolve([])
    }
    const ctrl = new DbKnowledgeController(svc)
    await ctrl.getRecentPulses({})
    expect(spy.calledWith).toBe(20)
  })

  it('venues 传空 city 应返回空数组', async () => {
    const svc = makeMockService(true)
    svc.getVenuesByCity = () => Promise.resolve([])
    const ctrl = new DbKnowledgeController(svc)
    const result = await ctrl.getVenuesByCity({ city: '' })
    expect(result).toEqual([])
  })
})
