import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { AutoRollbackController } from './auto-rollback.controller'
import { AutoRollbackService } from './auto-rollback.service'

describe('AutoRollbackController', () => {
  let controller: AutoRollbackController
  let service: AutoRollbackService

  beforeEach(() => {
    service = new AutoRollbackService()
    controller = new AutoRollbackController(service)
  })

  describe('POST /auto-rollback/trigger', () => {
    it('should trigger WARNING rollback and return record', () => {
      const result = controller.trigger({
        reason: 'P95 spike',
        severity: 'WARNING',
        metricKey: '/api/coupons',
        anomalyValue: 110,
        baselineValue: 100,
      })
      expect(result.data.id).toBeDefined()
      // WARNING auto-executes, status may already be past PENDING
      expect(['PENDING', 'SNAPSHOTTING', 'ROLLING_BACK', 'VERIFYING', 'COMPLETED']).toContain(result.data.status)
      expect(result.data.severity).toBe('WARNING')
      expect(result.data.requiresConfirmation).toBe(false)
    })

    it('should trigger CRITICAL rollback with AWAITING_CONFIRM status', () => {
      const result = controller.trigger({
        reason: 'P99 critical spike',
        severity: 'CRITICAL',
        metricKey: '/api/orders',
        anomalyValue: 5000,
        baselineValue: 200,
      })
      expect(result.data.status).toBe('AWAITING_CONFIRM')
      expect(result.data.requiresConfirmation).toBe(true)
    })

    it('should accept optional snapshotKind', () => {
      const result = controller.trigger({
        reason: 'redis sync failure',
        severity: 'WARNING',
        metricKey: 'redis.cache.hit',
        anomalyValue: 0.1,
        baselineValue: 0.85,
        snapshotKind: 'REDIS',
      })
      expect(result.data.id).toBeDefined()
    })
  })

  describe('POST /auto-rollback/confirm', () => {
    it('should confirm a CRITICAL rollback', () => {
      const triggerResult = controller.trigger({
        reason: 'test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      })
      const confirmResult = controller.confirm({ id: triggerResult.data.id })
      expect(confirmResult.data).not.toBeNull()
      expect(confirmResult.data!.status).not.toBe('AWAITING_CONFIRM')
    })

    it('should return null for non-existent id', () => {
      const result = controller.confirm({ id: 'non-existent' })
      expect(result.data).toBeNull()
    })
  })

  describe('POST /auto-rollback/cancel', () => {
    it('should cancel an AWAITING_CONFIRM rollback', () => {
      const triggerResult = controller.trigger({
        reason: 'test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      })
      const cancelResult = controller.cancel({
        id: triggerResult.data.id,
        reason: 'False alarm',
      })
      expect(cancelResult.data).not.toBeNull()
      expect(cancelResult.data!.status).toBe('CANCELLED')
    })

    it('should return null for non-existent id', () => {
      const result = controller.cancel({ id: 'non-existent' })
      expect(result.data).toBeNull()
    })
  })

  describe('GET /auto-rollback/records', () => {
    it('should list all records', () => {
      controller.trigger({
        reason: 'a',
        severity: 'WARNING',
        metricKey: 'm1',
        anomalyValue: 110,
        baselineValue: 100,
      })
      controller.trigger({
        reason: 'b',
        severity: 'CRITICAL',
        metricKey: 'm2',
        anomalyValue: 999,
        baselineValue: 100,
      })
      const result = controller.listRecords({})
      expect(result.data.length).toBe(2)
    })

    it('should filter by status', () => {
      controller.trigger({
        reason: 'a',
        severity: 'WARNING',
        metricKey: 'm1',
        anomalyValue: 110,
        baselineValue: 100,
      })
      controller.trigger({
        reason: 'b',
        severity: 'CRITICAL',
        metricKey: 'm2',
        anomalyValue: 999,
        baselineValue: 100,
      })
      const result = controller.listRecords({ status: 'AWAITING_CONFIRM' })
      expect(result.data.length).toBe(1)
      expect(result.data[0].status).toBe('AWAITING_CONFIRM')
    })

    it('should filter by metricKey', () => {
      controller.trigger({
        reason: 'a',
        severity: 'WARNING',
        metricKey: 'm1',
        anomalyValue: 110,
        baselineValue: 100,
      })
      const result = controller.listRecords({ metricKey: 'm1' })
      expect(result.data.length).toBe(1)
    })
  })

  describe('GET /auto-rollback/records/:id', () => {
    it('should return record by id', () => {
      const triggerResult = controller.trigger({
        reason: 'test',
        severity: 'WARNING',
        metricKey: 'm',
        anomalyValue: 110,
        baselineValue: 100,
      })
      const result = controller.getRecord(triggerResult.data.id)
      expect(result.data).not.toBeNull()
      expect(result.data!.id).toBe(triggerResult.data.id)
    })

    it('should return null for non-existent id', () => {
      const result = controller.getRecord('non-existent')
      expect(result.data).toBeNull()
    })
  })

  describe('GET /auto-rollback/snapshots/:id', () => {
    it('should return null for non-existent snapshot', () => {
      const result = controller.getSnapshot('non-existent')
      expect(result.data).toBeNull()
    })
  })

  describe('POST /auto-rollback/configure', () => {
    it('should apply configuration', () => {
      const result = controller.configure({
        criticalRequiresConfirm: false,
        confirmationDelayMs: 60000,
      })
      expect(result.status).toBe('ok')
      expect(result.applied).toContain('criticalRequiresConfirm')
      expect(result.applied).toContain('confirmationDelayMs')
    })

    it('should return empty applied for empty config', () => {
      const result = controller.configure({})
      expect(result.status).toBe('ok')
      expect(result.applied).toEqual([])
    })
  })

  describe('GET /auto-rollback/status', () => {
    it('should return engine status', () => {
      const result = controller.getStatus()
      expect(result.data.engineName).toBe('AutoRollback')
      expect(result.data.status).toBe('ACTIVE')
      expect(result.data.activeRecords).toBe(0)
    })

    it('should reflect active records count', () => {
      controller.trigger({
        reason: 'test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      })
      const result = controller.getStatus()
      expect(result.data.activeRecords).toBeGreaterThan(0)
    })
  })
})
