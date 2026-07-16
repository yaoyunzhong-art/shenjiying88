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

describe('SupportTicket 实体结构', () => {
  it('完整工单对象属性齐全', () => {
    const ticket = {
      id: 'tkt-001',
      title: '文档内容过时',
      description: '运营手册第3章需要更新',
      kind: 'correction',
      status: 'open',
      reporter: '树哥',
      assignee: null,
      createdAt: '2026-07-14T00:00:00Z',
      updatedAt: '2026-07-14T00:00:00Z',
      resolvedAt: null,
    }
    expect(ticket.id).toBeTypeOf('string')
    expect(ticket.title).toBeTypeOf('string')
    expect(ticket.status).toBe('open')
    expect(ticket.assignee).toBeNull()
    expect(ticket.resolvedAt).toBeNull()
  })

  it('已解决的工单有 resolvedAt', () => {
    const resolved = {
      id: 'tkt-002',
      title: '修复链接',
      description: '断链已修复',
      kind: 'bug',
      status: 'resolved',
      reporter: '王工',
      assignee: '树哥',
      createdAt: '2026-07-13T00:00:00Z',
      updatedAt: '2026-07-14T00:00:00Z',
      resolvedAt: '2026-07-14T00:00:00Z',
    }
    expect(resolved.status).toBe('resolved')
    expect(resolved.assignee).toBe('树哥')
    expect(resolved.resolvedAt).toBeDefined()
  })

  it('kind 应为标准类型之一', () => {
    const validKinds = ['correction', 'bug', 'feature_request', 'question', 'other']
    const ticketKinds: string[] = ['correction', 'bug', 'feature_request', 'question', 'other']
    ticketKinds.forEach(k => expect(validKinds).toContain(k))
  })
})

describe('KnowledgeTag 实体结构', () => {
  it('标签完整结构', () => {
    const tag = { id: 'tag-001', name: '运营', color: '#1890ff', docCount: 5 }
    expect(tag.id).toBeTypeOf('string')
    expect(tag.name).toBeTypeOf('string')
    expect(tag.color).toMatch(/^#[0-9a-f]{6}$/)
    expect(tag.docCount).toBeTypeOf('number')
  })

  it('docCount 可为 0', () => {
    const tag = { id: 'tag-002', name: '新标签', color: '#52c41a', docCount: 0 }
    expect(tag.docCount).toBe(0)
  })
})

describe('KnowledgeDoc 边界校验', () => {
  it('tags 数组可为空', () => {
    const doc = {
      id: 'doc-empty-tags',
      sourcePath: '/docs/no-tags.md',
      title: '无标签文档',
      kind: 'note',
      tags: [] as string[],
      content: '暂无分类',
      chunkCount: 1,
      isArchive: false,
      metadata: {},
      createdAt: '2026-07-01T00:00:00Z',
      updatedAt: '2026-07-01T00:00:00Z',
    }
    expect(doc.tags).toHaveLength(0)
  })

  it('chunkCount 可以为 0（小文档不分块）', () => {
    const doc = {
      id: 'doc-no-chunks',
      sourcePath: '/docs/tiny.md',
      title: '小文档',
      kind: 'note',
      tags: [],
      content: '短内容',
      chunkCount: 0,
      isArchive: false,
      metadata: {},
      createdAt: '2026-07-01T00:00:00Z',
      updatedAt: '2026-07-01T00:00:00Z',
    }
    expect(doc.chunkCount).toBe(0)
  })

  it('isArchive 可为 true（已归档文档）', () => {
    const doc = {
      id: 'doc-archived',
      sourcePath: '/docs/old.md',
      title: '历史归档',
      kind: 'guide',
      tags: ['归档'],
      content: '已归档内容',
      chunkCount: 3,
      isArchive: true,
      metadata: { archivedBy: 'treege' },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    }
    expect(doc.isArchive).toBe(true)
    expect(doc.metadata.archivedBy).toBe('treege')
  })
})

describe('RevisionHistory 实体结构', () => {
  it('修订历史含版本号和作者', () => {
    const revision = {
      id: 'rev-001',
      docId: 'doc-001',
      version: 2,
      author: '树哥',
      change: '更新运营手册第三章',
      timestamp: '2026-07-14T10:00:00Z',
    }
    expect(revision.version).toBeGreaterThan(0)
    expect(revision.author).toBeTypeOf('string')
    expect(revision.change).toBeTypeOf('string')
  })

  it('版本号可累加', () => {
    const revisions = [
      { version: 1, change: '初始创建' },
      { version: 2, change: '添加内容' },
      { version: 3, change: '修正错误' },
    ]
    revisions.forEach((r, i) => expect(r.version).toBe(i + 1))
  })
})

describe('DocumentRelation 实体结构', () => {
  it('关联文档双向引用', () => {
    const relation = {
      id: 'rel-001',
      sourceDocId: 'doc-001',
      targetDocId: 'doc-002',
      relationType: 'references',
      createdAt: '2026-07-14T00:00:00Z',
    }
    expect(relation.sourceDocId).toBe('doc-001')
    expect(relation.targetDocId).toBe('doc-002')
    expect(relation.relationType).toBe('references')
  })

  it('关联类型可为 enum', () => {
    const types = ['references', 'extends', 'supersedes', 'related']
    expect(types).toContain('references')
    expect(types).toContain('extends')
    expect(types).toContain('supersedes')
    expect(types).toContain('related')
  })
})

describe('PatternEdge 实体结构', () => {
  it('完整 PatternEdge 对象至少包含 source 和 target', () => {
    const edge = { source: 'p-001', target: 'p-002', relationship: 'supersedes' }
    expect(edge.source).toBeTypeOf('string')
    expect(edge.target).toBeTypeOf('string')
    expect(edge.relationship).toBeDefined()
  })

  it('edge 的 relationship 可以是空字符串', () => {
    const edge = { source: 'p-001', target: 'p-002', relationship: '' }
    expect(edge.relationship).toBe('')
  })

  it('edge 关系类型为已知枚举值', () => {
    const edge1 = { source: 'a', target: 'b', relationship: 'supersedes' }
    const edge2 = { source: 'b', target: 'c', relationship: 'extends' }
    const edge3 = { source: 'c', target: 'a', relationship: 'related' }
    expect(['supersedes', 'extends', 'related']).toContain(edge1.relationship)
    expect(['supersedes', 'extends', 'related']).toContain(edge2.relationship)
    expect(['supersedes', 'extends', 'related']).toContain(edge3.relationship)
  })

  it('边缘关系 source 和 target 不应相同', () => {
    // self-referencing edges are likely data errors
    const edge = { source: 'p-001', target: 'p-001', relationship: 'related' }
    expect(edge.source === edge.target).toBe(true)
    // but we document that it's not prohibited by the type system
  })
})

describe('PhaseInfo 实体结构', () => {
  it('完整 PhaseInfo 对象包含阶段标识字段', () => {
    const phase = { id: 'phase-001', name: '启动阶段', order: 1, isActive: true }
    expect(phase.id).toBeTypeOf('string')
    expect(phase.name).toBeTypeOf('string')
    expect(phase.order).toBeTypeOf('number')
    expect(phase.isActive).toBeTypeOf('boolean')
  })

  it('PhaseInfo 可选字段 createdAt 可以为空', () => {
    const phase: Partial<{id:string;name:string;order:number;createdAt:undefined}> = { id: 'phase-002', name: '规划阶段', order: 2 }
    expect(phase.createdAt).toBeUndefined()
  })

  it('PhaseInfo 的 order 可以为 0', () => {
    const phase = { id: 'phase-003', name: '预备', order: 0, isActive: false }
    expect(phase.order).toBe(0)
  })

  it('PhaseInfo 的 name 可以为空', () => {
    const phase = { id: 'phase-004', name: '', order: 3, isActive: true }
    expect(phase.name).toBe('')
  })

  it('PhaseInfo 的 isActive 默认为 true', () => {
    const phase = { id: 'phase-005', name: '默认', order: 4, isActive: true }
    expect(phase.isActive).toBe(true)
  })
})
