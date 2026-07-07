import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Sprint 3 Phase 2 - License 续费管理 Service 测试
 *
 * 测试覆盖:
 * - 创建续费记录
 * - 查询续费记录 (分页 + 筛选)
 * - 获取记录详情
 * - 更新续费状态
 * - 通知管理
 * - 统计
 * - 边界: 记录不存在, 空数据
 */

import assert from 'node:assert/strict'

describe('LicenseRenewalService', () => {
  const { LicenseRenewalService } = require('./license-renewal.service')
  let service: InstanceType<typeof LicenseRenewalService>

  beforeEach(() => {
    service = new LicenseRenewalService()
  })

  // ============ 创建续费记录 ============

  describe('createRecord', () => {
    it('should create a renewal record with basic fields', async () => {
      const record = await service.createRecord({
        licenseId: 'lic-new-1',
        tenantId: 'tenant-A',
        price: 1999,
      })

      assert.ok(record.id)
      assert.equal(record.licenseId, 'lic-new-1')
      assert.equal(record.tenantId, 'tenant-A')
      assert.equal(record.price, 1999)
      assert.equal(record.status, 'pending')
      assert.ok(record.createdAt)
      assert.ok(record.updatedAt)
    })

    it('should create a successful renewal record', async () => {
      const record = await service.createRecord({
        licenseId: 'lic-new-2',
        tenantId: 'tenant-B',
        price: 3999,
        status: 'success',
        packageId: 'pkg-premium',
        packageName: '高级版',
      })

      assert.equal(record.status, 'success')
      assert.equal(record.packageId, 'pkg-premium')
      assert.equal(record.packageName, '高级版')
    })

    it('should create with future expiry dates', async () => {
      const now = new Date()
      const future = new Date(now.getTime() + 365 * 24 * 3600 * 1000)

      const record = await service.createRecord({
        licenseId: 'lic-renew-1',
        tenantId: 'tenant-C',
        price: 5999,
        previousExpireAt: now.toISOString(),
        newExpireAt: future.toISOString(),
      })

      assert.ok(record.previousExpireAt)
      assert.ok(record.newExpireAt)
    })
  })

  // ============ 查询续费记录 ============

  describe('listRecords', () => {
    it('should list all records with pagination', async () => {
      const result = await service.listRecords({ page: 1, pageSize: 10 })

      assert.ok(Array.isArray(result.data))
      assert.ok(result.total >= 2) // has seed data
      assert.equal(result.page, 1)
      assert.equal(result.pageSize, 10)
    })

    it('should filter by licenseId', async () => {
      const result = await service.listRecords({ licenseId: 'lic-seed-paid' })

      assert.ok(result.data.length > 0)
      assert.ok(result.data.every((r: any) => r.licenseId === 'lic-seed-paid'))
    })

    it('should filter by status', async () => {
      const result = await service.listRecords({ status: 'success' })

      assert.ok(result.data.length > 0)
      assert.ok(result.data.every((r: any) => r.status === 'success'))
    })

    it('should filter by tenantId', async () => {
      const result = await service.listRecords({ tenantId: 'tenant-A' })

      assert.ok(result.data.length > 0)
      assert.ok(result.data.every((r: any) => r.tenantId === 'tenant-A'))
    })

    it('should return empty for non-existent tenant', async () => {
      const result = await service.listRecords({ tenantId: 'tenant-ghost' })

      assert.equal(result.total, 0)
      assert.equal(result.data.length, 0)
    })

    it('should sort by newest first', async () => {
      // Create a new record
      await service.createRecord({
        licenseId: 'lic-sort-1',
        tenantId: 'tenant-A',
        price: 100,
      })

      const result = await service.listRecords({})
      const dates = result.data.map((r: any) => new Date(r.createdAt).getTime())

      for (let i = 1; i < dates.length; i++) {
        assert.ok(
          dates[i - 1] >= dates[i],
          `Records should be sorted newest first at index ${i}`
        )
      }
    })

    it('should support date range filter', async () => {
      const result = await service.listRecords({
        startDate: '2025-01-01',
        endDate: '2027-12-31',
      })

      assert.ok(result.total > 0)
    })
  })

  // ============ 获取记录详情 ============

  describe('getRecord', () => {
    it('should get record by id', async () => {
      const record = await service.getRecord('renewal-seed-1')

      assert.equal(record.id, 'renewal-seed-1')
      assert.equal(record.licenseId, 'lic-seed-paid')
      assert.equal(record.price, 2999)
    })

    it('should throw NotFoundException for non-existent id', async () => {
      await assert.rejects(
        () => service.getRecord('non-existent-id'),
        (err: any) => {
          assert.equal(err.name, 'NotFoundException')
          assert.ok(err.message.includes('不存在'))
          return true
        }
      )
    })
  })

  // ============ 更新状态 ============

  describe('updateStatus', () => {
    it('should update status to success', async () => {
      const updated = await service.updateStatus('renewal-seed-2', {
        status: 'success',
        paymentId: 'pay-wechat-001',
      })

      assert.equal(updated.status, 'success')
      assert.equal(updated.paymentId, 'pay-wechat-001')
      assert.ok(updated.paidAt)
    })

    it('should update status to failed with error message', async () => {
      const updated = await service.updateStatus('renewal-seed-2', {
        status: 'failed',
        errorMessage: '支付超时',
      })

      assert.equal(updated.status, 'failed')
      assert.equal(updated.errorMessage, '支付超时')
    })

    it('should throw NotFoundException for non-existent id', async () => {
      await assert.rejects(
        () => service.updateStatus('non-existent-id', { status: 'success' }),
        (err: any) => err.name === 'NotFoundException'
      )
    })
  })

  // ============ 通知管理 ============

  describe('createNotification', () => {
    it('should create a reminder notification', async () => {
      const notif = await service.createNotification({
        licenseId: 'lic-seed-paid',
        tenantId: 'tenant-A',
        type: 'reminder',
        reminderDays: 7,
        sentAt: new Date().toISOString(),
      })

      assert.ok(notif.id)
      assert.equal(notif.type, 'reminder')
      assert.equal(notif.reminderDays, 7)
    })

    it('should create a success notification', async () => {
      const notif = await service.createNotification({
        licenseId: 'lic-seed-trial',
        tenantId: 'tenant-B',
        type: 'success',
        sentAt: new Date().toISOString(),
      })

      assert.equal(notif.type, 'success')
    })

    it('should create a failure notification', async () => {
      const notif = await service.createNotification({
        licenseId: 'lic-seed-trial',
        tenantId: 'tenant-B',
        type: 'failure',
        sentAt: new Date().toISOString(),
      })

      assert.equal(notif.type, 'failure')
    })
  })

  describe('listNotifications', () => {
    it('should list all notifications', async () => {
      const result = await service.listNotifications()

      assert.ok(result.total >= 2)
      assert.ok(Array.isArray(result.data))
    })

    it('should filter by licenseId', async () => {
      const result = await service.listNotifications('lic-seed-paid')

      assert.ok(result.data.every((n: any) => n.licenseId === 'lic-seed-paid'))
    })

    it('should filter by tenantId', async () => {
      const result = await service.listNotifications(undefined, 'tenant-A')

      assert.ok(result.data.every((n: any) => n.tenantId === 'tenant-A'))
    })
  })

  // ============ 统计 ============

  describe('getStats', () => {
    it('should return overall stats', async () => {
      const stats = await service.getStats()

      assert.ok(typeof stats.totalRenewals === 'number')
      assert.ok(typeof stats.successCount === 'number')
      assert.ok(typeof stats.failedCount === 'number')
      assert.ok(typeof stats.pendingCount === 'number')
      assert.ok(typeof stats.successRate === 'number')
      assert.ok(typeof stats.totalRevenue === 'number')
    })

    it('should return valid success rate', async () => {
      const stats = await service.getStats()

      assert.ok(stats.successRate >= 0)
      assert.ok(stats.successRate <= 100)
      assert.equal(
        stats.successCount + stats.failedCount + stats.pendingCount,
        stats.totalRenewals
      )
    })

    it('should filter by tenantId', async () => {
      const stats = await service.getStats('tenant-A')

      assert.ok(stats.totalRenewals > 0)
      assert.ok(stats.successRate >= 0)
    })

    it('should return zero stats for non-existent tenant', async () => {
      const stats = await service.getStats('tenant-ghost')

      assert.equal(stats.totalRenewals, 0)
      assert.equal(stats.successCount, 0)
      assert.equal(stats.failedCount, 0)
      assert.equal(stats.pendingCount, 0)
      assert.equal(stats.successRate, 0)
      assert.equal(stats.totalRevenue, 0)
    })
  })
})
