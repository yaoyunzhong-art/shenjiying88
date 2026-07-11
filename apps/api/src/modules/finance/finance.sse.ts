/**
 * finance.sse.ts — P-38 财务对账模块 SSE 事件推送
 *
 * 提供实时事件流端点：
 *   1. GET /api/finance/events              — 财务全事件流
 *   2. GET /api/finance/reconciliation/events  — 对账进度事件流
 *   3. GET /api/finance/reports/events         — 报表生成进度事件流
 *
 * 防御:
 *   - TenantGuard 强制租户隔离
 *   - 事件内含 tenantId 双重过滤
 *   - Last-Event-ID 重连支持
 */

import {
  Controller,
  Sse,
  UseGuards,
  Req,
  Param,
  MessageEvent,
  Query,
  Get,
  Res,
  Logger
} from '@nestjs/common'
import { Observable, Subject } from 'rxjs'
import { map, filter } from 'rxjs/operators'
import type { Response } from 'express'
import { TenantGuard } from '../agent/tenant.guard'

// ─── 事件类型定义 ─────────────────────────────────────────

export type FinanceEventType =
  | 'ledger.created'
  | 'account.created'
  | 'account.frozen'
  | 'account.closed'
  | 'settlement.created'
  | 'settlement.confirmed'
  | 'settlement.disputed'
  | 'invoice.created'
  | 'invoice.issued'
  | 'invoice.cancelled'
  | 'reconciliation.started'
  | 'reconciliation.progress'
  | 'reconciliation.completed'
  | 'reconciliation.mismatch'
  | 'report.generating'
  | 'report.completed'
  | 'report.failed'

export interface FinanceBaseEvent {
  tenantId: string
  timestamp: string
  [key: string]: unknown
}

export type FinanceEventPayload =
  | { type: 'ledger.created'; tenantId: string; ledgerId: string; amount: number; currentBalance: number; timestamp: string }
  | { type: 'account.created'; tenantId: string; accountId: string; accountName: string; accountType: string; timestamp: string }
  | { type: 'account.frozen'; tenantId: string; accountId: string; timestamp: string }
  | { type: 'account.closed'; tenantId: string; accountId: string; timestamp: string }
  | { type: 'settlement.created'; tenantId: string; settlementId: string; totalRevenue: number; totalExpense: number; netProfit: number; timestamp: string }
  | { type: 'settlement.confirmed'; tenantId: string; settlementId: string; timestamp: string }
  | { type: 'settlement.disputed'; tenantId: string; settlementId: string; timestamp: string }
  | { type: 'invoice.created'; tenantId: string; invoiceId: string; invoiceNo: string; amount: number; timestamp: string }
  | { type: 'invoice.issued'; tenantId: string; invoiceId: string; timestamp: string }
  | { type: 'invoice.cancelled'; tenantId: string; invoiceId: string; timestamp: string }
  | { type: 'reconciliation.started'; tenantId: string; batchId: string; batchNo: string; channel: string; totalTransactions: number; timestamp: string }
  | { type: 'reconciliation.progress'; tenantId: string; batchId: string; processed: number; total: number; progress: number; timestamp: string }
  | { type: 'reconciliation.completed'; tenantId: string; batchId: string; matched: number; mismatched: number; totalDifference: number; timestamp: string }
  | { type: 'reconciliation.mismatch'; tenantId: string; batchId: string; transactionId: string; difference: number; timestamp: string }
  | { type: 'report.generating'; tenantId: string; reportId: string; reportType: string; timestamp: string }
  | { type: 'report.completed'; tenantId: string; reportId: string; status: string; timestamp: string }
  | { type: 'report.failed'; tenantId: string; reportId: string; error: string; timestamp: string }

export interface FinanceMessageEvent {
  id: string
  type: string
  data: FinanceEventPayload
}

interface EventStoreRecord {
  event: FinanceEventPayload
  eventId: string
  timestamp: string
  tenantId: string
}

interface TenantRequest {
  tenantId: string
  userId?: string
}

/**
 * FinanceEventEmitter — 财务事件总线
 *
 * 职责:
 *   1. emit() 接收业务事件
 *   2. 同步写入 EventStore (重放用)
 *   3. 推送到 Subject 流 (SSE controller 订阅)
 *   4. tenantId 过滤在订阅侧完成
 */
export class FinanceEventEmitter {
  private readonly logger = new Logger(FinanceEventEmitter.name)
  private readonly subject = new Subject<FinanceMessageEvent>()
  private readonly store: EventStoreRecord[] = []
  private eventSeq = 0
  private static readonly MAX_STORE_SIZE = 10000

  /**
   * 发射财务事件
   */
  emit(event: FinanceEventPayload): string {
    this.eventSeq += 1
    const eventId = `fin-evt-${Date.now()}-${this.eventSeq}`
    const timestamp = new Date().toISOString()

    const messageEvent: FinanceMessageEvent = {
      id: eventId,
      type: event.type,
      data: event
    }

    // EventStore 持久化
    try {
      this.store.push({ event, eventId, timestamp, tenantId: event.tenantId })
      if (this.store.length > FinanceEventEmitter.MAX_STORE_SIZE) {
        this.store.splice(0, this.store.length - FinanceEventEmitter.MAX_STORE_SIZE)
      }
    } catch (err) {
      this.logger.error(`EventStore write failed: ${(err as Error).message}`)
    }

    // Subject 推送
    try {
      this.subject.next(messageEvent)
    } catch (err) {
      this.logger.error(`Subject emit failed: ${(err as Error).message}`)
    }

    this.logger.debug(`emit ${event.type} tenant=${event.tenantId} id=${eventId}`)
    return eventId
  }

  /**
   * 获取事件流 (SSE controller 订阅)
   */
  stream(): Observable<FinanceMessageEvent> {
    return this.subject.asObservable()
  }

  /**
   * 从 EventStore 恢复事件 (Last-Event-ID 重连)
   */
  replay(lastEventId: string, tenantId: string): FinanceMessageEvent[] {
    const lastIdx = this.store.findIndex((r) => r.eventId === lastEventId)
    const startIdx = lastIdx >= 0 ? lastIdx + 1 : 0

    return this.store
      .slice(startIdx)
      .filter((r) => r.tenantId === tenantId)
      .map((r) => ({
        id: r.eventId,
        type: r.event.type,
        data: r.event
      }))
  }

  /** 测试用: 清空 store */
  clearStore(): void {
    this.store.length = 0
    this.eventSeq = 0
  }

  /** 测试用: 获取 store 大小 */
  storeSize(): number {
    return this.store.length
  }
}

// ─── SSE Controller ──────────────────────────────────────

@Controller('api/finance')
@UseGuards(TenantGuard)
export class FinanceSseController {
  private readonly logger = new Logger(FinanceSseController.name)

  constructor(private readonly emitter: FinanceEventEmitter) {}

  /**
   * SSE 端点 1: 财务全事件流
   * GET /api/finance/events
   */
  @Sse('events')
  financeEvents(@Req() req: TenantRequest): Observable<MessageEvent> {
    const tenantId = req.tenantId

    return this.emitter.stream().pipe(
      filter((msg) => this.belongsToTenant(msg, tenantId)),
      map((msg) => this.toMessageEvent(msg))
    )
  }

  /**
   * SSE 端点 2: 对账进度事件流
   * GET /api/finance/reconciliation/events
   */
  @Sse('reconciliation/events')
  reconciliationEvents(@Req() req: TenantRequest): Observable<MessageEvent> {
    const tenantId = req.tenantId

    return this.emitter.stream().pipe(
      filter((msg) => this.belongsToTenant(msg, tenantId)),
      filter((msg) => msg.type.startsWith('reconciliation.')),
      map((msg) => this.toMessageEvent(msg))
    )
  }

  /**
   * SSE 端点 3: 报表生成进度事件流
   * GET /api/finance/reports/events
   */
  @Sse('reports/events')
  reportEvents(@Req() req: TenantRequest): Observable<MessageEvent> {
    const tenantId = req.tenantId

    return this.emitter.stream().pipe(
      filter((msg) => this.belongsToTenant(msg, tenantId)),
      filter((msg) => msg.type.startsWith('report.')),
      map((msg) => this.toMessageEvent(msg))
    )
  }

  /**
   * SSE 重连端点
   * GET /api/finance/events/replay?lastEventId=fin-evt-xxx
   */
  @Get('events/replay')
  replayEvents(
    @Req() req: TenantRequest,
    @Query('lastEventId') lastEventId: string,
    @Res() res: Response
  ): void {
    const tenantId = req.tenantId

    if (!lastEventId) {
      res.status(400).json({ error: 'lastEventId query parameter required' })
      return
    }

    const replayEvents = this.emitter.replay(lastEventId, tenantId)

    res.status(200).json({
      replayed: replayEvents.length,
      events: replayEvents,
      tenantId
    })
  }

  // ─── 私有辅助方法 ───

  private belongsToTenant(msg: FinanceMessageEvent, tenantId: string): boolean {
    if (!msg.data || typeof msg.data !== 'object') return false
    return (msg.data as FinanceBaseEvent).tenantId === tenantId
  }

  private toMessageEvent(msg: FinanceMessageEvent): MessageEvent {
    return {
      id: msg.id,
      type: msg.type,
      data: msg.data
    }
  }
}
