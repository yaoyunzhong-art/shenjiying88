import { Injectable, Logger } from '@nestjs/common'
import {
  type CircuitBreakerConfig,
  type CircuitState,
  type CircuitBreakerStats,
  CircuitOpenError
} from './circuit-breaker.port'

/**
 * CircuitBreaker 通用实现 (P2-1.1)
 *
 * 状态机:
 *   CLOSED --(failureThreshold 连续失败)--> OPEN
 *   OPEN   --(cooldownMs)--> HALF_OPEN (探测期, 仅放 1 个请求)
 *   HALF_OPEN --(probe success)--> 累计 successThreshold 成功 --> CLOSED
 *   HALF_OPEN --(probe failure)--> OPEN (重新计时)
 *
 * 反模式防御:
 *   - 探测期互斥: HALF_OPEN 状态拒绝并发请求 (仅放 1 个探测)
 *   - 异常分类: isFailure 自定义可让某些错误 (如 400) 不计入失败
 *   - metrics 完整: 累计成功/失败/短路, 便于监控
 */
@Injectable()
export class CircuitBreaker {
  private readonly logger = new Logger(CircuitBreaker.name)
  private readonly name: string
  private readonly failureThreshold: number
  private readonly successThreshold: number
  private readonly cooldownMs: number
  private readonly isFailure: (err: unknown) => boolean
  private readonly onStateChange?: (
    from: CircuitState,
    to: CircuitState,
    reason: string
  ) => void

  private state: CircuitState = 'CLOSED'
  private consecutiveFailures = 0
  private consecutiveSuccesses = 0
  private totalCalls = 0
  private totalSuccesses = 0
  private totalFailures = 0
  private totalShortCircuited = 0
  private openedAt: number | null = null
  private lastFailureAt: number | null = null
  private lastError: string | null = null
  /** HALF_OPEN 探测期互斥锁 */
  private probeInFlight = false

  constructor(config: CircuitBreakerConfig) {
    if (!config.name) throw new Error('CircuitBreaker.name is required')
    this.name = config.name
    this.failureThreshold = config.failureThreshold ?? 5
    this.successThreshold = config.successThreshold ?? 2
    this.cooldownMs = config.cooldownMs ?? 30_000
    this.isFailure = config.isFailure ?? ((err) => err !== null && err !== undefined)
    this.onStateChange = config.onStateChange
  }

  /** 当前状态 (含冷却期到 HALF_OPEN 的自动转移) */
  getState(now: number = Date.now()): CircuitState {
    if (this.state === 'OPEN' && this.openedAt !== null && now - this.openedAt >= this.cooldownMs) {
      this.transition('OPEN', 'HALF_OPEN', 'cooldown elapsed')
    }
    return this.state
  }

  getStats(now: number = Date.now()): CircuitBreakerStats {
    return {
      name: this.name,
      state: this.getState(now),
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      totalCalls: this.totalCalls,
      totalSuccesses: this.totalSuccesses,
      totalFailures: this.totalFailures,
      totalShortCircuited: this.totalShortCircuited,
      openedAt: this.openedAt,
      lastFailureAt: this.lastFailureAt,
      lastError: this.lastError
    }
  }

  /**
   * 执行被保护的操作
   * - CLOSED: 正常执行
   * - OPEN: 立即抛 CircuitOpenError (短路)
   * - HALF_OPEN: 仅放 1 个探测请求, 其他短路
   */
  async exec<T>(fn: () => Promise<T>, now: number = Date.now()): Promise<T> {
    const currentState = this.getState(now)

    if (currentState === 'OPEN') {
      this.totalShortCircuited += 1
      const openedAt = this.openedAt ?? now
      throw new CircuitOpenError({
        breakerName: this.name,
        openedAt,
        cooldownMs: this.cooldownMs,
        remainingCooldownMs: Math.max(0, this.cooldownMs - (now - openedAt))
      })
    }

    if (currentState === 'HALF_OPEN') {
      if (this.probeInFlight) {
        // 探测期只允许 1 个请求
        this.totalShortCircuited += 1
        throw new CircuitOpenError({
          breakerName: this.name,
          openedAt: this.openedAt ?? now,
          cooldownMs: this.cooldownMs,
          remainingCooldownMs: 0
        })
      }
      this.probeInFlight = true
    }

    this.totalCalls += 1
    try {
      const result = await fn()
      this.recordSuccess()
      return result
    } catch (err) {
      if (this.isFailure(err)) {
        this.recordFailure(err, now)
      } else {
        // 非失败 (业务可接受): 记成功
        this.recordSuccess()
      }
      throw err
    } finally {
      if (currentState === 'HALF_OPEN') {
        this.probeInFlight = false
      }
    }
  }

  private recordSuccess(): void {
    this.totalSuccesses += 1
    this.lastError = null
    this.consecutiveFailures = 0

    if (this.state === 'HALF_OPEN') {
      this.consecutiveSuccesses += 1
      if (this.consecutiveSuccesses >= this.successThreshold) {
        this.transition('HALF_OPEN', 'CLOSED', `${this.consecutiveSuccesses} consecutive successes`)
        this.consecutiveSuccesses = 0
        this.openedAt = null
      }
    }
  }

  private recordFailure(err: unknown, now: number): void {
    this.totalFailures += 1
    this.consecutiveFailures += 1
    this.lastFailureAt = now
    this.lastError = err instanceof Error ? err.message : String(err)

    if (this.state === 'HALF_OPEN') {
      this.consecutiveSuccesses = 0
      this.transition('HALF_OPEN', 'OPEN', 'probe failed')
      this.openedAt = now
    } else if (this.consecutiveFailures >= this.failureThreshold) {
      this.transition('CLOSED', 'OPEN', `${this.consecutiveFailures} consecutive failures`)
      this.openedAt = now
    }
  }

  private transition(from: CircuitState, to: CircuitState, reason: string): void {
    if (from === to) return
    this.state = to
    this.logger.warn(`Circuit '${this.name}' ${from} -> ${to} (${reason})`)
    this.onStateChange?.(from, to, reason)
  }

  /** 测试/管理: 强制重置 */
  reset(): void {
    this.state = 'CLOSED'
    this.consecutiveFailures = 0
    this.consecutiveSuccesses = 0
    this.openedAt = null
    this.lastFailureAt = null
    this.lastError = null
    this.probeInFlight = false
  }

  /** 强制开启熔断器 (运维介入) */
  forceOpen(now: number = Date.now()): void {
    if (this.state !== 'OPEN') {
      this.transition(this.state, 'OPEN', 'manual override')
      this.openedAt = now
    }
  }
}
