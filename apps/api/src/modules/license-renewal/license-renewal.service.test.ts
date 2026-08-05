/**
 * license-renewal.service.spec.ts — 续费管理 Service 纯函数式单元测试
 *
 * 覆盖：
 *  createRecord     — 正例（创建记录）/ 反例（校验）
 *  listRecords      — 正例（全量/分页/过滤）/ 边界（空结果）
 *  getRecord        — 正例（存在）/ 反例（不存在）
 *  updateStatus     — 正例（状态更新）/ 反例（不存在）
 *  createNotification  — 正例（创建通知）
 *  listNotifications — 正例（过滤/全量）
 *  getStats         — 正例（全量/按租户）
 *  边界种子数据验证
 *
 * ≥ 18 项测试，纯内联 mock，依赖 LicenseRenewalService
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LicenseRenewalService } from './license-renewal.service'
import type { CreateRenewalRecordDto, UpdateRenewalStatusDto, RenewalRecordQueryDto, CreateNotificationDto } from './license-renewal.dto'

describe('LicenseRenewalService', () => {
  let svc: LicenseRenewalService

  beforeEach(() => {
    svc = new LicenseRenewalService()
  })

  // ── createRecord ────────────────────────────────────────────────

  describe('createRecord', () => {
    it('正例: 创建续费记录，返回完整响应', async () => {
      const dto: CreateRenewalRecordDto = {
        licenseId: 'lic-new-1',
        tenantId: 'tenant-C',
        packageId: 'pkg-basic',
        packageName: '基础版',
        price: 999,
        status: 'pending',
      }
      const result = await svc.createRecord(dto)

      expect(result.id).toMatch(/^renewal-\d+$/)
      expect(result.licenseId).toBe('lic-new-1')
      expect(result.tenantId).toBe('tenant-C')
      expect(result.packageName).toBe('基础版')
      expect(result.price).toBe(999)
      expect(result.status).toBe('pending')
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('正例: 创建含时间字段的记录', async () => {
      const dto: CreateRenewalRecordDto = {
        licenseId: 'lic-new-2',
        tenantId: 'tenant-D',
        price: 1999,
        previousExpireAt: new Date(Date.now() - 86400000).toISOString(),
        newExpireAt: new Date(Date.now() + 364 * 86400000).toISOString(),
      }
      const result = await svc.createRecord(dto)

      expect(result.previousExpireAt).toBeDefined()
      expect(result.newExpireAt).toBeDefined()
      expect(result.status).toBe('pending')
    })
  })

  // ── listRecords ─────────────────────────────────────────────────

  describe('listRecords', () => {
    it('正例: 返回全量种子记录（含分页信息）', async () => {
      const result = await svc.listRecords({ page: 1, pageSize: 10 })

      expect(result.data.length).toBeGreaterThanOrEqual(2)
      expect(result.total).toBeGreaterThanOrEqual(2)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
      expect(result.data[0].id).toBeDefined()
    })

    it('正例: 按 licenseId 过滤', async () => {
      const result = await svc.listRecords({ licenseId: 'lic-seed-paid' })

      expect(result.data.every((r) => r.licenseId === 'lic-seed-paid')).toBe(true)
      expect(result.total).toBe(1)
    })

    it('正例: 按 status 过滤', async () => {
      const result = await svc.listRecords({ status: 'pending' })

      expect(result.data.every((r) => r.status === 'pending')).toBe(true)
    })

    it('正例: 分页返回 subset', async () => {
      // 先插入一条确保有足够数据
      await svc.createRecord({
        licenseId: 'lic-page',
        tenantId: 'tenant-P',
        price: 1,
      })
      const result = await svc.listRecords({ page: 1, pageSize: 1 })

      expect(result.data.length).toBeLessThanOrEqual(1)
      expect(result.total).toBeGreaterThanOrEqual(1)
    })

    it('边界: 查询条件无匹配返回空列表', async () => {
      const result = await svc.listRecords({ licenseId: 'non-existent-id' })

      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  // ── getRecord ──────────────────────────────────────────────────

  describe('getRecord', () => {
    it('正例: 获取已有记录详情', async () => {
      const result = await svc.getRecord('renewal-seed-1')

      expect(result.id).toBe('renewal-seed-1')
      expect(result.licenseId).toBe('lic-seed-paid')
      expect(result.status).toBe('success')
    })

    it('反例: 不存在的 id 抛 NotFoundException', async () => {
      await expect(svc.getRecord('non-existent')).rejects.toThrow()
    })
  })

  // ── updateStatus ───────────────────────────────────────────────

  describe('updateStatus', () => {
    it('正例: 更新为 success 并设置 paidAt', async () => {
      const dto: UpdateRenewalStatusDto = {
        status: 'success',
        paymentId: 'pay-updated-1',
      }
      const result = await svc.updateStatus('renewal-seed-2', dto)

      expect(result.status).toBe('success')
      expect(result.paymentId).toBe('pay-updated-1')
      expect(result.paidAt).toBeDefined()
    })

    it('正例: 更新为 failed 并保留错误信息', async () => {
      const dto: UpdateRenewalStatusDto = {
        status: 'failed',
        errorMessage: '支付超时',
      }
      const result = await svc.updateStatus('renewal-seed-2', dto)

      expect(result.status).toBe('failed')
      expect(result.errorMessage).toBe('支付超时')
    })

    it('反例: 不存在的 id 抛 NotFoundException', async () => {
      const dto: UpdateRenewalStatusDto = { status: 'success' }
      await expect(svc.updateStatus('non-existent', dto)).rejects.toThrow()
    })
  })

  // ── createNotification ─────────────────────────────────────────

  describe('createNotification', () => {
    it('正例: 创建 reminder 通知', async () => {
      const dto: CreateNotificationDto = {
        licenseId: 'lic-seed-paid',
        tenantId: 'tenant-A',
        type: 'reminder',
        reminderDays: 7,
        sentAt: new Date().toISOString(),
      }
      const result = await svc.createNotification(dto)

      expect(result.id).toMatch(/^notif-\d+$/)
      expect(result.type).toBe('reminder')
      expect(result.reminderDays).toBe(7)
    })

    it('正例: 创建 success 通知', async () => {
      const dto: CreateNotificationDto = {
        licenseId: 'lic-seed-trial',
        tenantId: 'tenant-B',
        type: 'success',
        sentAt: new Date().toISOString(),
      }
      const result = await svc.createNotification(dto)

      expect(result.type).toBe('success')
      expect(result.reminderDays).toBeUndefined()
    })
  })

  // ── listNotifications ──────────────────────────────────────────

  describe('listNotifications', () => {
    it('正例: 返回全量通知', async () => {
      const result = await svc.listNotifications()

      expect(result.total).toBeGreaterThanOrEqual(2)
      expect(result.data.length).toBe(result.total)
    })

    it('正例: 按 licenseId 过滤', async () => {
      const result = await svc.listNotifications('lic-seed-paid')

      expect(result.data.every((n) => n.licenseId === 'lic-seed-paid')).toBe(true)
    })

    it('边界: 无匹配通知返回空', async () => {
      const result = await svc.listNotifications('lic-non-existent')

      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  // ── getStats ───────────────────────────────────────────────────

  describe('getStats', () => {
    it('正例: 返回全局统计数据', async () => {
      const stats = await svc.getStats()

      expect(stats.totalRenewals).toBeGreaterThanOrEqual(2)
      expect(stats.successCount).toBeGreaterThanOrEqual(1)
      expect(stats.pendingCount).toBeGreaterThanOrEqual(1)
      expect(stats.failedCount).toBe(0)
      expect(stats.successRate).toBeGreaterThan(0)
      expect(stats.totalRevenue).toBeGreaterThanOrEqual(2999)
    })

    it('正例: 按 tenantId 过滤后统计', async () => {
      const stats = await svc.getStats('tenant-B')

      expect(stats.totalRenewals).toBe(1)
      expect(stats.totalRevenue).toBe(0)
      expect(stats.successRate).toBe(0)
    })

    it('边界: 无匹配租户返回空统计', async () => {
      const stats = await svc.getStats('tenant-non-existent')

      expect(stats.totalRenewals).toBe(0)
      expect(stats.successCount).toBe(0)
      expect(stats.failedCount).toBe(0)
      expect(stats.pendingCount).toBe(0)
      expect(stats.successRate).toBe(0)
      expect(stats.totalRevenue).toBe(0)
    })
  })

  // ── 种子数据验证 ──────────────────────────────────────────────

  describe('种子数据', () => {
    it('验证: 种子续费记录的详细信息', async () => {
      const record = await svc.getRecord('renewal-seed-1')
      expect(record.licenseId).toBe('lic-seed-paid')
      expect(record.price).toBe(2999)
      expect(record.paymentId).toBe('pay-seed-1')
    })

    it('验证: 种子通知数据', async () => {
      const result = await svc.listNotifications()
      expect(result.data.some((n) => n.id === 'notif-seed-1')).toBe(true)
      expect(result.data.some((n) => n.id === 'notif-seed-2')).toBe(true)
    })
  })
})
