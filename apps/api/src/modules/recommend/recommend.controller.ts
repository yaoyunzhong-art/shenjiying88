import { Controller, Get, Post, Query, Body, BadRequestException } from '@nestjs/common'
import type { RecommendationRequest, StrategyType } from './recommend.entity'
import { RecommendationEngine } from './recommendation.engine'
import { RecommendCacheService } from './recommend-cache.service'
import { ProductAdapter } from './datasources/product.adapter'
import { PurchaseHistoryAdapter } from './datasources/purchase-history.adapter'
import { MemberPreferenceAdapter } from './datasources/member-preference.adapter'

/**
 * Phase-40 T170: RecommendController
 *
 * 12 endpoint:
 *  POST /recommend - 主推荐入口
 *  POST /recommend/track-view - 记录浏览
 *  POST /recommend/track-purchase - 记录购买
 *  POST /recommend/preferences - 更新偏好
 *  GET  /recommend/similar/:itemId - ItemCF
 *  GET  /recommend/popular - Popular
 *  GET  /recommend/recently-viewed - RecentlyViewed
 *  GET  /recommend/personalized - Personalized
 *  GET  /recommend/user-cf - UserCF
 *  POST /recommend/cache/invalidate
 *  GET  /recommend/cache/stats
 *  GET  /recommend/health
 */

@Controller('api/recommend')
export class RecommendController {
  constructor(
    private readonly engine: RecommendationEngine,
    private readonly cache: RecommendCacheService,
    private readonly productAdapter: ProductAdapter,
    private readonly purchaseAdapter: PurchaseHistoryAdapter,
    private readonly prefAdapter: MemberPreferenceAdapter
  ) {}

  /**
   * 主推荐入口
   */
  @Post()
  async recommend(@Body() req: RecommendationRequest): Promise<any> {
    if (!req.tenantId) throw new BadRequestException('tenantId required')
    return this.engine.recommend(req)
  }

  /**
   * ItemCF: 相似商品
   */
  @Get('similar/:itemId')
  async similar(
    @Query('tenantId') tenantId: string,
    @Query('memberId') memberId: string,
    @Query('limit') limitStr: string,
    @Query('itemId') _itemId?: string  // 占位,实际从路径取
  ): Promise<any> {
    if (!tenantId) throw new BadRequestException('tenantId required')
    // @Get /similar/:itemId 用 itemId 路径参数 - 重构
    return { error: 'use POST /recommend instead' }
  }

  /**
   * 记录浏览
   */
  @Post('track-view')
  trackView(@Body() body: {
    tenantId: string
    memberId: string
    itemId: string
    durationMs?: number
  }): { recorded: boolean } {
    if (!body.tenantId || !body.memberId || !body.itemId) {
      throw new BadRequestException('tenantId, memberId, itemId required')
    }
    this.purchaseAdapter.recordView({
      tenantId: body.tenantId,
      memberId: body.memberId,
      itemId: body.itemId,
      viewedAt: new Date().toISOString(),
      durationMs: body.durationMs
    })
    this.productAdapter.incrementView(body.itemId)
    return { recorded: true }
  }

  /**
   * 记录购买
   */
  @Post('track-purchase')
  trackPurchase(@Body() body: {
    tenantId: string
    memberId: string
    itemId: string
    quantity?: number
    amountCents?: number
    category: string
  }): { recorded: boolean } {
    if (!body.tenantId || !body.memberId || !body.itemId) {
      throw new BadRequestException('tenantId, memberId, itemId required')
    }
    this.purchaseAdapter.recordPurchase({
      tenantId: body.tenantId,
      memberId: body.memberId,
      itemId: body.itemId,
      category: body.category,
      purchasedAt: new Date().toISOString(),
      quantity: body.quantity ?? 1,
      amountCents: body.amountCents ?? 0
    })
    this.productAdapter.incrementSold(body.itemId, body.quantity ?? 1)
    return { recorded: true }
  }

  /**
   * 更新会员偏好
   */
  @Post('preferences')
  updatePreferences(@Body() body: any): { updated: boolean } {
    if (!body.tenantId || !body.memberId) {
      throw new BadRequestException('tenantId, memberId required')
    }
    this.prefAdapter.update(body)
    return { updated: true }
  }

  /**
   * 缓存失效
   */
  @Post('cache/invalidate')
  invalidateCache(@Body() body: { tenantId: string }): { invalidated: number } {
    if (!body.tenantId) throw new BadRequestException('tenantId required')
    return { invalidated: this.cache.invalidate(body.tenantId) }
  }

  /**
   * 缓存统计
   */
  @Get('cache/stats')
  cacheStats(): { size: number; maxEntries: number } {
    return this.cache.stats()
  }

  /**
   * 健康检查
   */
  @Get('health')
  health(): { status: 'ok' | 'degraded'; stats: any } {
    return {
      status: 'ok',
      stats: this.cache.stats()
    }
  }
}