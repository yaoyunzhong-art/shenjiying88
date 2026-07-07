import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  TeamBuildingReportGenerator,
  ContentModerationService,
  VideoDeduplicationService,
  ProgressAnalyzer,
  type TeamBuildingReport,
  type PerformanceComparison,
} from './ai-content.service'

// ─── TeamBuildingReportGenerator ──────────────────────────────────────────────

describe('TeamBuildingReportGenerator', () => {
  let generator: TeamBuildingReportGenerator

  beforeEach(() => {
    generator = new TeamBuildingReportGenerator()
  })

  describe('generateReport', () => {
    it('should generate a report for a known event', async () => {
      const report = await generator.generateReport('evt-001')
      expect(report).not.toBeNull()
      expect(report!.eventId).toBe('evt-001')
      expect(report!.summary).toBeTruthy()
      expect(report!.stats.participationRate).toBeGreaterThan(0)
      expect(report!.highlights).toEqual([])
      expect(report!.sharedWith).toEqual([])
    })

    it('should return null for an unknown event', async () => {
      const report = await generator.generateReport('evt-unknown')
      expect(report).toBeNull()
    })
  })

  describe('addHighlights', () => {
    it('should add highlights to an existing report', async () => {
      await generator.generateReport('evt-001')
      // get report by eventId
      const existing = generator.getReport('evt-001')
      expect(existing).not.toBeNull()

      const updated = generator.addHighlights(existing!.id, ['Great teamwork!', 'Fun activities'])
      expect(updated).not.toBeNull()
      expect(updated!.highlights).toContain('Great teamwork!')
      expect(updated!.highlights).toContain('Fun activities')
    })

    it('should return null if report does not exist', () => {
      const updated = generator.addHighlights('non-existent', ['Highlight'])
      expect(updated).toBeNull()
    })
  })

  describe('getReport', () => {
    it('should find report by eventId after generation', async () => {
      await generator.generateReport('evt-002')
      const report = generator.getReport('evt-002')
      expect(report).not.toBeNull()
      expect(report!.eventId).toBe('evt-002')
    })

    it('should return null for event with no report', () => {
      const report = generator.getReport('evt-none')
      expect(report).toBeNull()
    })
  })

  describe('shareReport', () => {
    it('should share a report with recipients', async () => {
      await generator.generateReport('evt-001')
      const existing = generator.getReport('evt-001')

      const shared = generator.shareReport(existing!.id, ['alice@test.com', 'bob@test.com'])
      expect(shared).not.toBeNull()
      expect(shared!.sharedWith).toContain('alice@test.com')
      expect(shared!.sharedWith).toContain('bob@test.com')
    })

    it('should return null for non-existent report', () => {
      const shared = generator.shareReport('no-such-report', ['test@test.com'])
      expect(shared).toBeNull()
    })
  })
})

// ─── ContentModerationService ──────────────────────────────────────────────────

describe('ContentModerationService', () => {
  let moderation: ContentModerationService

  beforeEach(() => {
    moderation = new ContentModerationService()
  })

  describe('moderateContent', () => {
    it('should pass clean content', () => {
      const result = moderation.moderateContent('今天天气真好，一起出去玩吧！')
      expect(result.passed).toBe(true)
      expect(result.violations).toHaveLength(0)
      expect(result.flagged).toBe(false)
    })

    it('should detect political keywords', () => {
      const result = moderation.moderateContent('这个内容包含分裂言论')
      expect(result.passed).toBe(false)
      expect(result.violations.some((v) => v.type === 'political')).toBe(true)
      expect(result.flagged).toBe(true)
    })

    it('should detect violence keywords', () => {
      const result = moderation.moderateContent('他使用了暴力手段')
      expect(result.passed).toBe(false)
      expect(result.violations.some((v) => v.type === 'violence')).toBe(true)
    })

    it('should detect advertising keywords', () => {
      const result = moderation.moderateContent('加我微信获取优惠')
      expect(result.passed).toBe(false)
      expect(result.violations.some((v) => v.type === 'advertising')).toBe(true)
    })

    it('should detect multiple violation types', () => {
      const result = moderation.moderateContent('暴力分裂加我微信')
      expect(result.passed).toBe(false)
      expect(result.violations.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('flagForReview / approveContent / getReviewQueue', () => {
    it('should flag content for review', () => {
      moderation.storeContent('content-1', 'test content', 'text')
      const flagged = moderation.flagForReview('content-1')
      expect(flagged).toBe(true)
      expect(moderation.getReviewQueue()).toContain('content-1')
    })

    it('should approve flagged content', () => {
      moderation.storeContent('content-2', 'clean after review', 'text')
      moderation.flagForReview('content-2')
      const approved = moderation.approveContent('content-2')
      expect(approved).toBe(true)
      expect(moderation.getReviewQueue()).not.toContain('content-2')
    })

    it('should return false for unknown content', () => {
      expect(moderation.flagForReview('unknown')).toBe(false)
      expect(moderation.approveContent('unknown')).toBe(false)
    })
  })
})

// ─── VideoDeduplicationService ──────────────────────────────────────────────────

describe('VideoDeduplicationService', () => {
  let dedup: VideoDeduplicationService

  beforeEach(() => {
    dedup = new VideoDeduplicationService()
  })

  describe('computeVideoFingerprint', () => {
    it('should compute a fingerprint for a video', () => {
      const fp = dedup.computeVideoFingerprint('video-001')
      expect(fp.videoId).toBe('video-001')
      expect(fp.hash).toBeTruthy()
      expect(fp.hash.length).toBe(16)
      expect(fp.frames).toHaveLength(30)
      expect(fp.duration).toBeGreaterThan(0)
    })

    it('should return the same fingerprint for the same video', () => {
      const fp1 = dedup.computeVideoFingerprint('video-same')
      const fp2 = dedup.computeVideoFingerprint('video-same')
      expect(fp1.hash).toBe(fp2.hash)
    })
  })

  describe('findDuplicates', () => {
    it('should return empty for a single video', () => {
      dedup.computeVideoFingerprint('only-video')
      const duplicates = dedup.findDuplicates('only-video')
      expect(duplicates).toHaveLength(0)
    })

    it('should find similar videos', () => {
      dedup.computeVideoFingerprint('vid-aaa')
      dedup.computeVideoFingerprint('vid-aaa')
      const dup = dedup.findDuplicates('vid-aaa')
      expect(Array.isArray(dup)).toBe(true)
    })
  })

  describe('computeSimilarity', () => {
    it('should return 1.0 for identical fingerprints', () => {
      const sim = dedup.computeSimilarity('abc123', 'abc123')
      expect(sim).toBe(1.0)
    })

    it('should return 0.0 for different length fingerprints', () => {
      const sim = dedup.computeSimilarity('abc', 'abcdef')
      expect(sim).toBe(0.0)
    })
  })
})

// ─── ProgressAnalyzer ──────────────────────────────────────────────────────────

describe('ProgressAnalyzer', () => {
  let analyzer: ProgressAnalyzer

  beforeEach(() => {
    analyzer = new ProgressAnalyzer()
  })

  describe('recordMetric / calculateImprovement', () => {
    it('should calculate improvement with mock data when no history', () => {
      analyzer.recordMetric('member-1', '2024-Q1', 'sales', 100)
      const improvement = analyzer.calculateImprovement('member-1', 'sales')
      // Falls back to mock since only 1 record
      expect(typeof improvement).toBe('number')
    })

    it('should calculate improvement with recorded data', () => {
      analyzer.recordMetric('member-2', '2024-Q1', 'sales', 80)
      analyzer.recordMetric('member-2', '2024-Q2', 'sales', 100)
      const improvement = analyzer.calculateImprovement('member-2', 'sales')
      expect(improvement).toBe(25) // (100-80)/80 * 100 = 25%
    })

    it('should return null if initial value is zero', () => {
      analyzer.recordMetric('member-3', '2024-Q1', 'score', 0)
      analyzer.recordMetric('member-3', '2024-Q2', 'score', 50)
      const improvement = analyzer.calculateImprovement('member-3', 'score')
      expect(improvement).toBeNull()
    })
  })

  describe('comparePerformance', () => {
    it('should compare performance between two periods', () => {
      analyzer.recordMetric('member-4', '2024-Q1', 'revenue', 100)
      analyzer.recordMetric('member-4', '2024-Q1', 'revenue', 120)
      analyzer.recordMetric('member-4', '2024-Q2', 'revenue', 150)
      analyzer.recordMetric('member-4', '2024-Q2', 'revenue', 170)

      const comparison = analyzer.comparePerformance('member-4', '2024-Q1', '2024-Q2')
      expect(comparison).not.toBeNull()
      expect(comparison!.after).toBeGreaterThan(comparison!.before)
      expect(comparison!.improvement).toBeGreaterThan(0)
      expect(comparison!.improvementPercent).toBeGreaterThan(0)
    })

    it('should return null when no data for a period', () => {
      const comparison = analyzer.comparePerformance('empty-member', '2024-Q1', '2024-Q2')
      expect(comparison).toBeNull()
    })
  })
})
