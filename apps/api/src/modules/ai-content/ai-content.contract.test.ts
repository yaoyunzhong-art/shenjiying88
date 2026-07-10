/**
 * ai-content.contract.test.ts - [A类] contract 合约测试补全
 *
 * 验证 ai-content 模块对外暴露的合约接口的稳定性和正确性。
 * 测试覆盖: 团建报告合约 | 内容审核合约 | 视频去重合约 | 进步分析合约
 * 场景类型: 正例 | 反例 | 边界值
 */

import { describe, it, expect } from 'vitest'
import type {
  TeamBuildingReportContract,
  ModerationResultContract,
  VideoDeduplicationContract,
  PerformanceComparisonContract,
  AiContentGenerateRequestContract,
  AiContentGenerateResponseContract,
  BatchModerationRequestContract,
  BatchModerationResponseContract,
  ProgressAnalysisRequestContract,
  AiContentModuleStatsContract,
  ReviewQueueItemContract,
} from './ai-content.contract'

// ══════════════════════════════════════════════════════════════════
// 1. TeamBuildingReportContract
// ══════════════════════════════════════════════════════════════════
describe('TeamBuildingReportContract', () => {
  it('正例: 完整团建报告合约结构正确', () => {
    const report: TeamBuildingReportContract = {
      id: 'report-001',
      eventId: 'event-42',
      summary: '本次团建满意度 95%，团队凝聚力显著提升',
      highlights: [
        '破冰环节全员参与',
        '户外拓展挑战成功',
        '晚宴分享气氛热烈',
      ],
      stats: {
        participationRate: 0.95,
        avgDuration: 180,
        topActivity: '攀岩挑战',
      },
      createdAt: '2026-07-10T08:00:00.000Z',
    }

    expect(report.id).toBe('report-001')
    expect(report.eventId).toBe('event-42')
    expect(report.summary).toBeTruthy()
    expect(report.highlights).toHaveLength(3)
    expect(report.stats.participationRate).toBeGreaterThanOrEqual(0)
    expect(report.stats.participationRate).toBeLessThanOrEqual(1)
    expect(report.stats.avgDuration).toBeGreaterThan(0)
    expect(report.stats.topActivity).toBeTypeOf('string')
    expect(report.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('反例: 空 highlights 数组应被允许', () => {
    const report: TeamBuildingReportContract = {
      id: 'report-002',
      eventId: 'event-99',
      summary: '无亮点活动',
      highlights: [],
      stats: {
        participationRate: 0,
        avgDuration: 0,
        topActivity: '无',
      },
      createdAt: '2026-07-10T09:00:00.000Z',
    }
    expect(report.highlights).toHaveLength(0)
    expect(report.stats.participationRate).toBe(0)
  })

  it('边界: participationRate 为 1 (100% 参与)', () => {
    const report: TeamBuildingReportContract = {
      id: 'report-003',
      eventId: 'event-100',
      summary: '全勤参与',
      highlights: ['全员到齐'],
      stats: {
        participationRate: 1,
        avgDuration: 240,
        topActivity: '全员大会',
      },
      createdAt: '2026-07-10T10:00:00.000Z',
    }
    expect(report.stats.participationRate).toBe(1)
  })
})

// ══════════════════════════════════════════════════════════════════
// 2. ModerationResultContract
// ══════════════════════════════════════════════════════════════════
describe('ModerationResultContract', () => {
  it('正例: 审核通过 — 无违规', () => {
    const result: ModerationResultContract = {
      passed: true,
      violations: [],
      flagged: false,
    }
    expect(result.passed).toBe(true)
    expect(result.violations).toHaveLength(0)
    expect(result.flagged).toBe(false)
  })

  it('正例: 审核不通过 — 包含违规项', () => {
    const result: ModerationResultContract = {
      passed: false,
      violations: [
        {
          type: 'violence',
          severity: 'high',
          description: '包含暴力画面',
        },
        {
          type: 'advertising',
          severity: 'low',
          description: '提及竞品名称',
        },
      ],
      flagged: true,
    }
    expect(result.passed).toBe(false)
    expect(result.violations).toHaveLength(2)
    expect(result.flagged).toBe(true)
    expect(result.violations[0].type).toBe('violence')
    expect(result.violations[0].severity).toBe('high')
    expect(result.violations[1].severity).toBe('low')
  })

  it('边界: 大量违规项不应破坏合约结构', () => {
    const violations = Array.from({ length: 100 }, (_, i) => ({
      type: 'other' as const,
      severity: 'low' as const,
      description: `违规项 #${i + 1}`,
    }))
    const result: ModerationResultContract = {
      passed: false,
      violations,
      flagged: true,
    }
    expect(result.violations).toHaveLength(100)
    expect(result.flagged).toBe(true)
  })

  it('反例: 所有 severity 枚举值都可接受', () => {
    const severities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high']
    for (const severity of severities) {
      const result: ModerationResultContract = {
        passed: false,
        violations: [{ type: 'political', severity, description: `严重程度: ${severity}` }],
        flagged: true,
      }
      expect(result.violations[0].severity).toBe(severity)
    }
  })

  it('反例: 所有 violation type 枚举值都可接受', () => {
    const types: Array<'political' | 'violence' | 'advertising' | 'other'> = [
      'political', 'violence', 'advertising', 'other',
    ]
    for (const type of types) {
      const result: ModerationResultContract = {
        passed: false,
        violations: [{ type, severity: 'medium', description: `类型: ${type}` }],
        flagged: true,
      }
      expect(result.violations[0].type).toBe(type)
    }
  })
})

// ══════════════════════════════════════════════════════════════════
// 3. VideoDeduplicationContract
// ══════════════════════════════════════════════════════════════════
describe('VideoDeduplicationContract', () => {
  it('正例: 存在重复视频', () => {
    const result: VideoDeduplicationContract = {
      videoId: 'vid-001',
      duplicates: [
        { videoId: 'vid-002', similarity: 0.95 },
        { videoId: 'vid-003', similarity: 0.87 },
      ],
    }
    expect(result.videoId).toBe('vid-001')
    expect(result.duplicates).toHaveLength(2)
    expect(result.duplicates[0].similarity).toBe(0.95)
  })

  it('边界: 无重复视频', () => {
    const result: VideoDeduplicationContract = {
      videoId: 'vid-001',
      duplicates: [],
    }
    expect(result.duplicates).toHaveLength(0)
  })

  it('边界: similarity 精度 — 浮点数边界', () => {
    const result: VideoDeduplicationContract = {
      videoId: 'vid-001',
      duplicates: [
        { videoId: 'vid-002', similarity: 0 },
        { videoId: 'vid-003', similarity: 1 },
        { videoId: 'vid-004', similarity: 0.999999 },
      ],
    }
    expect(result.duplicates[0].similarity).toBe(0)
    expect(result.duplicates[1].similarity).toBe(1)
    expect(result.duplicates[2].similarity).toBeCloseTo(1, 5)
  })
})

// ══════════════════════════════════════════════════════════════════
// 4. PerformanceComparisonContract
// ══════════════════════════════════════════════════════════════════
describe('PerformanceComparisonContract', () => {
  it('正例: 进步幅度为正', () => {
    const result: PerformanceComparisonContract = {
      before: 50,
      after: 80,
      improvement: 30,
      improvementPercent: 60,
    }
    expect(result.before).toBe(50)
    expect(result.after).toBe(80)
    expect(result.improvement).toBe(30)
    expect(result.improvementPercent).toBe(60)
  })

  it('边界: 进步幅度为 0 (无变化)', () => {
    const result: PerformanceComparisonContract = {
      before: 100,
      after: 100,
      improvement: 0,
      improvementPercent: 0,
    }
    expect(result.improvement).toBe(0)
    expect(result.improvementPercent).toBe(0)
  })

  it('反例: 退步 (after < before) 应允许负值', () => {
    const result: PerformanceComparisonContract = {
      before: 100,
      after: 60,
      improvement: -40,
      improvementPercent: -40,
    }
    expect(result.improvement).toBe(-40)
    expect(result.improvementPercent).toBe(-40)
  })
})

// ══════════════════════════════════════════════════════════════════
// 5. AiContentGenerateRequestContract & ResponseContract
// ══════════════════════════════════════════════════════════════════
describe('AiContentGenerateContract', () => {
  it('正例: 请求合约 — 含 template 参数', () => {
    const req: AiContentGenerateRequestContract = {
      eventId: 'event-42',
      template: 'detailed',
    }
    expect(req.eventId).toBe('event-42')
    expect(req.template).toBe('detailed')
  })

  it('边界: 请求合约 — 无 template (可选)', () => {
    const req: AiContentGenerateRequestContract = {
      eventId: 'event-42',
    }
    expect(req.eventId).toBe('event-42')
    expect(req.template).toBeUndefined()
  })

  it('正例: 响应合约 — 完整结构', () => {
    const report: TeamBuildingReportContract = {
      id: 'report-001',
      eventId: 'event-42',
      summary: '优秀',
      highlights: ['协作好'],
      stats: { participationRate: 0.9, avgDuration: 120, topActivity: '攀岩' },
      createdAt: '2026-07-10T00:00:00.000Z',
    }
    const res: AiContentGenerateResponseContract = {
      id: 'gen-001',
      eventId: 'event-42',
      report,
      generatedAt: '2026-07-10T01:00:00.000Z',
    }
    expect(res.id).toBe('gen-001')
    expect(res.report.stats.topActivity).toBe('攀岩')
    expect(res.generatedAt).toMatch(/T/)
  })
})

// ══════════════════════════════════════════════════════════════════
// 6. BatchModerationContract
// ══════════════════════════════════════════════════════════════════
describe('BatchModerationContract', () => {
  it('正例: 批量审核请求 — 多项目', () => {
    const req: BatchModerationRequestContract = {
      items: [
        { id: 'item-1', content: '正常内容', type: 'text' },
        { id: 'item-2', content: '图片描述', type: 'image_description' },
      ],
    }
    expect(req.items).toHaveLength(2)
    expect(req.items[0].type).toBe('text')
    expect(req.items[1].type).toBe('image_description')
  })

  it('正例: 批量审核响应 — 混合结果', () => {
    const res: BatchModerationResponseContract = {
      results: [
        { id: 'item-1', passed: true, violations: [] },
        {
          id: 'item-2',
          passed: false,
          violations: [{ type: 'violence', severity: 'high', description: '暴力内容' }],
        },
      ],
    }
    expect(res.results).toHaveLength(2)
    expect(res.results[0].passed).toBe(true)
    expect(res.results[1].passed).toBe(false)
    expect(res.results[1].violations).toHaveLength(1)
  })

  it('边界: 空批量审核', () => {
    const req: BatchModerationRequestContract = { items: [] }
    expect(req.items).toHaveLength(0)
  })
})

// ══════════════════════════════════════════════════════════════════
// 7. ProgressAnalysisRequestContract
// ══════════════════════════════════════════════════════════════════
describe('ProgressAnalysisRequestContract', () => {
  it('正例: 完整进步分析请求', () => {
    const req: ProgressAnalysisRequestContract = {
      memberId: 'member-001',
      metric: 'avg_score',
      beforePeriod: '2026-01',
      afterPeriod: '2026-06',
    }
    expect(req.memberId).toBe('member-001')
    expect(req.metric).toBe('avg_score')
    expect(req.beforePeriod).toBe('2026-01')
    expect(req.afterPeriod).toBe('2026-06')
  })
})

// ══════════════════════════════════════════════════════════════════
// 8. AiContentModuleStatsContract
// ══════════════════════════════════════════════════════════════════
describe('AiContentModuleStatsContract', () => {
  it('正例: 全部指标为零', () => {
    const stats: AiContentModuleStatsContract = {
      totalReportsGenerated: 0,
      totalContentModerated: 0,
      totalVideosProcessed: 0,
      totalMembersAnalyzed: 0,
      currentReviewQueueSize: 0,
    }
    expect(stats.totalReportsGenerated).toBe(0)
    expect(stats.totalContentModerated).toBe(0)
    expect(stats.totalVideosProcessed).toBe(0)
    expect(stats.totalMembersAnalyzed).toBe(0)
    expect(stats.currentReviewQueueSize).toBe(0)
  })

  it('正例: 正常业务数据', () => {
    const stats: AiContentModuleStatsContract = {
      totalReportsGenerated: 128,
      totalContentModerated: 2048,
      totalVideosProcessed: 56,
      totalMembersAnalyzed: 320,
      currentReviewQueueSize: 12,
    }
    expect(stats.totalReportsGenerated).toBeGreaterThan(0)
    expect(stats.currentReviewQueueSize).toBeLessThanOrEqual(stats.totalContentModerated)
  })
})

// ══════════════════════════════════════════════════════════════════
// 9. ReviewQueueItemContract
// ══════════════════════════════════════════════════════════════════
describe('ReviewQueueItemContract', () => {
  it('正例: 待审核项', () => {
    const item: ReviewQueueItemContract = {
      contentId: 'content-001',
      content: '用户提交内容',
      type: 'text',
      violations: [],
      submittedAt: '2026-07-10T08:00:00.000Z',
      status: 'pending',
    }
    expect(item.status).toBe('pending')
    expect(item.violations).toHaveLength(0)
  })

  it('正例: 已拒绝项 — 含违规', () => {
    const item: ReviewQueueItemContract = {
      contentId: 'content-002',
      content: '违规内容',
      type: 'image_description',
      violations: [{ type: 'political', severity: 'high', description: '涉政内容' }],
      submittedAt: '2026-07-10T08:30:00.000Z',
      status: 'rejected',
    }
    expect(item.status).toBe('rejected')
    expect(item.violations).toHaveLength(1)
    expect(item.type).toBe('image_description')
  })

  it('正例: 所有 status 枚举值', () => {
    const statuses: Array<'pending' | 'approved' | 'rejected'> = ['pending', 'approved', 'rejected']
    for (const status of statuses) {
      const item: ReviewQueueItemContract = {
        contentId: `content-${status}`,
        content: '测试',
        type: 'text',
        violations: [],
        submittedAt: '2026-07-10T00:00:00.000Z',
        status,
      }
      expect(item.status).toBe(status)
    }
  })
})

// ══════════════════════════════════════════════════════════════════
// 10. 跨合约交互验证
// ══════════════════════════════════════════════════════════════════
describe('跨合约交互验证', () => {
  it('团建报告生成请求响应可串联', () => {
    const req: AiContentGenerateRequestContract = { eventId: 'evt-01', template: 'detailed' }
    const report: TeamBuildingReportContract = {
      id: 'r-1', eventId: req.eventId,
      summary: '优秀团建', highlights: ['协作'],
      stats: { participationRate: 0.9, avgDuration: 180, topActivity: '拓展' },
      createdAt: '2026-07-10T00:00:00.000Z',
    }
    const res: AiContentGenerateResponseContract = {
      id: 'gen-001', eventId: req.eventId, report, generatedAt: '2026-07-10T01:00:00.000Z',
    }
    expect(res.eventId).toBe(req.eventId)
    expect(res.report.eventId).toBe(req.eventId)
    expect(res.report.stats.participationRate).toBe(0.9)
  })

  it('批量审核的入参出参 id 可对应', () => {
    const req: BatchModerationRequestContract = {
      items: [
        { id: 'a', content: '正常', type: 'text' },
        { id: 'b', content: '违规', type: 'text' },
      ],
    }
    const res: BatchModerationResponseContract = {
      results: [
        { id: 'a', passed: true, violations: [] },
        { id: 'b', passed: false, violations: [{ type: 'violence', severity: 'high', description: '违规' }] },
      ],
    }
    expect(res.results).toHaveLength(req.items.length)
    const resultMap = new Map(res.results.map(r => [r.id, r]))
    for (const item of req.items) {
      const result = resultMap.get(item.id)
      expect(result).toBeDefined()
      expect(result!.passed).toBeTypeOf('boolean')
    }
  })
})
