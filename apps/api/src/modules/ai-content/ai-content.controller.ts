import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { TeamBuildingReportGenerator, ContentModerationService, VideoDeduplicationService, ProgressAnalyzer } from './ai-content.service'
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
} from './ai-content.dto'

@Controller('ai-content')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AiContentController {
  constructor(
    private readonly reportGenerator: TeamBuildingReportGenerator,
    private readonly moderationService: ContentModerationService,
    private readonly videoDedupService: VideoDeduplicationService,
    private readonly progressAnalyzer: ProgressAnalyzer,
  ) {}

  // ─── Team Building Report ────────────────────────────────────

  /**
   * 生成团建报告
   */
  @Post('report/generate')
  async generateReport(@Body() body: AiContentGenerateDto) {
    const report = await this.reportGenerator.generateReport(body.eventId)
    if (!report) {
      return { success: false, message: `Event ${body.eventId} not found` }
    }
    return {
      success: true,
      data: {
        report,
        generatedAt: new Date().toISOString(),
      },
    }
  }

  /**
   * 获取报告
   */
  @Get('report/:eventId')
  getReport(@Param('eventId') eventId: string) {
    const report = this.reportGenerator.getReport(eventId)
    if (!report) {
      return { success: false, message: `Report for event ${eventId} not found` }
    }
    return { success: true, data: report }
  }

  /**
   * 添加亮点
   */
  @Put('report/:reportId/highlights')
  addHighlights(
    @Param('reportId') reportId: string,
    @Body() body: AddHighlightsDto,
  ) {
    const report = this.reportGenerator.addHighlights(reportId, body.highlights)
    if (!report) {
      return { success: false, message: `Report ${reportId} not found` }
    }
    return { success: true, data: report }
  }

  /**
   * 分享报告
   */
  @Put('report/:reportId/share')
  shareReport(
    @Param('reportId') reportId: string,
    @Body() body: ShareReportDto,
  ) {
    const report = this.reportGenerator.shareReport(reportId, body.recipients)
    if (!report) {
      return { success: false, message: `Report ${reportId} not found` }
    }
    return { success: true, data: report }
  }

  // ─── Content Moderation ──────────────────────────────────────

  /**
   * 审核内容
   */
  @Post('moderate')
  moderateContent(@Body() body: ContentModerationDto) {
    const result = this.moderationService.moderateContent(
      body.content,
      body.type,
    )
    return { success: true, data: result }
  }

  /**
   * 批量审核内容
   */
  @Post('moderate/batch')
  batchModerate(@Body() body: BatchModerationDto) {
    const results = body.items.map((item) => {
      const result = this.moderationService.moderateContent(
        item.content,
        item.type,
      )
      return { id: item.id, ...result }
    })
    return { success: true, data: { results } }
  }

  /**
   * 标记待审核
   */
  @Post('moderate/:contentId/flag')
  flagForReview(@Param('contentId') contentId: string) {
    const result = this.moderationService.flagForReview(contentId)
    if (!result) {
      return { success: false, message: `Content ${contentId} not found` }
    }
    return { success: true, message: 'Flagged for review' }
  }

  /**
   * 审核通过/拒绝
   */
  @Put('moderate/:contentId/review')
  reviewContent(
    @Param('contentId') contentId: string,
    @Body() body: ReviewActionDto,
  ) {
    if (body.action === 'approve') {
      const result = this.moderationService.approveContent(contentId)
      if (!result) {
        return { success: false, message: `Content ${contentId} not found` }
      }
      return { success: true, message: 'Content approved' }
    }
    return { success: true, message: 'Content rejected' }
  }

  /**
   * 获取审核队列
   */
  @Get('moderate/queue')
  getReviewQueue() {
    const queue = this.moderationService.getReviewQueue()
    return { success: true, data: { queue, size: queue.length } }
  }

  // ─── Video Deduplication ─────────────────────────────────────

  /**
   * 计算视频指纹
   */
  @Post('video/fingerprint')
  computeFingerprint(@Body() body: VideoDeduplicationDto) {
    const fingerprint = this.videoDedupService.computeVideoFingerprint(body.videoId)
    return { success: true, data: fingerprint }
  }

  /**
   * 查找重复视频
   */
  @Post('video/detect-duplicates')
  detectDuplicates(@Body() body: VideoDeduplicationDto) {
    const duplicates = this.videoDedupService.findDuplicates(body.videoId)
    return { success: true, data: { videoId: body.videoId, duplicates } }
  }

  /**
   * 比对两个视频指纹
   */
  @Post('video/compare')
  compareVideos(@Body() body: { fingerprint1: string; fingerprint2: string }) {
    const similarity = this.videoDedupService.computeSimilarity(
      body.fingerprint1,
      body.fingerprint2,
    )
    return { success: true, data: { similarity } }
  }

  // ─── Progress Analysis ───────────────────────────────────────

  /**
   * 计算进步幅度
   */
  @Post('progress/improvement')
  calculateImprovement(@Body() body: RecordMetricDto) {
    // 先记录本次数据
    this.progressAnalyzer.recordMetric(
      body.memberId,
      body.period,
      body.metric,
      body.value,
    )
    const improvement = this.progressAnalyzer.calculateImprovement(
      body.memberId,
      body.metric,
    )
    return {
      success: true,
      data: {
        memberId: body.memberId,
        metric: body.metric,
        improvement,
      },
    }
  }

  /**
   * 比较两个周期表现
   */
  @Post('progress/compare')
  comparePerformance(@Body() body: ProgressAnalysisDto) {
    const comparison = this.progressAnalyzer.comparePerformance(
      body.memberId,
      body.beforePeriod,
      body.afterPeriod,
    )
    if (!comparison) {
      return {
        success: false,
        message: 'Insufficient data for comparison',
      }
    }
    return { success: true, data: comparison }
  }
}
