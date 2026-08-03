import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
UseGuards,
} from '@nestjs/common'
import {
  MarketingROIService,
  CopywritingAssistant,
  CampaignPlanner,
  AIMarketingCMOService,
} from './ai-marketing-cmo.service'
import { MarketingAnalyticsService } from './ai-marketing-analytics.service'
import { CampaignOptimizerService } from './ai-marketing-campaign-optimizer.service'
import {
  ROIAnalysisDto,
  CompareROIDto,
  ProjectROIDto,
  CopyGenerationDto,
  HeadlineOptimizeDto,
  LocalizeCopyDto,
  ABTestDto,
  SuggestCampaignDto,
  BudgetAllocationDto,
  ReachEstimateDto,
  PlanTimelineDto,
  MarketingAnalysisDto,
  BatchCopyGenerationDto,
  AttributionAnalysisDto,
  FunnelAnalysisDto,
  BudgetSimulationDto,
  CohortAnalysisDto,
  CompetitiveAnalysisDto,
  CreativePerformanceDto,
  BidOptimizeDto,
  BudgetPacingDto,
  CPADto,
} from './ai-marketing.dto'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('ai-marketing')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class AiMarketingController {
  constructor(
    private readonly roiService: MarketingROIService,
    private readonly copywritingService: CopywritingAssistant,
    private readonly campaignPlanner: CampaignPlanner,
    private readonly cmoService: AIMarketingCMOService,
    private readonly analyticsService: MarketingAnalyticsService,
    private readonly optimizerService: CampaignOptimizerService,
  ) {}

  // ─── ROI Analysis ────────────────────────────────────────────

  /**
   * 计算单个活动的 ROI
   */
  @Post('roi/calculate')
  calculateROI(@Body() body: ROIAnalysisDto) {
    const result = this.roiService.calculateCampaignROI(body.campaignId)
    if (!result) {
      return { success: false, message: `Campaign ${body.campaignId} not found` }
    }
    return { success: true, data: result }
  }

  /**
   * 比较多个活动的 ROI
   */
  @Post('roi/compare')
  compareROI(@Body() body: CompareROIDto) {
    const results = this.roiService.compareCampaigns(body.campaignIds)
    return { success: true, data: results }
  }

  /**
   * 预测新活动的 ROI
   */
  @Post('roi/project')
  projectROI(@Body() body: ProjectROIDto) {
    const projection = this.roiService.projectROI({
      type: body.type,
      budget: body.budget,
      expectedCPM: body.expectedCPM,
      expectedCTR: body.expectedCTR,
      expectedConversionRate: body.expectedConversionRate,
      averageOrderValue: body.averageOrderValue,
    })
    return { success: true, data: projection }
  }

  /**
   * 获取最优预算分配
   */
  @Post('roi/budget-allocation')
  getBudgetAllocation(@Body() body: BudgetAllocationDto) {
    const allocations = this.roiService.getOptimalBudget(
      body.campaignType,
      body.totalBudget,
    )
    return { success: true, data: allocations }
  }

  // ─── Copywriting ─────────────────────────────────────────────

  /**
   * 生成营销文案
   */
  @Post('copy/generate')
  generateCopy(@Body() body: CopyGenerationDto) {
    const copy = this.copywritingService.generateCopy({
      product: body.product,
      goal: body.goal,
      audience: body.audience,
      tone: body.tone,
      length: body.length,
      cta: body.cta,
    })
    return { success: true, data: copy }
  }

  /**
   * 批量生成文案
   */
  @Post('copy/generate-batch')
  batchGenerateCopy(@Body() body: BatchCopyGenerationDto) {
    const copies = body.items.map((item) =>
      this.copywritingService.generateCopy({
        product: item.product,
        goal: item.goal as 'awareness' | 'conversion' | 'retention' | 're-engagement',
        audience: item.audience,
        tone: item.tone as 'formal' | 'casual' | 'humorous' | 'inspirational' | undefined,
        length: item.length as 'short' | 'medium' | 'long' | undefined,
      }),
    )
    return {
      success: true,
      data: {
        items: copies,
        totalGenerated: copies.length,
        generatedAt: new Date().toISOString(),
      },
    }
  }

  /**
   * 优化标题
   */
  @Post('copy/optimize-headline')
  optimizeHeadline(@Body() body: HeadlineOptimizeDto) {
    const optimized = this.copywritingService.optimizeHeadline(body.headline)
    return { success: true, data: { original: body.headline, optimized } }
  }

  /**
   * 本地化文案
   */
  @Post('copy/localize')
  localizeCopy(@Body() body: LocalizeCopyDto) {
    const localized = this.copywritingService.localizeCopy(
      {
        headline: body.headline,
        body: body.body,
        cta: body.cta,
        taglines: body.taglines,
      },
      body.locale,
    )
    return { success: true, data: localized }
  }

  /**
   * 生成 A/B 测试变体
   */
  @Post('copy/ab-test')
  generateABTest(@Body() body: ABTestDto) {
    const variants = this.copywritingService.abTestVariants(body.brief, body.count)
    return { success: true, data: { variants } }
  }

  // ─── Campaign Planning ───────────────────────────────────────

  /**
   * 推荐活动类型
   */
  @Post('campaign/suggest')
  suggestCampaign(@Body() body: SuggestCampaignDto) {
    const suggestions = this.campaignPlanner.suggestCampaignType(
      body.goal,
      body.budget,
      body.audience,
    )
    return { success: true, data: suggestions }
  }

  /**
   * 规划活动时间线
   */
  @Post('campaign/timeline')
  planTimeline(@Body() body: PlanTimelineDto) {
    const timeline = this.campaignPlanner.planCampaignTimeline(body.goal)
    return { success: true, data: timeline }
  }

  /**
   * 预估触达人数
   */
  @Post('campaign/reach-estimate')
  estimateReach(@Body() body: ReachEstimateDto) {
    const reach = this.campaignPlanner.estimateReach(body.audience, body.channel)
    return { success: true, data: reach }
  }

  // ─── Comprehensive Analysis ──────────────────────────────────

  /**
   * 营销综合分析（ROI + 时间线 + 触达）
   */
  @Post('analyze')
  analyzeMarketing(@Body() body: MarketingAnalysisDto) {
    const campaignId = body.campaignId

    // 获取活动基础信息（模拟查找）
    const roi = body.includeROI !== false
      ? this.roiService.calculateCampaignROI(campaignId)
      : undefined

    const timeline = body.includeTimeline
      ? this.campaignPlanner.planCampaignTimeline('conversion')
      : undefined

    const reach = body.includeReach
      ? [
          this.campaignPlanner.estimateReach(50000, 'wechat'),
          this.campaignPlanner.estimateReach(50000, 'douyin'),
        ]
      : undefined

    return {
      success: true,
      data: {
        campaignId,
        campaignName: `Campaign-${campaignId}`,
        roi,
        timeline,
        reach,
        analyzedAt: new Date().toISOString(),
      },
    }
  }

  /**
   * 归因分析
   * POST /ai-marketing/analytics/attribution
   */
  @Post('analytics/attribution')
  attributionAnalysis(@Body() body: AttributionAnalysisDto) {
    const results = this.analyticsService.attributionAnalysis(body.campaignIds ?? [])
    return { success: true, data: results }
  }

  /**
   * 漏斗分析
   * POST /ai-marketing/analytics/funnel
   */
  @Post('analytics/funnel')
  funnelAnalysis(@Body() body: FunnelAnalysisDto) {
    const result = this.analyticsService.funnelAnalysis(body.campaignIds ?? [])
    return { success: true, data: result }
  }

  /**
   * 预算分配模拟
   * POST /ai-marketing/analytics/budget-simulation
   */
  @Post('analytics/budget-simulation')
  simulateBudget(@Body() body: BudgetSimulationDto) {
    const result = this.analyticsService.simulateBudgetAllocation(
      body.totalBudget,
      body.types ?? []
    )
    return { success: true, data: result }
  }

  /**
   * 同群分析
   * GET /ai-marketing/analytics/cohort
   */
  @Get('analytics/cohort')
  cohortAnalysis(@Query() query: CohortAnalysisDto) {
    const result = this.analyticsService.cohortAnalysis(query.count ?? 6)
    return { success: true, data: result }
  }

  /**
   * 竞争对手分析
   * GET /ai-marketing/analytics/competitive
   */
  @Get('analytics/competitive')
  competitiveAnalysis(@Query() query: CompetitiveAnalysisDto) {
    const result = this.analyticsService.competitiveAnalysis(query.market ?? '')
    return { success: true, data: result }
  }

  /**
   * 季节性趋势
   * GET /ai-marketing/analytics/seasonal-trends
   */
  @Get('analytics/seasonal-trends')
  seasonalTrends() {
    return { success: true, data: this.analyticsService.seasonalTrends() }
  }

  /**
   * AI 营销建议
   * GET /ai-marketing/analytics/suggestions
   */
  @Get('analytics/suggestions')
  getSuggestions() {
    return { success: true, data: this.analyticsService.generateAISuggestions() }
  }

  // ═══ Campaign Optimizer Endpoints ═══

  /**
   * 活动性能概览
   * GET /ai-marketing/optimizer/performance/:campaignId
   */
  @Get('optimizer/performance/:campaignId')
  getCampaignPerformance(@Param('campaignId') campaignId: string) {
    return {
      success: true,
      data: this.optimizerService.getCampaignPerformance(campaignId),
    }
  }

  /**
   * 智能竞价优化
   * POST /ai-marketing/optimizer/bid
   */
  @Post('optimizer/bid')
  optimizeBid(@Body() body: BidOptimizeDto) {
    const result = this.optimizerService.optimizeBid(
      body.campaignId,
      body.currentBid,
      body.dailyBudget,
      body.targetCPA
    )
    return { success: true, data: result }
  }

  /**
   * 受众分群推荐
   * GET /ai-marketing/optimizer/audience-segments/:campaignId
   */
  @Get('optimizer/audience-segments/:campaignId')
  recommendAudience(@Param('campaignId') campaignId: string) {
    return {
      success: true,
      data: this.optimizerService.recommendAudienceSegments(campaignId),
    }
  }

  /**
   * 创意素材性能
   * POST /ai-marketing/optimizer/creative-performance
   */
  @Post('optimizer/creative-performance')
  getCreativePerformance(@Body() body: CreativePerformanceDto) {
    return {
      success: true,
      data: this.optimizerService.getCreativePerformance(body.creativeIds),
    }
  }

  /**
   * 频控建议
   * GET /ai-marketing/optimizer/frequency-cap/:campaignId
   */
  @Get('optimizer/frequency-cap/:campaignId')
  getFrequencyCap(@Param('campaignId') campaignId: string) {
    return {
      success: true,
      data: this.optimizerService.recommendFrequencyCap(campaignId),
    }
  }

  /**
   * 预算节奏分析
   * POST /ai-marketing/optimizer/budget-pacing
   */
  @Post('optimizer/budget-pacing')
  analyzeBudgetPacing(@Body() body: BudgetPacingDto) {
    return {
      success: true,
      data: this.optimizerService.analyzeBudgetPacing(
        body.totalBudget,
        body.startDate,
        body.endDate,
        body.spentToDate,
        body.elapsedDays
      ),
    }
  }

  /**
   * CPA 优化
   * POST /ai-marketing/optimizer/cpa
   */
  @Post('optimizer/cpa')
  optimizeCPA(@Body() body: CPADto) {
    return {
      success: true,
      data: this.optimizerService.optimizeCPA(
        body.currentCPA,
        body.targetCPA,
        body.conversionRate,
        body.averageOrderValue
      ),
    }
  }

  /**
   * 跨渠道频控报告
   * POST /ai-marketing/optimizer/channel-frequency
   */
  @Post('optimizer/channel-frequency')
  getChannelFrequency(@Body() body: { channels: string[] }) {
    return {
      success: true,
      data: this.optimizerService.getChannelFrequencyReport(body.channels),
    }
  }

  private getKnownCampaignIds(): string[] {
    return ['camp-001', 'camp-002', 'camp-003', 'camp-004', 'camp-005']
  }

  /**
   * 模块概览统计
   */
  @Get('stats')
  getModuleStats() {
    const campaignIds = this.getKnownCampaignIds()
    let totalRevenue = 0
    let totalCost = 0
    let positiveCount = 0
    let negativeCount = 0

    for (const id of campaignIds) {
      const result = this.roiService.calculateCampaignROI(id)
      if (result) {
        totalRevenue += result.revenue
        totalCost += result.cost
        if (result.isPositive) positiveCount++
        else negativeCount++
      }
    }

    const averageROI = totalCost > 0
      ? Math.round(((totalRevenue - totalCost) / totalCost) * 10000) / 100
      : 0

    return {
      success: true,
      data: {
        totalCampaigns: campaignIds.length,
        totalRevenue,
        totalCost,
        averageROI,
        positiveCampaigns: positiveCount,
        negativeCampaigns: negativeCount,
      },
    }
  }
}
