import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: AuditLogService 单元测试 (Append-Only + Hash Chain 完整性)
import { AuditLogService } from './audit-log.service'

function createEnv() {
  const service = new AuditLogService()
  return { service }
}

describe('AuditLogService', () => {
  let service: AuditLogService

  beforeEach(() => {
    service = new AuditLogService()
  })

  // ── append ──

  describe('append', () => {
    it('should append an entry with correct hash chain (genesis)', () => {
      const entry = service.append({
        tenantId: 'store-a',
        actorId: 'admin-1',
        action: 'CREATE',
        resource: 'order',
        resourceId: 'ord-001',
        after: { total: 100 },
      })

      expect(entry.seq).toBe(1)
      expect(entry.prevHash).toBe('0'.repeat(64))
      expect(entry.hash).toHaveLength(64)
      expect(entry.hash).not.toBe(entry.prevHash)
      expect(entry.action).toBe('CREATE')
      expect(entry.resource).toBe('order')
    })

    it('should chain hash correctly across multiple appends', () => {
      const e1 = service.append({ tenantId: 'x', actorId: 'a', action: 'CREATE', resource: 'order', resourceId: '1' })
      const e2 = service.append({ tenantId: 'x', actorId: 'a', action: 'UPDATE', resource: 'order', resourceId: '1', after: { status: 'paid' } })

      expect(e2.prevHash).toBe(e1.hash)
      expect(e2.seq).toBe(2)
    })

    it('should include optional fields like ip, userAgent, meta', () => {
      const entry = service.append({
        tenantId: 'store-a',
        actorId: 'admin-1',
        action: 'CUSTOM',
        customAction: 'EXPORT',
        resource: 'report',
        resourceId: 'rpt-2024',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        meta: { reason: 'annual-audit' },
      })

      expect(entry.customAction).toBe('EXPORT')
      expect(entry.ip).toBe('192.168.1.1')
      expect(entry.userAgent).toBe('Mozilla/5.0')
      expect(entry.meta).toEqual({ reason: 'annual-audit' })
    })

    it('should accept empty tenantId without throwing', () => {
      const entry = service.append({
        tenantId: '',
        actorId: 'admin',
        action: 'READ',
        resource: 'log',
        resourceId: '1',
      })
      expect(entry.seq).toBe(1)
      expect(entry.tenantId).toBe('')
    })
  })

  // ── appendBatch ──

  describe('appendBatch', () => {
    it('should append multiple entries with correct chaining', () => {
      const entries = service.appendBatch([
        { tenantId: 't', actorId: 'a', action: 'CREATE', resource: 'order', resourceId: '1' },
        { tenantId: 't', actorId: 'a', action: 'UPDATE', resource: 'order', resourceId: '1' },
        { tenantId: 't', actorId: 'b', action: 'DELETE', resource: 'order', resourceId: '1' },
      ])

      expect(entries).toHaveLength(3)
      expect(entries[1].prevHash).toBe(entries[0].hash)
      expect(entries[2].prevHash).toBe(entries[1].hash)
      expect(service.size()).toBe(3)
    })
  })

  // ── size / tail / getBySeq ──

  describe('query helpers', () => {
    beforeEach(() => {
      service.append({ tenantId: 't1', actorId: 'a', action: 'CREATE', resource: 'order', resourceId: '1' })
      service.append({ tenantId: 't1', actorId: 'a', action: 'UPDATE', resource: 'order', resourceId: '1' })
      service.append({ tenantId: 't2', actorId: 'b', action: 'READ', resource: 'report', resourceId: '2' })
    })

    it('size() should return total count', () => {
      expect(service.size()).toBe(3)
    })

    it('tail(n) should return last n entries', () => {
      const last = service.tail(2)
      expect(last).toHaveLength(2)
      expect(last[0].seq).toBe(2)
      expect(last[1].seq).toBe(3)
    })

    it('getBySeq should return entry by sequence number', () => {
      const e = service.getBySeq(2)
      expect(e).toBeDefined()
      expect(e!.action).toBe('UPDATE')
    })

    it('getBySeq should return undefined for nonexistent seq', () => {
      expect(service.getBySeq(999)).toBeUndefined()
    })
  })

  // ── filterByTenant / filterByActor / filterByTimeRange ──

  describe('filters', () => {
    beforeEach(() => {
      service.append({ tenantId: 'store-a', actorId: 'alice', action: 'CREATE', resource: 'order', resourceId: '1', ip: '10.0.0.1' })
      service.append({ tenantId: 'store-a', actorId: 'bob', action: 'UPDATE', resource: 'order', resourceId: '1', ip: '10.0.0.2' })
      service.append({ tenantId: 'store-b', actorId: 'alice', action: 'READ', resource: 'report', resourceId: '2' })
    })

    it('filterByTenant should return only matching entries', () => {
      const rows = service.filterByTenant('store-a')
      expect(rows).toHaveLength(2)
    })

    it('filterByActor should return only matching entries', () => {
      const rows = service.filterByActor('alice')
      expect(rows).toHaveLength(2)
    })

    it('filterByTimeRange should respect boundaries', () => {
      const all = service.__getAll()
      const ts1 = all[0].ts
      const ts3 = all[2].ts
      const rows = service.filterByTimeRange(ts1, ts3)
      expect(rows).toHaveLength(3)
    })
  })

  // ── query ──

  describe('query', () => {
    beforeEach(() => {
      service.append({ tenantId: 't1', actorId: 'a', action: 'CREATE', resource: 'order', resourceId: '1' })
      service.append({ tenantId: 't1', actorId: 'b', action: 'UPDATE', resource: 'order', resourceId: '1' })
      service.append({ tenantId: 't2', actorId: 'a', action: 'DELETE', resource: 'invoice', resourceId: 'inv-1' })
    })

    it('should combine tenant + action filter', () => {
      const rows = service.query({ tenantId: 't1', action: 'CREATE' })
      expect(rows).toHaveLength(1)
      expect(rows[0].actorId).toBe('a')
    })

    it('should apply limit', () => {
      const rows = service.query({ limit: 2 })
      expect(rows).toHaveLength(2)
    })

    it('should return all entries when no filter', () => {
      expect(service.query({})).toHaveLength(3)
    })
  })

  // ── verify ──

  describe('verify / integrity', () => {
    it('should verify a valid chain', () => {
      service.append({ tenantId: 't', actorId: 'a', action: 'CREATE', resource: 'order', resourceId: '1' })
      service.append({ tenantId: 't', actorId: 'a', action: 'UPDATE', resource: 'order', resourceId: '1' })

      const result = service.verify()
      expect(result.valid).toBe(true)
      expect(result.totalChecked).toBe(2)
    })

    it('should detect tampered entry', () => {
      service.append({ tenantId: 't', actorId: 'a', action: 'CREATE', resource: 'order', resourceId: '1' })
      service.append({ tenantId: 't', actorId: 'a', action: 'UPDATE', resource: 'order', resourceId: '1' })

      service.__tamper(1)

      const result = service.verify()
      expect(result.valid).toBe(false)
      expect(result.brokenAtSeq).toBe(1)
    })

    it('should report valid for empty chain', () => {
      const result = service.verify()
      expect(result.valid).toBe(true)
      expect(result.totalChecked).toBe(0)
    })
  })

  // ── resetForTests ──

  describe('resetForTests', () => {
    it('should clear all entries', () => {
      service.append({ tenantId: 't', actorId: 'a', action: 'CREATE', resource: 'order', resourceId: '1' })
      expect(service.size()).toBe(1)
      service.resetForTests()
      expect(service.size()).toBe(0)
      expect(service.verify().valid).toBe(true)
    })
  })
})
