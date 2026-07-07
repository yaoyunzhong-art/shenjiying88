/**
 * BasePlatform 抽象端口 (P3-1.1) · 第二底座接入
 *
 * 业务背景:
 *   - 当前: cashier / loyalty / member 等模块对接 LYT (神机营自研中台)
 *   - 未来: 多租户接入不同行业管理系统 (教育/医疗/零售...)
 *   - 目标: 同一份业务代码, 通过 BasePlatform 抽象对接任意底座
 *
 * 抽象层次:
 *   - Port (本文件): 定义业务无关的"底座能力" (member / order / points)
 *   - Adapter: 真实/模拟实现 (LYTPlatform / MockAltPlatform / FutureXxx)
 *   - Registry: 多底座注册 + 路由
 *
 * 设计要点:
 *   - tenantId 是路由主键: 每个 tenant 绑定一个 primary base
 *   - 灰度: 同一 tenant 可临时切到 secondary (CanaryRouter 决定)
 *   - 隔离: 平台抛错不影响其他租户
 */

/** 底座类型 (业务分类, 便于监控/告警) */
export type BasePlatformType =
  | 'LYT' // 神机营现有
  | 'LYT_FORK' // 神机营分叉 (P0 阶段)
  | 'MOCK' // mock, 用于测试
  | 'GENERIC' // 通用 mock, 灰度演练
  | 'CUSTOM_A' // 客户 A 的行业系统
  | 'CUSTOM_B' // 客户 B 的行业系统

/** 业务调用上下文 */
export interface BasePlatformContext {
  tenantId: string
  userId?: string
  requestId: string
  /** 透传给底座的 trace 上下文 */
  traceId?: string
  /** 底座选路原因 (gray/primary/override) */
  selectionReason?: string
  /** 业务扩展字段 */
  extra?: Record<string, unknown>
}

/** 会员同步入参 (跨底座标准化) */
export interface BaseMemberPayload {
  memberId: string
  memberNo?: string
  name: string
  phone: string
  email?: string
  tier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'
  points?: number
  balanceCents?: number
}

/** 会员同步返回 (跨底座标准化) */
export interface BaseMemberResult {
  ok: boolean
  baseMemberId: string
  syncedAt: string
  /** 底座特定的额外字段 */
  baseSpecific?: Record<string, unknown>
  errorCode?: string
  errorMessage?: string
}

/** 订单同步入参 */
export interface BaseOrderPayload {
  orderId: string
  memberId?: string
  amountCents: number
  items?: Array<{ itemId: string; qty: number; unitPriceCents: number; name: string }>
  paidAt: string
  channel?: string
}

/** 订单同步返回 */
export interface BaseOrderResult {
  ok: boolean
  baseOrderId: string
  syncedAt: string
  baseSpecific?: Record<string, unknown>
  errorCode?: string
  errorMessage?: string
}

/** 积分增减入参 */
export interface BasePointsPayload {
  memberId: string
  delta: number
  reason: string
  orderId?: string
  expiresAt?: string
}

/** 积分增减返回 */
export interface BasePointsResult {
  ok: boolean
  baseMemberId: string
  newBalance: number
  ledgerId: string
  errorCode?: string
  errorMessage?: string
}

/** 底座能力 (Port) */
export interface BasePlatform {
  /** 唯一标识 */
  readonly platformId: string
  readonly platformType: BasePlatformType

  /** 健康检查 */
  healthCheck(ctx: BasePlatformContext): Promise<{ healthy: boolean; latencyMs: number; detail?: string }>

  /** 会员同步 */
  syncMember(ctx: BasePlatformContext, payload: BaseMemberPayload): Promise<BaseMemberResult>

  /** 订单同步 */
  syncOrder(ctx: BasePlatformContext, payload: BaseOrderPayload): Promise<BaseOrderResult>

  /** 积分增减 */
  adjustPoints(ctx: BasePlatformContext, payload: BasePointsPayload): Promise<BasePointsResult>
}

/** 平台健康状态 */
export type PlatformHealth = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN'

/** 路由决策结果 */
export interface RoutingDecision {
  platform: BasePlatform
  reason: 'primary' | 'gray_canary' | 'fallback' | 'override'
  /** 灰度桶 (gray canary 才有) */
  canaryBucket?: 'primary' | 'canary'
  /** 命中时间 ms (用于监控) */
  decidedAt: number
}

/** 平台注册中心配置 */
export interface PlatformRegistryConfig {
  /** tenantId → primary platform 映射 */
  primaryByTenant: Map<string, string>
  /** 默认 fallback platform (未配置 tenant 用) */
  defaultPlatform: string
}

/** 平台路由查询入参 */
export interface RouteQuery {
  tenantId: string
  /** 业务调用类型 (用于差异化灰度) */
  operation?: string
  /** 可选 hash 键 (保证同 key 总是同 bucket) */
  hashKey?: string
}

export class BasePlatformError extends Error {
  readonly platformId: string
  readonly operation: string
  readonly retryable: boolean
  constructor(input: { platformId: string; operation: string; message: string; retryable: boolean; cause?: unknown }) {
    super(input.message, input.cause ? { cause: input.cause } : undefined)
    this.name = 'BasePlatformError'
    this.platformId = input.platformId
    this.operation = input.operation
    this.retryable = input.retryable
  }
}
