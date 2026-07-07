import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { FunnelCalculator } from './funnel-calculator'
import { FunnelAdapter } from './datasources/funnel.adapter'
import { EventAdapter } from './datasources/event.adapter'
import { EventCollector } from './event-collector'

describe('FunnelCalculator', () => {
  let calc: FunnelCalculator
  let funnelAdapter: FunnelAdapter
  let eventAdapter: EventAdapter
  let collector: EventCollector

  beforeEach(() => {
    funnelAdapter = new FunnelAdapter()
    eventAdapter = new EventAdapter()
    collector = new EventCollector(eventAdapter)
    calc = new FunnelCalculator(funnelAdapter, eventAdapter)
  })

  describe('基础漏斗', () => {
    it('单步漏斗 = 100% 转化', () => {
      collector.collect({
        tenantId: 't1', eventId: 'e1', type: 'PAGEVIEW',
        who: 'm1', what: 'p', memberId: 'm1'
      })
      const r = calc.compute({
        tenantId: 't1', name: 'f1',
        steps: [{ name: 'view', eventType: 'PAGEVIEW' }]
      })
      assert.equal(r.totalConversionRate, 1)
      assert.equal(r.stepResults[0].enteredCount, 1)
    })

    it('两步漏斗: 1 人完成两步 = 100%', () => {
      collector.collect({
        tenantId: 't1', eventId: 'e1', type: 'PAGEVIEW',
        who: 'm1', what: 'p', memberId: 'm1'
      })
      collector.collect({
        tenantId: 't1', eventId: 'e2', type: 'CLICK',
        who: 'm1', what: 'c', memberId: 'm1'
      })
      const r = calc.compute({
        tenantId: 't1', name: 'f2',
        steps: [
          { name: 'view', eventType: 'PAGEVIEW' },
          { name: 'click', eventType: 'CLICK' }
        ]
      })
      assert.equal(r.stepResults[0].enteredCount, 1)
      assert.equal(r.stepResults[1].enteredCount, 1)
    })

    it('多步漏斗: dropOff 累加', () => {
      collector.collect({ tenantId: 't1', eventId: 'a', type: 'PAGEVIEW', who: 'm1', what: 'p', memberId: 'm1' })
      collector.collect({ tenantId: 't1', eventId: 'b', type: 'PAGEVIEW', who: 'm2', what: 'p', memberId: 'm2' })
      collector.collect({ tenantId: 't1', eventId: 'c', type: 'CLICK', who: 'm1', what: 'c', memberId: 'm1' })
      // m2 未点击
      const r = calc.compute({
        tenantId: 't1', name: 'f3',
        steps: [
          { name: 'view', eventType: 'PAGEVIEW' },
          { name: 'click', eventType: 'CLICK' }
        ]
      })
      assert.equal(r.stepResults[0].enteredCount, 2)
      assert.ok(r.stepResults[1].conversionRate < 1)
    })

    it('空漏斗 = totalConversionRate = 0', () => {
      const r = calc.compute({
        tenantId: 't1', name: 'empty',
        steps: [{ name: 'view', eventType: 'PAGEVIEW' }]
      })
      assert.equal(r.totalConversionRate, 0)
    })
  })

  describe('windowDays', () => {
    it('默认 7d 窗口', () => {
      const r = calc.compute({
        tenantId: 't1', name: 'f',
        steps: [{ name: 'v', eventType: 'PAGEVIEW' }]
      })
      assert.equal(r.windowDays, 7)
    })

    it('可自定义窗口', () => {
      const r = calc.compute({
        tenantId: 't1', name: 'f', windowDays: 14,
        steps: [{ name: 'v', eventType: 'PAGEVIEW' }]
      })
      assert.equal(r.windowDays, 14)
    })
  })

  describe('反模式检测', () => {
    it('isOverComplex: ≤5 步 = false', () => {
      assert.equal(calc.isOverComplex([
        { name: 'a', eventType: 'PAGEVIEW' },
        { name: 'b', eventType: 'CLICK' }
      ]), false)
    })

    it('isOverComplex: >5 步 = true', () => {
      assert.equal(calc.isOverComplex([
        { name: 'a', eventType: 'PAGEVIEW' },
        { name: 'b', eventType: 'CLICK' },
        { name: 'c', eventType: 'CONVERSION' },
        { name: 'd', eventType: 'PURCHASE' },
        { name: 'e', eventType: 'CUSTOM' },
        { name: 'f', eventType: 'PAGEVIEW' }
      ]), true)
    })
  })

  describe('步骤过滤', () => {
    it('支持 filter 参数', () => {
      collector.collect({
        tenantId: 't1', eventId: 'e1', type: 'PAGEVIEW',
        who: 'm1', what: 'p', memberId: 'm1',
        properties: { page: 'home' }
      })
      const r = calc.compute({
        tenantId: 't1', name: 'filtered',
        steps: [{ name: 'view-home', eventType: 'PAGEVIEW', filter: { page: 'home' } }]
      })
      assert.equal(r.totalConversionRate, 1)
    })
  })

  describe('stepResults 字段', () => {
    it('每步包含 enteredCount + conversionRate + dropOffRate', () => {
      collector.collect({ tenantId: 't1', eventId: 'a', type: 'PAGEVIEW', who: 'm1', what: 'p', memberId: 'm1' })
      const r = calc.compute({
        tenantId: 't1', name: 'f',
        steps: [{ name: 'v', eventType: 'PAGEVIEW' }]
      })
      const step = r.stepResults[0]
      assert.ok('enteredCount' in step)
      assert.ok('conversionRate' in step)
      assert.ok('dropOffRate' in step)
    })

    it('dropOffRate + conversionRate = 1', () => {
      collector.collect({ tenantId: 't1', eventId: 'a', type: 'PAGEVIEW', who: 'm1', what: 'p', memberId: 'm1' })
      const r = calc.compute({
        tenantId: 't1', name: 'f',
        steps: [
          { name: 'v', eventType: 'PAGEVIEW' },
          { name: 'c', eventType: 'CLICK' }
        ]
      })
      const step = r.stepResults[1]
      assert.ok(Math.abs(step.conversionRate + step.dropOffRate - 1) < 0.001)
    })
  })

  describe('computedAt', () => {
    it('computedAt 是 ISO 字符串', () => {
      const r = calc.compute({
        tenantId: 't1', name: 'f',
        steps: [{ name: 'v', eventType: 'PAGEVIEW' }]
      })
      assert.match(r.computedAt, /^\d{4}-\d{2}-\d{2}T/)
    })
  })
})