import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { ChainAuditService } from './chain-audit.service'

describe('ChainAuditService', () => {
  let service: ChainAuditService

  beforeEach(() => {
    service = new ChainAuditService()
  })

  describe('createAuditTrail', () => {
    it('should create audit trail', () => {
      const trail = service.createAuditTrail('tx-001', 'action', 'user1', {
        timestamp: Date.now(),
        blockNumber: 12345,
        txHash: '0x123',
      })
      expect(trail.transactionId).toBe('tx-001')
      expect(trail.action).toBe('action')
    })
  })

  describe('verifyAuditTrail', () => {
    it('should return verification result', () => {
      const trail = service.createAuditTrail('tx-001', 'action', 'user1', {
        timestamp: Date.now(),
        blockNumber: 12345,
        txHash: '0x123',
      })
      const result = service.verifyAuditTrail(trail.id)
      expect(result.verified).toBe(true)
    })

    it('should return false for non-existent trail', () => {
      const result = service.verifyAuditTrail('nonexistent')
      expect(result.verified).toBe(false)
    })
  })

  describe('getAuditTrail', () => {
    it('should return audit trail by id', () => {
      const created = service.createAuditTrail('tx-001', 'action', 'user1', {
        timestamp: Date.now(),
        blockNumber: 12345,
        txHash: '0x123',
      })
      const trail = service.getAuditTrail(created.id)
      expect(trail?.transactionId).toBe('tx-001')
    })
  })

  describe('listAuditTrails', () => {
    it('should list all audit trails', () => {
      service.createAuditTrail('tx-001', 'action1', 'user1', {
        timestamp: Date.now(),
        blockNumber: 12345,
        txHash: '0x123',
      })
      service.createAuditTrail('tx-002', 'action2', 'user2', {
        timestamp: Date.now(),
        blockNumber: 12346,
        txHash: '0x124',
      })
      const trails = service.listAuditTrails()
      expect(trails.length).toBe(2)
    })
  })

  describe('queryAuditTrails', () => {
    it('should query by user', () => {
      service.createAuditTrail('tx-001', 'action', 'user1', {
        timestamp: Date.now(),
        blockNumber: 12345,
        txHash: '0x123',
      })
      const trails = service.queryAuditTrails({ userId: 'user1' })
      expect(trails.length).toBe(1)
    })

    it('should query by time range', () => {
      service.createAuditTrail('tx-001', 'action', 'user1', {
        timestamp: Date.now(),
        blockNumber: 12345,
        txHash: '0x123',
      })
      const trails = service.queryAuditTrails({
        startTime: Date.now() - 1000,
        endTime: Date.now() + 1000,
      })
      expect(trails.length).toBe(1)
    })
  })

  describe('exportAuditReport', () => {
    it('should export audit report', () => {
      const report = service.exportAuditReport('user1', Date.now() - 86400000, Date.now())
      expect(report).toContain('审计报告')
      expect(report).toContain('user1')
    })
  })

  describe('alertOnAnomaly', () => {
    it('should return null for normal activity', () => {
      const alert = service.alertOnAnomaly('user1')
      expect(alert).toBeNull()
    })

    it('should return alert for suspicious activity', () => {
      service.createAuditTrail('tx-001', 'action', 'user1', {
        timestamp: Date.now(),
        blockNumber: 12345,
        txHash: '0x123',
      })
      service.createAuditTrail('tx-002', 'action', 'user1', {
        timestamp: Date.now() + 1,
        blockNumber: 12346,
        txHash: '0x124',
      })
      const alert = service.alertOnAnomaly('user1')
      expect(alert).toBeDefined()
    })
  })
})
