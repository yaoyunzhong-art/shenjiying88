import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Queue Producer 单元测试 (Phase-13 task 13)
 */

import assert from 'node:assert/strict'
import {
  BullMQQueueProducer,
  InMemoryQueueProducer,
  QueueJob,
  QueueType
} from './queue-producer'

let producer: InMemoryQueueProducer

beforeEach(() => {
  producer = new InMemoryQueueProducer()
})

it('InMemoryQueueProducer - backend = memory', () => {
  assert.equal(producer.backend, 'memory')
})

it('addJob 返回完整 QueueJob', async () => {
  const job = await producer.addJob(QueueType.Notification, { to: 'a@b.com' })
  assert.ok(job.id)
  assert.equal(job.type, QueueType.Notification)
  assert.equal(job.attempts, 0)
  assert.equal(job.maxAttempts, 3)
  assert.ok(job.enqueuedAt)
})

it('addJob 支持 maxAttempts 选项', async () => {
  const job = await producer.addJob(QueueType.Email, { x: 1 }, { maxAttempts: 5 })
  assert.equal(job.maxAttempts, 5)
})

it('addJob 支持 delayMs 选项', async () => {
  const job = await producer.addJob(QueueType.Sms, { x: 1 }, { delayMs: 5000 })
  assert.ok(job.scheduledFor)
  const delay = new Date(job.scheduledFor!).getTime() - new Date(job.enqueuedAt).getTime()
  assert.ok(delay >= 4900 && delay <= 5100, `delay 异常: ${delay}ms`)
})

it('addJob 支持 scope 选项', async () => {
  const job = await producer.addJob(
    QueueType.Receipt,
    { x: 1 },
    { scope: { tenantId: 't-1', storeId: 's-1' } }
  )
  assert.deepEqual(job.scope, { tenantId: 't-1', storeId: 's-1' })
})

it('registerHandler + addJob 触发 handler', async () => {
  let called = 0
  let receivedJob: { id: string; payload: unknown } | null = null
  producer.registerHandler<{ msg: string }>(QueueType.Notification, async (job: QueueJob<{ msg: string }>) => {
    called++
    receivedJob = { id: job.id, payload: job.payload }
  })

  await producer.addJob(QueueType.Notification, { msg: 'hi' })
  await producer.drain()

  assert.equal(called, 1)
  assert.ok(receivedJob)
  assert.ok(receivedJob)
  const rj: { id: string; payload: unknown } = receivedJob
  assert.deepEqual(rj.payload, { msg: 'hi' })
})

it('handler 抛错时记录 failed 结果', async () => {
  producer.registerHandler(QueueType.Email, async () => {
    throw new Error('send failed')
  })

  const job = await producer.addJob(QueueType.Email, { to: 'a@b.com' }, { maxAttempts: 1 })
  await producer.drain()

  const results = producer.listResults()
  assert.equal(results.length, 1)
  assert.equal(results[0].status, 'failed')
  assert.equal(results[0].error, 'send failed')
  assert.equal(results[0].jobId, job.id)
})

it('handler 抛错未达 maxAttempts 时状态为 retry', async () => {
  producer.registerHandler(QueueType.Sms, async () => {
    throw new Error('transient')
  })

  await producer.addJob(QueueType.Sms, { to: '+86' }, { maxAttempts: 3 })
  await producer.drain()

  const results = producer.listResults()
  assert.equal(results[0].status, 'retry')
})

it('未注册 handler 时任务标记 failed', async () => {
  await producer.addJob(QueueType.Webhook, { url: 'http://x' })
  await producer.drain()

  const results = producer.listResults()
  assert.equal(results.length, 1)
  assert.equal(results[0].status, 'failed')
  assert.equal(results[0].error, 'No handler registered')
})

it('removeHandler 移除注册', async () => {
  let called = 0
  producer.registerHandler(QueueType.Export, async () => {
    called++
  })
  producer.removeHandler(QueueType.Export)

  await producer.addJob(QueueType.Export, { x: 1 })
  await producer.drain()

  assert.equal(called, 0)
  assert.equal(producer.listResults()[0].status, 'failed')
})

it('stats 统计正确', async () => {
  producer.registerHandler(QueueType.Notification, async () => {})
  producer.registerHandler(QueueType.Email, async () => {
    throw new Error('x')
  })

  await producer.addJob(QueueType.Notification, { i: 1 })
  await producer.addJob(QueueType.Notification, { i: 2 })
  await producer.addJob(QueueType.Email, { i: 3 }, { maxAttempts: 1 })
  await producer.drain()

  const stats = await producer.stats()
  assert.equal(stats.total, 3)
  assert.equal(stats.completed, 2)
  assert.equal(stats.failed, 1)
  assert.equal(stats.byType[QueueType.Notification], 2)
  assert.equal(stats.byType[QueueType.Email], 1)
})

it('ping 返回 true', async () => {
  assert.equal(await producer.ping(), true)
})

it('reset 清理所有状态', async () => {
  await producer.addJob(QueueType.Notification, { x: 1 })
  producer.reset()

  assert.equal(producer.listJobs().length, 0)
  assert.equal(producer.listResults().length, 0)
})

it('BullMQQueueProducer - backend = bullmq', () => {
  const bp = new BullMQQueueProducer('redis://localhost:6379')
  assert.equal(bp.backend, 'bullmq')
})

it('BullMQQueueProducer - ping 检查 connectionUrl', async () => {
  const bp1 = new BullMQQueueProducer('redis://prod:6379')
  assert.equal(await bp1.ping(), true)

  const bp2 = new BullMQQueueProducer('')
  assert.equal(await bp2.ping(), false)
})

it('BullMQQueueProducer - addJob fallback 到 InMemory', async () => {
  const bp = new BullMQQueueProducer('redis://localhost:6379')
  const job = await bp.addJob(QueueType.Report, { name: 'daily' })
  assert.ok(job.id)
  assert.equal(job.type, QueueType.Report)

  // fallback 后 stats 应能工作
  const stats = await bp.stats()
  assert.ok(stats.total >= 1)
})

it('QueueType 枚举包含 7 种类型', () => {
  const types = Object.values(QueueType)
  assert.equal(types.length, 7)
  assert.ok(types.includes(QueueType.Notification))
  assert.ok(types.includes(QueueType.Receipt))
  assert.ok(types.includes(QueueType.Report))
  assert.ok(types.includes(QueueType.Email))
  assert.ok(types.includes(QueueType.Sms))
  assert.ok(types.includes(QueueType.Webhook))
  assert.ok(types.includes(QueueType.Export))
})

it('多个 handler 并行触发', async () => {
  const order: string[] = []
  producer.registerHandler(QueueType.Email, async () => {
    await new Promise((r) => setTimeout(r, 10))
    order.push('email')
  })
  producer.registerHandler(QueueType.Sms, async () => {
    order.push('sms')
  })

  await producer.addJob(QueueType.Email, {})
  await producer.addJob(QueueType.Sms, {})
  await producer.drain()

  assert.equal(order.length, 2)
  assert.ok(order.includes('email'))
  assert.ok(order.includes('sms'))
})

it('completedAt 时间戳正确', async () => {
  producer.registerHandler(QueueType.Notification, async () => {})

  const before = Date.now()
  await producer.addJob(QueueType.Notification, {})
  await producer.drain()
  const after = Date.now()

  const results = producer.listResults()
  const ts = new Date(results[0].completedAt).getTime()
  assert.ok(ts >= before - 50 && ts <= after + 50, `时间戳异常: ${ts}`)
})

it('durationMs 非负数', async () => {
  producer.registerHandler(QueueType.Email, async () => {
    await new Promise((r) => setTimeout(r, 20))
  })

  await producer.addJob(QueueType.Email, {})
  await producer.drain()

  const results = producer.listResults()
  assert.ok(results[0].durationMs >= 0, `durationMs = ${results[0].durationMs}`)
})
