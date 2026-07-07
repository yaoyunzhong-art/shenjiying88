import { Injectable, Logger, Optional } from '@nestjs/common'
import type { PaymentMethod } from '@m5/types'
import { TenantConfigService } from '../../tenant-config/tenant-config.service'
import {
  AllChannelsFailedError,
  NoChannelConfiguredError,
  type PaymentChannelConfig,
  type PaymentChannelPort
} from './payment-channel.port'

// Re-export errors for convenience (tests + consumers)
export { AllChannelsFailedError, NoChannelConfiguredError } from './payment-channel.port'
export type { PaymentChannelConfig, PaymentChannelPort } from './payment-channel.port'

/**
 * PaymentChannelRegistry · 多租户支付通道注册表
 *
 * 类比 LytAdapterRegistry (apps/api/src/modules/lyt/lyt-adapter.registry.ts):
 *   - 按 tenantId 选通道
 *   - 主备切换 (priority 0/1/2)
 *   - 通道级健康状态
 *
 * 路由逻辑:
 *   1. 从 TenantConfigService 读 tenant 的 payment.channel 类别
 *   2. 过滤 enabled=true + isHealthy=true
 *   3. 按 priority 升序排序
 *   4. 返回主通道 (priority=0)
 *
 * 失败重路由:
 *   - 业务调用 channel.createPrepay 失败 → caller 调用 routeToNext()
 *   - registry 记录失败 + 增加 consecutiveFailures
 *   - 达到熔断阈值 (默认 5) → isHealthy=false
 *   - 下次路由跳过该通道, 走 priority 更大的备通道
 *
 * 熔断恢复:
 *   - 30s 后自动 half-open: isHealthy=true, consecutiveFailures=0
 *   - 成功则保持, 失败则再次 open
 */

export const DEFAULT_CIRCUIT_BREAKER_THRESHOLD = 5
export const DEFAULT_CIRCUIT_BREAKER_COOLDOWN_SECONDS = 30

export interface PaymentChannelRegistryOptions {
  circuitBreakerThreshold?: number
  circuitBreakerCooldownSeconds?: number
}

@Injectable()
export class PaymentChannelRegistry {
  private readonly logger = new Logger(PaymentChannelRegistry.name)
  private readonly channelStore = new Map<string, PaymentChannelPort[]>()
  private readonly configByKey = new Map<string, PaymentChannelConfig>()
  private readonly threshold: number
  private readonly cooldownMs: number

  constructor(
    @Optional() private readonly tenantConfigService?: TenantConfigService
  ) {
    this.threshold = DEFAULT_CIRCUIT_BREAKER_THRESHOLD
    this.cooldownMs = DEFAULT_CIRCUIT_BREAKER_COOLDOWN_SECONDS * 1000
  }

  /**
   * 注册一个通道实例 (启动时由 cashier.module 注册)
   */
  register(channel: PaymentChannelPort): void {
    const key = this.keyOf(channel.tenantId, channel.config.channel)
    const list = this.channelStore.get(key) ?? []
    list.push(channel)
    this.channelStore.set(key, list)
    // 每个实例的 config 独立跟踪, 避免主备相互干扰
    this.configByKey.set(this.instanceKey(channel), { ...channel.config })
    this.logger.log(
      `Registered ${channel.config.channel} for tenant=${channel.tenantId} priority=${channel.config.priority}`
    )
  }

  /**
   * 列出租户所有通道 (按 priority 升序)
   */
  listChannels(tenantId: string, method: PaymentMethod): PaymentChannelPort[] {
    const key = this.keyOf(tenantId, method)
    const list = this.channelStore.get(key) ?? []
    return [...list].sort((a, b) => a.config.priority - b.config.priority)
  }

  /**
   * 选主通道 (priority=0 且 enabled 且 healthy)
   * @throws NoChannelConfiguredError
   */
  selectPrimary(tenantId: string, method: PaymentMethod): PaymentChannelPort {
    const candidates = this.listChannels(tenantId, method)
      .filter((c) => c.config.enabled)
      .filter((c) => this.isAvailable(c))

    if (candidates.length === 0) {
      throw new NoChannelConfiguredError(tenantId, method)
    }
    return candidates[0]
  }

  /**
   * 选下一个通道 (失败重路由)
   * 返回 null 表示所有通道都不可用
   *
   * 排除规则: 按通道实例引用 (而非 channel 类型) 排除
   *   - 真实场景: 主 WECHAT 失败 → 选 priority=1 的同一 WECHAT 实例
   *   - 但多通道类型场景: 主 WECHAT 失败 → 也可选 priority=0 的 ALIPAY
   *   - 因此: 排除已用过的实例, 不是排除 channel 类型
   */
  selectNext(
    tenantId: string,
    method: PaymentMethod,
    excludeInstance: PaymentChannelPort
  ): PaymentChannelPort | null {
    const candidates = this.listChannels(tenantId, method)
      .filter((c) => c !== excludeInstance)
      .filter((c) => c.config.enabled)
      .filter((c) => this.isAvailable(c))

    return candidates[0] ?? null
  }

  /**
   * 记录失败 (熔断)
   */
  recordFailure(tenantId: string, method: PaymentMethod, reason: string): void {
    const list = this.channelStore.get(this.keyOf(tenantId, method)) ?? []
    for (const channel of list) {
      const cfg = this.configByKey.get(this.instanceKey(channel))
      if (!cfg) continue
      cfg.consecutiveFailures += 1
      cfg.lastFailureAt = new Date().toISOString()
      if (cfg.consecutiveFailures >= this.threshold) {
        cfg.isHealthy = false
        this.logger.warn(
          `Channel ${channel.config.channel} OPENED (tenant=${tenantId}, instance=${this.instanceKey(channel)}, consecutive=${cfg.consecutiveFailures}, reason=${reason})`
        )
      }
    }
  }

  /**
   * 记录成功 (熔断恢复)
   */
  recordSuccess(tenantId: string, method: PaymentMethod): void {
    const list = this.channelStore.get(this.keyOf(tenantId, method)) ?? []
    for (const channel of list) {
      const cfg = this.configByKey.get(this.instanceKey(channel))
      if (!cfg) continue
      cfg.consecutiveFailures = 0
      cfg.isHealthy = true
      cfg.lastFailureAt = undefined
    }
  }

  /**
   * 主备链式调用 (P0-2 MVP: 失败一次即重路由, 不做对账级回滚)
   * 真实环境: 配合 Outbox 模式异步重试
   *
   * 行为契约:
   *   - 每个通道实例只试一次
   *   - 失败 → 记录失败 + 重路由到下一个
   *   - 全部失败 → 抛 AllChannelsFailedError (含尝试链)
   *   - 不做 retry-loop (避免单次请求调用 5+ 次)
   */
  async executeWithFailover<T>(input: {
    tenantId: string
    method: PaymentMethod
    op: (channel: PaymentChannelPort) => Promise<T>
    onChannel?: (channel: PaymentChannelPort) => void
  }): Promise<T> {
    const attempts: Array<{ channel: PaymentMethod; reason: string }> = []
    const tried = new Set<PaymentChannelPort>()
    let current: PaymentChannelPort | null = this.selectPrimary(input.tenantId, input.method)
    if (input.onChannel && current) input.onChannel(current)

    while (current && !tried.has(current)) {
      tried.add(current)
      try {
        const result = await input.op(current)
        this.recordSuccess(input.tenantId, input.method)
        return result
      } catch (error) {
        const reason = (error as Error).message
        attempts.push({ channel: current.config.channel, reason })
        this.recordFailure(input.tenantId, input.method, reason)
        current = this.selectNext(input.tenantId, input.method, current)
      }
    }

    throw new AllChannelsFailedError(input.tenantId, input.method, attempts)
  }

  // ─── 私有 ─────────────────────────────────────────

  private keyOf(tenantId: string, method: PaymentMethod): string {
    return `${tenantId}::${method}`
  }

  /**
   * 每个通道实例的独立 key, 避免主备 config 共享
   */
  private instanceKey(channel: PaymentChannelPort): string {
    return `${channel.tenantId}::${channel.config.channel}::${channel.config.priority}::${this.identityOf(channel)}`
  }

  private identityOf(channel: PaymentChannelPort): number {
    // 弱身份: WeakMap 风格, 用对象引用当 key
    // 简化: 用随机数 (注册时分配), 但我们没有 slot
    // 兜底: 用 channel 对象自身的 WeakMap
    if (!this.identityCache.has(channel)) {
      this.identityCache.set(channel, this.identitySeq++)
    }
    return this.identityCache.get(channel)!
  }

  private readonly identityCache = new WeakMap<PaymentChannelPort, number>()
  private identitySeq = 0

  /**
   * 熔断恢复: 过了 cooldownMs 视为自动 half-open
   */
  private isAvailable(channel: PaymentChannelPort): boolean {
    const cfg = this.configByKey.get(this.instanceKey(channel))
    if (!cfg) return true
    if (cfg.isHealthy) return true
    if (!cfg.lastFailureAt) return true
    const lastFailure = new Date(cfg.lastFailureAt).getTime()
    return Date.now() - lastFailure >= this.cooldownMs
  }
}
