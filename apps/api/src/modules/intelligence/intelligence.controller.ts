import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  NotFoundException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import { IntelligenceService } from './intelligence.service'
import type { RenovationTier, StorePlanningInput } from './intelligence.entity'

@UseGuards(TenantGuard)
@Controller('intelligence')
export class IntelligenceController {
  constructor(private readonly svc: IntelligenceService) {}

  @Post('feasibility')
  feasibility(@Body() body: { city: string; district: string; budget: number }) {
    if (!body.city?.trim() || !body.district?.trim()) throw new NotFoundException('城市和区域不能为空')
    return this.svc.generateFeasibilityReport(body.city.trim(), body.district.trim(), body.budget || 300)
  }

  @Post('finance-panorama')
  financePanorama(@Body() body: { budget: number; area: number; tier: RenovationTier; city: string; district: string }) {
    if (!body.city?.trim()) throw new BadRequestException('城市不能为空')
    if (!body.district?.trim()) throw new BadRequestException('区域不能为空')
    if (!body.area || body.area <= 0) throw new BadRequestException('面积必须大于0')
    if (!body.budget || body.budget <= 0) throw new BadRequestException('预算必须大于0')
    const validTiers: RenovationTier[] = ['luxury', 'standard', 'economy']
    if (!body.tier || !validTiers.includes(body.tier)) throw new BadRequestException('装修档次无效')
    return this.svc.calculateFinancePanorama(
      body.budget,
      body.area,
      body.tier,
      body.city.trim(),
      body.district.trim(),
    )
  }

  /**
   * 场景A: 科学选址评估（增强版）
   * GET /intelligence/siting-assessment?city=上海&district=徐汇
   */
  @Get('siting-assessment')
  sitingAssessment(@Query('city') city: string, @Query('district') district: string) {
    if (!city?.trim()) throw new BadRequestException('城市不能为空')
    if (!district?.trim()) throw new BadRequestException('区域不能为空')
    return this.svc.sitingAssessment(city.trim(), district.trim())
  }

  /**
   * 场景B: 新店开张整体规划
   * POST /intelligence/store-planning
   * 输入: { city, district, budget, area, tier }
   */
  @Post('store-planning')
  storePlanning(@Body() body: StorePlanningInput) {
    if (!body.city?.trim()) throw new BadRequestException('城市不能为空')
    if (!body.district?.trim()) throw new BadRequestException('区域不能为空')
    if (!body.area || body.area <= 0) throw new BadRequestException('面积必须大于0')
    if (!body.budget || body.budget <= 0) throw new BadRequestException('预算必须大于0')
    const validTiers: string[] = ['economy', 'standard', 'deluxe', 'luxury']
    if (!body.tier || !validTiers.includes(body.tier)) throw new BadRequestException('装修档次无效，可选: economy/standard/deluxe/luxury')
    return this.svc.storePlanning({
      city: body.city.trim(),
      district: body.district.trim(),
      budget: body.budget,
      area: body.area,
      tier: body.tier,
    })
  }

  @Get('operations/:storeId')
  operations(@Param('storeId') storeId: string, @Query('category') category?: string) {
    return this.svc.generateOperationAdvice(storeId, category)
  }

  @Get('monitor/:storeId')
  async monitor(
    @Param('storeId') _storeId: string,
    @Query('city') city?: string,
    @Query('mode') mode?: string,
  ) {
    return this.svc.monitorCompetitor(city, (mode as 'incremental' | 'full') ?? 'incremental')
  }

  @Get('monitor/summary')
  async monitorSummary(@Query('city') city?: string) {
    return this.svc.getLatestScanResult()
  }

  @Post('monitor/scan/incremental')
  async triggerIncremental(@Query('city') city?: string) {
    return this.svc.triggerIncrementalScan(city)
  }

  @Post('monitor/scan/full')
  async triggerFull(@Query('city') city?: string) {
    return this.svc.triggerFullScan(city)
  }
}
