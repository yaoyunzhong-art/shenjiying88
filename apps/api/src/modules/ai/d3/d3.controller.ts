/**
 * d3.controller.ts — D3 智能推荐引擎 HTTP 入口
 *
 * 路由: /ai/d3
 * D3 = Discovery + Decision + Delivery
 */

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
import { D3Service } from './d3.service'
import {
  GetRecommendationsDto,
  GetTrendingItemsDto,
  GetPersonalPicksDto,
  ApplyFiltersDto,
  ScoreItemsDto,
  GetExplanationDto,
  GetDeliveriesDto,
  MarkDeliveredDto,
  GetChannelDto,
  RecommendContext,
  RecommendPeriod,
} from './d3.dto'

@Controller('ai/d3')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class D3Controller {
  constructor(private readonly d3Service: D3Service) {}

  // ═══════════════════════════════════════════════════════════════
  // ✨ Discovery Endpoints
  // ═══════════════════════════════════════════════════════════════

  /**
   * 上下感知推荐
   * POST /ai/d3/recommendations
   */
  @Post('recommendations')
  getRecommendations(@Body() body: GetRecommendationsDto) {
    const result = this.d3Service.getRecommendations(
      body.userId,
      body.context ?? RecommendContext.HOME,
      body.limit ?? 10,
    )
    return { success: true, data: result }
  }

  /**
   * 热门推荐
   * GET /ai/d3/trending/:type
   */
  @Get('trending/:type')
  getTrending(
    @Param('type') type: string,
    @Query('period') period?: RecommendPeriod,
  ) {
    const result = this.d3Service.getTrendingItems(type, period ?? RecommendPeriod.WEEK)
    return { success: true, data: result }
  }

  /**
   * 个性化选品
   * POST /ai/d3/personal-picks
   */
  @Post('personal-picks')
  getPersonalPicks(@Body() body: GetPersonalPicksDto) {
    const result = this.d3Service.getPersonalPicks(body.userId)
    return { success: true, data: result }
  }

  // ═══════════════════════════════════════════════════════════════
  // 💡 Decision Endpoints
  // ═══════════════════════════════════════════════════════════════

  /**
   * 规则过滤
   * POST /ai/d3/filters
   */
  @Post('filters')
  applyFilters(@Body() body: ApplyFiltersDto) {
    const result = this.d3Service.applyFilters(
      body.candidateIds,
      body.rules,
    )
    return { success: true, data: result }
  }

  /**
   * 评分排序
   * POST /ai/d3/score
   */
  @Post('score')
  scoreItems(@Body() body: ScoreItemsDto) {
    const result = this.d3Service.scoreItems(body.itemIds, body.userId)
    return { success: true, data: result }
  }

  /**
   * 推荐解释
   * POST /ai/d3/explain
   */
  @Post('explain')
  getExplanation(@Body() body: GetExplanationDto) {
    const result = this.d3Service.getExplanation(body.itemId, body.score)
    return { success: true, data: result }
  }

  // ═══════════════════════════════════════════════════════════════
  // 📦 Delivery Endpoints
  // ═══════════════════════════════════════════════════════════════

  /**
   * 查看推荐分发历史
   * POST /ai/d3/deliveries
   */
  @Post('deliveries')
  getDeliveries(@Body() body: GetDeliveriesDto) {
    const result = this.d3Service.getDeliveries(body.userId)
    return { success: true, data: result }
  }

  /**
   * 标记已送达
   * POST /ai/d3/deliveries/mark
   */
  @Post('deliveries/mark')
  markDelivered(@Body() body: MarkDeliveredDto) {
    const result = this.d3Service.markDelivered(body.deliveryId)
    if (!result) {
      return { success: false, message: `Delivery ${body.deliveryId} not found` }
    }
    return { success: true, data: result }
  }

  /**
   * 分发渠道信息
   * POST /ai/d3/channel
   */
  @Post('channel')
  getChannel(@Body() body: GetChannelDto) {
    const result = this.d3Service.getChannel(body.channel)
    return { success: true, data: result }
  }
}
