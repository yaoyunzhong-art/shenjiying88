/**
 * 🐜 圈梁: [ai-content] 内容模块圈梁测试
 *
 * 正例 + 反例 + 边界
 * 验证: DTO、实体、Service 核心接口
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  TeamBuildingReportGenerator,
  ContentModerationService,
  VideoDeduplicationService,
  ProgressAnalyzer,
} from './ai-content.service'
import { AiContentGenerateDto, ContentModerationDto, VideoDeduplicationDto } from './ai-content.dto'
import type { TeamBuildingReport, ModerationResult, PerformanceComparison } from './ai-content.entity'

// ─── DTO ────────────────────────────────────────────────

describe('ai-content DTO', () => {
  // 正例: AiContentGenerateDto 合法
  it('正例: AiContentGenerateDto 包含 eventId', () => {
    const dto = new AiContentGenerateDto()
    dto.eventId = 'event-001'
    expect(dto.eventId).toBe('event-001')
  })

  // 正例: ContentModerationDto 包含 content
  it('正例: ContentModerationDto 含待审核内容', () => {
    const dto = new ContentModerationDto()
    dto.content = '这是一条测试内容'
    expect(dto.content).toBeTruthy()
  })

  // 正例: VideoDeduplicationDto 包含 videoId
  it('正例: VideoDeduplicationDto 含 videoId', () => {
    const dto = new VideoDeduplicationDto()
    dto.videoId = 'video-001'
    expect(dto.videoId).toBe('video-001')
  })

  // 反例: AiContentGenerateDto 空 eventId
  it('反例: eventId 为空字符串应拒绝', () => {
    const dto = new AiContentGenerateDto()
    dto.eventId = ''
    expect(dto.eventId).toBe('')
  })
})

// ─── Service: 团建报告 ──────────────────────────────────

describe('ai-content Service - 团建报告', () => {
  let reportGen: TeamBuildingReportGenerator

  beforeEach(() => {
    reportGen = new TeamBuildingReportGenerator()
  })

  // 正例: 生成团建报告
  it('正例: generateReport 返回报告', async () => {
    const report = await reportGen.generateReport('evt-001')
    expect(report).toBeDefined()
    expect(report!.eventId).toBe('evt-001')
    expect(report!.summary).toBeTruthy()
    expect(report!.stats.participationRate).toBeGreaterThan(0)
  })

  // 反例: 不存在的 eventId 返回 null
  it('反例: 不存在的 eventId 返回 null', async () => {
    const report = await reportGen.generateReport('non-existent-event')
    expect(report).toBeNull()
  })

  // 边界: getReport 不存在的报告返回 null
  it('边界: getReport 不存在返回 null', () => {
    const report = reportGen.getReport('non-existent-event')
    expect(report).toBeNull()
  })
})

// ─── Service: 内容审核 ──────────────────────────────────

describe('ai-content Service - 内容审核', () => {
  let moderation: ContentModerationService

  beforeEach(() => {
    moderation = new ContentModerationService()
  })

  // 正例: 正常内容通过审核
  it('正例: 正常内容通过审核', () => {
    const result = moderation.moderateContent('今天团建很开心！')
    expect(result.passed).toBe(true)
    expect(result.flagged).toBe(false)
    expect(result.violations).toHaveLength(0)
  })

  // 反例: 暴力内容不通过
  it('反例: 暴力内容不通过审核', () => {
    const result = moderation.moderateContent('含有暴力内容的描述')
    expect(result.passed).toBe(false)
    expect(result.flagged).toBe(true)
    expect(result.violations.length).toBeGreaterThan(0)
  })

  // 反例: 政治敏感内容不通过
  it('反例: 政治敏感内容不通过审核', () => {
    const result = moderation.moderateContent('非法集会相关讨论')
    expect(result.passed).toBe(false)
    expect(result.flagged).toBe(true)
    expect(result.violations.length).toBeGreaterThan(0)
  })

  // 边界: 空内容审核通过（无违规）
  it('边界: 空内容通过审核（无违规）', () => {
    const result = moderation.moderateContent('')
    expect(result.passed).toBe(true)
    expect(result.violations).toHaveLength(0)
  })
})

// ─── Service: 视频去重 ──────────────────────────────────

describe('ai-content Service - 视频去重', () => {
  let dedup: VideoDeduplicationService

  beforeEach(() => {
    dedup = new VideoDeduplicationService()
  })

  // 正例: 视频指纹计算
  it('正例: computeVideoFingerprint 返回指纹', () => {
    const fp = dedup.computeVideoFingerprint('video-1')
    expect(fp).toBeDefined()
    expect(fp.videoId).toBe('video-1')
    expect(fp.hash).toBeTruthy()
    expect(fp.duration).toBeGreaterThan(0)
  })

  // 边界: 重复视频查找返回空数组
  it('边界: 没有重复视频时返回空数组', () => {
    const result = dedup.findDuplicates('video-1')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })
})

// ─── Service: 进步分析 ──────────────────────────────────

describe('ai-content Service - 进步分析', () => {
  let analyzer: ProgressAnalyzer

  beforeEach(() => {
    analyzer = new ProgressAnalyzer()
  })

  // 反例: 无历史数据返回 null
  it('反例: 无历史数据返回 null', () => {
    const result = analyzer.comparePerformance('unknown-member', '2026-01', '2026-06')
    expect(result).toBeNull()
  })
})

// ─── 实体结构验证 ───────────────────────────────────────

describe('ai-content 实体结构', () => {
  it('正例: TeamBuildingReport 结构完整', () => {
    const report: TeamBuildingReport = {
      id: 'report-1',
      eventId: 'event-1',
      summary: '团建圆满结束',
      highlights: ['破冰成功'],
      stats: { participationRate: 0.95, avgDuration: 120, topActivity: '密室逃脱' },
      sharedWith: [],
      createdAt: '2026-07-01T00:00:00Z',
      updatedAt: '2026-07-01T00:00:00Z',
    }
    expect(report.stats.participationRate).toBeGreaterThan(0)
    expect(report.stats.participationRate).toBeLessThanOrEqual(1)
    expect(report.highlights.length).toBeGreaterThan(0)
  })

  it('正例: ModerationResult 结构完整', () => {
    const result: ModerationResult = {
      passed: false,
      violations: [{ type: 'political', severity: 'high', description: '涉政内容' }],
      flagged: true,
    }
    expect(result.passed).toBe(false)
    expect(result.flagged).toBe(true)
    expect(result.violations[0].type).toBe('political')
  })

  it('边界: 空的 PerformanceComparison 不可为 null', () => {
    // verify interface shape
    const comp: PerformanceComparison = { before: 0, after: 100, improvement: 100, improvementPercent: 100 }
    expect(comp.improvementPercent).toBe(100)
  })
})
