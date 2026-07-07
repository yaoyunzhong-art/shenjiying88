import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: AutoRollbackService 单元测试 - 快照/回滚/验证 workflow 状态机
import { AutoRollbackService } from './auto-rollback.service'
import type { RollbackConfig } from './auto-rollback.entity'

describe('AutoRollbackService', () => {
  let service: AutoRollbackService

  beforeEach(() => {
    service = new AutoRollbackService()
    service.resetForTests()
  })

  // ── 触发回滚 ──

  describe('trigger()', () => {
    it('should create a WARNING rollback with PENDING status', () => {
      const record = service.trigger({
        reason: 'P95 spike on /api/coupons',
        severity: 'WARNING',
        metricKey: '/api/coupons',
        anomalyValue: 110,
        baselineValue: 100,
      })

      expect(record.id).toBeDefined()
      expect(record.id).toMatch(/^rollback-/)
      expect(record.severity).toBe('WARNING')
      expect(record.reason).toBe('P95 spike on /api/coupons')
      expect(record.requiresConfirmation).toBe(false)
      // WARNING 直接执行,status 可能已前进
      expect(['PENDING', 'SNAPSHOTTING', 'ROLLING_BACK', 'VERIFYING', 'COMPLETED']).toContain(record.status)
      expect(record.createdAt).toBeDefined()
      expect(record.history.length).toBeGreaterThanOrEqual(1)
    })

    it('should create a CRITICAL rollback with AWAITING_CONFIRM status', () => {
      const record = service.trigger({
        reason: 'P99 critical spike',
        severity: 'CRITICAL',
        metricKey: '/api/orders',
        anomalyValue: 5000,
        baselineValue: 200,
      })

      expect(record.id).toBeDefined()
      expect(record.severity).toBe('CRITICAL')
      expect(record.status).toBe('AWAITING_CONFIRM')
      expect(record.requiresConfirmation).toBe(true)
    })

    it('should accept optional trigger parameter', () => {
      const record = service.trigger({
        reason: 'redis sync failure',
        severity: 'WARNING',
        metricKey: 'redis.cache.hit',
        anomalyValue: 0.1,
        baselineValue: 0.85,
        trigger: 'manual-check',
      })
      expect(record.id).toBeDefined()
    })

    it('should schedule auto-cancel for CRITICAL after confirmationDelayMs', async () => {
      // 配置短延迟加速测试
      service.configure({ confirmationDelayMs: 10 })
      const record = service.trigger({
        reason: 'short timeout',
        severity: 'CRITICAL',
        metricKey: 'test',
        anomalyValue: 999,
        baselineValue: 100,
      })
      expect(record.status).toBe('AWAITING_CONFIRM')

      // 等待自动取消
      await new Promise((r) => setTimeout(r, 50))
      const after = service.getRecord(record.id)
      expect(after?.status).toBe('CANCELLED')
    })
  })

  // ── 二次确认 ──

  describe('confirm()', () => {
    it('should confirm a CRITICAL rollback and start execution', () => {
      const record = service.trigger({
        reason: 'test critical confirmation',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      })
      expect(record.status).toBe('AWAITING_CONFIRM')

      const confirmed = service.confirm(record.id)
      expect(confirmed).toBeDefined()
      expect(confirmed!.status).not.toBe('AWAITING_CONFIRM')
      // 确认后状态应前进
      expect(['PENDING', 'SNAPSHOTTING', 'ROLLING_BACK', 'VERIFYING', 'COMPLETED']).toContain(confirmed!.status)
    })

    it('should return undefined for non-existent id', () => {
      const result = service.confirm('non-existent-id')
      expect(result).toBeUndefined()
    })

    it('should be idempotent on COMPLETED record', () => {
      const record = service.trigger({
        reason: 'test',
        severity: 'WARNING',
        metricKey: 'm',
        anomalyValue: 110,
        baselineValue: 100,
      })
      // WARNING 直接执行,等待完成
      const confirmed = service.confirm(record.id)
      expect(confirmed).toBeDefined()
      // 再次 confirm 不应改变已完成的记录
      const confirmAgain = service.confirm(record.id)
      expect(confirmAgain).toBeDefined()
    })
  })

  // ── 取消回滚 ──

  describe('cancel()', () => {
    it('should cancel an AWAITING_CONFIRM rollback', () => {
      const record = service.trigger({
        reason: 'test cancel',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      })
      expect(record.status).toBe('AWAITING_CONFIRM')

      const cancelled = service.cancel(record.id, 'False alarm')
      expect(cancelled).toBeDefined()
      expect(cancelled!.status).toBe('CANCELLED')
      // 历史应包含取消原因
      const lastHistory = cancelled!.history[cancelled!.history.length - 1]
      expect(lastHistory.note).toBe('False alarm')
    })

    it('should return undefined for non-existent id', () => {
      const result = service.cancel('non-existent-id')
      expect(result).toBeUndefined()
    })

    it('should be idempotent on already cancelled record', () => {
      const record = service.trigger({
        reason: 'test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      })
      service.cancel(record.id, 'First cancel')
      const secondCancel = service.cancel(record.id, 'Second cancel')
      expect(secondCancel?.status).toBe('CANCELLED')
    })

    it('should cancel WARNING rollback that is still executing', () => {
      const record = service.trigger({
        reason: 'test',
        severity: 'WARNING',
        metricKey: 'm',
        anomalyValue: 110,
        baselineValue: 100,
      })
      // WARNING 也会执行,但可能在执行中被取消
      const cancelled = service.cancel(record.id, 'Stop execution')
      expect(cancelled).toBeDefined()
      // 如果已完成则不再取消
      if (cancelled!.status !== 'COMPLETED') {
        expect(cancelled!.status).toBe('CANCELLED')
      }
    })
  })

  // ── 查询 ──

  describe('getRecord()', () => {
    it('should return a record by id', () => {
      const record = service.trigger({
        reason: 'test get',
        severity: 'WARNING',
        metricKey: 'm',
        anomalyValue: 110,
        baselineValue: 100,
      })
      const found = service.getRecord(record.id)
      expect(found).toBeDefined()
      expect(found!.id).toBe(record.id)
      expect(found!.metricKey).toBe('m')
    })

    it('should return undefined for non-existent id', () => {
      expect(service.getRecord('non-existent')).toBeUndefined()
    })
  })

  describe('listRecords()', () => {
    it('should return all records sorted by createdAt descending', () => {
      service.trigger({ reason: 'a', severity: 'WARNING', metricKey: 'm1', anomalyValue: 110, baselineValue: 100 })
      service.trigger({ reason: 'b', severity: 'WARNING', metricKey: 'm2', anomalyValue: 120, baselineValue: 100 })
      const records = service.listRecords()
      expect(records.length).toBe(2)
      // 第一条应该是最近创建的
      expect(new Date(records[0].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(records[1].createdAt).getTime(),
      )
    })

    it('should filter by status', () => {
      service.trigger({ reason: 'a', severity: 'WARNING', metricKey: 'm', anomalyValue: 110, baselineValue: 100 })
      service.trigger({ reason: 'b', severity: 'CRITICAL', metricKey: 'm', anomalyValue: 999, baselineValue: 100 })
      const awaiting = service.listRecords({ status: 'AWAITING_CONFIRM' })
      expect(awaiting.length).toBe(1)
      expect(awaiting[0].status).toBe('AWAITING_CONFIRM')
    })

    it('should filter by metricKey', () => {
      service.trigger({ reason: 'a', severity: 'WARNING', metricKey: 'api/coupons', anomalyValue: 110, baselineValue: 100 })
      service.trigger({ reason: 'b', severity: 'WARNING', metricKey: 'api/orders', anomalyValue: 120, baselineValue: 100 })
      const filtered = service.listRecords({ metricKey: 'api/coupons' })
      expect(filtered.length).toBe(1)
      expect(filtered[0].metricKey).toBe('api/coupons')
    })

    it('should combine status and metricKey filters', () => {
      service.trigger({ reason: 'a', severity: 'CRITICAL', metricKey: 'api/coupons', anomalyValue: 999, baselineValue: 100 })
      service.trigger({ reason: 'b', severity: 'WARNING', metricKey: 'api/orders', anomalyValue: 110, baselineValue: 100 })
      const filtered = service.listRecords({ status: 'AWAITING_CONFIRM', metricKey: 'api/coupons' })
      expect(filtered.length).toBe(1)
    })

    it('should return empty array when no records match', () => {
      const records = service.listRecords({ metricKey: 'nonexistent' })
      expect(records).toHaveLength(0)
    })
  })

  describe('getSnapshot()', () => {
    it('should return undefined for non-existent snapshot', () => {
      expect(service.getSnapshot('non-existent')).toBeUndefined()
    })
  })

  // ── 配置 ──

  describe('configure()', () => {
    it('should apply partial config updates', () => {
      service.configure({ criticalRequiresConfirm: false })
      const record = service.trigger({
        reason: 'test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      })
      // 当 criticalRequiresConfirm = false 时,CRITICAL 不再等待确认
      expect(record.status).not.toBe('AWAITING_CONFIRM')
    })

    it('should apply confirmationDelayMs', () => {
      service.configure({ confirmationDelayMs: 5000 })
      const record = service.trigger({
        reason: 'test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      })
      expect(record.confirmationDelayMs).toBe(5000)
    })

    it('should reset to defaults when calling resetForTests', () => {
      service.configure({ criticalRequiresConfirm: false, maxConcurrent: 10 })
      service.resetForTests()
      // 再次触发 CRITICAL 应回到 AWAITING_CONFIRM
      const record = service.trigger({
        reason: 'test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      })
      expect(record.status).toBe('AWAITING_CONFIRM')
    })
  })

  // ── 状态机工作流 (同步执行) ──

  describe('executeRollbackSync()', () => {
    it('should execute the full rollback workflow to COMPLETED', async () => {
      // 先手动触发 CRITICAL 获得 PENDING 记录,再手动确认进入 PENDING
      service.configure({ criticalRequiresConfirm: false })
      const record = service.trigger({
        reason: 'sync test',
        severity: 'CRITICAL',
        metricKey: 'test',
        anomalyValue: 105,
        baselineValue: 100,
      })
      // 由于 criticalRequiresConfirm = false,直接执行
      // 等异步完成
      await new Promise((r) => setTimeout(r, 50))
      const final = service.getRecord(record.id)
      expect(final).toBeDefined()
      expect(final!.status).toBe('COMPLETED')
      expect(final!.snapshotId).toBeDefined()
      expect(final!.completedAt).toBeDefined()
    })

    it('should execute sync rollback when status is PENDING', async () => {
      // 创建一个 CRITICAL,确认后状态变成 PENDING,然后同步执行
      const record = service.trigger({
        reason: 'sync test',
        severity: 'CRITICAL',
        metricKey: 'test',
        anomalyValue: 105,
        baselineValue: 100,
      })
      expect(record.status).toBe('AWAITING_CONFIRM')
      service.confirm(record.id)
      // confirm 后状态变 PENDING,executeRollbackSync 应完成
      const result = await service.executeRollbackSync(record.id)
      expect(result!.status).toBe('COMPLETED')
      expect(result!.snapshotId).toBeDefined()
      expect(result!.completedAt).toBeDefined()
    })

    it('should return undefined for non-existent id', async () => {
      const result = await service.executeRollbackSync('non-existent')
      expect(result).toBeUndefined()
    })

    it('should skip if status is not PENDING', async () => {
      const criticalRecord = service.trigger({
        reason: 'test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      })
      expect(criticalRecord.status).toBe('AWAITING_CONFIRM')
      // 不是 PENDING,应该跳过
      const result = await service.executeRollbackSync(criticalRecord.id)
      expect(result).toBeDefined()
      expect(result!.status).toBe('AWAITING_CONFIRM')
    })

    it('should handle snapshot creation correctly', async () => {
      const record = service.trigger({
        reason: 'test snapshot',
        severity: 'CRITICAL',
        metricKey: 'test',
        anomalyValue: 110,
        baselineValue: 100,
      })
      expect(record.status).toBe('AWAITING_CONFIRM')
      service.confirm(record.id)
      const result = await service.executeRollbackSync(record.id)
      expect(result!.snapshotId).toBeDefined()
      const snapshot = service.getSnapshot(result!.snapshotId!)
      expect(snapshot).toBeDefined()
      expect(snapshot!.kind).toBe('FULL') // executeRollbackSync 默认 FULL
      expect(snapshot!.trigger).toBe(record.reason)
    })

    it('should FAIL verification when anomaly far from baseline', async () => {
      const record = service.trigger({
        reason: 'extreme anomaly',
        severity: 'CRITICAL',
        metricKey: 'test',
        anomalyValue: 1000,
        baselineValue: 100,
      })
      expect(record.status).toBe('AWAITING_CONFIRM')
      service.confirm(record.id)
      const result = await service.executeRollbackSync(record.id)
      expect(result!.status).toBe('FAILED')
      expect(result!.completedAt).toBeDefined()
    })
  })

  // ── resetForTests ──

  describe('resetForTests()', () => {
    it('should clear all records and snapshots', () => {
      service.trigger({ reason: 'a', severity: 'WARNING', metricKey: 'm', anomalyValue: 110, baselineValue: 100 })
      service.trigger({ reason: 'b', severity: 'CRITICAL', metricKey: 'm', anomalyValue: 999, baselineValue: 100 })
      expect(service.listRecords().length).toBe(2)

      service.resetForTests()
      expect(service.listRecords().length).toBe(0)
    })

    it('should clear pending confirmations', () => {
      const record = service.trigger({
        reason: 'test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      })
      expect(record.status).toBe('AWAITING_CONFIRM')
      service.resetForTests()
      // 重置后不应再有定时器
      const afterReset = service.confirm(record.id)
      expect(afterReset).toBeUndefined()
    })
  })

  // ── 边界情况 ──

  describe('edge cases', () => {
    it('should handle multiple concurrent rollbacks', () => {
      const r1 = service.trigger({ reason: 'a', severity: 'WARNING', metricKey: 'm1', anomalyValue: 110, baselineValue: 100 })
      const r2 = service.trigger({ reason: 'b', severity: 'WARNING', metricKey: 'm2', anomalyValue: 105, baselineValue: 100 })
      const r3 = service.trigger({ reason: 'c', severity: 'CRITICAL', metricKey: 'm3', anomalyValue: 999, baselineValue: 100 })
      expect(r1.id).not.toBe(r2.id)
      expect(r2.id).not.toBe(r3.id)
      expect(service.listRecords().length).toBe(3)
    })

    it('should handle zero baseline value', () => {
      const record = service.trigger({
        reason: 'zero baseline',
        severity: 'WARNING',
        metricKey: 'test',
        anomalyValue: 100,
        baselineValue: 0,
      })
      expect(record.id).toBeDefined()
    })
  })
})
