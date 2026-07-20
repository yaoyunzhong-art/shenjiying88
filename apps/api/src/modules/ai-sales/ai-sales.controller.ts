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
  ProductRecommendationEngine,
  ObjectionHandler,
  FollowUpScheduler
} from './ai-sales-copilot.service'
import {
  RecommendationRequestDto,
  UpsellRequestDto,
  CrossSellRequestDto,
  ObjectionClassifyRequestDto,
  ObjectionResponseRequestDto,
  SimulateConversationRequestDto,
  ScheduleFollowUpRequestDto,
  MarkCompletedRequestDto,
  SetBirthdayRequestDto,
  RecordPurchaseDto
} from './ai-sales.dto'
import type {
  SalesRecommendationResponse,
  ObjectionResponse,
  ConverseSimulationResponse,
  FollowUpCreatedResponse,
  ScoredProduct,
  UpcomingBirthday,
  FollowUpReminder,
  ObjectionType,
  ConversationSimulation
} from './ai-sales.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('ai-sales')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class AiSalesController {
  constructor(
    private readonly recommendationEngine: ProductRecommendationEngine,
    private readonly objectionHandler: ObjectionHandler,
    private readonly followUpScheduler: FollowUpScheduler
  ) {}

  // ─── 商品推荐 ────────────────────────────────────

  /**
   * 上下文感知推荐
   * POST /ai-sales/recommend
   */
  @Post('recommend')
  recommend(@Body() body: RecommendationRequestDto): SalesRecommendationResponse {
    const recommendations = this.recommendationEngine.recommendForCustomer(body.customerId, {
      currentBrowsing: body.currentBrowsing,
      recentViewed: body.recentViewed ?? [],
      scenario: body.scenario
    })

    return {
      type: 'context-aware',
      recommendations,
      context: body.scenario ? `场景: ${body.scenario}` : undefined
    }
  }

  /**
   * 向上销售推荐
   * POST /ai-sales/recommend/upsell
   */
  @Post('recommend/upsell')
  recommendUpsell(@Body() body: UpsellRequestDto): SalesRecommendationResponse {
    const recommendations = this.recommendationEngine.recommendUpsell(body.productId)
    return {
      type: 'upsell',
      recommendations
    }
  }

  /**
   * 交叉销售推荐
   * POST /ai-sales/recommend/cross-sell
   */
  @Post('recommend/cross-sell')
  recommendCrossSell(@Body() body: CrossSellRequestDto): SalesRecommendationResponse {
    const recommendations = this.recommendationEngine.recommendCrossSell(body.productId)
    return {
      type: 'cross-sell',
      recommendations
    }
  }

  /**
   * 获取所有商品
   * GET /ai-sales/products
   */
  @Get('products')
  getAllProducts() {
    return this.recommendationEngine.getAllProducts()
  }

  /**
   * 获取单个商品
   * GET /ai-sales/products/:id
   */
  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    const product = this.recommendationEngine.getProduct(id)
    if (!product) {
      throw new Error(`Product ${id} not found`)
    }
    return product
  }

  /**
   * 记录购买
   * POST /ai-sales/purchase
   */
  @Post('purchase')
  recordPurchase(@Body() body: RecordPurchaseDto): { success: boolean } {
    this.recommendationEngine.recordPurchase(body.customerId, body.productId)
    return { success: true }
  }

  // ─── 异议处理 ────────────────────────────────────

  /**
   * 异议分类
   * POST /ai-sales/objection/classify
   */
  @Post('objection/classify')
  classifyObjection(@Body() body: ObjectionClassifyRequestDto): { type: ObjectionType } {
    const type = this.objectionHandler.classifyObjection(body.customerReply)
    return { type }
  }

  /**
   * 生成应对话术
   * POST /ai-sales/objection/respond
   */
  @Post('objection/respond')
  generateResponse(@Body() body: ObjectionResponseRequestDto): ObjectionResponse {
    const response = this.objectionHandler.generateResponse(body.objectionType, {
      customerId: body.customerId,
      productId: body.productId,
      conversationHistory: body.conversationHistory ?? []
    })
    return { type: body.objectionType, response }
  }

  /**
   * 模拟对话
   * POST /ai-sales/objection/simulate
   */
  @Post('objection/simulate')
  simulateConversation(@Body() body: SimulateConversationRequestDto): ConverseSimulationResponse {
    const turns = this.objectionHandler.simulateConversation(body.objection, body.response)
    const finalSentiment = turns[turns.length - 1].sentiment
    return { turns, finalSentiment }
  }

  // ─── 跟进提醒 ────────────────────────────────────

  /**
   * 安排跟进
   * POST /ai-sales/follow-up
   */
  @Post('follow-up')
  scheduleFollowUp(@Body() body: ScheduleFollowUpRequestDto): FollowUpCreatedResponse {
    const reminder = this.followUpScheduler.scheduleFollowUp(body.customerId, {
      customerId: body.customerId,
      salesId: body.salesId,
      type: body.type,
      scheduledAt: body.scheduledAt,
      message: body.message ?? '',
      priority: 3
    })
    return {
      id: reminder.id,
      message: reminder.message,
      priority: reminder.priority,
      status: reminder.status
    }
  }

  /**
   * 获取到期跟进
   * GET /ai-sales/follow-up/due/:salesId
   */
  @Get('follow-up/due/:salesId')
  getDueFollowUps(@Param('salesId') salesId: string): FollowUpReminder[] {
    return this.followUpScheduler.getDueFollowUps(salesId)
  }

  /**
   * 获取所有待处理跟进
   * GET /ai-sales/follow-up/pending?salesId=xxx
   */
  @Get('follow-up/pending')
  getPendingFollowUps(@Query('salesId') salesId?: string): FollowUpReminder[] {
    return this.followUpScheduler.getAllPending(salesId)
  }

  /**
   * 标记跟进完成
   * POST /ai-sales/follow-up/complete
   */
  @Post('follow-up/complete')
  markCompleted(@Body() body: MarkCompletedRequestDto): FollowUpReminder | { error: string } {
    const result = this.followUpScheduler.markCompleted(body.followUpId)
    if (!result) return { error: `FollowUp ${body.followUpId} not found` }
    return result
  }

  /**
   * 获取即将到来的生日提醒
   * GET /ai-sales/follow-up/upcoming-birthdays?days=7
   */
  @Get('follow-up/upcoming-birthdays')
  getUpcomingBirthdays(@Query('days') days?: string): UpcomingBirthday[] {
    const daysAhead = days ? parseInt(days, 10) : 7
    return this.followUpScheduler.getUpcomingBirthdays(daysAhead)
  }

  /**
   * 设置客户生日
   * POST /ai-sales/follow-up/birthday
   */
  @Post('follow-up/birthday')
  setBirthday(@Body() body: SetBirthdayRequestDto): { success: boolean } {
    this.followUpScheduler.setCustomerBirthday(body.customerId, body.birthday)
    return { success: true }
  }
}
