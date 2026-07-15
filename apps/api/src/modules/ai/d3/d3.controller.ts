/**
 * d3.controller.ts — D3 智能推荐引擎 HTTP 入口
 *
 * 路由: /ai/d3
 * D3 = Discovery + Decision + Delivery
 *
 * @see d3.service.ts — 所有业务逻辑
 * @see d3.dto.ts — 请求校验 DTO
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
   * 上下文感知推荐（GET 版本，支持 Query 参数）
   * GET /ai/d3/recommendations?userId=&context=&limit=
   */
  @Get('recommendations')
  getRecommendations(
    @Query('userId') userId: string,
    @Query('context') context?: RecommendContext,
    @Query('limit') limit?: string,
  ) {
    const ctx = context ?? RecommendContext.HOME
    const lim = limit ? Math.max(1, Math.min(100, Number(limit))) : 10
    const result = this.d3Service.getRecommendations(userId, ctx, lim)
    return { success: true, data: result }
  }

  /**
   * 上下文感知推荐（POST 版本，支持 Body）
   * POST /ai/d3/recommendations
   */
  @Post('recommendations')
  postRecommendations(@Body() body: GetRecommendationsDto) {
    const result = this.d3Service.getRecommendations(
      body.userId,
      body.context ?? RecommendContext.HOME,
      body.limit ?? 10,
    )
    return { success: true, data: result }
  }

  /**
   * 热门推荐（GET 版本，同时支持 Query 参数和 Path 参数）
   * GET /ai/d3/trending?type=&period=
   * GET /ai/d3/trending/:type
   */
  @Get('trending')
  getTrendingByQuery(
    @Query('type') type: string,
    @Query('period') period?: RecommendPeriod,
  ) {
    const result = this.d3Service.getTrendingItems(type, period ?? RecommendPeriod.WEEK)
    return { success: true, data: result }
  }

  @Get('trending/:type')
  getTrendingByParam(
    @Param('type') type: string,
    @Query('period') period?: RecommendPeriod,
  ) {
    const result = this.d3Service.getTrendingItems(type, period ?? RecommendPeriod.WEEK)
    return { success: true, data: result }
  }

  /**
   * 个性化选品（GET 版本）
   * GET /ai/d3/personal-picks?userId=
   */
  @Get('personal-picks')
  getPersonalPicks(@Query('userId') userId: string) {
    const result = this.d3Service.getPersonalPicks(userId)
    return { success: true, data: result }
  }

  /**
   * 个性化选品（POST 版本）
   * POST /ai/d3/personal-picks
   */
  @Post('personal-picks')
  postPersonalPicks(@Body() body: GetPersonalPicksDto) {
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
   * 推荐解释（POST 版本，Body 传参）
   * POST /ai/d3/explain
   */
  @Post('explain')
  getExplanation(@Body() body: GetExplanationDto) {
    const result = this.d3Service.getExplanation(body.itemId, body.score)
    return { success: true, data: result }
  }

  /**
   * 推荐解释（通过 itemId 路径参数）
   * POST /ai/d3/items/:itemId/explain
   */
  @Post('items/:itemId/explain')
  explainItem(
    @Param('itemId') itemId: string,
    @Body('score') score: number,
  ) {
    const result = this.d3Service.getExplanation(itemId, score ?? 0)
    return { success: true, data: result }
  }

  // ═══════════════════════════════════════════════════════════════
  // 📦 Delivery Endpoints
  // ═══════════════════════════════════════════════════════════════

  /**
   * 查看推荐分发历史（GET 版本）
   * GET /ai/d3/deliveries?userId=
   */
  @Get('deliveries')
  getDeliveries(@Query('userId') userId: string) {
    const result = this.d3Service.getDeliveries(userId)
    return { success: true, data: result }
  }

  /**
   * 查看推荐分发历史（POST 版本）
   * POST /ai/d3/deliveries
   */
  @Post('deliveries')
  postDeliveries(@Body() body: GetDeliveriesDto) {
    const result = this.d3Service.getDeliveries(body.userId)
    return { success: true, data: result }
  }

  /**
   * 标记配送（通过 deliveryId 路径参数）
   * POST /ai/d3/deliveries/:deliveryId/deliver
   */
  @Post('deliveries/:deliveryId/deliver')
  deliverDelivery(@Param('deliveryId') deliveryId: string) {
    const result = this.d3Service.markDelivered(deliveryId)
    if (!result) {
      return { success: false, message: `Delivery ${deliveryId} not found` }
    }
    return { success: true, data: result }
  }

  /**
   * 标记已送达（POST Body 版本）
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

  // ═══════════════════════════════════════════════════════════════
  // 🤝 Collaborative Filtering
  // ═══════════════════════════════════════════════════════════════

  /**
   * User-based协同过滤
   * GET /ai/d3/collaborate?userId=&topK=
   */
  @Get('collaborate')
  collaborateFilter(
    @Query('userId') userId: string,
    @Query('topK') topK?: string,
  ) {
    const k = topK ? Math.max(1, Math.min(20, Number(topK))) : 5
    const result = this.d3Service.collaborateFilter(userId, k)
    return { success: true, data: result }
  }

  /**
   * Item-based协同过滤
   * GET /ai/d3/similar-items/:itemId
   */
  @Get('similar-items/:itemId')
  itemBasedFilter(
    @Param('itemId') itemId: string,
    @Query('topK') topK?: string,
  ) {
    const k = topK ? Math.max(1, Math.min(20, Number(topK))) : 5
    const result = this.d3Service.itemBasedFilter(itemId, k)
    return { success: true, data: result }
  }

  // ═══════════════════════════════════════════════════════════════
  // 🆕 Cold Start
  // ═══════════════════════════════════════════════════════════════

  /**
   * 新用户冷启动
   * GET /ai/d3/cold-start?segment=
   */
  @Get('cold-start')
  coldStartNewUser(@Query('segment') segment?: string) {
    const result = this.d3Service.coldStartNewUser(segment)
    return { success: true, data: result }
  }

  /**
   * 新品冷启动
   * POST /ai/d3/cold-start/new-item
   */
  @Post('cold-start/new-item')
  coldStartNewItem(@Body() body: any) {
    const result = this.d3Service.coldStartNewItem({
      id: body.id,
      title: body.title,
      type: body.type,
      tags: body.tags,
      category: body.category,
      price: body.price,
      rating: body.rating,
      imageUrl: body.imageUrl,
    })
    return { success: true, data: result }
  }

  // ═══════════════════════════════════════════════════════════════
  // ⚖️ Ensemble & Evaluation
  // ═══════════════════════════════════════════════════════════════

  /**
   * 集成评分
   * GET /ai/d3/ensemble?userId=
   */
  @Get('ensemble')
  ensembleScore(@Query('userId') userId: string) {
    const result = this.d3Service.ensembleScore(userId)
    return { success: true, data: result }
  }

  /**
   * 推荐模型离线评估
   * GET /ai/d3/evaluate?userId=
   */
  @Get('evaluate')
  modelEvaluate(@Query('userId') userId: string) {
    const result = this.d3Service.modelEvaluate(userId)
    return { success: true, data: result }
  }
}
