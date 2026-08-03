import { describe, it, expect, beforeEach } from 'vitest'
import { AllianceDataService, DataCallbackError } from './alliance-data.service'

describe('AllianceDataService — 数据API (BS-0222~BS-0224)', () => {
  let service: AllianceDataService

  beforeEach(() => {
    service = new AllianceDataService()
  })

  describe('receiveCallback', () => {
    it('should receive a data callback and process it', () => {
      const record = service.receiveCallback('partner-A', 'order', JSON.stringify({ orderId: '123', amount: 50000 }))

      expect(record.id).toBeDefined()
      expect(record.partnerId).toBe('partner-A')
      expect(record.dataType).toBe('order')
      expect(record.processStatus).toBe('processed')
    })

    it('should mark as failed for invalid JSON payload', () => {
      const record = service.receiveCallback('partner-A', 'revenue', 'not-valid-json')

      expect(record.processStatus).toBe('failed')
      expect(record.processResult).toBeDefined()
    })

    it('should throw error for empty params', () => {
      expect(() => service.receiveCallback('', 'order', '{}')).toThrow(DataCallbackError)
    })
  })

  describe('getCallbackRecords', () => {
    it('should return records filtered by partner', () => {
      service.receiveCallback('partner-A', 'order', JSON.stringify({ id: '1' }))
      service.receiveCallback('partner-A', 'member', JSON.stringify({ id: '2' }))
      service.receiveCallback('partner-B', 'order', JSON.stringify({ id: '3' }))

      const recordsA = service.getCallbackRecords('partner-A')
      expect(recordsA).toHaveLength(2)

      const recordsB = service.getCallbackRecords('partner-B')
      expect(recordsB).toHaveLength(1)
    })

    it('should filter by data type', () => {
      service.receiveCallback('partner-A', 'order', JSON.stringify({ id: '1' }))
      service.receiveCallback('partner-A', 'member', JSON.stringify({ id: '2' }))

      const orders = service.getCallbackRecords('partner-A', { dataType: 'order', from: '', to: '' })
      expect(orders).toHaveLength(1)
      expect(orders[0].dataType).toBe('order')
    })
  })

  describe('getCallbackStats', () => {
    it('should return correct stats', () => {
      service.receiveCallback('partner-A', 'order', JSON.stringify({ id: '1' }))
      service.receiveCallback('partner-A', 'member', JSON.stringify({ id: '2' }))
      service.receiveCallback('partner-A', 'revenue', 'bad-json')

      const stats = service.getCallbackStats('partner-A')
      expect(stats.totalCallbacks).toBe(3)
      expect(stats.processedCount).toBe(2)
      expect(stats.failedCount).toBe(1)
    })
  })

  describe('getDataDashboard', () => {
    it('should return dashboard with zeros for partner with no data', () => {
      const dashboard = service.getDataDashboard('partner-empty')
      expect(dashboard.partnerId).toBe('partner-empty')
      expect(dashboard.todayCallbacks).toBe(0)
      expect(dashboard.monthCallbacks).toBe(0)
      expect(dashboard.trend7d).toHaveLength(7)
    })

    it('should calculate success rate correctly', () => {
      service.receiveCallback('partner-A', 'order', JSON.stringify({ id: '1' }))
      service.receiveCallback('partner-A', 'order', JSON.stringify({ id: '2' }))

      const dashboard = service.getDataDashboard('partner-A')
      expect(dashboard.successRate).toBe(100)
    })
  })
})
