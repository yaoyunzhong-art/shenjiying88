/**
 * 🐜 自动: [ai-sales] [A] service 补全
 *
 * AiSalesService - AI 销售导购副驾门面服务
 *
 * 聚合 ProductRecommendationEngine / ObjectionHandler / FollowUpScheduler 能力，
 * 提供组合级别的高阶 API，确保与 ai-sales.module.ts 注册的 @Injectable 一致。
 *
 * 方法清单：
 *   recommendForCustomer / recommendUpsell / recommendCrossSell
 *   classifyObjection / generateResponse / simulateConversation
 *   scheduleFollowUp / markCompleted / getDueFollowUps / getAllPending
 *   getUpcomingBirthdays / setCustomerBirthday / recordPurchase
 */

import { Injectable } from '@nestjs/common'
import {
  ProductRecommendationEngine,
  ObjectionHandler,
  FollowUpScheduler,
} from './ai-sales-copilot.service'
import type {
  CustomerProfile,
  Product,
  RecommendationContext,
  ScoredProduct,
  ObjectionType,
  ObjectionContext,
  ConversationSimulation,
  FollowUpReminder,
  UpcomingBirthday,
} from './ai-sales.entity'

/**
 * 推荐结果
 */
export interface RecommendResult {
  type: 'context-aware' | 'upsell' | 'cross-sell'
  recommendations: ScoredProduct[]
  context?: string
}

/**
 * 异议处理结果
 */
export interface ObjectionResult {
  type: ObjectionType
  response: string
}

/**
 * 跟进创建结果
 */
export interface FollowUpCreateResult {
  id: string
  customerId: string
  message: string
  priority: number
  status: string
}

/**
 * 模拟对话结果
 */
export interface SimulateConverseResult {
  turns: ConversationSimulation[]
  finalSentiment: string
}

@Injectable()
export class AiSalesService {
  constructor(
    private readonly recommendationEngine: ProductRecommendationEngine,
    private readonly objectionHandler: ObjectionHandler,
    private readonly followUpScheduler: FollowUpScheduler,
  ) {}

  // ── 商品推荐 ─────────────────────────────────────────────────────────────

  /**
   * 上下文感知推荐
   */
  recommendForCustomer(
    customerId: string,
    context: Partial<RecommendationContext>,
  ): RecommendResult {
    const recommendations = this.recommendationEngine.recommendForCustomer(customerId, {
      currentBrowsing: context.currentBrowsing ?? '',
      recentViewed: context.recentViewed ?? [],
      scenario: context.scenario ?? 'casual',
    })
    return {
      type: 'context-aware',
      recommendations,
      context: context.scenario ? `场景: ${context.scenario}` : undefined,
    }
  }

  /**
   * 向上销售推荐
   */
  recommendUpsell(productId: string): RecommendResult {
    const recommendations = this.recommendationEngine.recommendUpsell(productId)
    return { type: 'upsell', recommendations }
  }

  /**
   * 交叉销售推荐
   */
  recommendCrossSell(productId: string): RecommendResult {
    const recommendations = this.recommendationEngine.recommendCrossSell(productId)
    return { type: 'cross-sell', recommendations }
  }

  /**
   * 获取所有商品
   */
  getAllProducts(): Product[] {
    return this.recommendationEngine.getAllProducts()
  }

  /**
   * 获取单个商品
   */
  getProduct(id: string): Product | undefined {
    return this.recommendationEngine.getProduct(id)
  }

  /**
   * 记录购买
   */
  recordPurchase(customerId: string, productId: string): void {
    this.recommendationEngine.recordPurchase(customerId, productId)
  }

  // ── 异议处理 ─────────────────────────────────────────────────────────────

  /**
   * 异议分类
   */
  classifyObjection(customerReply: string): ObjectionType {
    return this.objectionHandler.classifyObjection(customerReply)
  }

  /**
   * 生成应对话术
   */
  generateResponse(objectionType: ObjectionType, context: Partial<ObjectionContext>): string {
    return this.objectionHandler.generateResponse(objectionType, {
      customerId: context.customerId ?? '',
      productId: context.productId ?? '',
      conversationHistory: context.conversationHistory ?? [],
    })
  }

  /**
   * 模拟对话
   */
  simulateConversation(objection: string, response: string): SimulateConverseResult {
    const turns = this.objectionHandler.simulateConversation(objection, response)
    const finalSentiment = turns[turns.length - 1]?.sentiment ?? 'neutral'
    return { turns, finalSentiment }
  }

  // ── 跟进提醒 ─────────────────────────────────────────────────────────────

  /**
   * 安排跟进
   */
  scheduleFollowUp(
    customerId: string,
    options: {
      salesId: string
      type: 'birthday' | 'inactive' | 'price_alert' | 'reorder'
      scheduledAt: string
      message?: string
      priority?: number
    },
  ): FollowUpReminder {
    return this.followUpScheduler.scheduleFollowUp(customerId, {
      customerId,
      salesId: options.salesId,
      type: options.type,
      scheduledAt: options.scheduledAt,
      message: options.message ?? '',
      priority: options.priority ?? 3,
    })
  }

  /**
   * 获取到期跟进
   */
  getDueFollowUps(salesId: string): FollowUpReminder[] {
    return this.followUpScheduler.getDueFollowUps(salesId)
  }

  /**
   * 获取所有待处理跟进
   */
  getAllPending(salesId?: string): FollowUpReminder[] {
    return this.followUpScheduler.getAllPending(salesId)
  }

  /**
   * 标记跟进完成
   */
  markCompleted(followUpId: string): FollowUpReminder | undefined {
    return this.followUpScheduler.markCompleted(followUpId)
  }

  /**
   * 获取即将到来的生日提醒
   */
  getUpcomingBirthdays(daysAhead: number = 7): UpcomingBirthday[] {
    return this.followUpScheduler.getUpcomingBirthdays(daysAhead)
  }

  /**
   * 设置客户生日
   */
  setCustomerBirthday(customerId: string, birthday: string): void {
    this.followUpScheduler.setCustomerBirthday(customerId, birthday)
  }
}
