import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import assert from 'node:assert/strict'
import { CircuitBreaker } from './circuit-breaker'
import { TokenBucket } from './rate-limiter'
import { CircuitOpenError } from './circuit-breaker.port'
import { RateLimitError } from './rate-limiter.port'

/**
 * P2-1 弹性能力 4 子套件测试
 *
 *   1. CircuitBreaker 状态机 (CLOSED / OPEN / HALF_OPEN / 恢复)
 *   2. CircuitBreaker 短路 + 探测期互斥
 *   3. TokenBucket 令牌发放 / 拒绝
 *   4. TokenBucket 突发 + 阻塞获取
 */

// ═══════════════════════════════════════════════════════════════
// 1. CircuitBreaker 状态机
// ═══════════════════════════════════════════════════════════════

describe('CircuitBreaker · 状态机', () => {
  it('1.1 初始 CLOSED: 成功放行 + state 保持', async () => {
    const cb = new CircuitBreaker({ name: 'it-1.1', failureThreshold: 3 })
    const result = await cb.exec(async () => 'ok')
    assert.equal(result, 'ok')
    assert.equal(cb.getState(), 'CLOSED')
    const stats = cb.getStats()
    assert.equal(stats.totalSuccesses, 1)
    assert.equal(stats.totalFailures, 0)
  })

  it('1.2 累计 N 次失败 → OPEN', async () => {
    const cb = new CircuitBreaker({ name: 'it-1.2', failureThreshold: 3, cooldownMs: 30_000 })
    for (let i = 0; i < 3; i++) {
      await assert.rejects(cb.exec(async () => { throw new Error('boom') }))
    }
    assert.equal(cb.getState(), 'OPEN')
    const stats = cb.getStats()
    assert.equal(stats.totalFailures, 3)
    assert.equal(stats.consecutiveFailures, 3)
  })

  it('1.3 失败计数达阈值但中间有成功 → 不会开 (计数连续)', async () => {
    const cb = new CircuitBreaker({ name: 'it-1.3', failureThreshold: 3, cooldownMs: 30_000 })
    await assert.rejects(cb.exec(async () => { throw new Error('1') }))
    await assert.rejects(cb.exec(async () => { throw new Error('2') }))
    await cb.exec(async () => 'ok') // 打断
    await assert.rejects(cb.exec(async () => { throw new Error('3') }))
    await assert.rejects(cb.exec(async () => { throw new Error('4') }))
    // 连续失败 = 2, 未达 3
    assert.equal(cb.getState(), 'CLOSED')
  })

  it('1.4 OPEN → HALF_OPEN: 经过 cooldownMs 后自动转移', async () => {
    const now = 1_000_000
    const cb = new CircuitBreaker({ name: 'it-1.4', failureThreshold: 1, cooldownMs: 1000 })
    await assert.rejects(cb.exec(async () => { throw new Error('x') }, now))
    assert.equal(cb.getState(now), 'OPEN')
    // 推 1s 后查询 → 应自动转 HALF_OPEN
    assert.equal(cb.getState(now + 1000), 'HALF_OPEN')
  })

  it('1.5 HALF_OPEN 探测成功累计 → CLOSED 恢复', async () => {
    const now = 2_000_000
    const cb = new CircuitBreaker({ name: 'it-1.5', failureThreshold: 1, cooldownMs: 100, successThreshold: 2 })
    await assert.rejects(cb.exec(async () => { throw new Error('x') }, now))
    // 等到冷却
    const t1 = now + 100
    assert.equal(cb.getState(t1), 'HALF_OPEN')
    await cb.exec(async () => 'ok1', t1) // 1 success
    // 探测成功后还是 HALF_OPEN (需累计)
    const t2 = t1 + 1
    assert.equal(cb.getState(t2), 'HALF_OPEN')
    await cb.exec(async () => 'ok2', t2) // 2 success = 阈值
    assert.equal(cb.getState(t2), 'CLOSED')
  })

  it('1.6 HALF_OPEN 探测失败 → 立即回 OPEN + 重新计时', async () => {
    const now = 3_000_000
    const cb = new CircuitBreaker({ name: 'it-1.6', failureThreshold: 1, cooldownMs: 1000 })
    await assert.rejects(cb.exec(async () => { throw new Error('x') }, now))
    const probeTime = now + 1000
    assert.equal(cb.getState(probeTime), 'HALF_OPEN')
    await assert.rejects(cb.exec(async () => { throw new Error('probe fail') }, probeTime))
    // 探测失败 → 立即 OPEN
    assert.equal(cb.getState(probeTime), 'OPEN')
    // 100ms 后还是 OPEN (重新计时)
    assert.equal(cb.getState(probeTime + 100), 'OPEN')
  })

  it('1.7 isFailure 自定义: 业务错误不计入失败', async () => {
    const cb = new CircuitBreaker({
      name: 'it-1.7',
      failureThreshold: 1,
      isFailure: (err) => err instanceof Error && err.message !== 'business-error'
    })
    // 业务错误 (不计入)
    await assert.rejects(cb.exec(async () => { throw new Error('business-error') }))
    assert.equal(cb.getState(), 'CLOSED')
    // 真正失败
    await assert.rejects(cb.exec(async () => { throw new Error('infra-error') }))
    assert.equal(cb.getState(), 'OPEN')
  })

  it('1.8 onStateChange 回调: 状态切换时触发', async () => {
    const transitions: Array<{ from: string; to: string; reason: string }> = []
    const cb = new CircuitBreaker({
      name: 'it-1.8',
      failureThreshold: 1,
      cooldownMs: 100,
      onStateChange: (from, to, reason) => transitions.push({ from, to, reason })
    })
    const now = 4_000_000
    await assert.rejects(cb.exec(async () => { throw new Error('x') }, now))
    await cb.exec(async () => 'ok', now + 100)
    await cb.exec(async () => 'ok', now + 200)
    // 3 transitions: CLOSED->OPEN, OPEN->HALF_OPEN (cooldown), HALF_OPEN->CLOSED (2 success)
    assert.equal(transitions.length, 3)
    assert.deepEqual(transitions[0], { from: 'CLOSED', to: 'OPEN', reason: '1 consecutive failures' })
    assert.deepEqual(transitions[1], { from: 'OPEN', to: 'HALF_OPEN', reason: 'cooldown elapsed' })
    assert.deepEqual(transitions[2], { from: 'HALF_OPEN', to: 'CLOSED', reason: '2 consecutive successes' })
  })
})

// ═══════════════════════════════════════════════════════════════
// 2. CircuitBreaker 短路 + 探测期互斥
// ═══════════════════════════════════════════════════════════════

describe('CircuitBreaker · 短路 + 探测期互斥', () => {
  it('2.1 OPEN 状态短路: 立即抛 CircuitOpenError + 不调 fn', async () => {
    const now = 5_000_000
    const cb = new CircuitBreaker({ name: 'it-2.1', failureThreshold: 1, cooldownMs: 30_000 })
    await assert.rejects(cb.exec(async () => { throw new Error('x') }, now))
    let called = false
    await assert.rejects(
      cb.exec(async () => { called = true; return 'should not run' }, now + 1000),
      (err: unknown) => {
        assert.ok(err instanceof CircuitOpenError)
        assert.equal((err as CircuitOpenError).breakerName, 'it-2.1')
        assert.ok((err as CircuitOpenError).remainingCooldownMs > 0)
        return true
      }
    )
    assert.equal(called, false, 'fn should not be called in OPEN state')
    const stats = cb.getStats()
    assert.equal(stats.totalShortCircuited, 1)
  })

  it('2.2 HALF_OPEN 探测期: 同时只放 1 个请求', async () => {
    const now = 6_000_000
    const cb = new CircuitBreaker({ name: 'it-2.2', failureThreshold: 1, cooldownMs: 100 })
    await assert.rejects(cb.exec(async () => { throw new Error('x') }, now))
    const probeTime = now + 100

    // 第一个探测: 慢
    let resolveFirst!: () => void
    const firstSignal = new Promise<void>((r) => (resolveFirst = r))
    const first = cb.exec(
      async () => {
        resolveFirst()
        await new Promise<void>((r) => setTimeout(r, 50))
        return 'first'
      },
      probeTime
    )
    // 等探测真正开始
    await firstSignal

    // 第二个: 探测期有 in-flight → 短路
    await assert.rejects(
      cb.exec(async () => 'second', probeTime + 1),
      (err: unknown) => err instanceof CircuitOpenError
    )
    const result = await first
    assert.equal(result, 'first')
  })

  it('2.3 forceOpen: 手动开启熔断器', () => {
    const cb = new CircuitBreaker({ name: 'it-2.3', failureThreshold: 100 })
    assert.equal(cb.getState(), 'CLOSED')
    cb.forceOpen()
    assert.equal(cb.getState(), 'OPEN')
  })

  it('2.4 reset: 强制重置回 CLOSED', async () => {
    const now = 7_000_000
    const cb = new CircuitBreaker({ name: 'it-2.4', failureThreshold: 1, cooldownMs: 30_000 })
    await assert.rejects(cb.exec(async () => { throw new Error('x') }, now))
    assert.equal(cb.getState(now), 'OPEN')
    cb.reset()
    assert.equal(cb.getState(), 'CLOSED')
    // 重新可用
    const result = await cb.exec(async () => 'ok')
    assert.equal(result, 'ok')
  })

  it('2.5 stats: totalCalls/totalSuccesses/totalFailures 累计', async () => {
    const cb = new CircuitBreaker({ name: 'it-2.5', failureThreshold: 100 })
    await cb.exec(async () => 'ok1')
    await cb.exec(async () => 'ok2')
    await assert.rejects(cb.exec(async () => { throw new Error('x') }))
    const stats = cb.getStats()
    assert.equal(stats.totalCalls, 3)
    assert.equal(stats.totalSuccesses, 2)
    assert.equal(stats.totalFailures, 1)
  })

  it('2.6 lastError: 最近错误信息', async () => {
    const cb = new CircuitBreaker({ name: 'it-2.6', failureThreshold: 1 })
    await assert.rejects(cb.exec(async () => { throw new Error('specific-error-msg') }))
    assert.equal(cb.getStats().lastError, 'specific-error-msg')
  })

  it('2.7 name 必填: 缺 name 构造抛错', () => {
    assert.throws(
      () => new CircuitBreaker({ name: '' }),
      /name is required/
    )
  })
})

// ═══════════════════════════════════════════════════════════════
// 3. TokenBucket 基础 (P2-1.2)
// ═══════════════════════════════════════════════════════════════

describe('TokenBucket · 令牌发放 / 拒绝', () => {
  it('3.1 初始满桶: 连续 capacity 次成功, 第 (capacity+1) 次失败', () => {
    const bucket = new TokenBucket({ capacity: 5, refillPerSecond: 1 })
    for (let i = 0; i < 5; i++) {
      assert.equal(bucket.tryAcquire(), true, `attempt ${i + 1}`)
    }
    assert.equal(bucket.tryAcquire(), false)
  })

  it('3.2 多 token 消费: 一次消耗 3 个', () => {
    const bucket = new TokenBucket({ capacity: 10, refillPerSecond: 1 })
    assert.equal(bucket.tryAcquire(3), true)
    assert.equal(bucket.tryAcquire(3), true)
    assert.equal(bucket.tryAcquire(3), true) // 剩 1
    assert.equal(bucket.tryAcquire(3), false)
  })

  it('3.3 一次请求超过 capacity → 永远拒绝', () => {
    const bucket = new TokenBucket({ capacity: 5, refillPerSecond: 1 })
    assert.equal(bucket.tryAcquire(6), false)
    assert.equal(bucket.tryAcquire(100), false)
  })

  it('3.4 stats: totalAcquired / totalRejected 累计', () => {
    const bucket = new TokenBucket({ capacity: 2, refillPerSecond: 1 })
    bucket.tryAcquire() // 1 acquired
    bucket.tryAcquire() // 2 acquired
    bucket.tryAcquire() // rejected
    bucket.tryAcquire() // rejected
    const stats = bucket.getStats()
    assert.equal(stats.totalAcquired, 2)
    assert.equal(stats.totalRejected, 2)
  })

  it('3.5 reset: 满桶 + 计数清零', () => {
    const bucket = new TokenBucket({ capacity: 5, refillPerSecond: 1 })
    bucket.tryAcquire(5) // 满桶耗光
    bucket.tryAcquire() // rejected
    bucket.reset()
    const stats = bucket.getStats()
    assert.equal(stats.availableTokens, 5)
    assert.equal(stats.totalAcquired, 0)
    assert.equal(stats.totalRejected, 0)
  })

  it('3.6 invalid tokens: 0 / 负数 → 视为 true (不消耗)', () => {
    const bucket = new TokenBucket({ capacity: 5, refillPerSecond: 1 })
    assert.equal(bucket.tryAcquire(0), true)
    assert.equal(bucket.tryAcquire(-1), true)
    // 桶里 token 数没变
    assert.equal(bucket.getStats().availableTokens, 5)
  })

  it('3.7 默认参数: capacity=10, refillPerSecond=2', () => {
    const bucket = new TokenBucket({ name: 'default' })
    const stats = bucket.getStats()
    assert.equal(stats.capacity, 10)
    assert.equal(stats.refillPerSecond, 2)
    assert.equal(stats.availableTokens, 10)
  })
})

// ═══════════════════════════════════════════════════════════════
// 4. TokenBucket 突发 + 阻塞获取
// ═══════════════════════════════════════════════════════════════

describe('TokenBucket · 突发容忍 + 阻塞', () => {
  it('4.1 突发: 满桶 10 个, 0 间隔连续 10 次都成功', () => {
    const bucket = new TokenBucket({ capacity: 10, refillPerSecond: 0.5 })
    for (let i = 0; i < 10; i++) {
      assert.equal(bucket.tryAcquire(), true)
    }
  })

  it('4.2 耗光后: 等 1s 补 0.5 个 → 还不够 1 个 → 继续拒绝', async () => {
    const bucket = new TokenBucket({ capacity: 2, refillPerSecond: 0.5 })
    bucket.tryAcquire(2) // 耗光
    await new Promise((r) => setTimeout(r, 1100))
    // 1.1s 补 0.55 个, 仍不够
    assert.equal(bucket.tryAcquire(), false)
  })

  it('4.3 耗光后: 等 2s 补 1 个 → 刚好成功', async () => {
    const bucket = new TokenBucket({ capacity: 2, refillPerSecond: 0.5 })
    bucket.tryAcquire(2) // 耗光
    await new Promise((r) => setTimeout(r, 2100))
    assert.equal(bucket.tryAcquire(), true)
  })

  it('4.4 acquire 阻塞: 拿到 token 才返回 (短等待)', async () => {
    const bucket = new TokenBucket({ capacity: 1, refillPerSecond: 5 }) // 200ms 补 1 个
    bucket.tryAcquire(1) // 耗光
    const start = Date.now()
    await bucket.acquire(1, 5_000) // 最多等 5s
    const elapsed = Date.now() - start
    assert.ok(elapsed >= 150, `elapsed=${elapsed}ms, expected >= 150ms`)
    assert.ok(elapsed < 1000, `elapsed=${elapsed}ms, expected < 1000ms`)
  })

  it('4.5 acquire 阻塞: 超时抛 RateLimitError', async () => {
    const bucket = new TokenBucket({ capacity: 1, refillPerSecond: 0.1 }) // 10s 补 1 个
    bucket.tryAcquire(1)
    await assert.rejects(
      bucket.acquire(1, 200),
      (err: unknown) => {
        assert.ok(err instanceof RateLimitError)
        assert.equal((err as RateLimitError).bucketName, 'token-bucket')
        return true
      }
    )
  })

  it('4.6 computeWaitMs: 满桶 → 0ms; 耗光 → 按速率推算', () => {
    const bucket = new TokenBucket({ capacity: 5, refillPerSecond: 2 }) // 500ms 补 1 个
    assert.equal(bucket.computeWaitMs(1), 0)
    bucket.tryAcquire(5) // 耗光
    // 需要 3 个: 3 / 2 * 1000 = 1500ms
    const wait = bucket.computeWaitMs(3)
    assert.ok(wait >= 1400 && wait <= 1600, `wait=${wait}ms`)
  })

  it('4.7 并发安全: 同时 100 个 tryAcquire, 总成功 = capacity', () => {
    const bucket = new TokenBucket({ capacity: 10, refillPerSecond: 0.0001 })
    let acquired = 0
    for (let i = 0; i < 100; i++) {
      if (bucket.tryAcquire()) acquired += 1
    }
    assert.equal(acquired, 10)
  })
})

// ═══════════════════════════════════════════════════════════════
// 5. 组合场景: CircuitBreaker + TokenBucket
// ═══════════════════════════════════════════════════════════════

describe('组合场景 · 限流 + 熔断', () => {
  it('5.1 限流先于熔断: 被限流的请求不计入熔断失败', async () => {
    const bucket = new TokenBucket({ capacity: 2, refillPerSecond: 0.0001 })
    const cb = new CircuitBreaker({ name: 'combo', failureThreshold: 1 })

    const call = async () => {
      if (!bucket.tryAcquire()) {
        // 限流拦截, 不让请求到达下游
        throw new Error('rate_limited_local')
      }
      return cb.exec(async () => 'ok')
    }

    // 头 2 个成功
    assert.equal(await call(), 'ok')
    assert.equal(await call(), 'ok')
    // 第 3 个被本地限流
    await assert.rejects(call(), /rate_limited_local/)
    // 熔断器还应该是 CLOSED (没失败过)
    assert.equal(cb.getState(), 'CLOSED')
  })
})
