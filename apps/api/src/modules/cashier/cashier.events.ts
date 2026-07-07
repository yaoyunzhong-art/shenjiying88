import { Injectable, Logger } from '@nestjs/common'
import { Subject, Observable } from 'rxjs'

/**
 * Phase-35 T164: 收银台 SSE 事件类型定义
 *
 * 设计原则:
 *  - 所有事件必含 tenantId, orderId, timestamp (防御 + 重放)
 *  - TypeScript discriminated union 类型化 (编译期安全)
 *  - 11 类事件覆盖 order/payment/refund 全生命周期
 */

/** 事件类型 (TypeScript discriminated union) */
export type CashierEvent =
  | { type: 'order.created'; tenantId: string; orderId: string; amount: number; createdAt: string }
  | { type: 'order.submitted'; tenantId: string; orderId: string; submittedAt: string }
  | { type: 'order.paid'; tenantId: string; orderId: string; paidAt: string; paymentId: string }
  | { type: 'order.fulfilled'; tenantId: string; orderId: string; fulfilledAt: string }
  | { type: 'order.partially_refunded'; tenantId: string; orderId: string; refundedCents: number; remainingCents: number; refundId: string }
  | { type: 'order.refunded'; tenantId: string; orderId: string; refundedAt: string; amount: number; refundId: string }
  | { type: 'order.canceled'; tenantId: string; orderId: string; canceledAt: string; reason: string }
  | { type: 'order.timeout'; tenantId: string; orderId: string; timeoutAt: string }
  | { type: 'payment.success'; tenantId: string; orderId: string; paymentId: string; channel: string; amount: number }
  | { type: 'payment.failed'; tenantId: string; orderId: string; paymentId: string; reason: string }
  | { type: 'refund.success'; tenantId: string; orderId: string; refundId: string; amount: number }
  | { type: 'refund.failed'; tenantId: string; orderId: string; refundId: string; reason: string }

/** 事件类型字符串联合 (用于 SSE filter / 反模式扫描) */
export type CashierEventType = CashierEvent['type']

/** SSE MessageEvent 结构 (NestJS 标准) */
export interface CashierMessageEvent {
  id: string
  type: string
  data: CashierEvent
}

/** 事件 store (Phase-33 EventStore 抽象, in-memory 实现) */
interface EventStoreRecord {
  event: CashierEvent
  eventId: string
  timestamp: string
}

/**
 * CashierEventEmitter - 收银台业务事件总线
 *
 * 职责:
 *  1. emit() 接收业务事件 (由 OrderService/PaymentService/RefundService 调用)
 *  2. 同步写入 EventStore (Phase-33 重放用)
 *  3. 推送到 Subject 流 (CashierSseController 订阅)
 *  4. tenantId 过滤在订阅侧完成 (SSE controller 强制)
 */
@Injectable()
export class CashierEventEmitter {
  private readonly logger = new Logger(CashierEventEmitter.name)
  private readonly subject = new Subject<CashierMessageEvent>()
  private readonly store: EventStoreRecord[] = []
  private eventSeq = 0

  /**
   * 发射业务事件
   * @param event CashierEvent discriminated union
   * @returns eventId (用于 SSE Last-Event-ID 重连)
   */
  emit(event: CashierEvent): string {
    this.eventSeq += 1
    const eventId = `evt-${Date.now()}-${this.eventSeq}`
    const timestamp = new Date().toISOString()

    const messageEvent: CashierMessageEvent = {
      id: eventId,
      type: event.type,
      data: event
    }

    // 1. EventStore 持久化 (Phase-33)
    try {
      this.store.push({ event, eventId, timestamp })
      // 防御: store 不超过 10000 条 (LRU 简化)
      if (this.store.length > 10000) {
        this.store.shift()
      }
    } catch (err) {
      this.logger.error(`EventStore write failed: ${(err as Error).message}`)
      // 不抛错 - 业务事件流不阻塞业务流
    }

    // 2. Subject 推送给订阅者 (SSE controller)
    try {
      this.subject.next(messageEvent)
    } catch (err) {
      this.logger.error(`Subject emit failed: ${(err as Error).message}`)
    }

    this.logger.debug(`emit ${event.type} tenant=${event.tenantId} order=${event.orderId} id=${eventId}`)
    return eventId
  }

  /**
   * 获取事件流 (SSE controller 订阅)
   */
  stream(): Observable<CashierMessageEvent> {
    return this.subject.asObservable()
  }

  /**
   * 从 EventStore 恢复事件 (Phase-32 Last-Event-ID 重连用)
   * @param lastEventId 客户端最后收到的事件 ID
   * @param tenantId 强制租户过滤 (防御)
   */
  replay(lastEventId: string, tenantId: string): CashierMessageEvent[] {
    const lastIdx = this.store.findIndex((r) => r.eventId === lastEventId)
    const startIdx = lastIdx >= 0 ? lastIdx + 1 : 0

    return this.store
      .slice(startIdx)
      .filter((r) => r.event.tenantId === tenantId)  // tenant 强制过滤
      .map((r) => ({
        id: r.eventId,
        type: r.event.type,
        data: r.event
      }))
  }

  /**
   * 测试用: 清空 store (不暴露给生产)
   */
  clearStore(): void {
    this.store.length = 0
    this.eventSeq = 0
  }

  /**
   * 测试用: 获取 store 大小
   */
  storeSize(): number {
    return this.store.length
  }
}
