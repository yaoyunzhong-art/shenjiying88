import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import assert from 'node:assert/strict'
import {
  OfflineTicketService,
  TimeSyncService,
  TicketStatus,
  type Ticket
} from './edge-computing.service'

function createTicketService(): OfflineTicketService {
  return new OfflineTicketService()
}

function createTimeSyncService(): TimeSyncService {
  return new TimeSyncService()
}

describe('OfflineTicketService', () => {
  describe('离线取号', () => {
    it('issueTicket 发放第一个号码，号码为1', () => {
      const service = createTicketService()
      const ticket = service.issueTicket('store-001')

      assert.equal(ticket.ticketNumber, 1)
      assert.equal(ticket.storeId, 'store-001')
      assert.equal(ticket.status, TicketStatus.Waiting)
    })

    it('issueTicket 连续发放，号码连续递增', () => {
      const service = createTicketService()

      const ticket1 = service.issueTicket('store-001')
      const ticket2 = service.issueTicket('store-001')
      const ticket3 = service.issueTicket('store-001')

      assert.equal(ticket1.ticketNumber, 1)
      assert.equal(ticket2.ticketNumber, 2)
      assert.equal(ticket3.ticketNumber, 3)
    })

    it('issueTicket 离线模式正常发放号码', () => {
      const service = createTicketService()

      const tickets: Ticket[] = []
      for (let i = 0; i < 10; i++) {
        tickets.push(service.issueTicket('store-offline'))
      }

      assert.equal(tickets.length, 10)
      assert.equal(tickets[0].ticketNumber, 1)
      assert.equal(tickets[9].ticketNumber, 10)
      tickets.forEach((t) => {
        assert.equal(t.status, TicketStatus.Waiting)
      })
    })

    it('issueTicket 支持客户ID和优先级', () => {
      const service = createTicketService()
      const ticket = service.issueTicket('store-001', 'customer-123', 10)

      assert.equal(ticket.customerId, 'customer-123')
      assert.equal(ticket.priority, 10)
    })

    it('issueTicket 不同门店号码独立计数', () => {
      const service = createTicketService()

      service.issueTicket('store-A')
      service.issueTicket('store-A')
      const ticketB = service.issueTicket('store-B')

      assert.equal(ticketB.ticketNumber, 1)
    })
  })

  describe('排队位置', () => {
    it('getQueuePosition 返回正确的排队位置', () => {
      const service = createTicketService()

      service.issueTicket('store-001')
      service.issueTicket('store-001')
      const ticket3 = service.issueTicket('store-001')

      const position = service.getQueuePosition(ticket3.ticketId)

      assert.notEqual(position, null)
      assert.equal(position!.position, 3)
      assert.equal(position!.totalWaiting, 3)
    })

    it('getQueuePosition 已叫号的号码返回-1位置', () => {
      const service = createTicketService()

      const ticket1 = service.issueTicket('store-001')
      service.issueTicket('store-001')
      service.callNext('store-001')

      const position = service.getQueuePosition(ticket1.ticketId)

      assert.notEqual(position, null)
      assert.equal(position!.position, -1)
    })

    it('getQueuePosition 预估等待时间计算正确', () => {
      const service = createTicketService()

      service.issueTicket('store-001')
      service.issueTicket('store-001')
      service.issueTicket('store-001')
      const ticket4 = service.issueTicket('store-001')

      const position = service.getQueuePosition(ticket4.ticketId)

      assert.notEqual(position, null)
      assert.equal(position!.position, 4)
      assert.equal(position!.estimatedWaitMinutes, 15)
    })

    it('getQueuePosition 不存在的号码返回null', () => {
      const service = createTicketService()
      const position = service.getQueuePosition('non-existent')

      assert.equal(position, null)
    })

    it('getQueuePosition 取消后重新计算位置', () => {
      const service = createTicketService()

      const ticket1 = service.issueTicket('store-001')
      service.issueTicket('store-001')
      service.cancelTicket(ticket1.ticketId)
      const position = service.getQueuePosition(ticket1.ticketId)

      assert.notEqual(position, null)
      assert.equal(position!.position, -1)
    })
  })

  describe('叫号', () => {
    it('callNext 正确呼叫下一位', () => {
      const service = createTicketService()

      service.issueTicket('store-001')
      service.issueTicket('store-001')
      const result = service.callNext('store-001')

      assert.notEqual(result.calledTicket, null)
      assert.equal(result.calledTicket!.ticketNumber, 1)
      assert.equal(result.queueAfterCall, 1)
    })

    it('callNext 队列为空时返回null', () => {
      const service = createTicketService()
      const result = service.callNext('store-empty')

      assert.equal(result.calledTicket, null)
      assert.equal(result.queueAfterCall, 0)
    })

    it('callNext 队列前进正确', () => {
      const service = createTicketService()

      service.issueTicket('store-001')
      service.issueTicket('store-001')
      service.issueTicket('store-001')

      service.callNext('store-001')
      const result = service.callNext('store-001')

      assert.notEqual(result.calledTicket, null)
      assert.equal(result.calledTicket!.ticketNumber, 2)
    })

    it('callNext 高优先级号码优先被呼叫', () => {
      const service = createTicketService()

      service.issueTicket('store-001', undefined, 0)
      service.issueTicket('store-001', undefined, 10)
      service.issueTicket('store-001', undefined, 5)

      const result = service.callNext('store-001')

      assert.notEqual(result.calledTicket, null)
      assert.equal(result.calledTicket!.priority, 10)
      assert.equal(result.calledTicket!.ticketNumber, 2)
    })

    it('callNext 更新号码状态为Called', () => {
      const service = createTicketService()

      const ticket = service.issueTicket('store-001')
      service.callNext('store-001')

      const updated = service.getTicket(ticket.ticketId)
      assert.notEqual(updated, null)
      assert.equal(updated!.status, TicketStatus.Called)
    })
  })

  describe('取消号码', () => {
    it('cancelTicket 成功取消等待中的号码', () => {
      const service = createTicketService()

      const ticket = service.issueTicket('store-001')
      const result = service.cancelTicket(ticket.ticketId)

      assert.equal(result, true)
      assert.equal(service.getTicket(ticket.ticketId)!.status, TicketStatus.Cancelled)
    })

    it('cancelTicket 已完成的号码不能取消', () => {
      const service = createTicketService()

      const ticket = service.issueTicket('store-001')
      service.callNext('store-001')
      service.completeTicket(ticket.ticketId)
      const result = service.cancelTicket(ticket.ticketId)

      assert.equal(result, false)
    })

    it('cancelTicket 不存在的号码返回false', () => {
      const service = createTicketService()
      const result = service.cancelTicket('non-existent')

      assert.equal(result, false)
    })
  })

  describe('同步队列', () => {
    it('syncQueueToServer 返回正确的同步信息', () => {
      const service = createTicketService()

      service.issueTicket('store-001')
      service.issueTicket('store-001')
      service.issueTicket('store-001')

      const result = service.syncQueueToServer('store-001')

      assert.equal(result.storeId, 'store-001')
      assert.equal(result.ticketCount, 3)
      assert.equal(result.success, true)
      assert.ok(result.syncedAt)
    })

    it('syncQueueToServer 只同步等待中的号码', () => {
      const service = createTicketService()

      service.issueTicket('store-001')
      const ticket2 = service.issueTicket('store-001')
      service.callNext('store-001')
      service.issueTicket('store-001')

      const result = service.syncQueueToServer('store-001')

      assert.equal(result.ticketCount, 2)
    })
  })
})

describe('TimeSyncService', () => {
  describe('时间同步', () => {
    it('getServerTime 返回当前时间戳', () => {
      const service = createTimeSyncService()
      const before = Date.now()
      const serverTime = service.getServerTime()
      const after = Date.now()

      assert.ok(serverTime >= before)
      assert.ok(serverTime <= after)
    })

    it('calculateClockDrift 计算正确的偏移量', () => {
      const service = createTimeSyncService()
      const clientTime = 1000000000000
      const serverTime = 1000000000500

      const drift = service.calculateClockDrift(clientTime, serverTime)

      assert.equal(drift, 500)
    })

    it('syncClock 同步成功并返回正确结构', () => {
      const service = createTimeSyncService()
      const clientTime = Date.now()

      const result = service.syncClock(clientTime)

      assert.ok(result.serverTime > 0)
      assert.ok(typeof result.offset === 'number')
      assert.ok(typeof result.roundTripDelay === 'number')
      assert.equal(result.synced, true)
    })

    it('syncClock 记录同步历史', () => {
      const service = createTimeSyncService()

      service.syncClock(Date.now())
      service.syncClock(Date.now())
      const history = service.getSyncHistory()

      assert.equal(history.length, 2)
    })

    it('isWithinTolerance 500ms容差内返回true', () => {
      const service = createTimeSyncService()
      const serverTime = service.getServerTime()

      const result = service.isWithinTolerance(serverTime, 500)

      assert.equal(result.withinTolerance, true)
      assert.ok(result.deviationMs <= 500)
    })

    it('isWithinTolerance 超过容差返回false', () => {
      const service = createTimeSyncService()
      const oldTime = Date.now() - 1000

      const result = service.isWithinTolerance(oldTime, 500)

      assert.equal(result.withinTolerance, false)
      assert.ok(result.deviationMs > 500)
    })

    it('isTimestampValid 有效时间戳通过验证', () => {
      const service = createTimeSyncService()
      const now = Date.now()

      const result = service.isTimestampValid(now)

      assert.equal(result, true)
    })

    it('isTimestampValid 过期时间戳验证失败', () => {
      const service = createTimeSyncService()
      const oldTime = Date.now() - 120000

      const result = service.isTimestampValid(oldTime, 60000)

      assert.equal(result, false)
    })

    it('calibrateWithSamples 使用中位数计算偏移', () => {
      const service = createTimeSyncService()
      const samples = [
        { clientTime: 1000, serverTime: 1100 },
        { clientTime: 1000, serverTime: 1200 },
        { clientTime: 1000, serverTime: 1300 }
      ]

      const offset = service.calibrateWithSamples(samples)

      assert.equal(offset, 200)
    })

    it('reset 重置同步状态', () => {
      const service = createTimeSyncService()

      service.syncClock(Date.now())
      service.reset()

      assert.equal(service.getClockOffset(), 0)
      assert.equal(service.getLastSyncTime(), 0)
      assert.equal(service.getSyncHistory().length, 0)
    })

    it('adjustTimestamp 根据偏移调整时间戳', () => {
      const service = createTimeSyncService()
      const clientTime = 1000000000000
      service.syncClock(clientTime)

      const original = 1000000000000
      const adjusted = service.adjustTimestamp(original)

      assert.ok(adjusted !== original)
    })
  })
})
