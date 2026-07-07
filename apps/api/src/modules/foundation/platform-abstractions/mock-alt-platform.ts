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
 * MockAltPlatform · 备用底座适配器 (P3-1.3)
 *
 * 用途:
 *   - 灰度演练: 替代 LYT, 验证路由/降级/告警
 *   - 客户 A/B 行业系统接入模板
 *   - E2E 测试: 隔离 LYT 副作用
 *
 * 行为:
 *   - 与 LYT 接口签名一致
 *   - 内部状态独立 (不污染 LYT 存储)
 *   - 可配置故障率 (用于压测/告警)
 */
@Injectable()
export class MockAltPlatform implements BasePlatform {
  private readonly logger = new Logger(MockAltPlatform.name)
  readonly platformId: string
  readonly platformType: BasePlatformType

  /** 故障率 0-1 (用于压测) */
  private failureRate = 0
  /** 内部独立状态 */
  private members = new Map<string, BaseMemberPayload & { lastSyncedAt: string }>()
  private orders = new Map<string, BaseOrderPayload & { lastSyncedAt: string }>()
  private pointsLedger = new Map<string, { memberId: string; balance: number }>()
  /** 调用统计 (用于监控) */
  private callStats = { member: 0, order: 0, points: 0, failed: 0 }

  constructor(input: { platformId?: string; platformType?: BasePlatformType; failureRate?: number } = {}) {
    this.platformId = input.platformId ?? 'mock-alt-default'
    this.platformType = input.platformType ?? 'MOCK'
    this.failureRate = input.failureRate ?? 0
  }

  /** 设置故障率 (压测/演练用) */
  setFailureRate(rate: number): void {
    this.failureRate = Math.max(0, Math.min(1, rate))
  }

  getCallStats() {
    return { ...this.callStats }
  }

  /** 模拟随机故障 */
  private maybeFail(operation: string): void {
    if (this.failureRate > 0 && Math.random() < this.failureRate) {
      this.callStats.failed += 1
      throw new BasePlatformError({
        platformId: this.platformId,
        operation,
        message: 'simulated failure',
        retryable: true
      })
    }
  }

  async healthCheck(_ctx: BasePlatformContext): Promise<{ healthy: boolean; latencyMs: number; detail?: string }> {
    const start = Date.now()
    await new Promise((r) => setTimeout(r, 10 + Math.floor(Math.random() * 20)))
    return {
      healthy: this.failureRate < 0.5,
      latencyMs: Date.now() - start,
      detail: this.failureRate > 0 ? `failureRate=${this.failureRate}` : undefined
    }
  }

  async syncMember(ctx: BasePlatformContext, payload: BaseMemberPayload): Promise<BaseMemberResult> {
    this.callStats.member += 1
    this.maybeFail('syncMember')
    if (!payload.memberId || !payload.phone) {
      throw new BasePlatformError({
        platformId: this.platformId,
        operation: 'syncMember',
        message: 'memberId and phone required',
        retryable: false
      })
    }
    this.members.set(payload.memberId, {
      ...payload,
      lastSyncedAt: new Date().toISOString()
    })
    this.logger.debug(`MockAlt.syncMember tenant=${ctx.tenantId} memberId=${payload.memberId}`)
    return {
      ok: true,
      baseMemberId: `mock-${payload.memberId}`,
      syncedAt: new Date().toISOString(),
      baseSpecific: { source: 'mock-alt' }
    }
  }

  async syncOrder(ctx: BasePlatformContext, payload: BaseOrderPayload): Promise<BaseOrderResult> {
    this.callStats.order += 1
    this.maybeFail('syncOrder')
    if (!payload.orderId || payload.amountCents <= 0) {
      throw new BasePlatformError({
        platformId: this.platformId,
        operation: 'syncOrder',
        message: 'orderId and positive amountCents required',
        retryable: false
      })
    }
    this.orders.set(payload.orderId, {
      ...payload,
      lastSyncedAt: new Date().toISOString()
    })
    this.logger.debug(`MockAlt.syncOrder tenant=${ctx.tenantId} orderId=${payload.orderId}`)
    return {
      ok: true,
      baseOrderId: `mock-order-${payload.orderId}`,
      syncedAt: new Date().toISOString()
    }
  }

  async adjustPoints(ctx: BasePlatformContext, payload: BasePointsPayload): Promise<BasePointsResult> {
    this.callStats.points += 1
    this.maybeFail('adjustPoints')
    const current = this.pointsLedger.get(payload.memberId) ?? { memberId: payload.memberId, balance: 0 }
    const newBalance = current.balance + payload.delta
    if (newBalance < 0) {
      throw new BasePlatformError({
        platformId: this.platformId,
        operation: 'adjustPoints',
        message: 'insufficient points',
        retryable: false
      })
    }
    this.pointsLedger.set(payload.memberId, { memberId: payload.memberId, balance: newBalance })
    this.logger.debug(`MockAlt.adjustPoints tenant=${ctx.tenantId} memberId=${payload.memberId} delta=${payload.delta}`)
    return {
      ok: true,
      baseMemberId: payload.memberId,
      newBalance,
      ledgerId: `mock-ledger-${randomUUID()}`
    }
  }

  /** 测试/管理辅助 */
  _getMember(memberId: string) { return this.members.get(memberId) }
  _getOrder(orderId: string) { return this.orders.get(orderId) }
  _getPointsBalance(memberId: string): number {
    return this.pointsLedger.get(memberId)?.balance ?? 0
  }
}
