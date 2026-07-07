import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import {
  MarketingROIService,
  CopywritingAssistant,
  CampaignPlanner,
  AIMarketingCMOService,
} from './ai-marketing-cmo.service'
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
} from './ai-marketing.dto'

@Controller('ai-marketing')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AiMarketingController {
  constructor(
    private readonly roiService: MarketingROIService,
    private readonly copywritingService: CopywritingAssistant,
    private readonly campaignPlanner: CampaignPlanner,
    private readonly cmoService: AIMarketingCMOService,
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

  private getKnownCampaignIds(): string[] {
    // 只需知道 mock 数据中的 ID 列表即可
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
