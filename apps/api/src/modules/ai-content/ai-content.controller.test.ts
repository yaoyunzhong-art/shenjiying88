import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Test, type TestingModule } from '@nestjs/testing'
import { AiContentController } from './ai-content.controller'
import {
  TeamBuildingReportGenerator,
  ContentModerationService,
  VideoDeduplicationService,
  ProgressAnalyzer,
} from './ai-content.service'
import {
  AiContentGenerateDto,
  ContentModerationDto,
  VideoDeduplicationDto,
  ProgressAnalysisDto,
  BatchModerationDto,
  AddHighlightsDto,
  ShareReportDto,
  RecordMetricDto,
  ReviewActionDto,
  ContentTypeEnum,
} from './ai-content.dto'

describe('AiContentController', () => {
  let controller: AiContentController
  let reportGenerator: TeamBuildingReportGenerator
  let moderationService: ContentModerationService
  let videoDedupService: VideoDeduplicationService
  let progressAnalyzer: ProgressAnalyzer

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiContentController],
      providers: [
        TeamBuildingReportGenerator,
        ContentModerationService,
        VideoDeduplicationService,
        ProgressAnalyzer,
      ],
    }).compile()

    controller = module.get<AiContentController>(AiContentController)
    reportGenerator = module.get<TeamBuildingReportGenerator>(TeamBuildingReportGenerator)
    moderationService = module.get<ContentModerationService>(ContentModerationService)
    videoDedupService = module.get<VideoDeduplicationService>(VideoDeduplicationService)
    progressAnalyzer = module.get<ProgressAnalyzer>(ProgressAnalyzer)
  })

  // ─── Team Building Report ────────────────────────────────────

  describe('generateReport (POST /ai-content/report/generate)', () => {
    it('should generate a report for a valid event', async () => {
      const dto: AiContentGenerateDto = { eventId: 'evt-001' }
      const result = await controller.generateReport(dto) as { success: true; data: { report: { eventId: string }; generatedAt: string } }
      expect(result.success).toBe(true)
      expect(result.data.report.eventId).toBe('evt-001')
      expect(result.data.generatedAt).toBeTruthy()
    })

    it('should return failure for unknown event', async () => {
      const dto: AiContentGenerateDto = { eventId: 'evt-unknown' }
      const result = await controller.generateReport(dto)
      expect(result.success).toBe(false)
      expect(result.message).toContain('not found')
    })
  })

  describe('getReport (GET /ai-content/report/:eventId)', () => {
    it('should get report after generation', async () => {
      await controller.generateReport({ eventId: 'evt-002' })
      const result = controller.getReport('evt-002') as { success: true; data: { eventId: string; id: string; highlights: string[]; sharedWith: string[] } }
      expect(result.success).toBe(true)
      expect(result.data.eventId).toBe('evt-002')
    })

    it('should return failure for non-existent report', () => {
      const result = controller.getReport('evt-none')
      expect(result.success).toBe(false)
      expect(result.message).toContain('not found')
    })
  })

  describe('addHighlights (PUT /ai-content/report/:reportId/highlights)', () => {
    it('should add highlights to existing report', async () => {
      await controller.generateReport({ eventId: 'evt-001' })
      const reportRes = controller.getReport('evt-001') as { success: true; data: { id: string } }
      const reportId = reportRes.data.id

      const dto: AddHighlightsDto = { highlights: ['Excellent teamwork!'] }
      const result = controller.addHighlights(reportId, dto) as { success: true; data: { highlights: string[] } }
      expect(result.success).toBe(true)
      expect(result.data.highlights).toContain('Excellent teamwork!')
    })

    it('should return failure for non-existent report', () => {
      const dto: AddHighlightsDto = { highlights: ['test'] }
      const result = controller.addHighlights('no-such', dto)
      expect(result.success).toBe(false)
    })
  })

  describe('shareReport (PUT /ai-content/report/:reportId/share)', () => {
    it('should share report with recipients', async () => {
      await controller.generateReport({ eventId: 'evt-001' })
      const reportRes = controller.getReport('evt-001') as { success: true; data: { id: string } }

      const dto: ShareReportDto = { recipients: ['alice@test.com'] }
      const result = controller.shareReport(reportRes.data.id, dto) as { success: true; data: { sharedWith: string[] } }
      expect(result.success).toBe(true)
      expect(result.data.sharedWith).toContain('alice@test.com')
    })
  })

  // ─── Content Moderation ──────────────────────────────────────

  describe('moderateContent (POST /ai-content/moderate)', () => {
    it('should pass clean content', () => {
      const dto: ContentModerationDto = { content: '今天天气真好' }
      const result = controller.moderateContent(dto) as { success: true; data: { passed: boolean; violations: unknown[] } }
      expect(result.success).toBe(true)
      expect(result.data.passed).toBe(true)
    })

    it('should flag content with violations', () => {
      const dto: ContentModerationDto = { content: '这个内容包含分裂和暴力' }
      const result = controller.moderateContent(dto) as { success: true; data: { passed: boolean; violations: unknown[] } }
      expect(result.success).toBe(true)
      expect(result.data.passed).toBe(false)
      expect(result.data.violations.length).toBeGreaterThan(0)
    })
  })

  describe('batchModerate (POST /ai-content/moderate/batch)', () => {
    it('should moderate multiple items', () => {
      const dto: BatchModerationDto = {
        items: [
          { id: '1', content: 'clean text', type: ContentTypeEnum.TEXT },
          { id: '2', content: '分裂言论', type: ContentTypeEnum.TEXT },
        ],
      }
      const result = controller.batchModerate(dto) as { success: true; data: { results: Array<{ passed: boolean }> } }
      expect(result.success).toBe(true)
      expect(result.data.results).toHaveLength(2)
      expect(result.data.results[0].passed).toBe(true)
      expect(result.data.results[1].passed).toBe(false)
    })
  })

  describe('flagForReview (POST /ai-content/moderate/:contentId/flag)', () => {
    it('should flag existing content for review', () => {
      moderationService.storeContent('content-test', 'test', 'text')
      const result = controller.flagForReview('content-test')
      expect(result.success).toBe(true)
    })

    it('should return failure for unknown content', () => {
      const result = controller.flagForReview('unknown')
      expect(result.success).toBe(false)
    })
  })

  describe('reviewContent (PUT /ai-content/moderate/:contentId/review)', () => {
    it('should approve content', () => {
      moderationService.storeContent('approve-test', 'good', 'text')
      moderationService.flagForReview('approve-test')

      const dto: ReviewActionDto = { action: 'approve' }
      const result = controller.reviewContent('approve-test', dto)
      expect(result.success).toBe(true)
      expect(result.message).toContain('approved')
    })
  })

  describe('getReviewQueue (GET /ai-content/moderate/queue)', () => {
    it('should return empty queue initially', () => {
      const result = controller.getReviewQueue() as { success: true; data: { size: number; queue: string[] } }
      expect(result.success).toBe(true)
      expect(result.data.size).toBe(0)
    })

    it('should return items in queue', () => {
      moderationService.storeContent('q1', 'test', 'text')
      moderationService.flagForReview('q1')
      const result = controller.getReviewQueue() as { success: true; data: { size: number; queue: string[] } }
      expect(result.data.size).toBe(1)
      expect(result.data.queue).toContain('q1')
    })
  })

  // ─── Video Deduplication ─────────────────────────────────────

  describe('computeFingerprint (POST /ai-content/video/fingerprint)', () => {
    it('should compute fingerprint for a video', () => {
      const dto: VideoDeduplicationDto = { videoId: 'vid-001' }
      const result = controller.computeFingerprint(dto) as { success: true; data: { videoId: string; hash: string; duplicates?: string[] } }
      expect(result.success).toBe(true)
      expect(result.data.videoId).toBe('vid-001')
      expect(result.data.hash).toBeTruthy()
    })
  })

  describe('detectDuplicates (POST /ai-content/video/detect-duplicates)', () => {
    it('should return empty duplicates for unique video', () => {
      const dto: VideoDeduplicationDto = { videoId: 'vid-uniq' }
      const result = controller.detectDuplicates(dto) as unknown as { success: true; data: { videoId: string; hash: string; duplicates: string[] } }
      expect(result.success).toBe(true)
      expect(result.data.videoId).toBe('vid-uniq')
      expect(Array.isArray(result.data.duplicates)).toBe(true)
    })
  })

  describe('compareVideos (POST /ai-content/video/compare)', () => {
    it('should compare two fingerprints', () => {
      const body = { fingerprint1: 'abc123', fingerprint2: 'abc123' }
      const result = controller.compareVideos(body) as { success: true; data: { similarity: number } }
      expect(result.success).toBe(true)
      expect(result.data.similarity).toBe(1.0)
    })

    it('should return low similarity for different fingerprints', () => {
      const body = { fingerprint1: 'aaaaaaaaaaaaaaaa', fingerprint2: 'bbbbbbbbbbbbbbbb' }
      const result = controller.compareVideos(body) as { success: true; data: { similarity: number } }
      expect(result.success).toBe(true)
      expect(result.data.similarity).toBe(0)
    })
  })

  // ─── Progress Analysis ───────────────────────────────────────

  describe('calculateImprovement (POST /ai-content/progress/improvement)', () => {
    it('should record and calculate improvement', () => {
      const dto: RecordMetricDto = {
        memberId: 'm1',
        period: '2024-Q1',
        metric: 'sales',
        value: 100,
      }
      const result = controller.calculateImprovement(dto) as { success: true; data: { memberId: string; improvement: number } }
      expect(result.success).toBe(true)
      expect(result.data.memberId).toBe('m1')
      expect(typeof result.data.improvement).toBe('number')
    })
  })

  describe('comparePerformance (POST /ai-content/progress/compare)', () => {
    it('should compare two periods with data', () => {
      progressAnalyzer.recordMetric('m-compare', '2024-Q1', 'score', 80)
      progressAnalyzer.recordMetric('m-compare', '2024-Q1', 'score', 100)
      progressAnalyzer.recordMetric('m-compare', '2024-Q2', 'score', 120)
      progressAnalyzer.recordMetric('m-compare', '2024-Q2', 'score', 140)

      const dto: ProgressAnalysisDto = {
        memberId: 'm-compare',
        metric: 'score',
        beforePeriod: '2024-Q1',
        afterPeriod: '2024-Q2',
      }
      const result = controller.comparePerformance(dto) as { success: true; data: { after: number; before: number } }
      expect(result.success).toBe(true)
      expect(result.data.after).toBeGreaterThan(result.data.before)
    })

    it('should return failure with insufficient data', () => {
      const dto: ProgressAnalysisDto = {
        memberId: 'm-empty',
        metric: 'score',
        beforePeriod: '2024-Q1',
        afterPeriod: '2024-Q2',
      }
      const result = controller.comparePerformance(dto)
      expect(result.success).toBe(false)
    })
  })
})
