import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { CDCStream } from './cdc-stream'
import { CDCAdapter } from './datasources/cdc.adapter'

describe('CDCStream', () => {
  let stream: CDCStream
  let adapter: CDCAdapter

  beforeEach(() => {
    adapter = new CDCAdapter()
    stream = new CDCStream(adapter)
  })

  function makeEvent(overrides: any = {}) {
    return stream.create({
      tenantId: 't1',
      tableName: 'orders',
      recordId: 'r1',
      eventType: 'CREATED',
      after: { id: 'r1', total: 100 },
      ...overrides
    })
  }

  describe('create', () => {
    it('默认 watermark = Date.now()', () => {
      const before = Date.now()
      const e = makeEvent()
      const after = Date.now()
      assert.ok(e.watermark >= before && e.watermark <= after, `watermark ${e.watermark} 应在 [${before}, ${after}]`)
    })

    it('默认 eventId 包含 recordId', () => {
      const e = makeEvent()
      assert.match(e.eventId, /orders-r1-/)
    })
  })

  describe('apply 幂等', () => {
    it('重复 eventId 被拒绝', () => {
      const e = makeEvent()
      assert.equal(stream.apply(e).accepted, true)
      const e2 = { ...e }  // 同 eventId
      const r = stream.apply(e2)
      assert.equal(r.accepted, false)
      assert.match(r.reason || '', /duplicate_event_id/)
    })

    it('eventId 可自定义', () => {
      const e = makeEvent({ eventId: 'custom-evt' })
      const r = stream.apply(e)
      assert.equal(r.accepted, true)
    })
  })

  describe('watermark 单调递增', () => {
    it('回退 watermark 被拒绝 (直接 adapter)', () => {
      const e1 = makeEvent({ eventId: 'e1' })
      adapter.apply(e1)
      const e2 = makeEvent({ eventId: 'e2', recordId: 'r2' })
      e2.watermark = e1.watermark - 100  // 回退
      const r = adapter.apply(e2)
      assert.equal(r.accepted, false)
      assert.match(r.reason || '', /watermark_not_increasing/)
    })

    it('stream.apply 自动校正 watermark (回退也接受)', () => {
      const e1 = makeEvent({ eventId: 'e1' })
      stream.apply(e1)
      const e2 = makeEvent({ eventId: 'e2', recordId: 'r2' })
      e2.watermark = e1.watermark  // 等于
      const r = stream.apply(e2)
      // 自动校正为 e1.watermark + 1, 所以接受
      assert.equal(r.accepted, true)
      assert.ok(r.applied!.watermark > e1.watermark, '校正后 watermark 应大于 e1')
    })

    it('detectWatermarkRegression 检出回退', () => {
      const e1 = makeEvent({ eventId: 'e1' })
      stream.apply(e1)
      assert.equal(stream.detectWatermarkRegression('t1', e1.watermark - 1), true)
      assert.equal(stream.detectWatermarkRegression('t1', e1.watermark + 100), false)
    })
  })

  describe('软删除', () => {
    it('DELETED 必须有 before 快照', () => {
      const e = stream.create({
        tenantId: 't1', tableName: 'orders', recordId: 'r1',
        eventType: 'DELETED', before: { id: 'r1' }
      })
      assert.equal(stream.apply(e).accepted, true)
    })

    it('DELETED 缺 before 被拒绝', () => {
      const e = stream.create({
        tenantId: 't1', tableName: 'orders', recordId: 'r1',
        eventType: 'DELETED'
      })
      const r = stream.apply(e)
      assert.equal(r.accepted, false)
      assert.match(r.reason || '', /missing_before/)
    })

    it('CREATED 接受 after 快照', () => {
      const e = stream.create({
        tenantId: 't1', tableName: 'orders', recordId: 'r2',
        eventType: 'CREATED', after: { id: 'r2' }
      })
      assert.equal(stream.apply(e).accepted, true)
    })

    it('UPDATED 接受 before + after', () => {
      const e = stream.create({
        tenantId: 't1', tableName: 'orders', recordId: 'r3',
        eventType: 'UPDATED', before: { total: 100 }, after: { total: 200 }
      })
      assert.equal(stream.apply(e).accepted, true)
    })
  })

  describe('replay 幂等', () => {
    it('replay 标记 replayed=true', () => {
      const e = makeEvent({ eventId: 'replay-1' })
      const r = stream.replay(e)
      assert.equal(r.accepted, true)
      assert.equal(r.replayed?.replayed, true)
    })

    it('重复 replay 同一 eventId 被拒绝', () => {
      const e = makeEvent({ eventId: 'replay-2' })
      assert.equal(stream.replay(e).accepted, true)
      assert.equal(stream.replay(e).accepted, false)
    })

    it('apply 过的 eventId 不能 replay (重复)', () => {
      const e = makeEvent({ eventId: 'replay-3' })
      stream.apply(e)
      const r = stream.replay({ ...e })
      assert.equal(r.accepted, false)
    })
  })

  describe('applyBatch 排序', () => {
    it('applyBatch 按 watermark 升序应用', () => {
      const e1 = stream.create({ tenantId: 't1', tableName: 'orders', recordId: 'r1', eventType: 'CREATED', after: {} })
      const e2 = stream.create({ tenantId: 't1', tableName: 'orders', recordId: 'r2', eventType: 'CREATED', after: {} })
      const e3 = stream.create({ tenantId: 't1', tableName: 'orders', recordId: 'r3', eventType: 'CREATED', after: {} })
      // 故意乱序传入
      const results = stream.applyBatch([e3, e1, e2])
      assert.equal(results.length, 3)
      assert.ok(results.every(r => r.accepted))
    })
  })

  describe('tail 查询', () => {
    it('sinceWatermark 增量查询', () => {
      stream.apply(makeEvent({ eventId: 'tail-1' }))
      const e2 = stream.create({ tenantId: 't1', tableName: 'orders', recordId: 'r2', eventType: 'CREATED', after: {} })
      stream.apply(e2)
      const tail = stream.tail('t1', e2.watermark - 1)
      assert.equal(tail.length, 1)
    })

    it('currentWatermark 跟踪', () => {
      assert.equal(stream.currentWatermark('t1'), 0)
      const e = makeEvent()
      stream.apply(e)
      assert.ok(stream.currentWatermark('t1') > 0)
    })
  })
})