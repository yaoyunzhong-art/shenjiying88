import {
  Controller,
  Sse,
  UseGuards,
  Req,
  Param,
  MessageEvent,
  Query,
  Get,
  Res
} from '@nestjs/common'
import { Observable, merge, from } from 'rxjs'
import { map, filter, mergeMap } from 'rxjs/operators'
import type { Response } from 'express'
import { CashierEventEmitter, CashierEvent, CashierMessageEvent } from './cashier.events'
import { TenantGuard } from '../agent/tenant.guard'

/**
 * Phase-35 T164: 收银台 SSE 端点
 *
 * 3 端点:
 *  1. GET /api/cashier/orders/events         (全订单事件流)
 *  2. GET /api/cashier/orders/:orderId/events (单订单事件流)
 *  3. GET /api/cashier/payments/events       (支付事件流)
 *
 * 防御:
 *  - TenantGuard 强制注入 (AC-5 租户隔离)
 *  - tenantId filter 双重保险 (Guard + SSE 内部)
 *  - Last-Event-ID 重连支持 (Phase-32)
 *  - 静态扫描: grep 'tenantId' cashier.sse.ts ✅
 */

interface TenantRequest {
  tenantId: string
  userId?: string
}

@Controller('api/cashier')
@UseGuards(TenantGuard)
export class CashierSseController {
  constructor(private readonly emitter: CashierEventEmitter) {}

  /**
   * SSE 端点 1: 全收银台订单事件流
   */
  @Sse('orders/events')
  orderEvents(@Req() req: TenantRequest): Observable<MessageEvent> {
    const tenantId = req.tenantId

    // 实时事件流 + tenant 过滤
    return this.emitter.stream().pipe(
      filter((msg) => this.belongsToTenant(msg, tenantId)),
      filter((msg) => this.isOrderEvent(msg)),
      map((msg) => this.toMessageEvent(msg))
    )
  }

  /**
   * SSE 端点 2: 单订单事件流
   */
  @Sse('orders/:orderId/events')
  orderSingleEvents(
    @Req() req: TenantRequest,
    @Param('orderId') orderId: string
  ): Observable<MessageEvent> {
    const tenantId = req.tenantId

    return this.emitter.stream().pipe(
      filter((msg) => this.belongsToTenant(msg, tenantId)),
      filter((msg) => msg.data.orderId === orderId),
      map((msg) => this.toMessageEvent(msg))
    )
  }

  /**
   * SSE 端点 3: 支付事件流
   */
  @Sse('payments/events')
  paymentEvents(@Req() req: TenantRequest): Observable<MessageEvent> {
    const tenantId = req.tenantId

    return this.emitter.stream().pipe(
      filter((msg) => this.belongsToTenant(msg, tenantId)),
      filter((msg) => this.isPaymentOrRefundEvent(msg)),
      map((msg) => this.toMessageEvent(msg))
    )
  }

  /**
   * SSE 重连端点 (Phase-32 Last-Event-ID)
   * GET /api/cashier/orders/events/replay?lastEventId=evt-xxx
   * 返回一次性 replay 事件 (不是流, 而是当前未收到的历史事件)
   */
  @Get('orders/events/replay')
  replayOrderEvents(
    @Req() req: TenantRequest,
    @Query('lastEventId') lastEventId: string,
    @Res() res: Response
  ): void {
    const tenantId = req.tenantId

    if (!lastEventId) {
      res.status(400).json({ error: 'lastEventId required' })
      return
    }

    // 从 EventStore 拉取 lastEventId 之后的所有事件
    const replayEvents = this.emitter.replay(lastEventId, tenantId)

    res.status(200).json({
      replayed: replayEvents.length,
      events: replayEvents,
      tenantId  // 防御: 强制返回 tenantId 让客户端校验
    })
  }

  // ─── 私有辅助方法 ───

  private belongsToTenant(msg: CashierMessageEvent, tenantId: string): boolean {
    // 强制 tenantId 过滤 (防御数据泄漏)
    if (!msg.data || typeof msg.data !== 'object') return false
    const eventTenantId = (msg.data as CashierEvent).tenantId
    return eventTenantId === tenantId
  }

  private isOrderEvent(msg: CashierMessageEvent): boolean {
    return msg.type.startsWith('order.')
  }

  private isPaymentOrRefundEvent(msg: CashierMessageEvent): boolean {
    return msg.type.startsWith('payment.') || msg.type.startsWith('refund.')
  }

  private toMessageEvent(msg: CashierMessageEvent): MessageEvent {
    return {
      id: msg.id,
      type: msg.type,
      data: msg.data
    }
  }
}
