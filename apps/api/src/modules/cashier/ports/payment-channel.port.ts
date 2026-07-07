import type { PaymentMethod } from '@m5/types'
import type { PaymentGateway } from '../payment.service'

/**
 * PaymentChannelPort · 支付通道端口 (多租户路由的抽象)
 *
 * 与 PaymentGateway 区别:
 *   - PaymentGateway: 纯接口, PaymentService 直接注入单一实现 (历史遗留)
 *   - PaymentChannelPort: 多租户路由的"端口", 每个 channel 是一份独立配置/适配器
 *
 * 设计目的:
 *   - PaymentChannelRegistry 按 tenantId 选通道
 *   - 同一租户可配置多通道 (主+备)
 *   - 通道级 metrics / health check
 *
 * 静态元数据 (registry 用):
 *   - channel: 通道名 (WECHAT/ALIPAY/CASH)
 *   - priority: 主备顺序 (0 主, 1 备, ...)
 *   - isHealthy: 健康状态 (熔断器用)
 */

export interface PaymentChannelConfig {
  tenantId: string
  channel: PaymentMethod
  /** 0 = 主通道, 1 = 第一备, 2 = 第二备 ... */
  priority: number
  /** 通道是否启用 (false → 跳过) */
  enabled: boolean
  /** 健康状态 (熔断器可写) */
  isHealthy: boolean
  /** 最后一次失败时间 (熔断器) */
  lastFailureAt?: string
  /** 连续失败次数 (达到阈值后熔断) */
  consecutiveFailures: number
}

export interface PaymentChannelPort extends PaymentGateway {
  readonly tenantId: string
  readonly config: PaymentChannelConfig

  /** 健康检查 (P2 熔断器用) */
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number; reason?: string }>

  /** 标记一次失败 (registry 收集) */
  recordFailure(reason: string): void

  /** 标记一次成功 (registry 收集, 用于熔断恢复) */
  recordSuccess(): void
}

/**
 * 从 PaymentGateway.gatewayName 复制的运行时快照,避免 cast
 */
export type ChannelGatewayName = string

/**
 * NoAdapterError: 租户没配置任何可用通道
 */
export class NoChannelConfiguredError extends Error {
  readonly tenantId: string
  readonly method: PaymentMethod

  constructor(tenantId: string, method: PaymentMethod) {
    super(`No payment channel configured for tenant=${tenantId}, method=${method}`)
    this.name = 'NoChannelConfiguredError'
    this.tenantId = tenantId
    this.method = method
  }
}

/**
 * AllChannelsFailedError: 所有通道都失败 (熔断 / 拒收)
 */
export class AllChannelsFailedError extends Error {
  readonly tenantId: string
  readonly method: PaymentMethod
  readonly attempts: Array<{ channel: PaymentMethod; reason: string }>

  constructor(
    tenantId: string,
    method: PaymentMethod,
    attempts: Array<{ channel: PaymentMethod; reason: string }>
  ) {
    super(
      `All payment channels failed for tenant=${tenantId}, method=${method}: ${attempts
        .map((a) => `${a.channel}(${a.reason})`)
        .join(', ')}`
    )
    this.name = 'AllChannelsFailedError'
    this.tenantId = tenantId
    this.method = method
    this.attempts = attempts
  }
}
