import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { OfflineTicketService, TimeSyncService } from './edge-computing.service'

describe('EdgeComputingService', () => {
  let offlineTicketService: OfflineTicketService
  let timeSyncService: TimeSyncService

  beforeEach(() => {
    offlineTicketService = new OfflineTicketService()
    timeSyncService = new TimeSyncService()
  })

  describe('OfflineTicketService', () => {
    describe('issueTicket', () => {
      it('should issue a ticket', () => {
        const ticket = offlineTicketService.issueTicket('store1', 'customer1')
        expect(ticket.storeId).toBe('store1')
        expect(ticket.ticketNumber).toBeGreaterThan(0)
        expect(ticket.status).toBe('WAITING')
      })

      it('should auto-increment ticket numbers', () => {
        const ticket1 = offlineTicketService.issueTicket('store1')
        const ticket2 = offlineTicketService.issueTicket('store1')
        expect(ticket2.ticketNumber).toBe(ticket1.ticketNumber + 1)
      })

      it('should support priority', () => {
        const ticket = offlineTicketService.issueTicket('store1', 'customer1', 10)
        expect(ticket.priority).toBe(10)
      })
    })

    describe('getQueuePosition', () => {
      it('should return queue position', () => {
        const ticket = offlineTicketService.issueTicket('store1')
        const position = offlineTicketService.getQueuePosition(ticket.ticketId)
        expect(position?.position).toBe(1)
      })

      it('should return null for unknown ticket', () => {
        const position = offlineTicketService.getQueuePosition('unknown')
        expect(position).toBeNull()
      })
    })

    describe('callNext', () => {
      it('should call next ticket', () => {
        offlineTicketService.issueTicket('store1')
        offlineTicketService.issueTicket('store1')
        const result = offlineTicketService.callNext('store1')
        expect(result.calledTicket).toBeDefined()
        expect(result.queueAfterCall).toBe(1)
      })

      it('should return null when queue empty', () => {
        const result = offlineTicketService.callNext('empty-store')
        expect(result.calledTicket).toBeNull()
      })
    })

    describe('cancelTicket', () => {
      it('should cancel ticket', () => {
        const ticket = offlineTicketService.issueTicket('store1')
        const result = offlineTicketService.cancelTicket(ticket.ticketId)
        expect(result).toBe(true)
      })

      it('should return false for unknown ticket', () => {
        const result = offlineTicketService.cancelTicket('unknown')
        expect(result).toBe(false)
      })
    })

    describe('completeTicket', () => {
      it('should complete called ticket', () => {
        offlineTicketService.issueTicket('store1')
        const { calledTicket } = offlineTicketService.callNext('store1')
        const result = offlineTicketService.completeTicket(calledTicket!.ticketId)
        expect(result).toBe(true)
      })
    })

    describe('syncQueueToServer', () => {
      it('should sync queue', () => {
        offlineTicketService.issueTicket('store1')
        const result = offlineTicketService.syncQueueToServer('store1')
        expect(result.success).toBe(true)
        expect(result.ticketCount).toBe(1)
      })
    })

    describe('getWaitingTickets', () => {
      it('should return waiting tickets', () => {
        offlineTicketService.issueTicket('store1')
        offlineTicketService.issueTicket('store1')
        const tickets = offlineTicketService.getWaitingTickets('store1')
        expect(tickets.length).toBe(2)
      })
    })
  })

  describe('TimeSyncService', () => {
    describe('getServerTime', () => {
      it('should return server time', () => {
        const time = timeSyncService.getServerTime()
        expect(time).toBeGreaterThan(0)
      })
    })

    describe('calculateClockDrift', () => {
      it('should calculate drift', () => {
        const drift = timeSyncService.calculateClockDrift(1000000, 1000100)
        expect(drift).toBe(100)
      })
    })

    describe('syncClock', () => {
      it('should sync clock', () => {
        const result = timeSyncService.syncClock(Date.now())
        expect(result.synced).toBe(true)
        expect(result.serverTime).toBeGreaterThan(0)
      })
    })

    describe('isWithinTolerance', () => {
      it('should return within tolerance', () => {
        const result = timeSyncService.isWithinTolerance(Date.now())
        expect(result.withinTolerance).toBe(true)
      })

      it('should detect out of tolerance', () => {
        const result = timeSyncService.isWithinTolerance(Date.now() - 10000, 1000)
        expect(result.withinTolerance).toBe(false)
      })
    })

    describe('isTimestampValid', () => {
      it('should validate recent timestamp', () => {
        expect(timeSyncService.isTimestampValid(Date.now())).toBe(true)
      })

      it('should reject old timestamp', () => {
        expect(timeSyncService.isTimestampValid(Date.now() - 120000, 60000)).toBe(false)
      })
    })

    describe('getClockOffset', () => {
      it('should return clock offset', () => {
        timeSyncService.syncClock(Date.now())
        expect(timeSyncService.getClockOffset()).toBeDefined()
      })
    })

    describe('calibrateWithSamples', () => {
      it('should calibrate with samples', () => {
        const samples = [
          { clientTime: 1000, serverTime: 1050 },
          { clientTime: 2000, serverTime: 2050 },
        ]
        const offset = timeSyncService.calibrateWithSamples(samples)
        expect(offset).toBe(50)
      })

      it('should return current offset for empty samples', () => {
        const offset = timeSyncService.calibrateWithSamples([])
        expect(typeof offset).toBe('number')
      })
    })

    describe('getSyncHistory', () => {
      it('should return sync history', () => {
        timeSyncService.syncClock(Date.now())
        const history = timeSyncService.getSyncHistory()
        expect(history.length).toBeGreaterThan(0)
      })
    })

    describe('reset', () => {
      it('should reset sync state', () => {
        timeSyncService.syncClock(Date.now())
        timeSyncService.reset()
        expect(timeSyncService.getClockOffset()).toBe(0)
      })
    })
  })
})
