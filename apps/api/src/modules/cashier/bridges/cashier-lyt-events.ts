/**
 * cashier↔LYT 事件契约 (P1-1.1)
 *
 * 双系统数据同步的统一事件模型
 *
 * cashier → LYT  (CashierToLytBridge 处理)
 *   - cashier.order.paid          订单支付成功 → LYT 同步订单
 *   - cashier.order.refunded      订单退款成功 → LYT 同步退款
 *   - cashier.member.tier-upgrade 会员升级 → LYT 更新会员等级
 *
 * LYT → cashier  (LytToCashierBridge 处理)
 *   - lyt.member.profile-synced    LYT 同步会员档案 → cashier 更新档案
 *   - lyt.order.external-created  LYT 外部订单 → cashier 同步订单
 *   - lyt.gate.pass-record        LYT 门闸通行 → cashier 标记履约
 *
 * 幂等键规则:
 *   - cashier→LYT: idempotencyKey = `cashier-2-lyt:{eventName}:{tenantId}:{sourceId}`
 *   - LYT→cashier: idempotencyKey = `lyt-2-cashier:{eventName}:{tenantId}:{eventId}`
 *   - 重复事件 (LytEvent.eventId 相同) 静默 skip
 *
 * 重试策略:
 *   - 指数退避: 1s, 5s, 30s, 5min, 30min
 *   - 最多 5 次
 *   - 超过进 DLQ (Outbox 模式 P1-3 落地)
 */

export type CashierToLytEventName =
  | 'cashier.order.paid'
  | 'cashier.order.refunded'
  | 'cashier.member.tier-upgrade'

export type LytToCashierEventName =
  | 'lyt.member.profile-synced'
  | 'lyt.order.external-created'
  | 'lyt.gate.pass-record'

/**
 * cashier.order.paid 事件载荷
 * 触发源: PaymentService.confirm() 成功
 */
export interface CashierOrderPaidEvent {
  /** 内部订单 ID */
  orderId: string
  /** 租户 */
  tenantId: string
  /** 会员 ID */
  memberId: string
  /** 支付金额 (分) */
  totalCents: number
  /** 支付方式 */
  method: 'WECHAT' | 'ALIPAY' | 'CARD' | 'CASH'
  /** 通道交易号 (用于 LYT 端对账) */
  providerTxnId: string
  /** 售币商品 (LYT 端使用) */
  coinProductId?: string
  /** 售币数量 (LYT 售币场景) */
  coinQuantity?: number
  /** 支付完成时间 */
  paidAt: string
}

/**
 * cashier.order.refunded 事件载荷
 */
export interface CashierOrderRefundedEvent {
  orderId: string
  tenantId: string
  memberId: string
  refundId: string
  refundCents: number
  reason: string
  refundedAt: string
}

/**
 * cashier.member.tier-upgrade 事件载荷
 */
export interface CashierMemberTierUpgradeEvent {
  memberId: string
  tenantId: string
  oldTier: string
  newTier: string
  upgradedAt: string
}

/**
 * lyt.member.profile-synced 事件载荷
 * 触发源: LYT 推送会员档案变更 webhook
 */
export interface LytMemberProfileSyncedEvent {
  /** LYT 端会员 ID */
  lytMemberId: string
  /** M5 端会员 ID (映射后) */
  memberId: string
  tenantId: string
  profile: {
    phone?: string
    name?: string
    tier?: string
    points?: number
    balance?: number
  }
  syncedAt: string
}

/**
 * lyt.order.external-created 事件载荷
 * 触发源: LYT 端售币/售卡/外部订单
 */
export interface LytOrderExternalCreatedEvent {
  lytOrderId: string
  tenantId: string
  lytMemberId: string
  memberId: string
  amountCents: number
  productType: 'COIN' | 'TICKET' | 'LOCKER' | 'OTHER'
  productRef: string
  createdAt: string
}

/**
 * lyt.gate.pass-record 事件载荷
 * 触发源: LYT 端门闸 / 闸机 通行记录
 */
export interface LytGatePassRecordEvent {
  lytPassId: string
  tenantId: string
  gateId: string
  lytMemberId: string
  memberId: string
  passType: 'ENTER' | 'EXIT'
  passAt: string
  /** 关联订单 (e.g. 售币 → 进门) */
  relatedOrderId?: string
}

/**
 * Bridge 通用信封 (cashier↔LYT)
 * - source: 'cashier' | 'lyt'
 * - direction: 'to-lyt' | 'to-cashier'
 * - idempotencyKey: 必填, 用于重试去重
 * - payload: 事件载荷
 * - occurredAt: 事件发生时间
 */
export interface BridgeEventEnvelope<T = unknown> {
  source: 'cashier' | 'lyt'
  direction: 'to-lyt' | 'to-cashier'
  eventName: CashierToLytEventName | LytToCashierEventName
  tenantId: string
  idempotencyKey: string
  payload: T
  occurredAt: string
  receivedAt: string
  retryCount: number
  lastError?: string
}

/**
 * Bridge 处理器结果
 */
export interface BridgeProcessResult {
  status: 'success' | 'duplicate' | 'failed'
  idempotencyKey: string
  message?: string
  durationMs: number
}

/**
 * 生成 idempotencyKey 的标准工具
 */
export function buildCashierToLytKey(
  eventName: CashierToLytEventName,
  tenantId: string,
  sourceId: string
): string {
  return `cashier-2-lyt:${eventName}:${tenantId}:${sourceId}`
}

export function buildLytToCashierKey(
  eventName: LytToCashierEventName,
  tenantId: string,
  lytEventId: string
): string {
  return `lyt-2-cashier:${eventName}:${tenantId}:${lytEventId}`
}
