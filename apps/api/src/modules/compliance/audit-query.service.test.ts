import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: AuditQueryService 单元测试 (查询 + CSV/JSON 导出 + integrity 验证)
import { AuditLogService } from './audit-log.service'
import { AuditQueryService } from './audit-query.service'

function createEnv() {
  const log = new AuditLogService()
  const queryService = new AuditQueryService(log)
  return { log, queryService }
}

describe('AuditQueryService', () => {
  let env: ReturnType<typeof createEnv>

  beforeEach(() => {
    env = createEnv()
    // Seed some audit entries
    env.log.append({ tenantId: 'store-a', actorId: 'alice', action: 'CREATE', resource: 'order', resourceId: 'ord-001' })
    env.log.append({ tenantId: 'store-a', actorId: 'bob', action: 'UPDATE', resource: 'order', resourceId: 'ord-001', after: { status: 'paid' } })
    env.log.append({ tenantId: 'store-a', actorId: 'alice', action: 'DELETE', resource: 'order', resourceId: 'ord-002' })
    env.log.append({ tenantId: 'store-b', actorId: 'carol', action: 'CREATE', resource: 'invoice', resourceId: 'inv-001' })
    env.log.append({ tenantId: 'store-b', actorId: 'carol', action: 'READ', resource: 'report', resourceId: 'rpt-2024' })
  })

  // ── export ──

  describe('export (CSV)', () => {
    it('should export all entries as CSV', () => {
      const result = env.queryService.export({ format: 'csv' })

      expect(result.format).toBe('csv')
      expect(result.rowCount).toBe(5)
      expect(result.content).toContain('seq,ts,tenantId,actorId,action')
      expect(result.content).toContain('store-a')
      expect(result.content).toContain('alice')
      expect(result.content).toContain('CREATE')
      expect(result.retentionDays).toBe(2555) // 7 years
    })

    it('should apply tenant filter in CSV export', () => {
      const result = env.queryService.export({
        format: 'csv',
        filter: { tenantId: 'store-a' },
      })

      expect(result.rowCount).toBe(3)
      const lines = result.content.split('\n').filter(Boolean)
      // Header + 3 data rows
      expect(lines).toHaveLength(4)
    })

    it('should apply pagination', () => {
      const result = env.queryService.export({
        format: 'csv',
        page: 1,
        pageSize: 2,
      })

      expect(result.rowCount).toBe(2)
    })

    it('should escape CSV fields containing commas or quotes', () => {
      env.log.append({
        tenantId: 'store-c', actorId: 'admin', action: 'CUSTOM',
        customAction: 'IMPORT',
        resource: 'data',
        resourceId: '"file,1"',
        after: { note: 'contains, comma' },
      })

      const result = env.queryService.export({ format: 'csv' })
      // The resourceId "file,1" should be quoted
      expect(result.content).toContain('"file,1"')
    })
  })

  describe('export (JSON)', () => {
    it('should export all entries as formatted JSON', () => {
      const result = env.queryService.export({ format: 'json' })

      expect(result.format).toBe('json')
      expect(result.rowCount).toBe(5)
      const parsed = JSON.parse(result.content)
      expect(parsed).toHaveLength(5)
      expect(parsed[0].tenantId).toBe('store-a')
    })

    it('should export with action filter', () => {
      const result = env.queryService.export({
        format: 'json',
        filter: { action: 'CREATE' },
      })

      expect(result.rowCount).toBe(2)
      const parsed = JSON.parse(result.content)
      expect(parsed.every((e: any) => e.action === 'CREATE')).toBe(true)
    })
  })

  // ── quickQuery ──

  describe('quickQuery', () => {
    it('should return matching entries without export wrapper', () => {
      const entries = env.queryService.quickQuery({ actorId: 'alice' })
      expect(entries).toHaveLength(2)
      expect(entries[0].actorId).toBe('alice')
    })

    it('should return all entries when filter is empty', () => {
      expect(env.queryService.quickQuery({})).toHaveLength(5)
    })
  })

  // ── statsByAction ──

  describe('statsByAction', () => {
    it('should aggregate counts by action across all tenants', () => {
      const stats = env.queryService.statsByAction()
      expect(stats.CREATE).toBe(2)
      expect(stats.UPDATE).toBe(1)
      expect(stats.DELETE).toBe(1)
      expect(stats.READ).toBe(1)
      expect(stats.CUSTOM).toBe(0)
    })

    it('should filter by tenant when specified', () => {
      const stats = env.queryService.statsByAction('store-b')
      expect(stats.CREATE).toBe(1)
      expect(stats.READ).toBe(1)
      expect(stats.UPDATE).toBe(0)
    })
  })

  // ── topActors ──

  describe('topActors', () => {
    it('should return actors sorted by action count', () => {
      const top = env.queryService.topActors('store-a')
      expect(top).toHaveLength(2)
      expect(top[0].actorId).toBe('alice') // 2 actions
      expect(top[0].count).toBe(2)
      expect(top[1].actorId).toBe('bob')
      expect(top[1].count).toBe(1)
    })

    it('should respect limit', () => {
      const top = env.queryService.topActors('store-a', 1)
      expect(top).toHaveLength(1)
    })
  })

  // ── exportWithVerification ──

  describe('exportWithVerification', () => {
    it('should export successfully when chain is valid', () => {
      const result = env.queryService.exportWithVerification({ format: 'json' })
      expect(result.integrity.valid).toBe(true)
      expect(result.export.rowCount).toBe(5)
    })

    it('should throw when chain is tampered', () => {
      env.log.__tamper(2)
      expect(() =>
        env.queryService.exportWithVerification({ format: 'json' }),
      ).toThrow('Audit log integrity broken')
    })
  })
})
