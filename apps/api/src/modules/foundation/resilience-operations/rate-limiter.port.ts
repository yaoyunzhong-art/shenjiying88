/**
 * TokenBucket 限流器端口 (P2-1.2)
 *
 * 漏桶变体: 周期性补充 token, 允许突发 burst
 *
 *   bucket (capacity=10, refillRate=2/sec)
 *
 *   t=0:  bucket full (10 tokens)
 *   t=2:  bucket full (refilled 4, still 10)
 *   连续消费 10 个 -> 0 -> 等 5s 补充 10 -> 再消费
 *
 * 用法:
 *   const limiter = new TokenBucket({ capacity: 10, refillPerSecond: 2 })
 *   if (limiter.tryAcquire()) { return callDownstream() } else { return 429 }
 *
 * 集成点:
 *   - 收银台高频防刷 (单 tenant + 单 method)
 *   - 微信 prepay 限流 (官方限频 1000/min)
 *   - LYT 事件发送限流
 */

export interface TokenBucketConfig {
  /** 桶容量 (最大突发), 默认 10 */
  capacity?: number
  /** 补充速率 (token/秒), 默认 2 */
  refillPerSecond?: number
  /** 名称 (用于日志/metrics) */
  name?: string
}

export interface TokenBucketStats {
  name: string
  capacity: number
  refillPerSecond: number
  availableTokens: number
  lastRefillAt: number
  totalAcquired: number
  totalRejected: number
  totalRefilled: number
}

export class RateLimitError extends Error {
  readonly bucketName: string
  readonly retryAfterMs: number
  constructor(input: { bucketName: string; retryAfterMs: number }) {
    super(`Rate limit exceeded for bucket '${input.bucketName}' (retry after ${input.retryAfterMs}ms)`)
    this.name = 'RateLimitError'
    this.bucketName = input.bucketName
    this.retryAfterMs = input.retryAfterMs
  }
}

/** 限流器抽象接口 */
export interface RateLimiter {
  tryAcquire(tokens?: number): boolean
  acquire(tokens?: number): Promise<void>
  getStats(): TokenBucketStats
  reset(): void
}
