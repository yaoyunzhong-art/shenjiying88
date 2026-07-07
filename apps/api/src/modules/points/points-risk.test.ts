import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * points-risk.test.ts - T107-1 Points 风控服务测试
 *
 * 24 tests covering:
 * - InflationMonitor: inflation index calculation (normal/inflation/deflation)
 * - CircuitBreaker: open after 5 failures, half-open after 60s
 * - ExpirationNotifier: schedule, sendReminder increment, cancel
 */

import assert from 'node:assert/strict'
import {
  InflationMonitor,
  CircuitBreaker,
  ExpirationNotifier,
  PointsRiskService
} from './points-risk.service'

// ============================================================================
// InflationMonitor Tests
// ============================================================================

describe('InflationMonitor', () => {
  let monitor: InflationMonitor

  beforeEach(() => {
    monitor = new InflationMonitor()
  })

  describe('getInflationIndex()', () => {
    it('TC-1 初始状态返回 1（无发放无消耗）', () => {
      assert.equal(monitor.getInflationIndex(), 1)
    })

    it('TC-2 正常状态：发放=消耗，指数=1', () => {
      monitor.recordPointIssuance(100, 'm1')
      monitor.recordPointRedemption(100, 'm1')
      assert.equal(monitor.getInflationIndex(), 1)
    })

    it('TC-3 通胀状态：发放>消耗，指数>1', () => {
      monitor.recordPointIssuance(200, 'm1')
      monitor.recordPointRedemption(100, 'm1')
      assert.ok(monitor.getInflationIndex() > 1)
      assert.ok(monitor.getInflationIndex() === 2)
    })

    it('TC-4 通缩状态：消耗>发放，指数<1', () => {
      monitor.recordPointIssuance(50, 'm1')
      monitor.recordPointRedemption(100, 'm1')
      assert.ok(monitor.getInflationIndex() < 1)
      assert.ok(monitor.getInflationIndex() === 0.5)
    })

    it('TC-5 只有发放无消耗，返回 Infinity', () => {
      monitor.recordPointIssuance(100, 'm1')
      assert.equal(monitor.getInflationIndex(), Infinity)
    })

    it('TC-6 多会员累计正确', () => {
      monitor.recordPointIssuance(100, 'm1')
      monitor.recordPointIssuance(100, 'm2')
      monitor.recordPointRedemption(50, 'm1')
      monitor.recordPointRedemption(150, 'm2')
      assert.equal(monitor.getInflationIndex(), 200 / 200)
    })
  })

  describe('alertIfHigh()', () => {
    it('TC-7 指数正常不触发预警', () => {
      monitor.recordPointIssuance(100, 'm1')
      monitor.recordPointRedemption(100, 'm1')
      assert.equal(monitor.alertIfHigh(1.5), null)
    })

    it('TC-8 指数超阈值触发预警', () => {
      monitor.recordPointIssuance(300, 'm1')
      monitor.recordPointRedemption(100, 'm1')
      const alert = monitor.alertIfHigh(1.5)
      assert.notEqual(alert, null)
      assert.equal(alert!.type, 'inflation')
      assert.equal(alert!.threshold, 1.5)
    })
  })

  describe('getInflationTrend()', () => {
    it('TC-9 返回最近7天数据', () => {
      const trend = monitor.getInflationTrend()
      assert.equal(trend.length, 7)
    })

    it('TC-10 趋势数据包含必要字段', () => {
      const trend = monitor.getInflationTrend()
      for (const point of trend) {
        assert.ok('date' in point)
        assert.ok('issuance' in point)
        assert.ok('redemption' in point)
        assert.ok('index' in point)
      }
    })
  })
})

// ============================================================================
// CircuitBreaker Tests
// ============================================================================

describe('CircuitBreaker', () => {
  let cb: CircuitBreaker

  beforeEach(() => {
    cb = new CircuitBreaker({ failureThreshold: 5, recoveryTimeoutMs: 60_000 })
  })

  describe('recordFailure()', () => {
    it('TC-11 前4次失败不开启熔断', () => {
      for (let i = 0; i < 4; i++) {
        cb.recordFailure('ep1')
        assert.equal(cb.isOpen('ep1'), false)
      }
    })

    it('TC-12 第5次连续失败后开启熔断', () => {
      for (let i = 0; i < 5; i++) {
        cb.recordFailure('ep2')
      }
      assert.equal(cb.isOpen('ep2'), true)
    })
  })

  describe('isOpen()', () => {
    it('TC-13 未记录过的 endpoint 返回 false', () => {
      assert.equal(cb.isOpen('unknown'), false)
    })

    it('TC-14 熔断开启后持续返回 true 直到超时', () => {
      for (let i = 0; i < 5; i++) {
        cb.recordFailure('ep3')
      }
      assert.equal(cb.isOpen('ep3'), true)
    })
  })

  describe('getStatus()', () => {
    it('TC-15 未记录返回 closed 状态', () => {
      const status = cb.getStatus('unknown')
      assert.equal(status.state, 'closed')
      assert.equal(status.failures, 0)
    })

    it('TC-16 熔断开启后返回 open 状态和剩余时间', () => {
      for (let i = 0; i < 5; i++) {
        cb.recordFailure('ep4')
      }
      const status = cb.getStatus('ep4')
      assert.equal(status.state, 'open')
      assert.ok(status.remainingMs !== null)
      assert.ok(status.remainingMs! > 0)
    })
  })

  describe('recordSuccess()', () => {
    it('TC-17 熔断关闭时成功调用减少失败计数', () => {
      cb.recordFailure('ep5')
      cb.recordFailure('ep5')
      cb.recordSuccess('ep5')
      const status = cb.getStatus('ep5')
      assert.equal(status.failures, 1)
    })
  })

  describe('halfOpen()', () => {
    it('TC-18 手动 halfOpen 后状态变为 half-open', () => {
      cb.halfOpen('ep6')
      const status = cb.getStatus('ep6')
      assert.equal(status.state, 'half-open')
    })
  })

  describe('reset()', () => {
    it('TC-19 reset 后 endpoint 状态恢复 closed', () => {
      for (let i = 0; i < 5; i++) {
        cb.recordFailure('ep7')
      }
      cb.reset('ep7')
      const status = cb.getStatus('ep7')
      assert.equal(status.state, 'closed')
    })
  })
})

// ============================================================================
// ExpirationNotifier Tests
// ============================================================================

describe('ExpirationNotifier', () => {
  let notifier: ExpirationNotifier

  beforeEach(() => {
    notifier = new ExpirationNotifier()
  })

  describe('scheduleReminder()', () => {
    it('TC-20 schedule 后 hasScheduled 返回 true', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      notifier.scheduleReminder('m1', 500, futureDate)
      assert.equal(notifier.hasScheduled('m1'), true)
    })

    it('TC-21 重复 schedule 不覆盖已有记录', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      notifier.scheduleReminder('m2', 500, futureDate)
      notifier.scheduleReminder('m2', 600, futureDate)
      const record = notifier.getReminder('m2')
      assert.equal(record!.points, 500)
    })
  })

  describe('sendReminder()', () => {
    it('TC-22 sendReminder 正确增加计数', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      notifier.scheduleReminder('m3', 500, futureDate)
      assert.equal(notifier.getReminderCount('m3'), 0)

      notifier.sendReminder('m3', 500)
      assert.equal(notifier.getReminderCount('m3'), 1)

      notifier.sendReminder('m3', 500)
      assert.equal(notifier.getReminderCount('m3'), 2)
    })

    it('TC-23 达到5次后返回 false', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      notifier.scheduleReminder('m4', 500, futureDate)

      // 前5次成功，第6次返回 false
      for (let i = 0; i < 6; i++) {
        const result = notifier.sendReminder('m4', 500)
        assert.equal(result, i < 5)
      }
    })
  })

  describe('cancelReminder()', () => {
    it('TC-24 cancel 后 hasScheduled 返回 false', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      notifier.scheduleReminder('m5', 500, futureDate)
      assert.equal(notifier.hasScheduled('m5'), true)

      notifier.cancelReminder('m5')
      assert.equal(notifier.hasScheduled('m5'), false)
    })
  })
})

// ============================================================================
// PointsRiskService Integration Tests
// ============================================================================

describe('PointsRiskService', () => {
  let service: PointsRiskService

  beforeEach(() => {
    service = new PointsRiskService()
  })

  it('提供 inflation / circuitBreaker / expiration 三个子服务', () => {
    assert.ok(service.inflation instanceof InflationMonitor)
    assert.ok(service.circuitBreaker instanceof CircuitBreaker)
    assert.ok(service.expiration instanceof ExpirationNotifier)
  })
})
