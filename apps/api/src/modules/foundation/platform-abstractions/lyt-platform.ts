import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import {
  type BasePlatform,
  type BasePlatformType,
  type BasePlatformContext,
  type BaseMemberPayload,
  type BaseMemberResult,
  type BaseOrderPayload,
  type BaseOrderResult,
  type BasePointsPayload,
  type BasePointsResult,
  BasePlatformError
} from './base-platform.port'

/**
 * LYTPlatform · 神机营现有底座适配器 (P3-1.2)
 *
 * 适配策略:
 *   - syncMember → 对接 LYT member API (Phase-35 已实现, 此处封装)
 *   - syncOrder  → 对接 LYT order API
 *   - adjustPoints → 对接 LYT points ledger
 *
 * MVP 行为:
 *   - 接受输入, 返回标准化结果 (假装对接成功)
 *   - 真实集成在 Phase-46 (P3 上线时)
 */
@Injectable()
export class LYTPlatform implements BasePlatform {
  private readonly logger = new Logger(LYTPlatform.name)
  readonly platformId: string
  readonly platformType: BasePlatformType = 'LYT'

  /** 模拟 LYT 内部状态 (Phase-46 替换为真实 LYT 调用) */
  private members = new Map<string, BaseMemberPayload & { lastSyncedAt: string }>()
  private orders = new Map<string, BaseOrderPayload & { lastSyncedAt: string }>()
  private pointsLedger = new Map<string, { memberId: string; balance: number }>()

  constructor(platformId: string = 'lyt-default') {
    this.platformId = platformId
  }

  async healthCheck(_ctx: BasePlatformContext): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now()
    // 模拟延迟 5-15ms
    await new Promise((r) => setTimeout(r, 5 + Math.floor(Math.random() * 10)))
    return { healthy: true, latencyMs: Date.now() - start }
  }

  async syncMember(ctx: BasePlatformContext, payload: BaseMemberPayload): Promise<BaseMemberResult> {
    this.logger.debug(`LYT.syncMember tenant=${ctx.tenantId} memberId=${payload.memberId}`)
    if (!payload.memberId) {
      throw new BasePlatformError({
        platformId: this.platformId,
        operation: 'syncMember',
        message: 'memberId required',
        retryable: false
      })
    }
    if (!payload.phone) {
      throw new BasePlatformError({
        platformId: this.platformId,
        operation: 'syncMember',
        message: 'phone required',
        retryable: false
      })
    }
    this.members.set(payload.memberId, {
      ...payload,
      lastSyncedAt: new Date().toISOString()
    })
    return {
      ok: true,
      baseMemberId: `lyt-${payload.memberId}`,
      syncedAt: new Date().toISOString(),
      baseSpecific: { lyt_memberNo: payload.memberNo ?? `LYT-${payload.memberId}` }
    }
  }

  async syncOrder(ctx: BasePlatformContext, payload: BaseOrderPayload): Promise<BaseOrderResult> {
    this.logger.debug(`LYT.syncOrder tenant=${ctx.tenantId} orderId=${payload.orderId}`)
    if (!payload.orderId) {
      throw new BasePlatformError({
        platformId: this.platformId,
        operation: 'syncOrder',
        message: 'orderId required',
        retryable: false
      })
    }
    if (payload.amountCents <= 0) {
      throw new BasePlatformError({
        platformId: this.platformId,
        operation: 'syncOrder',
        message: 'amountCents must be positive',
        retryable: false
      })
    }
    this.orders.set(payload.orderId, {
      ...payload,
      lastSyncedAt: new Date().toISOString()
    })
    return {
      ok: true,
      baseOrderId: `lyt-order-${payload.orderId}`,
      syncedAt: new Date().toISOString()
    }
  }

  async adjustPoints(ctx: BasePlatformContext, payload: BasePointsPayload): Promise<BasePointsResult> {
    this.logger.debug(`LYT.adjustPoints tenant=${ctx.tenantId} memberId=${payload.memberId} delta=${payload.delta}`)
    if (payload.delta === 0) {
      throw new BasePlatformError({
        platformId: this.platformId,
        operation: 'adjustPoints',
        message: 'delta cannot be 0',
        retryable: false
      })
    }
    const current = this.pointsLedger.get(payload.memberId) ?? { memberId: payload.memberId, balance: 0 }
    const newBalance = current.balance + payload.delta
    if (newBalance < 0) {
      throw new BasePlatformError({
        platformId: this.platformId,
        operation: 'adjustPoints',
        message: 'insufficient points balance',
        retryable: false
      })
    }
    this.pointsLedger.set(payload.memberId, { memberId: payload.memberId, balance: newBalance })
    return {
      ok: true,
      baseMemberId: payload.memberId,
      newBalance,
      ledgerId: `lyt-ledger-${randomUUID()}`
    }
  }

  /** 测试/管理辅助 */
  _getMember(memberId: string) { return this.members.get(memberId) }
  _getOrder(orderId: string) { return this.orders.get(orderId) }
  _getPointsBalance(memberId: string): number {
    return this.pointsLedger.get(memberId)?.balance ?? 0
  }
}
