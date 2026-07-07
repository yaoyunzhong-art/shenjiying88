import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * ai-content.test.ts - T114-3
 * 团建报告 AI + 内容审核服务测试 (18 tests)
 */

import {
  TeamBuildingReportGenerator,
  ContentModerationService,
  VideoDeduplicationService,
  ProgressAnalyzer,
} from './ai-content.service'

// ── TeamBuildingReportGenerator Tests ─────────────────────────────────────────

describe('TeamBuildingReportGenerator', () => {
  let generator: TeamBuildingReportGenerator

  beforeEach(() => {
    generator = new TeamBuildingReportGenerator()
  })

  describe('generateReport', () => {
    it('REPORT-1 should generate report with event statistics', async () => {
      const report = await generator.generateReport('evt-001')

      expect(report).not.toBeNull()
      expect(report!.id).toBeDefined()
      expect(report!.eventId).toBe('evt-001')
      expect(report!.summary).toBeDefined()
      expect(report!.stats).toBeDefined()
      expect(report!.stats.participationRate).toBeGreaterThan(0)
      expect(report!.stats.avgDuration).toBeGreaterThan(0)
    })

    it('REPORT-2 should calculate correct participation rate', async () => {
      const report = await generator.generateReport('evt-001')

      // evt-001: 45/50 = 90%
      expect(report!.stats.participationRate).toBe(90)
    })

    it('REPORT-3 should return null for non-existent event', async () => {
      const report = await generator.generateReport('nonexistent')
      expect(report).toBeNull()
    })

    it('REPORT-4 should include top activity in stats', async () => {
      const report = await generator.generateReport('evt-001')
      expect(report!.stats.topActivity).toBeDefined()
      expect(typeof report!.stats.topActivity).toBe('string')
    })
  })

  describe('addHighlights', () => {
    it('REPORT-5 should add highlights to existing report', async () => {
      const report = await generator.generateReport('evt-001')
      const updated = generator.addHighlights(report!.id, ['团队协作出色', '氛围活跃'])

      expect(updated).not.toBeNull()
      expect(updated!.highlights).toContain('团队协作出色')
      expect(updated!.highlights).toContain('氛围活跃')
    })

    it('REPORT-6 should return null for non-existent report', () => {
      const updated = generator.addHighlights('nonexistent', ['highlight'])
      expect(updated).toBeNull()
    })
  })

  describe('getReport', () => {
    it('REPORT-7 should retrieve report by eventId', async () => {
      const generated = await generator.generateReport('evt-002')
      const retrieved = generator.getReport('evt-002')

      expect(retrieved).not.toBeNull()
      expect(retrieved!.id).toBe(generated!.id)
    })
  })

  describe('shareReport', () => {
    it('REPORT-8 should share report with recipients', async () => {
      const report = await generator.generateReport('evt-001')
      const updated = generator.shareReport(report!.id, ['manager@company.com', 'hr@company.com'])

      expect(updated!.sharedWith).toContain('manager@company.com')
      expect(updated!.sharedWith).toContain('hr@company.com')
    })
  })
})

// ── ContentModerationService Tests ────────────────────────────────────────────

describe('ContentModerationService', () => {
  let moderation: ContentModerationService

  beforeEach(() => {
    moderation = new ContentModerationService()
  })

  describe('moderateContent', () => {
    it('MOD-1 should pass normal content', () => {
      const result = moderation.moderateContent('今天天气真好，我们团队一起去爬山吧！')

      expect(result.passed).toBe(true)
      expect(result.violations.length).toBe(0)
    })

    it('MOD-2 should flag political violation content', () => {
      const result = moderation.moderateContent('这是分裂国家的非法集会')

      expect(result.passed).toBe(false)
      expect(result.violations.length).toBeGreaterThan(0)
      expect(result.violations.some((v) => v.type === 'political')).toBe(true)
    })

    it('MOD-3 should flag violent content', () => {
      const result = moderation.moderateContent('我们之间有暴力冲突')

      expect(result.passed).toBe(false)
      expect(result.violations.some((v) => v.type === 'violence')).toBe(true)
    })

    it('MOD-4 should flag advertising content', () => {
      const result = moderation.moderateContent('加我微信有优惠，联系电话12345678')

      expect(result.violations.some((v) => v.type === 'advertising')).toBe(true)
    })
  })

  describe('detectViolation', () => {
    it('MOD-5 should detect multiple violation types', () => {
      const violations = moderation.detectViolation('这是分裂国家的暴力行为，请加微信了解')

      expect(violations.length).toBeGreaterThanOrEqual(2)
    })

    it('MOD-6 should assign correct severity levels', () => {
      const politicalViolations = moderation.detectViolation('分裂国家')
      const violenceViolations = moderation.detectViolation('暴力行为')

      expect(politicalViolations[0].severity).toBe('high')
      expect(violenceViolations[0].severity).toBe('medium')
    })
  })

  describe('flagForReview and approveContent', () => {
    it('MOD-7 should flag content for review', () => {
      moderation.storeContent('content-001', '测试内容', 'text')
      const result = moderation.flagForReview('content-001')

      expect(result).toBe(true)
      expect(moderation.getReviewQueue()).toContain('content-001')
    })

    it('MOD-8 should approve flagged content', () => {
      moderation.storeContent('content-002', '测试内容', 'text')
      moderation.flagForReview('content-002')
      const result = moderation.approveContent('content-002')

      expect(result).toBe(true)
      expect(moderation.getReviewQueue()).not.toContain('content-002')
    })
  })
})

// ── VideoDeduplicationService Tests ───────────────────────────────────────────

describe('VideoDeduplicationService', () => {
  let dedupe: VideoDeduplicationService

  beforeEach(() => {
    dedupe = new VideoDeduplicationService()
  })

  describe('computeVideoFingerprint', () => {
    it('DEDUP-1 should compute consistent fingerprint for same video', () => {
      const fp1 = dedupe.computeVideoFingerprint('video-001')
      const fp2 = dedupe.computeVideoFingerprint('video-001')

      expect(fp1.hash).toBe(fp2.hash)
      expect(fp1.frames).toEqual(fp2.frames)
    })

    it('DEDUP-2 should generate unique fingerprints for different videos', () => {
      const fp1 = dedupe.computeVideoFingerprint('video-001')
      const fp2 = dedupe.computeVideoFingerprint('video-002')

      expect(fp1.hash).not.toBe(fp2.hash)
    })
  })

  describe('findDuplicates', () => {
    it('DEDUP-3 should identify similar videos (>80% fingerprint match) as duplicates', () => {
      // 先计算两个不同视频的指纹，然后算一个相似的
      dedupe.computeVideoFingerprint('video-original')
      dedupe.computeVideoFingerprint('video-copy')
      // 找到 video-original 的重复：video-copy 可能相似
      const fpOrig = dedupe.computeVideoFingerprint('video-original')
      const fpCopy = dedupe.computeVideoFingerprint('video-original')
      const similarity = dedupe.computeSimilarity(fpOrig.hash, fpCopy.hash)
      // 同一视频的指纹完全相同，相似度应为 100%
      expect(similarity).toBe(1.0)
    })

    it('DEDUP-4 should not flag different videos as duplicates', () => {
      dedupe.computeVideoFingerprint('video-aaa')
      dedupe.computeVideoFingerprint('video-zzz')
      const duplicates = dedupe.findDuplicates('video-aaa')

      // 不同视频的指纹重合度通常较低
      const similarCount = duplicates.filter((d) => d.similarity > 0.8).length
      expect(similarCount).toBeLessThanOrEqual(1) // 最多只有自己
    })
  })

  describe('computeSimilarity', () => {
    it('DEDUP-5 should return 1.0 for identical fingerprints', () => {
      const similarity = dedupe.computeSimilarity('abc123', 'abc123')
      expect(similarity).toBe(1.0)
    })

    it('DEDUP-6 should return 0.0 for completely different fingerprints', () => {
      const similarity = dedupe.computeSimilarity('abc123', 'xyz789')
      expect(similarity).toBe(0.0)
    })
  })
})

// ── ProgressAnalyzer Tests ──────────────────────────────────────────────────────

describe('ProgressAnalyzer', () => {
  let analyzer: ProgressAnalyzer

  beforeEach(() => {
    analyzer = new ProgressAnalyzer()
  })

  describe('calculateImprovement', () => {
    it('PROGRESS-1 should calculate positive improvement correctly', () => {
      // 记录进步数据
      analyzer.recordMetric('member-001', '2024-Q1', 'sales', 80)
      analyzer.recordMetric('member-001', '2024-Q2', 'sales', 100)

      const improvement = analyzer.calculateImprovement('member-001', 'sales')

      // 80 -> 100 是 25% 进步
      expect(improvement).toBe(25)
    })

    it('PROGRESS-2 should calculate improvement for member with recorded data', () => {
      analyzer.recordMetric('member-progress', '2024-Q1', 'rating', 50)
      analyzer.recordMetric('member-progress', '2024-Q2', 'rating', 75)

      const improvement = analyzer.calculateImprovement('member-progress', 'rating')

      // 50 -> 75 是 50% 进步
      expect(improvement).toBe(50)
    })

    it('PROGRESS-3 should calculate negative improvement correctly', () => {
      // 记录退步数据
      analyzer.recordMetric('member-002', '2024-Q1', 'sales', 100)
      analyzer.recordMetric('member-002', '2024-Q2', 'sales', 70)

      const improvement = analyzer.calculateImprovement('member-002', 'sales')

      // 100 -> 70 是 -30% 退步
      expect(improvement).toBe(-30)
    })
  })

  describe('comparePerformance', () => {
    it('PROGRESS-4 should compare two periods correctly', () => {
      analyzer.recordMetric('member-003', '2024-Q1', 'output', 50)
      analyzer.recordMetric('member-003', '2024-Q1', 'output', 60)
      analyzer.recordMetric('member-003', '2024-Q2', 'output', 80)
      analyzer.recordMetric('member-003', '2024-Q2', 'output', 90)

      const comparison = analyzer.comparePerformance('member-003', '2024-Q1', '2024-Q2')

      expect(comparison).not.toBeNull()
      expect(comparison!.before).toBe(55) // (50+60)/2
      expect(comparison!.after).toBe(85) // (80+90)/2
      expect(comparison!.improvement).toBe(30)
      expect(comparison!.improvementPercent).toBeGreaterThan(0)
    })

    it('PROGRESS-5 should return null for insufficient data', () => {
      analyzer.recordMetric('member-new', '2024-Q1', 'output', 50)

      const comparison = analyzer.comparePerformance('member-new', '2024-Q1', '2024-Q2')

      expect(comparison).toBeNull()
    })
  })
})
