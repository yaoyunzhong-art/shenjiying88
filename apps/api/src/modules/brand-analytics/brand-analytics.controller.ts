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
import { IdentityAccessGuard } from '../../common/guards/identity-access.guard'
import { BrandAnalyticsService } from './brand-analytics.service'
import {
  GetKPIDto,
  TrackKPIDto,
  TrackMentionDto,
  UpdateHealthDto,
  TrackContentDto,
  GenerateReportDto,
  ROIDto,
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
@UseGuards(IdentityAccessGuard)
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
}
