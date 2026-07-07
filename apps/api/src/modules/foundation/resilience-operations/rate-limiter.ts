import { Injectable, Logger } from '@nestjs/common'
import {
  type TokenBucketConfig,
  type TokenBucketStats,
  type RateLimiter,
  RateLimitError
} from './rate-limiter.port'

/**
 * TokenBucket 实现 (P2-1.2)
 *
 * 算法:
 *   - availableTokens (start = capacity)
 *   - 每次 tryAcquire:
 *     1. 算补充: refill = (now - lastRefillAt) / 1000 * refillPerSecond
 *     2. availableTokens = min(capacity, availableTokens + refill)
 *     3. lastRefillAt = now
 *     4. 若 availableTokens >= tokens: 扣减, 放行
 *     5. 否则: 拒绝
 *
 * acquire 阻塞模式:
 *   - 计算需要等待的时间 = (tokens - availableTokens) / refillPerSecond * 1000
 *   - setTimeout, 然后再 tryAcquire
 */
@Injectable()
export class TokenBucket implements RateLimiter {
  private readonly logger = new Logger(TokenBucket.name)
  private readonly capacity: number
  private readonly refillPerSecond: number
  private readonly name: string

  private availableTokens: number
  private lastRefillAt: number
  private totalAcquired = 0
  private totalRejected = 0
  private totalRefilled = 0

  constructor(config: TokenBucketConfig) {
    this.name = config.name ?? 'token-bucket'
    this.capacity = config.capacity ?? 10
    this.refillPerSecond = config.refillPerSecond ?? 2
    this.availableTokens = this.capacity
    this.lastRefillAt = Date.now()
  }

  /**
   * 非阻塞尝试获取 token
   * 返回 true: 放行 (扣减)
   * 返回 false: 拒绝 (不阻塞)
   */
  tryAcquire(tokens: number = 1, now: number = Date.now()): boolean {
    if (tokens <= 0) return true
    if (tokens > this.capacity) {
      // 单次请求超过桶容量, 永远拿不到
      this.totalRejected += 1
      return false
    }
    this.refill(now)
    if (this.availableTokens >= tokens) {
      this.availableTokens -= tokens
      this.totalAcquired += 1
      return true
    }
    this.totalRejected += 1
    return false
  }

  /**
   * 阻塞获取 token (无 token 时等)
   * 抛 RateLimitError 如果等待超过 timeoutMs
   */
  async acquire(tokens: number = 1, timeoutMs: number = 60_000): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      if (this.tryAcquire(tokens)) return
      // 计算需等待的毫秒数
      const waitMs = this.computeWaitMs(tokens)
      await new Promise((r) => setTimeout(r, Math.max(1, waitMs)))
    }
    throw new RateLimitError({
      bucketName: this.name,
      retryAfterMs: timeoutMs
    })
  }

  /** 计算至少需要等多少 ms 才能拿到 tokens */
  computeWaitMs(tokens: number = 1, now: number = Date.now()): number {
    this.refill(now)
    if (this.availableTokens >= tokens) return 0
    const needed = tokens - this.availableTokens
    return Math.ceil((needed / this.refillPerSecond) * 1000)
  }

  getStats(now: number = Date.now()): TokenBucketStats {
    this.refill(now)
    return {
      name: this.name,
      capacity: this.capacity,
      refillPerSecond: this.refillPerSecond,
      availableTokens: this.availableTokens,
      lastRefillAt: this.lastRefillAt,
      totalAcquired: this.totalAcquired,
      totalRejected: this.totalRejected,
      totalRefilled: this.totalRefilled
    }
  }

  reset(): void {
    this.availableTokens = this.capacity
    this.lastRefillAt = Date.now()
    this.totalAcquired = 0
    this.totalRejected = 0
    this.totalRefilled = 0
  }

  private refill(now: number): void {
    if (now <= this.lastRefillAt) return
    const elapsedSec = (now - this.lastRefillAt) / 1000
    const refill = elapsedSec * this.refillPerSecond
    if (refill <= 0) return
    const before = this.availableTokens
    this.availableTokens = Math.min(this.capacity, this.availableTokens + refill)
    if (this.availableTokens > before) {
      this.totalRefilled += 1
    }
    this.lastRefillAt = now
  }
}
