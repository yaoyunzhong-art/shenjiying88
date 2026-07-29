import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { TrafficGovernanceGuard } from '../../common/guards/traffic-governance.guard'
import { BrandAnalyticsService } from './brand-analytics.service'
import {
  GetKPIDto,
  TrackKPIDto,
  TrackMentionDto,
  UpdateHealthDto,
  TrackContentDto,
  GenerateReportDto,
  ROIDto,
  AnalyticsQueryDto,
  CompareBrandsDto,
  CompetitorQueryDto,
  TopContentQueryDto,
  HealthTrendQueryDto,
  ContentSuggestionsDto,
} from './brand-analytics.dto'
import type {
  BrandKPI,
  ChannelAttribution,
  BrandMention,
  BrandHealthScore,
  ContentPerformance,
  BrandAnalyticsReport,
  ROICalculation,
  AttributionModelComparison,
  MarketShareData,
} from './brand-analytics.entity'

@Controller('brand-analytics')
@UseGuards(TrafficGovernanceGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class BrandAnalyticsController {
  constructor(private readonly service: BrandAnalyticsService) {}

  // ── KPI ──────────────────────────────────────────────────────────────────

  @Get('kpi/:brandId')
  async getKPI(
    @Param('brandId') brandId: string,
    @Query() query: GetKPIDto,
  ): Promise<BrandKPI[]> {
    return this.service.getKPI(brandId, query.startDate, query.endDate)
  }

  @Post('kpi')
  async trackKPI(@Body() dto: TrackKPIDto): Promise<BrandKPI> {
    return this.service.trackKPI(dto)
  }

  // ── 渠道归因 ─────────────────────────────────────────────────────────────

  @Get('attribution/:brandId')
  async getChannelAttribution(@Param('brandId') brandId: string): Promise<ChannelAttribution[]> {
    return this.service.getChannelAttribution(brandId)
  }

  @Get('attribution/:brandId/compare')
  async compareModels(@Param('brandId') brandId: string): Promise<AttributionModelComparison[]> {
    return this.service.compareAttributionModels(brandId)
  }

  // ── 品牌声量 ─────────────────────────────────────────────────────────────

  @Get('mentions/:brandId')
  async getBrandMentions(
    @Param('brandId') brandId: string,
    @Query('platform') platform?: string,
  ): Promise<BrandMention[]> {
    return this.service.getBrandMentions(brandId, platform)
  }

  @Post('mentions')
  async trackMention(@Body() dto: TrackMentionDto): Promise<BrandMention> {
    return this.service.trackMention(dto)
  }

  // ── 健康度 ───────────────────────────────────────────────────────────────

  @Get('health/:brandId')
  async getBrandHealth(@Param('brandId') brandId: string): Promise<BrandHealthScore> {
    return this.service.getBrandHealth(brandId)
  }

  @Patch('health/:brandId')
  async updateHealthScore(
    @Param('brandId') brandId: string,
    @Body() dto: UpdateHealthDto,
  ): Promise<BrandHealthScore> {
    return this.service.updateHealthScore(brandId, dto)
  }

  // ── 内容 ─────────────────────────────────────────────────────────────────

  @Get('content/:brandId')
  async getContentPerformance(@Param('brandId') brandId: string): Promise<ContentPerformance[]> {
    return this.service.getContentPerformance(brandId)
  }

  @Post('content')
  async trackContent(@Body() dto: TrackContentDto): Promise<ContentPerformance> {
    return this.service.trackContent(dto)
  }

  // ── 报告 ─────────────────────────────────────────────────────────────────

  @Post('report/:brandId')
  async generateReport(
    @Param('brandId') brandId: string,
    @Body() dto: GenerateReportDto,
  ): Promise<BrandAnalyticsReport> {
    return this.service.generateReport(brandId, dto.reportType)
  }

  @Get('reports/:brandId')
  async getReports(@Param('brandId') brandId: string): Promise<BrandAnalyticsReport[]> {
    return this.service.getReports(brandId)
  }

  @Get('report/:id')
  async getReport(@Param('id') id: string): Promise<BrandAnalyticsReport> {
    return this.service.getReport(id)
  }

  // ── ROI ──────────────────────────────────────────────────────────────────

  @Get('roi/:brandId')
  async calculateROI(
    @Param('brandId') brandId: string,
    @Query() query: ROIDto,
  ): Promise<ROICalculation> {
    return this.service.calculateROI(brandId, query.startDate, query.endDate)
  }

  // ── 市场占比 ─────────────────────────────────────────────────────────────

  @Get('market-share')
  async getMarketShare(): Promise<MarketShareData[]> {
    return this.service.getMarketShare()
  }

  // ── 品牌分析综合查询 ───────────────────────────────────────────────────

  @Get('analytics/:brandId')
  async getAnalytics(
    @Param('brandId') brandId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.service.getAnalytics({
      brandId,
      startDate: query.startDate,
      endDate: query.endDate,
      granularity: query.granularity,
      channels: query.channels,
      platforms: query.platforms,
    })
  }

  // ── 品牌对比 ─────────────────────────────────────────────────────────────

  @Post('compare')
  async compareBrands(@Body() dto: CompareBrandsDto) {
    return this.service.compareBrands(dto.brandIds, dto.startDate, dto.endDate)
  }

  // ── 竞争品牌对比 ─────────────────────────────────────────────────────────

  @Post('competitors')
  async compareCompetitors(@Body() dto: CompetitorQueryDto) {
    return this.service.compareCompetitors(
      dto.brandId,
      dto.competitorIds,
      dto.startDate,
      dto.endDate,
    )
  }

  // ── 热门内容排名 ─────────────────────────────────────────────────────────

  @Get('top-content/:brandId')
  async getTopContent(
    @Param('brandId') brandId: string,
    @Query() query: TopContentQueryDto,
  ) {
    return this.service.getTopContent(brandId, {
      contentType: query.contentType,
      platform: query.platform,
      startDate: query.startDate,
      endDate: query.endDate,
    })
  }

  // ── 健康度趋势 ───────────────────────────────────────────────────────────

  @Get('health/:brandId/trend')
  async getHealthTrend(
    @Param('brandId') brandId: string,
    @Query() query: HealthTrendQueryDto,
  ) {
    const months = query.months ? parseInt(query.months, 10) : 6
    return this.service.getHealthTrend(brandId, months)
  }

  // ── 内容建议 ─────────────────────────────────────────────────────────────

  @Get('content-suggestions/:contentId')
  async getContentSuggestions(
    @Param('contentId') contentId: string,
    @Query() query: ContentSuggestionsDto,
  ) {
    return this.service.getContentSuggestions(contentId, query.contentType)
  }
}
