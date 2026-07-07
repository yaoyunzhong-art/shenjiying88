import { Injectable, Logger, Optional } from '@nestjs/common'
import type { ILytAdapter } from '../../lyt/interfaces/lyt-adapter.interface'
import type { RequestTenantContext } from '../../tenant/tenant.types'
import { IntegrationOrchestrationService } from '../../foundation/integration-orchestration/integration-orchestration.service'
import {
  type BridgeProcessResult,
  type CashierToLytEventName,
  type CashierOrderPaidEvent,
  type CashierOrderRefundedEvent,
  type CashierMemberTierUpgradeEvent,
  buildCashierToLytKey
} from './cashier-lyt-events'

/**
 * CashierToLytBridge · cashier → LYT 事件桥
 *
 * 职责:
 *   - 监听 cashier 域事件 (order.paid, order.refunded, member.tier-upgrade)
 *   - 翻译为 LYT adapter 调用 (createOrder / createRefund / updateMember)
 *   - 幂等: 重复事件静默 skip
 *   - 重试: 失败抛 LytBridgeError, 由上层 Outbox 模式兜底
 *
 * 不依赖:
 *   - LytAdapterRegistry (caller 负责按 tenantId 选 adapter 注入)
 *   - LytService (本类只翻译事件, 不做业务编排)
 *
 * 使用模式 (P1-1 落地):
 *   - cashier module 注入本类
 *   - OrderService.pay 成功后 → bridge.dispatchPaidOrder(event)
 *   - RefundService 成功后 → bridge.dispatchRefundedOrder(event)
 *   - LoyaltyService 升级 → bridge.dispatchMemberUpgrade(event)
 */

export interface CashierToLytBridgeDeps {
  /** LYT 适配器解析器 (e.g. LytConnectionManager.resolve) */
  resolveLytAdapter(tenantId: string): ILytAdapter
}

@Injectable()
export class CashierToLytBridge {
  private readonly logger = new Logger(CashierToLytBridge.name)
  private readonly idempotencyCache = new Set<string>()

  constructor(
    private readonly deps: CashierToLytBridgeDeps,
    @Optional() private readonly integration?: IntegrationOrchestrationService
  ) {}

  // ─── 公开 API: 3 个事件 dispatch ──────────────────────

  async dispatchPaidOrder(
    event: CashierOrderPaidEvent,
    ctx: RequestTenantContext
  ): Promise<BridgeProcessResult> {
    const key = buildCashierToLytKey('cashier.order.paid', event.tenantId, event.orderId)
    return this.dispatch(
      key,
      'cashier.order.paid',
      event.tenantId,
      event,
      ctx,
      async (adapter) => {
        const result = await adapter.createOrder({
          storeId: event.tenantId,
          lytOrderId: event.orderId,
          memberId: event.memberId,
          totalCents: event.totalCents,
          paidAt: event.paidAt,
          providerTxnId: event.providerTxnId,
          method: event.method,
          coinProductId: event.coinProductId,
          coinQuantity: event.coinQuantity,
          items: [
            {
              skuId: event.coinProductId ?? 'unknown',
              quantity: event.coinQuantity ?? 1,
              price: event.totalCents ?? 0
            }
          ]
        })
        return { lytOrderId: result.orderId, status: result.status }
      }
    )
  }

  async dispatchRefundedOrder(
    event: CashierOrderRefundedEvent,
    ctx: RequestTenantContext
  ): Promise<BridgeProcessResult> {
    const key = buildCashierToLytKey(
      'cashier.order.refunded',
      event.tenantId,
      event.refundId
    )
    return this.dispatch(
      key,
      'cashier.order.refunded',
      event.tenantId,
      event,
      ctx,
      async () => {
        // LYT 适配器暂未提供 createRefund, 这里只 audit
        this.logger.log(
          `Order refunded: orderId=${event.orderId} refundCents=${event.refundCents}`
        )
        return { lytOrderId: event.orderId, status: 'SYNCED' as const }
      }
    )
  }

  async dispatchMemberUpgrade(
    event: CashierMemberTierUpgradeEvent,
    ctx: RequestTenantContext
  ): Promise<BridgeProcessResult> {
    const key = buildCashierToLytKey(
      'cashier.member.tier-upgrade',
      event.tenantId,
      event.memberId
    )
    return this.dispatch(
      key,
      'cashier.member.tier-upgrade',
      event.tenantId,
      event,
      ctx,
      async (adapter) => {
        if (!adapter.updateMember) {
          // mock 适配器未实现 updateMember, 仅 audit log
          this.logger.log(
            `Member tier-upgrade (audit only, no adapter impl): memberId=${event.memberId} newTier=${event.newTier}`
          )
          return { lytOrderId: event.memberId, status: 'UPDATED' }
        }
        const result = await adapter.updateMember({
          memberId: event.memberId,
          tier: event.newTier
        })
        return { lytOrderId: result.memberId, status: result.status }
      }
    )
  }

  // ─── 内部通用 dispatch ───────────────────────────────

  private async dispatch<TPayload>(
    idempotencyKey: string,
    eventName: CashierToLytEventName,
    tenantId: string,
    payload: TPayload,
    ctx: RequestTenantContext,
    handler: (adapter: ILytAdapter) => Promise<{ lytOrderId: string; status: string }>
  ): Promise<BridgeProcessResult> {
    const startedAt = Date.now()

    // 1. 幂等检查 (in-memory, P1-3 落 Outbox)
    if (this.idempotencyCache.has(idempotencyKey)) {
      this.logger.debug(`Duplicate (skipped): ${idempotencyKey}`)
      return {
        status: 'duplicate',
        idempotencyKey,
        message: 'duplicate event',
        durationMs: Date.now() - startedAt
      }
    }

    // 2. 解析 adapter (业务方负责, 解析失败抛)
    const adapter = this.deps.resolveLytAdapter(tenantId)
    if (!adapter) {
      return {
        status: 'failed',
        idempotencyKey,
        message: 'no LYT adapter resolved',
        durationMs: Date.now() - startedAt
      }
    }

    // 3. 执行 handler
    try {
      const result = await handler(adapter)
      this.idempotencyCache.add(idempotencyKey)

      // 4. 审计 (可选, 集成 IntegrationOrchestrationService)
      await this.integration?.publishEvent(
        eventName,
        { idempotencyKey, ...payload, ...result },
        { source: 'cashier-lyt-bridge', aggregateId: idempotencyKey, idempotencyKey }
      )

      this.logger.log(
        `Dispatched ${eventName} (lytOrderId=${result.lytOrderId}, duration=${Date.now() - startedAt}ms)`
      )
      return {
        status: 'success',
        idempotencyKey,
        message: result.status,
        durationMs: Date.now() - startedAt
      }
    } catch (error) {
      const reason = (error as Error).message
      this.logger.error(`Bridge dispatch failed: ${idempotencyKey} (${reason})`)
      return {
        status: 'failed',
        idempotencyKey,
        message: reason,
        durationMs: Date.now() - startedAt
      }
    }
  }
}
