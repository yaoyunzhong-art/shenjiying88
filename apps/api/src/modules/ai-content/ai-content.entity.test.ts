import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import type {
  AiContentGenerateRequest,
  AiContentGenerateResponse,
  ContentModerationRequest,
  VideoDeduplicationRequest,
  VideoDeduplicationResponse,
  ProgressAnalysisRequest,
  ReviewQueueItem,
  BatchModerationRequest,
  BatchModerationResponse,
  AiContentModuleStats,
} from './ai-content.entity'
import {
  TeamBuildingReport,
  TeamBuildingEvent,
  ModerationResult,
  Violation,
  VideoFingerprint,
  PerformanceMetric,
  PerformanceComparison,
  ContentType,
} from './ai-content.entity'

describe('ai-content.entity: TeamBuildingReport', () => {
  it('creates a valid TeamBuildingReport with all fields', () => {
    const report: TeamBuildingReport = {
      id: 'report-001',
      eventId: 'evt-001',
      summary: '春季团建圆满结束',
      highlights: ['团队精神提升'],
      stats: {
        participationRate: 90,
        avgDuration: 120,
        topActivity: '拓展训练',
      },
      sharedWith: ['manager@test.com'],
      createdAt: '2024-03-15T10:00:00Z',
      updatedAt: '2024-03-15T12:00:00Z',
    }

    assert.equal(report.id, 'report-001')
    assert.equal(report.eventId, 'evt-001')
    assert.ok(report.summary.length > 0)
    assert.equal(report.stats.participationRate, 90)
    assert.equal(report.sharedWith.length, 1)
  })

  it('handles empty highlights and sharedWith', () => {
    const report: TeamBuildingReport = {
      id: 'report-002',
      eventId: 'evt-002',
      summary: '测试报告',
      highlights: [],
      stats: {
        participationRate: 0,
        avgDuration: 0,
        topActivity: '无',
      },
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    assert.equal(report.highlights.length, 0)
    assert.equal(report.sharedWith.length, 0)
  })
})

describe('ai-content.entity: TeamBuildingEvent', () => {
  it('creates a valid TeamBuildingEvent', () => {
    const event: TeamBuildingEvent = {
      id: 'evt-001',
      name: '春季团建',
      date: '2024-03-15',
      participants: 50,
      duration: 240,
      activities: ['破冰游戏', '拓展训练'],
      attendance: 45,
      budget: 15000,
    }

    assert.equal(event.id, 'evt-001')
    assert.equal(event.participants, 50)
    assert.equal(event.activities.length, 2)
    assert.equal(event.budget, 15000)
  })
})

describe('ai-content.entity: ModerationResult & Violation', () => {
  it('creates a passed moderation result', () => {
    const result: ModerationResult = {
      passed: true,
      violations: [],
      flagged: false,
    }

    assert.equal(result.passed, true)
    assert.equal(result.violations.length, 0)
    assert.equal(result.flagged, false)
  })

  it('creates a failed moderation result with violations', () => {
    const violations: Violation[] = [
      { type: 'political', severity: 'high', description: '政治敏感词' },
      { type: 'advertising', severity: 'low', description: '广告内容' },
    ]

    const result: ModerationResult = {
      passed: false,
      violations,
      flagged: true,
    }

    assert.equal(result.passed, false)
    assert.equal(result.violations.length, 2)
    assert.equal(result.flagged, true)
  })

  it('supports all violation types and severities', () => {
    const types: Violation['type'][] = ['political', 'violence', 'advertising', 'other']
    const severities: Violation['severity'][] = ['low', 'medium', 'high']

    for (const type of types) {
      for (const severity of severities) {
        const v: Violation = { type, severity, description: `test ${type} ${severity}` }
        assert.equal(v.type, type)
        assert.equal(v.severity, severity)
      }
    }
  })
})

describe('ai-content.entity: VideoFingerprint', () => {
  it('creates a valid VideoFingerprint', () => {
    const fingerprint: VideoFingerprint = {
      videoId: 'vid-001',
      hash: 'a1b2c3d4e5f6a7b8',
      frames: [123, 456, 789],
      duration: 120,
    }

    assert.equal(fingerprint.videoId, 'vid-001')
    assert.equal(fingerprint.hash.length, 16)
    assert.equal(fingerprint.frames.length, 3)
    assert.equal(fingerprint.duration, 120)
  })
})

describe('ai-content.entity: PerformanceMetric & PerformanceComparison', () => {
  it('creates a valid PerformanceMetric', () => {
    const metric: PerformanceMetric = {
      memberId: 'member-001',
      period: '2024-Q1',
      metric: 'sales',
      value: 100,
    }

    assert.equal(metric.memberId, 'member-001')
    assert.equal(metric.value, 100)
  })

  it('creates a valid PerformanceComparison', () => {
    const comparison: PerformanceComparison = {
      before: 80,
      after: 100,
      improvement: 20,
      improvementPercent: 25,
    }

    assert.equal(comparison.before, 80)
    assert.equal(comparison.after, 100)
    assert.equal(comparison.improvement, 20)
    assert.equal(comparison.improvementPercent, 25)
  })
})

describe('ai-content.entity: ContentType', () => {
  it('supports all content types', () => {
    const types: ContentType[] = ['text', 'image_description']
    expect(types).toContain('text')
    expect(types).toContain('image_description')
  })
})

describe('ai-content.entity: Request/Response types', () => {
  it('creates AiContentGenerateRequest', () => {
    const req: AiContentGenerateRequest = { eventId: 'evt-001', template: 'detailed' }
    assert.equal(req.eventId, 'evt-001')
    assert.equal(req.template, 'detailed')
  })

  it('creates AiContentGenerateResponse', () => {
    const report: TeamBuildingReport = {
      id: 'r1', eventId: 'evt-001', summary: 's', highlights: [],
      stats: { participationRate: 90, avgDuration: 60, topActivity: 'game' },
      sharedWith: [], createdAt: '2024-01-01', updatedAt: '2024-01-01',
    }
    const resp: AiContentGenerateResponse = {
      id: 'r1', eventId: 'evt-001', report, generatedAt: '2024-01-01T00:00:00Z',
    }
    assert.equal(resp.id, 'r1')
  })

  it('creates ContentModerationRequest', () => {
    const req: ContentModerationRequest = { content: 'test content', type: 'text' }
    assert.equal(req.type, 'text')
  })

  it('creates VideoDeduplicationRequest and VideoDeduplicationResponse', () => {
    const req: VideoDeduplicationRequest = { videoId: 'vid-001' }
    assert.equal(req.videoId, 'vid-001')

    const resp: VideoDeduplicationResponse = {
      videoId: 'vid-001',
      duplicates: [{ videoId: 'vid-002', similarity: 0.95 }],
    }
    assert.equal(resp.duplicates.length, 1)
  })

  it('creates ProgressAnalysisRequest', () => {
    const req: ProgressAnalysisRequest = {
      memberId: 'm1', metric: 'sales',
      beforePeriod: '2024-Q1', afterPeriod: '2024-Q2',
    }
    assert.equal(req.memberId, 'm1')
  })

  it('creates ReviewQueueItem', () => {
    const item: ReviewQueueItem = {
      contentId: 'c1', content: 'pending content', type: 'text',
      violations: [], submittedAt: '2024-01-01T00:00:00Z', status: 'pending',
    }
    assert.equal(item.status, 'pending')
  })

  it('creates BatchModerationRequest and BatchModerationResponse', () => {
    const req: BatchModerationRequest = {
      items: [{ id: 'i1', content: 'test', type: 'text' }],
    }
    assert.equal(req.items.length, 1)

    const resp: BatchModerationResponse = {
      results: [{ id: 'i1', passed: true, violations: [] }],
    }
    assert.equal(resp.results[0].passed, true)
  })

  it('creates AiContentModuleStats', () => {
    const stats: AiContentModuleStats = {
      totalReportsGenerated: 10,
      totalContentModerated: 50,
      totalVideosProcessed: 5,
      totalMembersAnalyzed: 20,
      currentReviewQueueSize: 3,
    }
    assert.equal(stats.totalReportsGenerated, 10)
    assert.equal(stats.currentReviewQueueSize, 3)
  })
})
