/**
 * CircuitBreaker 端口 (P2-1.1) · 通用熔断器
 *
 * 状态机:
 *   CLOSED --(N failures)--> OPEN --(cooldownMs)--> HALF_OPEN
 *   CLOSED <--(N consecutive success)-- HALF_OPEN
 *   HALF_OPEN --(probe failure)--> OPEN
 *
 * 用法:
 *   const breaker = new CircuitBreaker({ failureThreshold: 5, cooldownMs: 30_000 })
 *   try {
 *     const result = await breaker.exec(() => callExternal())
 *   } catch (err) {
 *     if (err instanceof CircuitOpenError) { return fallback() }
 *   }
 *
 * 集成点:
 *   - PaymentChannelRegistry 已内置简化版 (P0-2.1)
 *   - 后续: outbox 投递 / 外部 API 调用 / LYT 事件桥 (P2-1.4)
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

/** 熔断器配置 */
export interface CircuitBreakerConfig {
  /** 名称 (用于日志/metrics) */
  name: string
  /** 连续失败阈值, 默认 5 */
  failureThreshold?: number
  /** 进入 HALF_OPEN 后的成功阈值 (恢复条件), 默认 2 */
  successThreshold?: number
  /** OPEN → HALF_OPEN 的冷却时间 ms, 默认 30_000 */
  cooldownMs?: number
  /** 自定义失败判定 (默认: 任何 throw 都算失败) */
  isFailure?: (err: unknown) => boolean
  /** 状态切换时的回调 (用于 metrics/告警) */
  onStateChange?: (from: CircuitState, to: CircuitState, reason: string) => void
}

export interface CircuitBreakerStats {
  name: string
  state: CircuitState
  consecutiveFailures: number
  consecutiveSuccesses: number
  totalCalls: number
  totalSuccesses: number
  totalFailures: number
  totalShortCircuited: number
  openedAt: number | null
  lastFailureAt: number | null
  lastError: string | null
}

/** 熔断器开启错误 (业务可捕获后走降级) */
export class CircuitOpenError extends Error {
  readonly breakerName: string
  readonly openedAt: number
  readonly cooldownMs: number
  readonly remainingCooldownMs: number
  constructor(input: { breakerName: string; openedAt: number; cooldownMs: number; remainingCooldownMs: number }) {
    super(`Circuit '${input.breakerName}' is OPEN (${input.remainingCooldownMs}ms remaining)`)
    this.name = 'CircuitOpenError'
    this.breakerName = input.breakerName
    this.openedAt = input.openedAt
    this.cooldownMs = input.cooldownMs
    this.remainingCooldownMs = input.remainingCooldownMs
  }
}

/** 通用熔断器接口 (供 registry 复用) */
export interface CircuitBreaker {
  exec<T>(fn: () => Promise<T>): Promise<T>
  getState(): CircuitState
  getStats(): CircuitBreakerStats
  reset(): void
  forceOpen(): void
}
