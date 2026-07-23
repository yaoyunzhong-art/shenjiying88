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
import type { RenovationTier, StorePlanningInput, OperationsPlanInput, StoreStage } from './intelligence.entity'

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

  /**
   * 场景G: 开业后全周期运营管理方案
   * POST /intelligence/operations-plan
   */
  @Post('operations-plan')
  operationsPlan(@Body() body: OperationsPlanInput) {
    if (!body.storeId?.trim()) throw new BadRequestException('门店ID不能为空')
    const validStages: StoreStage[] = ['early', 'growth', 'mature', 'renewal']
    if (!body.stage || !validStages.includes(body.stage)) throw new BadRequestException('阶段无效，可选: early/growth/mature/renewal')
    return this.svc.generateOperationsPlan({ storeId: body.storeId.trim(), stage: body.stage })
  }

  /**
   * 场景H: 侦察兵数据到知识库同步
   * POST /intelligence/sync-knowledge
   */
  @Post('sync-knowledge')
  async syncKnowledge() {
    return this.svc.syncKnowledge()
  }

  /**
   * 场景H: 数据底座汇总
   * GET /intelligence/data-base/summary
   */
  @Get('data-base/summary')
  async dataBaseSummary() {
    return this.svc.getDataBaseSummary()
  }

  /**
   * 场景C: 门店设备选型智能推荐
   * POST /intelligence/device-recommendation
   * 输入: { budget, area, city, storeType: 'arcade'|'game'|'mixed', tier: '经济'|'标准'|'精装'|'豪华' }
   */
  @Post('device-recommendation')
  async deviceRecommendation(@Body() body: any) {
    if (!body.city?.trim()) throw new BadRequestException('城市不能为空')
    if (!body.area || body.area <= 0) throw new BadRequestException('面积必须大于0')
    if (!body.budget || body.budget <= 0) throw new BadRequestException('预算必须大于0')
    const validStoreTypes = ['arcade', 'game', 'mixed']
    if (!body.storeType || !validStoreTypes.includes(body.storeType)) throw new BadRequestException('门店类型无效，可选: arcade/game/mixed')
    const validTiers = ['经济', '标准', '精装', '豪华']
    if (!body.tier || !validTiers.includes(body.tier)) throw new BadRequestException('装修档次无效，可选: 经济/标准/精装/豪华')
    return this.svc.deviceRecommendation({
      budget: body.budget,
      area: body.area,
      city: body.city.trim(),
      storeType: body.storeType,
      tier: body.tier,
    })
  }

  /**
   * 场景D: 个性化装修方案建议
   * POST /intelligence/renovation-plan
   * 输入: { area, tier, city, style?: '现代'|'工业'|'卡通'|'科技' }
   */
  @Post('renovation-plan')
  async renovationPlan(@Body() body: any) {
    if (!body.city?.trim()) throw new BadRequestException('城市不能为空')
    if (!body.area || body.area <= 0) throw new BadRequestException('面积必须大于0')
    const validTiers = ['经济', '标准', '精装', '豪华']
    if (!body.tier || !validTiers.includes(body.tier)) throw new BadRequestException('装修档次无效，可选: 经济/标准/精装/豪华')
    const validStyles = ['现代', '工业', '卡通', '科技']
    if (body.style && !validStyles.includes(body.style)) throw new BadRequestException('风格无效，可选: 现代/工业/卡通/科技')
    return this.svc.renovationPlan({
      area: body.area,
      tier: body.tier,
      city: body.city.trim(),
      style: body.style,
    })
  }

  /**
   * 场景E: 选址评估增强（已存在）
   * GET /intelligence/siting-assessment
   */

  /**
   * 场景E: 动态定价策略
   * POST /intelligence/pricing-strategy
   */
  @Post('pricing-strategy')
  async pricingStrategy(@Body() body: any) {
    if (!body.city?.trim()) throw new BadRequestException('城市不能为空')
    if (!body.district?.trim()) throw new BadRequestException('区域不能为空')
    if (!body.scenario?.trim()) throw new BadRequestException('场景不能为空')
    return this.svc.pricingStrategy({
      city: body.city.trim(),
      district: body.district.trim(),
      scenario: body.scenario,
      budget: body.budget ? Number(body.budget) : undefined,
      storeTier: body.storeTier,
    })
  }

  /**
   * 场景F: 精准营销活动方案（6大类）
   * POST /intelligence/marketing-campaign
   */
  @Post('marketing-campaign')
  async marketingCampaign(@Body() body: any) {
    if (!body.city?.trim()) throw new BadRequestException('城市不能为空')
    if (!body.district?.trim()) throw new BadRequestException('区域不能为空')
    if (!body.season?.trim()) throw new BadRequestException('季节不能为空')
    return this.svc.marketingCampaign({
      city: body.city.trim(),
      district: body.district.trim(),
      season: body.season,
      budget: body.budget ? Number(body.budget) : undefined,
    })
  }
}
