import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { EventCollector } from './event-collector'
import { EventAdapter } from './datasources/event.adapter'

describe('EventCollector', () => {
  let collector: EventCollector
  let adapter: EventAdapter

  beforeEach(() => {
    adapter = new EventAdapter()
    collector = new EventCollector(adapter)
  })

  describe('基础采集', () => {
    it('基础字段采集', () => {
      const r = collector.collect({
        tenantId: 't1',
        eventId: 'evt-001',
        type: 'PAGEVIEW',
        who: 'm1',
        what: 'page_view'
      })
      assert.equal(r.accepted, true)
      assert.ok(r.event)
      assert.equal(r.event!.tenantId, 't1')
      assert.equal(r.event!.type, 'PAGEVIEW')
    })

    it('服务端时间戳自动补全', () => {
      const before = Date.now()
      const r = collector.collect({
        tenantId: 't1',
        eventId: 'evt-002',
        type: 'CLICK',
        who: 'm1',
        what: 'btn_click'
      })
      const ts = new Date(r.event!.timestamp).getTime()
      assert.ok(ts >= before, '服务端时间戳应不早于调用时间')
    })

    it('客户端传入 timestamp 时优先使用', () => {
      const fixedTs = '2025-01-01T00:00:00.000Z'
      const r = collector.collect({
        tenantId: 't1',
        eventId: 'evt-003',
        type: 'PAGEVIEW',
        who: 'm1',
        what: 'home',
        timestamp: fixedTs
      })
      assert.equal(r.event!.timestamp, fixedTs)
    })
  })

  describe('PII 脱敏', () => {
    it('email 脱敏', () => {
      const r = collector.collect({
        tenantId: 't1',
        eventId: 'evt-004',
        type: 'CUSTOM',
        who: 'user@example.com',
        what: 'login'
      })
      assert.equal(r.event!.who, 'user@***')
    })

    it('手机号脱敏', () => {
      const r = collector.collect({
        tenantId: 't1',
        eventId: 'evt-005',
        type: 'CUSTOM',
        who: '13812345678',
        what: 'register'
      })
      assert.equal(r.event!.who, '138****5678')
    })

    it('properties 中 email 字段脱敏', () => {
      const r = collector.collect({
        tenantId: 't1',
        eventId: 'evt-006',
        type: 'CUSTOM',
        who: 'm1',
        what: 'submit',
        properties: { email: 'secret@test.com', name: 'ok' }
      })
      assert.equal(r.event!.properties.email, '***MASKED***')
      assert.equal(r.event!.properties.name, 'ok')
    })

    it('properties 中 phone 字段脱敏', () => {
      const r = collector.collect({
        tenantId: 't1',
        eventId: 'evt-007',
        type: 'CUSTOM',
        who: 'm1',
        what: 'submit',
        properties: { phone: '13800001111' }
      })
      assert.equal(r.event!.properties.phone, '***MASKED***')
    })

    it('properties 中 password/token 字段脱敏', () => {
      const r = collector.collect({
        tenantId: 't1',
        eventId: 'evt-008',
        type: 'CUSTOM',
        who: 'm1',
        what: 'login',
        properties: { password: 'xxx', token: 'yyy', idCard: 'ID' }
      })
      assert.equal(r.event!.properties.password, '***MASKED***')
      assert.equal(r.event!.properties.token, '***MASKED***')
      assert.equal(r.event!.properties.idCard, '***MASKED***')
    })
  })

  describe('properties 限制', () => {
    it('50 个以内 properties 完整保留', () => {
      const props: Record<string, any> = {}
      for (let i = 0; i < 30; i++) props[`key${i}`] = i
      const r = collector.collect({
        tenantId: 't1',
        eventId: 'evt-009',
        type: 'CUSTOM',
        who: 'm1',
        what: 'test',
        properties: props
      })
      assert.equal(Object.keys(r.event!.properties).length, 30)
    })

    it('超过 50 个 properties 截断', () => {
      const props: Record<string, any> = {}
      for (let i = 0; i < 80; i++) props[`key${i}`] = i
      const r = collector.collect({
        tenantId: 't1',
        eventId: 'evt-010',
        type: 'CUSTOM',
        who: 'm1',
        what: 'test',
        properties: props
      })
      assert.ok(Object.keys(r.event!.properties).length <= 50)
    })
  })

  describe('幂等与字段校验', () => {
    it('重复 eventId 被拒绝', () => {
      const r1 = collector.collect({
        tenantId: 't1', eventId: 'evt-dup', type: 'PAGEVIEW', who: 'm1', what: 'page'
      })
      assert.equal(r1.accepted, true)
      const r2 = collector.collect({
        tenantId: 't1', eventId: 'evt-dup', type: 'PAGEVIEW', who: 'm1', what: 'page'
      })
      assert.equal(r2.accepted, false)
      assert.match(r2.reason || '', /duplicate_event_id/)
    })

    it('缺少 tenantId 被拒绝', () => {
      const r = collector.collect({
        tenantId: '' as any, eventId: 'evt-no-t', type: 'PAGEVIEW', who: 'm1', what: 'p'
      })
      assert.equal(r.accepted, false)
    })

    it('缺少 type 被拒绝', () => {
      const r = collector.collect({
        tenantId: 't1', eventId: 'evt-no-type', type: '' as any, who: 'm1', what: 'p'
      })
      assert.equal(r.accepted, false)
    })
  })

  describe('批量采集', () => {
    it('collectBatch 返回每条结果', () => {
      const events = Array.from({ length: 5 }, (_, i) => ({
        tenantId: 't1', eventId: `batch-${i}`, type: 'PAGEVIEW' as const, who: 'm1', what: 'page'
      }))
      const results = collector.collectBatch(events)
      assert.equal(results.length, 5)
      assert.ok(results.every(r => r.accepted))
    })

    it('批量中含重复 eventId 时被拒绝', () => {
      const events = [
        { tenantId: 't1', eventId: 'dup', type: 'PAGEVIEW' as const, who: 'm1', what: 'p' },
        { tenantId: 't1', eventId: 'dup', type: 'PAGEVIEW' as const, who: 'm1', what: 'p' }
      ]
      const results = collector.collectBatch(events)
      assert.equal(results[0].accepted, true)
      assert.equal(results[1].accepted, false)
    })
  })

  describe('反模式检测', () => {
    it('isOverCollecting: >50 = true', () => {
      const props: Record<string, any> = {}
      for (let i = 0; i < 60; i++) props[`k${i}`] = i
      assert.equal(collector.isOverCollecting(props), true)
    })

    it('isOverCollecting: ≤50 = false', () => {
      const props: Record<string, any> = {}
      for (let i = 0; i < 30; i++) props[`k${i}`] = i
      assert.equal(collector.isOverCollecting(props), false)
    })
  })
})