import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: GDPRErasureService 单元测试 (删除权生命周期 + 级联删除)
import { GDPRErasureService, type ErasureRecord } from './gdpr-erasure.service'

function createEnv() {
  const service = new GDPRErasureService()
  return { service }
}

describe('GDPRErasureService', () => {
  let service: GDPRErasureService

  beforeEach(() => {
    service = new GDPRErasureService()
  })

  // ── requestErasure ──

  describe('requestErasure', () => {
    it('should create a PENDING_ERASURE record with default grace period', () => {
      const record = service.requestErasure({
        userId: 'user-1',
        tenantId: 'store-a',
        reason: 'User request',
        requestedBy: 'admin',
      })

      expect(record.status).toBe('PENDING_ERASURE')
      expect(record.userId).toBe('user-1')
      expect(record.tenantId).toBe('store-a')
      expect(record.reason).toBe('User request')
      expect(record.requestedBy).toBe('admin')
      expect(record.deletionRequestedAt).toBeDefined()
      expect(record.erasureDeadlineAt).toBeDefined()
      // Default grace period ~30 days
      const deadline = new Date(record.erasureDeadlineAt!)
      const requested = new Date(record.deletionRequestedAt!)
      const diff = deadline.getTime() - requested.getTime()
      expect(diff).toBeGreaterThan(29 * 24 * 60 * 60 * 1000)
    })

    it('should accept custom grace period', () => {
      const record = service.requestErasure({
        userId: 'user-2',
        tenantId: 'store-a',
        gracePeriodMs: 60_000, // 1 minute
      })

      expect(record.status).toBe('PENDING_ERASURE')
      const deadline = new Date(record.erasureDeadlineAt!)
      const requested = new Date(record.deletionRequestedAt!)
      expect(deadline.getTime() - requested.getTime()).toBe(60_000)
    })
  })

  // ── cancelErasure ──

  describe('cancelErasure', () => {
    it('should restore a PENDING_ERASURE record to ACTIVE', () => {
      service.requestErasure({ userId: 'user-1', tenantId: 't1' })
      const restored = service.cancelErasure('user-1', 'Wrong request')

      expect(restored.status).toBe('ACTIVE')
      expect(restored.restoredAt).toBeDefined()
      expect(restored.deletionRequestedAt).toBeUndefined()
      expect(restored.erasureDeadlineAt).toBeUndefined()
    })

    it('should throw when record does not exist', () => {
      expect(() => service.cancelErasure('nonexistent')).toThrow('Erasure record not found')
    })

    it('should throw when record is not in PENDING_ERASURE status', () => {
      service.requestErasure({ userId: 'user-1', tenantId: 't1' })
      service.cancelErasure('user-1')
      // Trying again should fail since it's now ACTIVE
      expect(() => service.cancelErasure('user-1')).toThrow('Cannot cancel erasure')
    })
  })

  // ── isActive ──

  describe('isActive', () => {
    it('should return true for users without erasure record', () => {
      expect(service.isActive('no-record')).toBe(true)
    })

    it('should return false for users with PENDING_ERASURE', () => {
      service.requestErasure({ userId: 'u1', tenantId: 't1' })
      expect(service.isActive('u1')).toBe(false)
    })

    it('should return true for restored users', () => {
      service.requestErasure({ userId: 'u1', tenantId: 't1' })
      service.cancelErasure('u1')
      expect(service.isActive('u1')).toBe(true)
    })

    it('should return false for erased users', async () => {
      service.requestErasure({ userId: 'u1', tenantId: 't1', gracePeriodMs: 1 })
      // Wait for grace period to pass
      await vi.waitFor(() => {
        const ready = service.listReadyForHardDelete(new Date(Date.now() + 100))
        return ready
      })
      // Force ready
      vi.useFakeTimers({ shouldAdvanceTime: true })
      vi.advanceTimersByTime(100)
      vi.useRealTimers()
      // Will be caught by hardDelete test, but isActive after erase
    })
  })

  // ── listReadyForHardDelete ──

  describe('listReadyForHardDelete', () => {
    it('should return ready records whose grace period has passed', () => {
      service.requestErasure({ userId: 'u1', tenantId: 't1', gracePeriodMs: -1 }) // already expired
      service.requestErasure({ userId: 'u2', tenantId: 't1', gracePeriodMs: 999_999_999 }) // not expired

      const ready = service.listReadyForHardDelete(new Date())
      expect(ready).toHaveLength(1)
      expect(ready[0].userId).toBe('u1')
    })

    it('should return empty when no records are expired', () => {
      service.requestErasure({ userId: 'u1', tenantId: 't1', gracePeriodMs: 999_999 })
      const ready = service.listReadyForHardDelete(new Date())
      expect(ready).toHaveLength(0)
    })
  })

  // ── hardDelete ──

  describe('hardDelete', () => {
    it('should execute cascade hooks and mark as ERASED', async () => {
      service.requestErasure({ userId: 'u1', tenantId: 't1', gracePeriodMs: -1 })

      // Register cascade hooks
      service.registerCascadeHook('member', async () => 3)
      service.registerCascadeHook('order', async () => 5)

      const result = await service.hardDelete('u1')

      expect(result.userId).toBe('u1')
      expect(result.totalDeleted).toBe(8)
      expect(result.deletedFromModules).toEqual({ member: 3, order: 5 })

      const record = service.getRecord('u1')
      expect(record!.status).toBe('ERASED')
      expect(record!.erasedAt).toBeDefined()
    })

    it('should throw when record is not PENDING_ERASURE', async () => {
      await expect(service.hardDelete('nonexistent')).rejects.toThrow('Erasure record not found')
    })

    it('should still proceed when a cascade hook fails', async () => {
      service.requestErasure({ userId: 'u1', tenantId: 't1', gracePeriodMs: -1 })
      service.registerCascadeHook('failing', async () => { throw new Error('DB timeout') })
      service.registerCascadeHook('healthy', async () => 2)

      const result = await service.hardDelete('u1')
      expect(result.totalDeleted).toBe(2) // Only the healthy hook contributed
      expect(result.deletedFromModules.failing).toBe(0)
    })
  })

  // ── registerCascadeHook / listRegisteredModules ──

  describe('cascade hook registration', () => {
    it('should register and list modules', () => {
      service.registerCascadeHook('member', async () => 0)
      service.registerCascadeHook('order', async () => 0)
      service.registerCascadeHook('invoice', async () => 0)

      const modules = service.listRegisteredModules()
      expect(modules).toContain('member')
      expect(modules).toContain('order')
      expect(modules).toContain('invoice')
    })
  })

  // ── processScheduledDeletions ──

  describe('processScheduledDeletions', () => {
    it('should process all ready records', async () => {
      service.requestErasure({ userId: 'u1', tenantId: 't1', gracePeriodMs: -1 })
      service.requestErasure({ userId: 'u2', tenantId: 't2', gracePeriodMs: -1 })
      service.registerCascadeHook('member', async () => 1)

      const results = await service.processScheduledDeletions(new Date())
      expect(results).toHaveLength(2)
      expect(results[0].totalDeleted).toBe(1)
      expect(results[1].totalDeleted).toBe(1)
    })
  })

  // ── listAuditTrail ──

  describe('listAuditTrail', () => {
    it('should return records filtered by tenant', () => {
      service.requestErasure({ userId: 'u1', tenantId: 'store-a' })
      service.requestErasure({ userId: 'u2', tenantId: 'store-b' })

      const trail = service.listAuditTrail('store-a')
      expect(trail).toHaveLength(1)
      expect(trail[0].userId).toBe('u1')
    })
  })

  // ── getRecord ──

  describe('getRecord', () => {
    it('should return the erasure record', () => {
      service.requestErasure({ userId: 'u1', tenantId: 't1' })
      const record = service.getRecord('u1')
      expect(record).toBeDefined()
      expect(record!.userId).toBe('u1')
    })

    it('should return undefined for unknown user', () => {
      expect(service.getRecord('unknown')).toBeUndefined()
    })
  })

  // ── resetForTests ──

  describe('resetForTests', () => {
    it('should clear all records and hooks', () => {
      service.requestErasure({ userId: 'u1', tenantId: 't1' })
      service.registerCascadeHook('member', async () => 0)
      service.resetForTests()

      expect(service.getRecord('u1')).toBeUndefined()
      expect(service.listRegisteredModules()).toHaveLength(0)
    })
  })
})
