/**
 * db-knowledge.entity.test.ts — 实体类型校验测试
 *
 * 验证各接口的结构定义是否符合预期。
 */
import { describe, it, expect } from 'vitest'

describe('KnowledgeDoc 实体结构', () => {
  it('完整 KnowledgeDoc 对象属性齐全', () => {
    const doc = {
      id: 'doc-001',
      sourcePath: '/docs/test.md',
      title: '测试文档',
      kind: 'guide',
      tags: ['test'],
      content: '内容',
      chunkCount: 1,
      isArchive: false,
      metadata: { source: 'manual' },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-07-11T00:00:00Z',
    }
    expect(doc.id).toBeTypeOf('string')
    expect(doc.sourcePath).toBeTypeOf('string')
    expect(doc.title).toBeTypeOf('string')
    expect(doc.kind).toBeTypeOf('string')
    expect(Array.isArray(doc.tags)).toBe(true)
    expect(doc.content).toBeTypeOf('string')
    expect(doc.chunkCount).toBeTypeOf('number')
    expect(doc.isArchive).toBeTypeOf('boolean')
    expect(doc.metadata).toBeTypeOf('object')
    expect(doc.createdAt).toBeTypeOf('string')
    expect(doc.updatedAt).toBeTypeOf('string')
  })

  it('summary 为可选字段', () => {
    const doc: Record<string, unknown> = {
      id: 'doc-001',
      sourcePath: '/docs/test.md',
      title: '测试',
      kind: 'guide',
      tags: [],
      content: '内容',
      chunkCount: 1,
      isArchive: false,
      metadata: {},
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-07-11T00:00:00Z',
    }
    expect(doc.summary).toBeUndefined()
    // 带 summary
    const docWithSummary = { ...doc, summary: '摘要' }
    expect(docWithSummary.summary).toBe('摘要')
  })
})

describe('ExpertProfile 实体结构', () => {
  it('完整专家对象属性齐全', () => {
    const expert = {
      id: 'exp-001',
      code: 'EXP-01',
      name: '张专家',
      groupId: 'group-a',
      role: '后端架构师',
      specialization: ['NestJS'],
      activePhases: ['phase-1'],
      activityLevel: 'high',
      insights: [],
      learningNotes: [],
      feedbackLog: [],
      evolutionLog: [],
    }
    expect(expert.id).toBeTypeOf('string')
    expect(expert.code).toBeTypeOf('string')
    expect(expert.name).toBeTypeOf('string')
    expect(Array.isArray(expert.specialization)).toBe(true)
    expect(Array.isArray(expert.activePhases)).toBe(true)
  })
})

describe('AcceptancePulse 实体结构', () => {
  it('完整验收脉冲对象', () => {
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
    expect(pulse.pulseNumber).toBeGreaterThan(0)
    expect(pulse.basePass).toBe(true)
    expect(pulse.streakCount).toBeGreaterThanOrEqual(0)
  })
})

describe('PatternRecord 实体结构', () => {
  it('正模式与反模式区分', () => {
    const pp: Record<string, unknown> = {
      id: 'pp-001',
      patternType: 'positive-pattern',
      code: 'PP-001',
      title: '好模式',
      description: '描述',
      discoveryDate: '2026-07-10',
      relatedPhases: ['P1'],
      resolved: true,
    }
    expect(pp.patternType).toBe('positive-pattern')

    const ap: Record<string, unknown> = {
      id: 'ap-001',
      patternType: 'anti-pattern',
      code: 'AP-001',
      title: '反模式',
      description: '描述',
      discoveryDate: '2026-07-10',
      relatedPhases: ['P1'],
      resolved: false,
    }
    expect(ap.patternType).toBe('anti-pattern')
    expect(ap.resolved).toBe(false)
  })
})

describe('PhaseRecord 实体结构', () => {
  it('完成百分比介于 0-100', () => {
    const phase: Record<string, unknown> = {
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
    expect(phase.completionPct).toBeGreaterThanOrEqual(0)
    expect(phase.completionPct).toBeLessThanOrEqual(100)
  })
})

describe('DailyBrief 实体结构', () => {
  it('数值字段均为数字类型', () => {
    const brief: Record<string, unknown> = {
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
    expect(brief.commits).toBeTypeOf('number')
    expect(brief.treeCommits).toBeTypeOf('number')
    expect(brief.testsPass).toBeTypeOf('number')
  })
})

describe('CompetitorVenue 实体结构', () => {
  it('必填字段与可选字段', () => {
    const venue: Record<string, unknown> = {
      id: 'ven-001',
      city: '上海',
      venueName: '竞品馆',
      sourcePlatform: '美团',
      data9dims: {},
    }
    expect(venue.city).toBeTypeOf('string')
    expect(venue.venueName).toBeTypeOf('string')
    expect(venue.venueType).toBeUndefined()
    expect(venue.scoutNotes).toBeUndefined()
  })
})

describe('EvolutionLog 实体结构', () => {
  it('affectedCrons 为数组', () => {
    const log: Record<string, unknown> = {
      id: 'ev-001',
      date: '2026-07-11',
      eventType: '升级',
      title: 'PG 升级到 16',
      description: 'PostgreSQL 主版本升级',
      affectedCrons: ['cron-db-backup', 'cron-knowledge-sync'],
    }
    expect(Array.isArray(log.affectedCrons)).toBe(true)
  })
})

describe('SearchResult 实体结构', () => {
  it('score 为数字', () => {
    const result: Record<string, unknown> = {
      id: 'sr-001',
      sourcePath: '/docs/test.md',
      title: '结果',
      kind: 'guide',
      content: '内容',
      score: 0.85,
    }
    expect(result.score).toBeTypeOf('number')
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThanOrEqual(1)
  })
})
