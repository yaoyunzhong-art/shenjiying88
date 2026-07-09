/**
 * shared.service.test.ts
 * SharedService 单元测试（正例 + 反例 + 边界）
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { SharedService } from './shared.service'
import { AuditService } from './audit.service'
import { assertTenantId } from './tenant-validator'

describe('SharedService', () => {
  let auditService: AuditService
  let sharedService: SharedService

  beforeEach(() => {
    auditService = new AuditService()
    sharedService = new SharedService(auditService)
  })

  /* ───────── getHealth ───────── */
  describe('getHealth', () => {
    it('正例: 应返回 healthy 状态及元数据', () => {
      const result = sharedService.getHealth()
      expect(result.status).toBe('healthy')
      expect(typeof result.uptimeMs).toBe('number')
      expect(typeof result.auditLogCount).toBe('number')
      expect(result.version).toBe('1.0.0')
    })

    it('边界: uptimeMs 随时间增长', async () => {
      const r1 = sharedService.getHealth()
      await new Promise((r) => setTimeout(r, 5))
      const r2 = sharedService.getHealth()
      expect(r2.uptimeMs).toBeGreaterThanOrEqual(r1.uptimeMs)
    })
  })

  /* ───────── getAuditLog ───────── */
  describe('getAuditLog', () => {
    it('正例: 按 tenantId 查询审计日志', async () => {
      await auditService.logCrossTenantAttempt({
        actor: 'u1', tenantId: 't1', resource: 'cfg:001',
      })
      await auditService.logCrossTenantAttempt({
        actor: 'u2', tenantId: 't2', resource: 'cfg:002',
      })
      const result = await sharedService.getAuditLog('t1')
      expect(result.total).toBe(1)
      expect(result.entries[0].actor).toBe('u1')
    })

    it('边界: 未知 tenantId 返回空数组', async () => {
      const result = await sharedService.getAuditLog('nonexistent')
      expect(result.total).toBe(0)
      expect(result.entries).toEqual([])
    })

    it('反例: 空 tenantId 抛 ForbiddenException', async () => {
      await expect(sharedService.getAuditLog('')).rejects.toThrow()
    })

    it('正例: action 过滤正确', async () => {
      await auditService.logCrossTenantAttempt({
        actor: 'u1', tenantId: 't1', resource: 'r1', action: 'config_read',
      })
      await auditService.logCrossTenantAttempt({
        actor: 'u2', tenantId: 't1', resource: 'r2', action: 'session_read',
      })
      const result = await sharedService.getAuditLog('t1', { action: 'config_read' })
      expect(result.total).toBe(1) // total 是 action 过滤后条数
      expect(result.entries.length).toBe(1)
      expect(result.entries[0].resource).toBe('r1')
    })

    it('正例: limit 截断正确', async () => {
      for (let i = 0; i < 5; i++) {
        await auditService.logCrossTenantAttempt({
          actor: 'u', tenantId: 't1', resource: `r${i}`,
        })
      }
      const result = await sharedService.getAuditLog('t1', { limit: 3 })
      expect(result.entries.length).toBe(3)
      expect(result.total).toBe(3) // total = filtered.length (limit 截断后)
    })

    it('边界: since 时间过滤正确', async () => {
      await auditService.logCrossTenantAttempt({
        actor: 'u1', tenantId: 't1', resource: 'early',
      })
      // 直接操作内存
      const all = auditService['logs'] as unknown as Array<{ occurredAt: string }>
      all[0].occurredAt = '2026-06-14T10:00:00.000Z'

      await auditService.logCrossTenantAttempt({
        actor: 'u2', tenantId: 't1', resource: 'late',
      })
      all[1].occurredAt = '2026-06-14T12:00:00.000Z'

      const result = await sharedService.getAuditLog('t1', {
        since: '2026-06-14T11:00:00.000Z',
      })
      expect(result.total).toBe(1)
      expect(result.entries[0].resource).toBe('late')
    })
  })

  /* ───────── getAllAuditLog ───────── */
  describe('getAllAuditLog', () => {
    it('正例: 应返回所有租户日志', async () => {
      await auditService.logCrossTenantAttempt({
        actor: 'u1', tenantId: 't1', resource: 'r1',
      })
      await auditService.logCrossTenantAttempt({
        actor: 'u2', tenantId: 't2', resource: 'r2',
      })
      const result = await sharedService.getAllAuditLog()
      expect(result.total).toBe(2)
    })

    it('边界: 空存储返回空数组', async () => {
      const result = await sharedService.getAllAuditLog()
      expect(result.total).toBe(0)
      expect(result.entries).toEqual([])
    })
  })

  /* ───────── getAuditEntry ───────── */
  describe('getAuditEntry', () => {
    it('正例: 按 ID 查到条目', async () => {
      await auditService.logCrossTenantAttempt({
        actor: 'u1', tenantId: 't1', resource: 'r1',
      })
      const result = await sharedService.getAuditEntry(1)
      expect(result.found).toBe(true)
      expect(result.entry?.actor).toBe('u1')
    })

    it('反例: 不存在的 ID 返回 found=false', async () => {
      const result = await sharedService.getAuditEntry(999)
      expect(result.found).toBe(false)
    })

    it('边界: ID=0 返回 not found', async () => {
      const result = await sharedService.getAuditEntry(0)
      expect(result.found).toBe(false)
    })
  })

  /* ───────── validateTenant ───────── */
  describe('validateTenant', () => {
    it('正例: 有效 tenantId 返回 valid=true', () => {
      const result = sharedService.validateTenant('tenant-valid-123')
      expect(result.valid).toBe(true)
    })

    it('反例: 空字符串返回 valid=false', () => {
      const result = sharedService.validateTenant('')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('反例: 空白字符串返回 valid=false', () => {
      const result = sharedService.validateTenant('   ')
      expect(result.valid).toBe(false)
    })

    it('边界: 单字符是有效 tenantId', () => {
      const result = sharedService.validateTenant('a')
      expect(result.valid).toBe(true)
    })
  })

  /* ───────── getVersion ───────── */
  describe('getVersion', () => {
    it('正例: 返回版本和启动时间', () => {
      const result = sharedService.getVersion()
      expect(result.version).toBe('1.0.0')
      expect(typeof result.startedAt).toBe('string')
      expect(new Date(result.startedAt).getTime()).toBeGreaterThan(0)
    })
  })

  /* ───────── recordAuditEvent ───────── */
  describe('recordAuditEvent', () => {
    it('正例: 记录审计事件成功', async () => {
      await sharedService.recordAuditEvent({
        actor: 'admin',
        tenantId: 't1',
        resource: 'cfg:test',
        action: 'config_read',
      })
      const logs = await auditService.getAllAuditLog()
      expect(logs.length).toBe(1)
      expect(logs[0].actor).toBe('admin')
    })

    it('边界: 不传 action 使用默认值', async () => {
      await sharedService.recordAuditEvent({
        actor: 'admin',
        tenantId: 't1',
        resource: 'cfg:test',
      })
      const logs = await auditService.getAllAuditLog()
      expect(logs[0].action).toBe('cross_tenant_access_attempt')
    })
  })
})
