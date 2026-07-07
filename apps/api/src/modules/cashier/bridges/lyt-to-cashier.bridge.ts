import { Injectable, Logger, Optional } from '@nestjs/common'
import type { RequestTenantContext } from '../../tenant/tenant.types'
import { IntegrationOrchestrationService } from '../../foundation/integration-orchestration/integration-orchestration.service'
import type { BillingWall } from '../../foundation/commercial-billing/billing-wall'
import {
  type BridgeProcessResult,
  type LytToCashierEventName,
  type LytMemberProfileSyncedEvent,
  type LytOrderExternalCreatedEvent,
  type LytGatePassRecordEvent,
  buildLytToCashierKey
} from './cashier-lyt-events'

/**
 * LytToCashierBridge · LYT → cashier 事件桥
 *
 * 职责:
 *   - 接收 LYT webhook 事件 (member.profile-synced, order.external-created, gate.pass-record)
 *   - 翻译为 cashier 域动作
 *   - 幂等: 重复事件静默 skip
 *
 * 真实集成:
 *   - IntegrationOrchestrationService.acceptWebhook 已 ingest LYT webhook
 *   - 本类作为 subscriber, 监听 'lyt.*' eventName
 *   - 由 cashier.module 在 onApplicationBootstrap 中订阅
 *
 * 当前实现 (P1-1.3 MVP):
 *   - 提供 3 个 handle 方法, 由 webhook 路由直接调用
 *   - 业务动作通过 deps 注入 (避免循环依赖)
 */

export interface LytToCashierBridgeDeps {
  /** 同步会员档案 → cashier MemberService */
  syncMemberProfile(input: {
    memberId: string
    tenantId: string
    profile: LytMemberProfileSyncedEvent['profile']
  }): Promise<{ updated: boolean }>

  /** 同步外部订单 → cashier OrderService */
  syncExternalOrder(input: {
    lytOrderId: string
    memberId: string
    tenantId: string
    amountCents: number
    productType: LytOrderExternalCreatedEvent['productType']
    productRef: string
  }): Promise<{ cashierOrderId: string }>

  /** 记录门闸通行 → cashier fulfillment */
  recordGatePass(input: {
    memberId: string
    tenantId: string
    gateId: string
    passType: LytGatePassRecordEvent['passType']
    passAt: string
    relatedOrderId?: string
  }): Promise<{ recorded: boolean }>
}

@Injectable()
export class LytToCashierBridge {
  private readonly logger = new Logger(LytToCashierBridge.name)
  private readonly idempotencyCache = new Set<string>()

  constructor(
    private readonly deps: LytToCashierBridgeDeps,
    @Optional() private readonly integration?: IntegrationOrchestrationService,
    @Optional() private readonly billingWall?: BillingWall
  ) {}

  // ─── 公开 API: 3 个事件 handle ──────────────────────

  async handleMemberProfileSynced(
    event: LytMemberProfileSyncedEvent,
    ctx: RequestTenantContext
  ): Promise<BridgeProcessResult> {
    const key = buildLytToCashierKey(
      'lyt.member.profile-synced',
      event.tenantId,
      `${event.lytMemberId}:${event.syncedAt}`
    )
    return this.dispatch(
      key,
      'lyt.member.profile-synced',
      event.tenantId,
      event,
      ctx,
      async () => {
        const result = await this.deps.syncMemberProfile({
          memberId: event.memberId,
          tenantId: event.tenantId,
          profile: event.profile
        })
        return { lytOrderId: event.memberId, status: result.updated ? 'UPDATED' : 'NOOP' }
      }
    )
  }

  async handleExternalOrderCreated(
    event: LytOrderExternalCreatedEvent,
    ctx: RequestTenantContext
  ): Promise<BridgeProcessResult> {
    const key = buildLytToCashierKey(
      'lyt.order.external-created',
      event.tenantId,
      event.lytOrderId
    )
    return this.dispatch(
      key,
      'lyt.order.external-created',
      event.tenantId,
      event,
      ctx,
      async () => {
        const result = await this.deps.syncExternalOrder({
          lytOrderId: event.lytOrderId,
          memberId: event.memberId,
          tenantId: event.tenantId,
          amountCents: event.amountCents,
          productType: event.productType,
          productRef: event.productRef
        })
        return { lytOrderId: result.cashierOrderId, status: 'CREATED' }
      }
    )
  }

  async handleGatePassRecord(
    event: LytGatePassRecordEvent,
    ctx: RequestTenantContext
  ): Promise<BridgeProcessResult> {
    const key = buildLytToCashierKey(
      'lyt.gate.pass-record',
      event.tenantId,
      event.lytPassId
    )
    return this.dispatch(
      key,
      'lyt.gate.pass-record',
      event.tenantId,
      event,
      ctx,
      async () => {
        const result = await this.deps.recordGatePass({
          memberId: event.memberId,
          tenantId: event.tenantId,
          gateId: event.gateId,
          passType: event.passType,
          passAt: event.passAt,
          relatedOrderId: event.relatedOrderId
        })
        return { lytOrderId: event.lytPassId, status: result.recorded ? 'RECORDED' : 'NOOP' }
      }
    )
  }

  // ─── 内部通用 dispatch ───────────────────────────────

  private eventNameToMetric(eventName: LytToCashierEventName): string {
    if (eventName === 'lyt.member.profile-synced') return 'lyt_bridge.member'
    if (eventName === 'lyt.order.external-created') return 'lyt_bridge.order'
    if (eventName === 'lyt.gate.pass-record') return 'lyt_bridge.gate'
    return 'lyt_bridge.unknown'
  }

  private async dispatch<TPayload>(
    idempotencyKey: string,
    eventName: LytToCashierEventName,
    tenantId: string,
    payload: TPayload,
    _ctx: RequestTenantContext,
    handler: () => Promise<{ lytOrderId: string; status: string }>
  ): Promise<BridgeProcessResult> {
    const startedAt = Date.now()

    if (this.idempotencyCache.has(idempotencyKey)) {
      this.logger.debug(`Duplicate (skipped): ${idempotencyKey}`)
      return {
        status: 'duplicate',
        idempotencyKey,
        message: 'duplicate event',
        durationMs: Date.now() - startedAt
      }
    }

    try {
      const result = await handler()
      this.idempotencyCache.add(idempotencyKey)

      await this.integration?.publishEvent(
        eventName,
        { idempotencyKey, ...payload, ...result },
        { source: 'lyt-cashier-bridge', aggregateId: idempotencyKey, idempotencyKey }
      )

      // 计费 (P3-5.5): LYT 桥事件按 metric 记录 usage
      //   - lyt.member.profile-synced → lyt_bridge.member
      //   - lyt.order.external-created → lyt_bridge.order
      //   - lyt.gate.pass-record → lyt_bridge.gate
      // 用于审计 + LYT 桥接包月套餐计费
      if (this.billingWall) {
        try {
          const metric = this.eventNameToMetric(eventName)
          this.billingWall.recordUsage(tenantId, metric, 1)
        } catch (err) {
          this.logger.warn(
            `BillingWall recordUsage failed tenant=${tenantId}: ${(err as Error).message}`
          )
        }
      }

      this.logger.log(
        `Handled ${eventName} (refId=${result.lytOrderId}, status=${result.status}, duration=${Date.now() - startedAt}ms)`
      )
      return {
        status: 'success',
        idempotencyKey,
        message: result.status,
        durationMs: Date.now() - startedAt
      }
    } catch (error) {
      const reason = (error as Error).message
      this.logger.error(`Bridge handle failed: ${idempotencyKey} (${reason})`)
      return {
        status: 'failed',
        idempotencyKey,
        message: reason,
        durationMs: Date.now() - startedAt
      }
    }
  }
}
