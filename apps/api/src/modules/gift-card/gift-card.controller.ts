/**
 * gift-card.controller.ts — 礼品卡 Controller
 *
 * 路由前缀: /gift-card
 * Guards:   @UseGuards(TenantGuard) — 强制 tenantId 注入
 *
 * REST API:
 *   POST   /gift-card            — 创建礼品卡
 *   POST   /gift-card/:cardId/activate — 激活
 *   POST   /gift-card/:cardId/topup     — 充值
 *   POST   /gift-card/:cardId/consume   — 消费
 *   POST   /gift-card/:cardId/freeze    — 冻结
 *   POST   /gift-card/:cardId/unfreeze  — 解冻
 *   POST   /gift-card/:cardId/cancel    — 取消
 *   POST   /gift-card/:cardId/refund    — 退款
 *   GET    /gift-card/:cardId           — 详情
 *   GET    /gift-card                   — 列表（支持过滤）
 *   GET    /gift-card/:cardId/transactions — 交易流水
 *   GET    /gift-card/stats             — 统计摘要
 *   POST   /gift-card/cleanup-expired   — 清理过期卡
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { TenantGuard } from '../agent/tenant.guard'
import { GiftCardService } from './gift-card.service'
import {
  CreateGiftCardDto,
  ActivateGiftCardDto,
  TopupGiftCardDto,
  ConsumeGiftCardDto,
  ListGiftCardQueryDto,
  StatusActionDto,
  RefundGiftCardDto,
} from './gift-card.dto'

@Controller('gift-card')
@UseGuards(TenantGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class GiftCardController {
  constructor(private readonly giftCardService: GiftCardService) {}

  // ─── 创建 ──────────────────────────────────────────────────

  /**
   * POST /gift-card — 创建礼品卡
   */
  @Post()
  create(
    @Body() body: CreateGiftCardDto,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    try {
      const card = this.giftCardService.create({
        ...body,
        tenantId,
      })
      return { success: true, data: card }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  // ─── 激活 ──────────────────────────────────────────────────

  /**
   * POST /gift-card/:cardId/activate — 激活礼品卡
   */
  @Post(':cardId/activate')
  activate(
    @Param('cardId') cardId: string,
    @Body() body: ActivateGiftCardDto,
  ) {
    try {
      const card = this.giftCardService.activate(cardId, body.operatorId)
      return { success: true, data: card }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  // ─── 充值 ──────────────────────────────────────────────────

  /**
   * POST /gift-card/:cardId/topup — 充值
   */
  @Post(':cardId/topup')
  topup(
    @Param('cardId') cardId: string,
    @Body() body: TopupGiftCardDto,
  ) {
    try {
      const card = this.giftCardService.topup({
        cardId,
        amount: body.amount,
        operatorId: body.operatorId,
        remark: body.remark,
      })
      return { success: true, data: card }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  // ─── 消费 ──────────────────────────────────────────────────

  /**
   * POST /gift-card/:cardId/consume — 消费
   */
  @Post(':cardId/consume')
  consume(
    @Param('cardId') cardId: string,
    @Body() body: ConsumeGiftCardDto,
  ) {
    try {
      const card = this.giftCardService.consume({
        cardId,
        amount: body.amount,
        orderId: body.orderId,
        operatorId: body.operatorId,
        remark: body.remark,
      })
      return { success: true, data: card }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  // ─── 冻结 ──────────────────────────────────────────────────

  /**
   * POST /gift-card/:cardId/freeze — 冻结
   */
  @Post(':cardId/freeze')
  freeze(
    @Param('cardId') cardId: string,
    @Body() body: StatusActionDto,
  ) {
    try {
      const card = this.giftCardService.freeze(cardId, body.operatorId, body.remark)
      return { success: true, data: card }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  // ─── 解冻 ──────────────────────────────────────────────────

  /**
   * POST /gift-card/:cardId/unfreeze — 解冻
   */
  @Post(':cardId/unfreeze')
  unfreeze(
    @Param('cardId') cardId: string,
    @Body() body: StatusActionDto,
  ) {
    try {
      const card = this.giftCardService.unfreeze(cardId, body.operatorId, body.remark)
      return { success: true, data: card }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  // ─── 取消 ──────────────────────────────────────────────────

  /**
   * POST /gift-card/:cardId/cancel — 取消
   */
  @Post(':cardId/cancel')
  cancel(
    @Param('cardId') cardId: string,
    @Body() body: StatusActionDto,
  ) {
    try {
      const card = this.giftCardService.cancel(cardId, body.operatorId, body.remark)
      return { success: true, data: card }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  // ─── 退款 ──────────────────────────────────────────────────

  /**
   * POST /gift-card/:cardId/refund — 退款
   */
  @Post(':cardId/refund')
  refund(
    @Param('cardId') cardId: string,
    @Body() body: RefundGiftCardDto,
  ) {
    try {
      const card = this.giftCardService.refund(
        cardId,
        body.amount,
        body.operatorId,
        body.remark,
      )
      return { success: true, data: card }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  // ─── 详情 ──────────────────────────────────────────────────

  /**
   * GET /gift-card/:cardId — 详情查询
   */
  @Get(':cardId')
  getById(@Param('cardId') cardId: string) {
    const card = this.giftCardService.getById(cardId)
    if (!card) {
      return { success: false, message: `礼品卡 ${cardId} 不存在` }
    }
    return { success: true, data: card }
  }

  // ─── 列表 ──────────────────────────────────────────────────

  /**
   * GET /gift-card — 列表查询（支持过滤）
   */
  @Get()
  list(@Query() query: ListGiftCardQueryDto) {
    const cards = this.giftCardService.list({
      status: query.status,
      holderName: query.holderName,
      holderPhone: query.holderPhone,
    })
    return { success: true, data: cards, total: cards.length }
  }

  // ─── 交易流水 ──────────────────────────────────────────────

  /**
   * GET /gift-card/:cardId/transactions — 交易流水
   */
  @Get(':cardId/transactions')
  getTransactions(@Param('cardId') cardId: string) {
    try {
      const txs = this.giftCardService.getTransactions(cardId)
      return { success: true, data: txs, total: txs.length }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  // ─── 统计 ──────────────────────────────────────────────────

  /**
   * GET /gift-card/stats — 统计摘要
   */
  @Get('stats')
  getStats(@Headers('x-tenant-id') tenantId?: string) {
    const stats = this.giftCardService.getStats(tenantId)
    return { success: true, data: stats }
  }

  // ─── 过期清理 ──────────────────────────────────────────────

  /**
   * POST /gift-card/cleanup-expired — 清理过期卡
   */
  @Post('cleanup-expired')
  cleanupExpired() {
    const count = this.giftCardService.cleanupExpired()
    return {
      success: true,
      data: { cleaned: count },
      message: `已清理 ${count} 张过期礼品卡`,
    }
  }
}
