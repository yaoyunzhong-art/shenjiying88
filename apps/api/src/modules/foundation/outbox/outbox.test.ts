import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { InMemoryOutboxStore } from './in-memory-outbox.store'
import { OutboxRelay } from './outbox.relay'
import { OutboxReplayService } from './outbox-replay.service'
import { OutboxError, type OutboxHandler, type OutboxRecord } from './outbox.port'

/**
 * Outbox + DLQ 4 子套件测试 (P1-3.4)
 *
 *   1. OutboxStore 基础 (append / 幂等 / claimBatch / 状态转换)
 *   2. OutboxRelay 投递 (handler 成功 / 失败重试 / 无 handler / 重入锁)
 *   3. DLQ 死信 (超 maxAttempts → DEAD_LETTERED / listDeadLetter / replay)
 *   4. 端到端 (业务写 → 投递 → handler 抛 → 重试 → 入死信 → replay → 投递)
 */

// ─── 测试辅助 ─────────────────────────────────────

/** 创建新 store (每个 test 隔离) */
function newStore() {
  return new InMemoryOutboxStore()
}

/** 创建 relay + store */
function newRelay(input?: { pollIntervalMs?: number; batchSize?: number; baseBackoffMs?: number }) {
  const store = newStore()
  const relay = new OutboxRelay(store, {
    pollIntervalMs: input?.pollIntervalMs ?? 60_000, // 测试时不开轮询
    batchSize: input?.batchSize ?? 10,
    baseBackoffMs: input?.baseBackoffMs ?? 10 // 测试用短退避
  })
  return { store, relay }
}

/** 等到指定条件成立 (用于重试场景) */
async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeoutMs = 1000
): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await condition()) return
    await new Promise((r) => setTimeout(r, 5))
  }
  throw new Error(`waitFor timeout after ${timeoutMs}ms`)
}

// ═══════════════════════════════════════════════════════════════
// 1. OutboxStore 基础
// ═══════════════════════════════════════════════════════════════

describe('InMemoryOutboxStore · 基础 CRUD', () => {
  it('1.1 append 创建 PENDING + envelope.eventName + maxAttempts 默认 5', async () => {
    const store = newStore()
    const record = await store.append({
      tenantId: 't1',
      eventName: 'order.paid',
      payload: { orderId: 'o-1' }
    })
    assert.equal(record.status, 'PENDING')
    assert.equal(record.attempts, 0)
    assert.equal(record.maxAttempts, 5)
    assert.equal(record.envelope.eventName, 'order.paid')
    assert.equal(record.envelope.payload.orderId, 'o-1')
    assert.equal(record.tenantId, 't1')
    assert.ok(record.id.startsWith('outbox-'))
  })

  it('1.2 append 同 idempotencyKey → 返回已存在 record (幂等)', async () => {
    const store = newStore()
    const r1 = await store.append({
      tenantId: 't1',
      eventName: 'order.paid',
      payload: { orderId: 'o-1' },
      idempotencyKey: 'idem-1'
    })
    const r2 = await store.append({
      tenantId: 't1',
      eventName: 'order.paid',
      payload: { orderId: 'o-1-rewrite' },
      idempotencyKey: 'idem-1'
    })
    assert.equal(r1.id, r2.id)
    // payload 不被重写
    assert.equal(r2.envelope.payload.orderId, 'o-1')
  })

  it('1.3 不同 idempotencyKey → 创建独立 record', async () => {
    const store = newStore()
    const r1 = await store.append({
      tenantId: 't1',
      eventName: 'order.paid',
      payload: { id: 1 },
      idempotencyKey: 'idem-a'
    })
    const r2 = await store.append({
      tenantId: 't1',
      eventName: 'order.paid',
      payload: { id: 2 },
      idempotencyKey: 'idem-b'
    })
    assert.notEqual(r1.id, r2.id)
  })

  it('1.4 claimBatch: 拉取 PENDING + nextAttemptAt <= now, IN_FLIGHT 标记', async () => {
    const store = newStore()
    await store.append({ tenantId: 't1', eventName: 'e1', payload: {} })
    await store.append({ tenantId: 't1', eventName: 'e2', payload: {} })
    const claimed = await store.claimBatch({ batchSize: 10, now: Date.now() })
    assert.equal(claimed.length, 2)
    for (const r of claimed) {
      assert.equal(r.status, 'IN_FLIGHT')
    }
    // 二次 claim (无 PENDING) → 空
    const claimed2 = await store.claimBatch({ batchSize: 10, now: Date.now() })
    assert.equal(claimed2.length, 0)
  })

  it('1.5 claimBatch: nextAttemptAt > now 不会被拉取', async () => {
    const store = newStore()
    await store.append({ tenantId: 't1', eventName: 'e1', payload: {} })
    // 用 now=0 调用, 所有真实 nextAttemptAt (基于 Date.now) 都 > 0, 不会被拉取
    const claimed = await store.claimBatch({ batchSize: 10, now: 0 })
    assert.equal(claimed.length, 0)
  })

  it('1.6 claimBatch: 拉满 batchSize 后停止', async () => {
    const store = newStore()
    for (let i = 0; i < 5; i++) {
      await store.append({ tenantId: 't1', eventName: `e${i}`, payload: {} })
    }
    const claimed = await store.claimBatch({ batchSize: 3, now: Date.now() })
    assert.equal(claimed.length, 3)
  })

  it('1.7 markDelivered: IN_FLIGHT → DELIVERED + deliveredAt', async () => {
    const store = newStore()
    const r = await store.append({ tenantId: 't1', eventName: 'e1', payload: {} })
    await store.claimBatch({ batchSize: 10, now: Date.now() })
    const now = Date.now()
    await store.markDelivered(r.id, now)
    const fresh = (await store.listAll()).find((x) => x.id === r.id)!
    assert.equal(fresh.status, 'DELIVERED')
    assert.equal(fresh.deliveredAt, new Date(now).toISOString())
  })

  it('1.8 markFailed: attempts++ + nextAttemptAt = now + backoffMs', async () => {
    const store = newStore()
    const r = await store.append({ tenantId: 't1', eventName: 'e1', payload: {} })
    await store.claimBatch({ batchSize: 10, now: Date.now() })
    const now = Date.now()
    const result = await store.markFailed({
      id: r.id,
      error: 'test',
      now,
      backoffMs: 5000
    })
    assert.equal(result!.attempts, 1)
    assert.equal(result!.status, 'PENDING')
    assert.equal(result!.nextAttemptAt, now + 5000)
    assert.equal(result!.lastError, 'test')
  })

  it('1.9 markFailed: 达到 maxAttempts → 自动 DEAD_LETTERED', async () => {
    const store = newStore()
    const r = await store.append({
      tenantId: 't1',
      eventName: 'e1',
      payload: {},
      maxAttempts: 2
    })
    await store.claimBatch({ batchSize: 10, now: Date.now() })
    await store.markFailed({ id: r.id, error: 'err1', now: Date.now(), backoffMs: 10 })
    await store.claimBatch({ batchSize: 10, now: Date.now() })
    const result = await store.markFailed({
      id: r.id,
      error: 'err2',
      now: Date.now(),
      backoffMs: 10
    })
    assert.equal(result!.attempts, 2)
    assert.equal(result!.status, 'DEAD_LETTERED')
    assert.ok(result!.deadLetteredAt)
  })

  it('1.10 count: total / pending / delivered / deadLettered 统计', async () => {
    const store = newStore()
    const r1 = await store.append({ tenantId: 't1', eventName: 'e1', payload: {} })
    const r2 = await store.append({ tenantId: 't1', eventName: 'e2', payload: {} })
    const r3 = await store.append({ tenantId: 't1', eventName: 'e3', payload: {}, maxAttempts: 1 })
    // 投递 r1
    await store.claimBatch({ batchSize: 1, now: Date.now() })
    await store.markDelivered(r1.id, Date.now())
    // 让 r3 入死信
    await store.claimBatch({ batchSize: 10, now: Date.now() })
    await store.markFailed({ id: r3.id, error: 'err', now: Date.now(), backoffMs: 10 })
    const stats = store.count()
    assert.equal(stats.total, 3)
    assert.equal(stats.delivered, 1)
    assert.equal(stats.deadLettered, 1)
    assert.equal(stats.pending, 1) // r2 还在 PENDING
  })
})

// ═══════════════════════════════════════════════════════════════
// 2. OutboxRelay 投递
// ═══════════════════════════════════════════════════════════════

describe('OutboxRelay · 投递 + 重试 + 重入锁', () => {
  it('2.1 handler 成功 → markDelivered + delivered++', async () => {
    const { store, relay } = newRelay()
    const received: OutboxRecord[] = []
    relay.registerHandler({
      eventName: 'order.paid',
      async handle(record) {
        received.push(record)
      }
    })
    await store.append({ tenantId: 't1', eventName: 'order.paid', payload: { id: 1 } })
    const result = await relay.drainOnce()
    assert.equal(result.claimed, 1)
    assert.equal(result.delivered, 1)
    assert.equal(received.length, 1)
    assert.equal(received[0]!.envelope.payload.id, 1)
    const stats = relay.getStats()
    assert.equal(stats.totalDelivered, 1)
  })

  it('2.2 handler 抛 retryable 错误 → markFailed + attempts++ + failed++', async () => {
    const { store, relay } = newRelay()
    let callCount = 0
    relay.registerHandler({
      eventName: 'order.paid',
      async handle() {
        callCount++
        throw new Error('downstream timeout')
      }
    })
    await store.append({
      tenantId: 't1',
      eventName: 'order.paid',
      payload: {},
      maxAttempts: 3
    })
    const r1 = await relay.drainOnce()
    assert.equal(r1.claimed, 1)
    assert.equal(r1.delivered, 0)
    assert.equal(r1.failed, 1)
    assert.equal(r1.deadLettered, 0)
    assert.equal(callCount, 1)
  })

  it('2.3 handler 多次失败 → 最终入死信 (maxAttempts=2)', async () => {
    const { store, relay } = newRelay({ baseBackoffMs: 5 })
    let callCount = 0
    relay.registerHandler({
      eventName: 'order.paid',
      async handle() {
        callCount++
        throw new Error('always fail')
      }
    })
    const r = await store.append({
      tenantId: 't1',
      eventName: 'order.paid',
      payload: {},
      maxAttempts: 2
    })
    // 第一次: 失败, attempts=1, 仍 PENDING (backoff=5ms)
    await relay.drainOnce()
    // 等过 backoff 才能再次拉取
    await new Promise((r) => setTimeout(r, 15))
    // 第二次: 失败, attempts=2 = maxAttempts, DEAD_LETTERED
    const r2 = await relay.drainOnce()
    assert.equal(r2.deadLettered, 1)
    const fresh = (await store.listAll()).find((x) => x.id === r.id)!
    assert.equal(fresh.status, 'DEAD_LETTERED')
    assert.equal(callCount, 2)
  })

  it('2.4 OutboxError(retryable=false) 立即入死信 (不再重试)', async () => {
    const { store, relay } = newRelay()
    const r = await store.append({
      tenantId: 't1',
      eventName: 'order.paid',
      payload: {},
      maxAttempts: 5
    })
    relay.registerHandler({
      eventName: 'order.paid',
      async handle() {
        throw new OutboxError({ message: 'fatal schema', retryable: false })
      }
    })
    const result = await relay.drainOnce()
    assert.equal(result.failed, 0)
    assert.equal(result.deadLettered, 1)
    const fresh = (await store.listAll()).find((x) => x.id === r.id)!
    assert.equal(fresh.status, 'DEAD_LETTERED')
  })

  it('2.5 无 handler → 视为 retryable 失败 (记录 error, 等待重试)', async () => {
    const { store, relay } = newRelay({ baseBackoffMs: 5 })
    const r = await store.append({
      tenantId: 't1',
      eventName: 'unknown.event',
      payload: {},
      maxAttempts: 2
    })
    // 第一次: 无 handler, failed (backoff=5ms, nextAttemptAt=now+5)
    const r1 = await relay.drainOnce()
    assert.equal(r1.failed, 1)
    // 等过 backoff
    await new Promise((res) => setTimeout(res, 15))
    // 第二次: 仍无 handler, attempts=2=maxAttempts, 入死信
    const r2 = await relay.drainOnce()
    assert.equal(r2.deadLettered, 1)
    const fresh = (await store.listAll()).find((x) => x.id === r.id)!
    assert.match(fresh.lastError ?? '', /no handler/)
  })

  it('2.6 多个事件 → 多个 handler 并行路由', async () => {
    const { store, relay } = newRelay()
    const orderPaid: unknown[] = []
    const orderRefunded: unknown[] = []
    relay.registerHandler({
      eventName: 'order.paid',
      async handle(r) { orderPaid.push(r.envelope.payload) }
    })
    relay.registerHandler({
      eventName: 'order.refunded',
      async handle(r) { orderRefunded.push(r.envelope.payload) }
    })
    await store.append({ tenantId: 't1', eventName: 'order.paid', payload: { id: 1 } })
    await store.append({ tenantId: 't1', eventName: 'order.refunded', payload: { id: 2 } })
    await relay.drainOnce()
    assert.equal(orderPaid.length, 1)
    assert.equal(orderRefunded.length, 1)
    assert.equal((orderPaid[0] as { id: number }).id, 1)
  })

  it('2.7 重入锁: 并发 drainOnce 第二次不执行 (返回 0,0,0,0)', async () => {
    const { relay } = newRelay()
    let resolveHandler!: () => void
    const handlerDone = new Promise<void>((r) => (resolveHandler = r))
    relay.registerHandler({
      eventName: 'e1',
      async handle() {
        await handlerDone
      }
    })
    const store = (relay as any).store as InMemoryOutboxStore
    await store.append({ tenantId: 't1', eventName: 'e1', payload: {} })
    // 第一次 drain: 不 await
    const first = relay.drainOnce()
    // 第二次: 立即同步调用 → 应该跳过
    const second = await relay.drainOnce()
    assert.equal(second.claimed, 0)
    assert.equal(second.delivered, 0)
    // 释放第一个
    resolveHandler()
    await first
  })
})

// ═══════════════════════════════════════════════════════════════
// 3. DLQ 死信
// ═══════════════════════════════════════════════════════════════

describe('OutboxStore · DLQ 死信', () => {
  it('3.1 moveToDeadLetter: 强制入死信 (跳过 maxAttempts 检查)', async () => {
    const store = newStore()
    const r = await store.append({
      tenantId: 't1',
      eventName: 'e1',
      payload: {},
      maxAttempts: 10
    })
    await store.moveToDeadLetter({
      id: r.id,
      error: 'manual quarantine',
      now: Date.now()
    })
    const fresh = (await store.listAll()).find((x) => x.id === r.id)!
    assert.equal(fresh.status, 'DEAD_LETTERED')
    assert.equal(fresh.lastError, 'manual quarantine')
  })

  it('3.2 listDeadLetter: 按 tenantId 过滤 + 按 deadLetteredAt 倒序', async () => {
    const store = newStore()
    const r1 = await store.append({ tenantId: 't1', eventName: 'e1', payload: {} })
    const r2 = await store.append({ tenantId: 't1', eventName: 'e2', payload: {} })
    const r3 = await store.append({ tenantId: 't2', eventName: 'e3', payload: {} })
    await store.moveToDeadLetter({ id: r1.id, error: 'a', now: 1000 })
    await new Promise((r) => setTimeout(r, 5))
    await store.moveToDeadLetter({ id: r2.id, error: 'b', now: 2000 })
    await store.moveToDeadLetter({ id: r3.id, error: 'c', now: 3000 })

    const t1Dlq = await store.listDeadLetter({ tenantId: 't1' })
    assert.equal(t1Dlq.length, 2)
    // 最新死信在前
    assert.equal(t1Dlq[0]!.id, r2.id)
    assert.equal(t1Dlq[1]!.id, r1.id)

    const t2Dlq = await store.listDeadLetter({ tenantId: 't2' })
    assert.equal(t2Dlq.length, 1)
    assert.equal(t2Dlq[0]!.id, r3.id)

    const allDlq = await store.listDeadLetter()
    assert.equal(allDlq.length, 3)
  })

  it('3.3 replayFromDeadLetter: DEAD_LETTERED → PENDING + attempts=0', async () => {
    const store = newStore()
    const r = await store.append({
      tenantId: 't1',
      eventName: 'e1',
      payload: {},
      maxAttempts: 2
    })
    await store.claimBatch({ batchSize: 10, now: Date.now() })
    await store.markFailed({ id: r.id, error: 'err1', now: Date.now(), backoffMs: 5 })
    await store.claimBatch({ batchSize: 10, now: Date.now() })
    await store.markFailed({ id: r.id, error: 'err2', now: Date.now(), backoffMs: 5 })
    // 入死信了
    const replayed = await store.replayFromDeadLetter(r.id, Date.now())
    assert.equal(replayed!.status, 'PENDING')
    assert.equal(replayed!.attempts, 0)
    assert.equal(replayed!.deadLetteredAt, undefined)
    assert.equal(replayed!.lastError, undefined)
  })

  it('3.4 replayFromDeadLetter: 非 DEAD_LETTERED 状态拒绝 replay', async () => {
    const store = newStore()
    const r = await store.append({ tenantId: 't1', eventName: 'e1', payload: {} })
    // 还在 PENDING, 不能 replay
    const result = await store.replayFromDeadLetter(r.id, Date.now())
    assert.equal(result, null)
  })
})

// ═══════════════════════════════════════════════════════════════
// 4. OutboxReplayService + 端到端
// ═══════════════════════════════════════════════════════════════

describe('OutboxReplayService · 死信重放 + 端到端', () => {
  it('4.1 deadLetterCount: 统计死信数量', async () => {
    const { store, relay } = newRelay()
    const replay = new OutboxReplayService(store, relay)
    const r1 = await store.append({ tenantId: 't1', eventName: 'e1', payload: {} })
    await store.moveToDeadLetter({ id: r1.id, error: 'q', now: Date.now() })
    assert.equal(await replay.deadLetterCount('t1'), 1)
    assert.equal(await replay.deadLetterCount('t2'), 0)
  })

  it('4.2 replay 单条: DEAD_LETTERED → PENDING → DELIVERED', async () => {
    const { store, relay } = newRelay()
    const replay = new OutboxReplayService(store, relay)
    let delivered = false
    relay.registerHandler({
      eventName: 'e1',
      async handle() {
        delivered = true
      }
    })
    const r = await store.append({ tenantId: 't1', eventName: 'e1', payload: {} })
    await store.moveToDeadLetter({ id: r.id, error: 'q', now: Date.now() })
    const result = await replay.replay(r.id)
    assert.ok(result.replayed)
    assert.equal(result.delivered, true)
    assert.ok(delivered)
  })

  it('4.3 replay 失败: 仍然失败 → 重新入死信', async () => {
    const { store, relay } = newRelay()
    const replay = new OutboxReplayService(store, relay)
    relay.registerHandler({
      eventName: 'e1',
      async handle() {
        throw new Error('still broken')
      }
    })
    const r = await store.append({
      tenantId: 't1',
      eventName: 'e1',
      payload: {},
      maxAttempts: 1
    })
    await store.moveToDeadLetter({ id: r.id, error: 'first q', now: Date.now() })
    const result = await replay.replay(r.id)
    assert.ok(result.replayed)
    // handler 失败 → 重新入死信
    const dlqList = await store.listDeadLetter()
    assert.equal(dlqList.length, 1)
    assert.match(dlqList[0]!.lastError ?? '', /still broken/)
  })

  it('4.4 replayMany: 批量重放 + 统计', async () => {
    const { store, relay } = newRelay()
    const replay = new OutboxReplayService(store, relay)
    const received: string[] = []
    relay.registerHandler({
      eventName: 'e1',
      async handle(r) {
        received.push(r.id)
      }
    })
    const r1 = await store.append({ tenantId: 't1', eventName: 'e1', payload: {} })
    const r2 = await store.append({ tenantId: 't1', eventName: 'e1', payload: {} })
    await store.moveToDeadLetter({ id: r1.id, error: 'q', now: Date.now() })
    await store.moveToDeadLetter({ id: r2.id, error: 'q', now: Date.now() })
    const result = await replay.replayMany([r1.id, r2.id, 'non-existent'])
    assert.equal(result.total, 3)
    assert.equal(result.replayed, 2)
    assert.equal(result.delivered, 2)
    assert.deepEqual(result.failed, ['non-existent'])
    assert.equal(received.length, 2)
  })

  it('4.5 端到端: 写 outbox → 投递失败 → 重试 → 入死信 → replay → 投递成功', async () => {
    const { store, relay } = newRelay({ baseBackoffMs: 5 })
    const replay = new OutboxReplayService(store, relay)
    let shouldFail = true
    const received: string[] = []
    relay.registerHandler({
      eventName: 'order.paid',
      async handle(r) {
        if (shouldFail) {
          throw new Error('temporary failure')
        }
        received.push(r.id)
      }
    })
    const r = await store.append({
      tenantId: 't1',
      eventName: 'order.paid',
      payload: { orderId: 'o-end2end' },
      maxAttempts: 2
    })

    // 1. 第一次投递: 失败 (attempts=1, PENDING, backoff=5ms)
    const d1 = await relay.drainOnce()
    assert.equal(d1.failed, 1)
    assert.equal(d1.deadLettered, 0)
    assert.equal(received.length, 0)

    // 等过 backoff
    await new Promise((r) => setTimeout(r, 15))

    // 2. 第二次投递: 失败 (attempts=2=maxAttempts, DEAD_LETTERED)
    const d2 = await relay.drainOnce()
    assert.equal(d2.deadLettered, 1)

    // 3. 修好 handler, replay
    shouldFail = false
    const result = await replay.replay(r.id)
    assert.equal(result.delivered, true)
    assert.equal(received.length, 1)
    assert.equal(received[0], r.id)

    // 4. store.count: delivered=1, deadLettered=0
    const stats = store.count()
    assert.equal(stats.delivered, 1)
    assert.equal(stats.deadLettered, 0)
  })
})
