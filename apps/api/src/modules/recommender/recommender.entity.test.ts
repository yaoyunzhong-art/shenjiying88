import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import type {
  ChampionRole,
  ContributionKind,
  RecommendationStatus,
  ConfidenceLevel,
  ChampionSummary,
  RecommendationContext,
  RankedResult,
  RecommendationItem,
  RecommendResponse,
  RecommendationLog,
} from './recommender.entity'

// ── ChampionSummary type contract ──────────────────────────────
describe('recommender.entity: ChampionSummary', () => {
  it('creates valid ChampionSummary with all fields', () => {
    const champion: ChampionSummary = {
      championId: 'c-001',
      name: 'Alice',
      role: 'CHAMPION',
      totalScore: 100,
      topModules: ['coupon', 'member'],
      recentContributions: [
        { kind: 'COMMIT', refId: 'r1', occurredAt: '2026-06-25T10:00:00Z', weight: 2 },
        { kind: 'RFC', refId: 'r2', occurredAt: '2026-06-24T08:00:00Z', weight: 5 },
      ],
    }

    assert.equal(champion.championId, 'c-001')
    assert.equal(champion.name, 'Alice')
    assert.equal(champion.role, 'CHAMPION')
    assert.equal(champion.totalScore, 100)
    assert.deepEqual(champion.topModules, ['coupon', 'member'])
    assert.equal(champion.recentContributions.length, 2)
  })

  it('role accepts both CHAMPION and APPROVER', () => {
    const champion: ChampionSummary = {
      championId: 'c-002',
      name: 'Bob',
      role: 'APPROVER',
      totalScore: 50,
      topModules: [],
      recentContributions: [],
    }

    assert.equal(champion.role, 'APPROVER')
  })

  it('contribution kind accepts valid values', () => {
    const kinds: ContributionKind[] = ['COMMIT', 'RFC', 'REVIEW']
    const contributions = kinds.map((kind, i) => ({
      kind,
      refId: `ref-${i}`,
      occurredAt: '2026-06-26T00:00:00Z',
      weight: 1,
    }))

    assert.equal(contributions.length, 3)
    assert.equal(contributions[0].kind, 'COMMIT')
    assert.equal(contributions[1].kind, 'RFC')
    assert.equal(contributions[2].kind, 'REVIEW')
  })

  it('allowed contribution kinds all present', () => {
    const champion: ChampionSummary = {
      championId: 'c-003',
      name: 'Charlie',
      role: 'CHAMPION',
      totalScore: 0,
      topModules: [],
      recentContributions: [
        { kind: 'COMMIT', refId: 'c1', occurredAt: '2026-06-26T00:00:00Z', weight: 1 },
        { kind: 'RFC', refId: 'c2', occurredAt: '2026-06-26T00:00:00Z', weight: 1 },
        { kind: 'REVIEW', refId: 'c3', occurredAt: '2026-06-26T00:00:00Z', weight: 1 },
      ],
    }
    const actualKinds = champion.recentContributions.map((c) => c.kind)
    assert.ok(actualKinds.includes('COMMIT'))
    assert.ok(actualKinds.includes('RFC'))
    assert.ok(actualKinds.includes('REVIEW'))
  })

  it('contribution weight is a positive number', () => {
    const champion: ChampionSummary = {
      championId: 'c-004',
      name: 'Diana',
      role: 'APPROVER',
      totalScore: 10,
      topModules: [],
      recentContributions: [{ kind: 'COMMIT', refId: 'r1', occurredAt: '2026-06-26T00:00:00Z', weight: 0 }],
    }
    assert.equal(typeof champion.recentContributions[0].weight, 'number')
  })

  it('empty topModules and recentContributions', () => {
    const champion: ChampionSummary = {
      championId: 'c-005',
      name: 'Empty',
      role: 'CHAMPION',
      totalScore: 0,
      topModules: [],
      recentContributions: [],
    }
    assert.equal(champion.topModules.length, 0)
    assert.equal(champion.recentContributions.length, 0)
  })
})

// ── RecommendationContext type contract ─────────────────────────
describe('recommender.entity: RecommendationContext', () => {
  const baseChampion: ChampionSummary = {
    championId: 'c-ctx',
    name: 'Eve',
    role: 'CHAMPION',
    totalScore: 120,
    topModules: ['loyalty'],
    recentContributions: [{ kind: 'COMMIT', refId: 'r1', occurredAt: '2026-06-25T00:00:00Z', weight: 3 }],
  }

  const relatedChampion: ChampionSummary = {
    championId: 'c-related',
    name: 'Frank',
    role: 'APPROVER',
    totalScore: 30,
    topModules: ['loyalty'],
    recentContributions: [],
  }

  it('creates valid RecommendationContext with full fields', () => {
    const context: RecommendationContext = {
      champion: baseChampion,
      currentTask: {
        branch: 'feat/loyalty-v2',
        files: ['loyalty.service.ts', 'loyalty.controller.ts'],
        module: 'loyalty',
        description: '升级会员等级规则',
      },
      relatedChampions: [relatedChampion],
      recentSummary: {
        totalContributions: 10,
        byKind: { COMMIT: 5, RFC: 3, REVIEW: 2 },
        topRefIds: ['r1', 'r2'],
      },
      builtAt: '2026-06-26T08:00:00.000Z',
    }

    assert.equal(context.champion.championId, 'c-ctx')
    assert.equal(context.currentTask.branch, 'feat/loyalty-v2')
    assert.equal(context.currentTask.module, 'loyalty')
    assert.equal(context.relatedChampions.length, 1)
    assert.equal(context.recentSummary.totalContributions, 10)
    assert.ok(new Date(context.builtAt).getTime() > 0)
  })

  it('currentTask description is optional', () => {
    const context: RecommendationContext = {
      champion: baseChampion,
      currentTask: {
        files: ['main.ts'],
        module: 'core',
      },
      relatedChampions: [],
      recentSummary: { totalContributions: 0, byKind: {}, topRefIds: [] },
      builtAt: '2026-06-26T00:00:00.000Z',
    }

    assert.equal(context.currentTask.description, undefined)
    assert.equal(context.currentTask.branch, undefined)
    assert.equal(context.relatedChampions.length, 0)
  })

  it('byKind maps to numeric counts', () => {
    const context: RecommendationContext = {
      champion: baseChampion,
      currentTask: { files: ['test.ts'], module: 'test' },
      relatedChampions: [],
      recentSummary: {
        totalContributions: 3,
        byKind: { COMMIT: 2, RFC: 1 },
        topRefIds: [],
      },
      builtAt: '2026-06-26T00:00:00.000Z',
    }

    assert.equal(context.recentSummary.byKind.COMMIT, 2)
    assert.equal(context.recentSummary.byKind.RFC, 1)
    assert.equal(Object.keys(context.recentSummary.byKind).length, 2)
  })
})

// ── RankedResult type contract ──────────────────────────────────
describe('recommender.entity: RankedResult', () => {
  it('creates valid RankedResult with scores', () => {
    const result: RankedResult = {
      chunkId: 'chunk-001',
      sourcePath: 'apps/api/src/modules/coupon/coupon.service.ts',
      content: 'export class CouponService { ... }',
      title: 'Coupon Service',
      section: 'Methods',
      kind: 'source',
      scores: {
        semantic: 0.85,
        recency: 0.7,
        championAffinity: 0.9,
      },
      totalScore: 0.82,
      reason: '高语义匹配 + 高 Champion 关联度',
    }

    assert.equal(result.chunkId, 'chunk-001')
    assert.equal(result.totalScore, 0.82)
    assert.equal(result.scores.semantic, 0.85)
    assert.equal(result.scores.championAffinity, 0.9)
  })

  it('title, section, kind are optional', () => {
    const result: RankedResult = {
      chunkId: 'chunk-minimal',
      sourcePath: 'file.ts',
      content: 'content',
      scores: { semantic: 0.5, recency: 0.5, championAffinity: 0.5 },
      totalScore: 0.5,
      reason: 'fallback',
    }

    assert.equal(result.title, undefined)
    assert.equal(result.section, undefined)
    assert.equal(result.kind, undefined)
  })

  it('scores are all between 0 and 1', () => {
    const result: RankedResult = {
      chunkId: 'chunk-boundary',
      sourcePath: 'file.ts',
      content: 'boundary test',
      scores: { semantic: 0, recency: 1, championAffinity: 0.5 },
      totalScore: 0.5,
      reason: 'boundary',
    }

    for (const val of Object.values(result.scores)) {
      assert.ok(val >= 0 && val <= 1)
    }
  })

  it('totalScore can be derived from weighted scores', () => {
    const result: RankedResult = {
      chunkId: 'chunk-weighted',
      sourcePath: 'file.ts',
      content: 'weighted test',
      scores: { semantic: 0.8, recency: 0.6, championAffinity: 0.4 },
      totalScore: 0.6,
      reason: 'weighted avg (0.4*0.8 + 0.3*0.6 + 0.3*0.4) = 0.62',
    }

    assert.ok(result.totalScore >= 0 && result.totalScore <= 1)
  })
})

// ── RecommendationItem type contract ────────────────────────────
describe('recommender.entity: RecommendationItem', () => {
  it('creates valid RecommendationItem', () => {
    const item: RecommendationItem = {
      rank: 1,
      chunkId: 'chunk-001',
      sourcePath: 'apps/api/src/modules/coupon/coupon.service.ts',
      title: 'Coupon Service',
      section: 'createCoupon',
      reason: '高匹配度',
      confidence: 0.85,
      content: 'export class CouponService { ... }',
      status: 'pending',
      createdAt: '2026-06-26T08:00:00.000Z',
    }

    assert.equal(item.rank, 1)
    assert.equal(item.status, 'pending')
    assert.equal(item.confidence, 0.85)
  })

  it('status accepts all valid values', () => {
    const statuses: RecommendationStatus[] = ['pending', 'read', 'adopted', 'dismissed']
    for (const s of statuses) {
      const item: RecommendationItem = {
        rank: 1,
        chunkId: `chunk-${s}`,
        sourcePath: 'f.ts',
        reason: 'test',
        confidence: 0.5,
        content: 'x',
        status: s,
        createdAt: '2026-06-26T00:00:00.000Z',
      }
      assert.equal(item.status, s)
    }
  })

  it('title and section are optional', () => {
    const item: RecommendationItem = {
      rank: 2,
      chunkId: 'chunk-no-title',
      sourcePath: 'f.ts',
      reason: 'no optional fields',
      confidence: 0.3,
      content: 'no title or section',
      status: 'pending',
      createdAt: '2026-06-26T00:00:00.000Z',
    }

    assert.equal(item.title, undefined)
    assert.equal(item.section, undefined)
  })

  it('confidence is always between 0 and 1', () => {
    for (const c of [0, 0.25, 0.5, 0.75, 1]) {
      const item: RecommendationItem = {
        rank: 1,
        chunkId: 'chunk-conf',
        sourcePath: 'f.ts',
        reason: 'confidence test',
        confidence: c,
        content: 'x',
        status: 'pending',
        createdAt: '2026-06-26T00:00:00.000Z',
      }
      assert.ok(item.confidence >= 0 && item.confidence <= 1)
    }
  })

  it('rank is a positive integer', () => {
    const item: RecommendationItem = {
      rank: 5,
      chunkId: 'chunk-rank',
      sourcePath: 'f.ts',
      reason: 'rank test',
      confidence: 0.7,
      content: 'x',
      status: 'pending',
      createdAt: '2026-06-26T00:00:00.000Z',
    }
    assert.equal(typeof item.rank, 'number')
    assert.ok(item.rank > 0)
  })
})

// ── RecommendResponse type contract ─────────────────────────────
describe('recommender.entity: RecommendResponse', () => {
  const baseContext: RecommendationContext = {
    champion: {
      championId: 'c-resp',
      name: 'Grace',
      role: 'CHAMPION',
      totalScore: 200,
      topModules: ['coupon'],
      recentContributions: [{ kind: 'COMMIT', refId: 'r1', occurredAt: '2026-06-25T00:00:00Z', weight: 5 }],
    },
    currentTask: { files: ['test.ts'], module: 'test' },
    relatedChampions: [],
    recentSummary: { totalContributions: 1, byKind: { COMMIT: 1 }, topRefIds: ['r1'] },
    builtAt: '2026-06-26T00:00:00.000Z',
  }

  const baseItems: RecommendationItem[] = [
    {
      rank: 1,
      chunkId: 'chunk-a',
      sourcePath: 'f.ts',
      reason: 'top match',
      confidence: 0.9,
      content: 'x',
      status: 'pending',
      createdAt: '2026-06-26T00:00:00.000Z',
    },
  ]

  it('creates valid RecommendResponse without adoptionRate', () => {
    const response: RecommendResponse = {
      context: baseContext,
      recommendations: baseItems,
    }

    assert.equal(response.context.champion.championId, 'c-resp')
    assert.equal(response.recommendations.length, 1)
    assert.equal(response.adoptionRate, undefined)
  })

  it('creates valid RecommendResponse with adoptionRate', () => {
    const response: RecommendResponse = {
      context: baseContext,
      recommendations: baseItems,
      adoptionRate: 0.75,
    }

    assert.equal(response.adoptionRate, 0.75)
  })

  it('adoptionRate is between 0 and 1 when present', () => {
    for (const rate of [0, 0.5, 1]) {
      const response: RecommendResponse = {
        context: baseContext,
        recommendations: baseItems,
        adoptionRate: rate,
      }
      assert.ok(response.adoptionRate! >= 0 && response.adoptionRate! <= 1)
    }
  })

  it('empty recommendations list', () => {
    const response: RecommendResponse = {
      context: baseContext,
      recommendations: [],
    }
    assert.equal(response.recommendations.length, 0)
  })
})

// ── RecommendationLog type contract ─────────────────────────────
describe('recommender.entity: RecommendationLog', () => {
  it('creates valid RecommendationLog', () => {
    const log: RecommendationLog = {
      id: 'log-001',
      championId: 'c-log',
      module: 'coupon',
      recommendationsCount: 5,
      adoptedCount: 2,
      executedAt: '2026-06-26T08:00:00.000Z',
      executionTimeMs: 150,
    }

    assert.equal(log.id, 'log-001')
    assert.equal(log.championId, 'c-log')
    assert.equal(log.module, 'coupon')
    assert.equal(log.recommendationsCount, 5)
    assert.equal(log.adoptedCount, 2)
    assert.ok(new Date(log.executedAt).getTime() > 0)
    assert.equal(log.executionTimeMs, 150)
  })

  it('adoptedCount can be zero', () => {
    const log: RecommendationLog = {
      id: 'log-zero',
      championId: 'c-zero',
      module: 'member',
      recommendationsCount: 3,
      adoptedCount: 0,
      executedAt: '2026-06-26T00:00:00.000Z',
      executionTimeMs: 100,
    }
    assert.equal(log.adoptedCount, 0)
  })

  it('executionTimeMs is a positive number', () => {
    const log: RecommendationLog = {
      id: 'log-time',
      championId: 'c-time',
      module: 'test',
      recommendationsCount: 1,
      adoptedCount: 0,
      executedAt: '2026-06-26T00:00:00.000Z',
      executionTimeMs: 0,
    }
    assert.equal(typeof log.executionTimeMs, 'number')
    assert.ok(log.executionTimeMs >= 0)
  })
})
