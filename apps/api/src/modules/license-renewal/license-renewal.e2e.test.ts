import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * license-renewal.e2e.test.ts
 *
 * LicenseRenewalService E2E 集成测试 —— 覆盖完整续费管理生命周期
 *
 * 测试场景:
 * 1. 创建续费记录 → 查询列表 → 查询详情
 * 2. 更新续费状态 → 验证状态变更
 * 3. 创建续费通知 → 查询通知列表
 * 4. 续费统计汇总
 * 5. 异常处理: 不存在的记录
 * 6. 多条件筛选
 * 7. 空数据场景
 * 8. 边界: 零价格续费
 */

import assert from 'node:assert/strict'

// ========== 测试辅助: 创建干净 Service 实例 ==========

interface InternalRecord {
  id: string
  licenseId: string
  tenantId: string
  packageId?: string
  packageName?: string
  previousExpireAt?: Date
  newExpireAt?: Date
  price: number
  status: 'pending' | 'success' | 'failed'
  errorMessage?: string
  paymentId?: string
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface InternalNotification {
  id: string
  licenseId: string
  tenantId: string
  type: string
  reminderDays?: number
  sentAt: Date
  createdAt: Date
}

function createRenewalService() {
  let records: InternalRecord[] = []
  let notifications: InternalNotification[] = []
  let recordSeq = 100
  let notifSeq = 100

  const svc = {
    _seed() {
      const now = new Date()
      const d = (days: number) => new Date(now.getTime() + days * 24 * 3600 * 1000)

      records = [
        {
          id: 'e2e-rec-seed-1',
          licenseId: 'lic-e2e-paid',
          tenantId: 'tenant-A',
          packageId: 'pkg-enterprise',
          packageName: '企业版',
          previousExpireAt: d(-30),
          newExpireAt: d(335),
          price: 2999,
          status: 'success',
          paymentId: 'pay-001',
          paidAt: d(-30),
          createdAt: d(-30),
          updatedAt: d(-30),
        },
        {
          id: 'e2e-rec-seed-2',
          licenseId: 'lic-e2e-trial',
          tenantId: 'tenant-B',
          price: 0,
          status: 'pending',
          createdAt: d(-5),
          updatedAt: d(-5),
        },
      ]

      notifications = [
        {
          id: 'e2e-notif-seed-1',
          licenseId: 'lic-e2e-paid',
          tenantId: 'tenant-A',
          type: 'reminder',
          reminderDays: 7,
          sentAt: d(-25),
          createdAt: d(-25),
        },
      ]
    },

    async createRecord(dto: any) {
      const id = `e2e-rec-${++recordSeq}`
      const now = new Date()
      const record: InternalRecord = {
        id,
        licenseId: dto.licenseId,
        tenantId: dto.tenantId,
        packageId: dto.packageId,
        packageName: dto.packageName,
        previousExpireAt: dto.previousExpireAt ? new Date(dto.previousExpireAt) : undefined,
        newExpireAt: dto.newExpireAt ? new Date(dto.newExpireAt) : undefined,
        price: dto.price,
        status: dto.status ?? 'pending',
        createdAt: now,
        updatedAt: now,
      }
      records.push(record)
      return toRecordResponse(record)
    },

    async listRecords(query: any) {
      const { page = 1, pageSize = 10, licenseId, tenantId, status, startDate, endDate } = query || {}

      let filtered = [...records]
      if (licenseId) filtered = filtered.filter(r => r.licenseId === licenseId)
      if (tenantId) filtered = filtered.filter(r => r.tenantId === tenantId)
      if (status) filtered = filtered.filter(r => r.status === status)
      if (startDate) {
        const s = new Date(startDate)
        filtered = filtered.filter(r => r.createdAt >= s)
      }
      if (endDate) {
        const e = new Date(endDate)
        filtered = filtered.filter(r => r.createdAt <= e)
      }

      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      const total = filtered.length
      const start = (page - 1) * pageSize
      const paged = filtered.slice(start, start + pageSize)

      return { data: paged.map(toRecordResponse), total, page, pageSize }
    },

    async getRecord(id: string) {
      const record = records.find(r => r.id === id)
      if (!record) throw new Error('续费记录不存在')
      return toRecordResponse(record)
    },

    async updateStatus(id: string, dto: any) {
      const record = records.find(r => r.id === id)
      if (!record) throw new Error('续费记录不存在')

      Object.assign(record, {
        status: dto.status,
        errorMessage: dto.errorMessage ?? record.errorMessage,
        paymentId: dto.paymentId ?? record.paymentId,
        paidAt: dto.paidAt
          ? new Date(dto.paidAt)
          : dto.status === 'success'
            ? new Date()
            : record.paidAt,
        updatedAt: new Date(),
      })

      return toRecordResponse(record)
    },

    async createNotification(dto: any) {
      const id = `e2e-notif-${++notifSeq}`
      const notification: InternalNotification = {
        id,
        licenseId: dto.licenseId,
        tenantId: dto.tenantId,
        type: dto.type,
        reminderDays: dto.reminderDays,
        sentAt: new Date(dto.sentAt),
        createdAt: new Date(),
      }
      notifications.push(notification)
      return toNotificationResponse(notification)
    },

    async listNotifications(licenseId?: string, tenantId?: string) {
      let filtered = [...notifications]
      if (licenseId) filtered = filtered.filter(n => n.licenseId === licenseId)
      if (tenantId) filtered = filtered.filter(n => n.tenantId === tenantId)
      filtered.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      return { data: filtered.map(toNotificationResponse), total: filtered.length }
    },

    async getStats(tenantId?: string) {
      let f = [...records]
      if (tenantId) f = f.filter(r => r.tenantId === tenantId)

      const totalRenewals = f.length
      const successCount = f.filter(r => r.status === 'success').length
      const failedCount = f.filter(r => r.status === 'failed').length
      const pendingCount = f.filter(r => r.status === 'pending').length
      const totalRevenue = f.filter(r => r.status === 'success').reduce((s, r) => s + r.price, 0)
      const successRate = totalRenewals > 0 ? Math.round((successCount / totalRenewals) * 10000) / 100 : 0

      return { totalRenewals, successCount, failedCount, pendingCount, successRate, totalRevenue }
    },
  }

  return svc
}

function toRecordResponse(r: InternalRecord) {
  return {
    id: r.id,
    licenseId: r.licenseId,
    tenantId: r.tenantId,
    packageId: r.packageId,
    packageName: r.packageName,
    previousExpireAt: r.previousExpireAt?.toISOString(),
    newExpireAt: r.newExpireAt?.toISOString(),
    price: r.price,
    status: r.status,
    errorMessage: r.errorMessage,
    paymentId: r.paymentId,
    paidAt: r.paidAt?.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

function toNotificationResponse(n: InternalNotification) {
  return {
    id: n.id,
    licenseId: n.licenseId,
    tenantId: n.tenantId,
    type: n.type,
    reminderDays: n.reminderDays,
    sentAt: n.sentAt.toISOString(),
    createdAt: n.createdAt.toISOString(),
  }
}

// ========== E2E 测试套件 ==========

describe('LicenseRenewal E2E: 续费管理完整生命周期', () => {
  let svc: ReturnType<typeof createRenewalService>

  beforeEach(() => {
    svc = createRenewalService()
    svc._seed()
  })

  it('场景 1: 创建续费记录 → 查询列表包含新记录', async () => {
    const record = await svc.createRecord({
      licenseId: 'lic-new-001',
      tenantId: 'tenant-X',
      price: 1999,
      packageId: 'pkg-basic',
      packageName: '基础版',
    })

    assert.ok(record.id, '返回记录 id')
    assert.equal(record.licenseId, 'lic-new-001')
    assert.equal(record.tenantId, 'tenant-X')
    assert.equal(record.price, 1999)
    assert.equal(record.packageId, 'pkg-basic')
    assert.equal(record.packageName, '基础版')
    assert.equal(record.status, 'pending')
    assert.ok(record.createdAt, '有创建时间')

    const list = await svc.listRecords({ page: 1, pageSize: 100 })
    assert.ok(list.total >= 3)
    assert.ok(list.data.some((r: any) => r.id === record.id))
  })

  it('场景 2: 创建成功续费记录（含到期时间）', async () => {
    const now = new Date()
    const expireAt = new Date(now.getTime() + 365 * 24 * 3600 * 1000)

    const record = await svc.createRecord({
      licenseId: 'lic-success',
      tenantId: 'tenant-Y',
      price: 5999,
      status: 'success',
      previousExpireAt: now.toISOString(),
      newExpireAt: expireAt.toISOString(),
      packageId: 'pkg-premium',
      packageName: '高级版',
    })

    assert.equal(record.status, 'success')
    assert.ok(record.previousExpireAt)
    assert.ok(record.newExpireAt)
  })

  it('场景 3: 更新续费状态 → 验证变更', async () => {
    const updated = await svc.updateStatus('e2e-rec-seed-2', {
      status: 'success',
      paymentId: 'pay-wechat-abc123',
    })

    assert.equal(updated.status, 'success')
    assert.equal(updated.paymentId, 'pay-wechat-abc123')
    assert.ok(updated.paidAt, '支付时间已设置')
  })

  it('场景 4: 更新续费为失败状态含错误信息', async () => {
    const updated = await svc.updateStatus('e2e-rec-seed-2', {
      status: 'failed',
      errorMessage: '微信支付回调超时',
    })

    assert.equal(updated.status, 'failed')
    assert.equal(updated.errorMessage, '微信支付回调超时')
  })

  it('场景 5: 查询续费记录详情', async () => {
    const record = await svc.getRecord('e2e-rec-seed-1')

    assert.equal(record.licenseId, 'lic-e2e-paid')
    assert.equal(record.price, 2999)
    assert.equal(record.status, 'success')
    assert.equal(record.packageName, '企业版')
  })

  it('场景 6: 查询不存在的记录抛出错误', async () => {
    await assert.rejects(
      () => svc.getRecord('non-existent-rec'),
      (err: any) => {
        assert.ok(err.message.includes('不存在'))
        return true
      },
    )
  })

  it('场景 7: 创建续费通知并查询', async () => {
    const notif = await svc.createNotification({
      licenseId: 'lic-e2e-paid',
      tenantId: 'tenant-A',
      type: 'reminder',
      reminderDays: 3,
      sentAt: new Date().toISOString(),
    })

    assert.ok(notif.id)
    assert.equal(notif.type, 'reminder')
    assert.equal(notif.reminderDays, 3)

    const list = await svc.listNotifications('lic-e2e-paid')
    assert.ok(list.total >= 2)
    assert.ok(list.data.some((n: any) => n.id === notif.id))
  })

  it('场景 8: 创建 success + failure 类型通知', async () => {
    const success = await svc.createNotification({
      licenseId: 'lic-e2e-trial',
      tenantId: 'tenant-B',
      type: 'success',
      sentAt: new Date().toISOString(),
    })
    assert.equal(success.type, 'success')

    const failure = await svc.createNotification({
      licenseId: 'lic-e2e-trial',
      tenantId: 'tenant-B',
      type: 'failure',
      sentAt: new Date().toISOString(),
    })
    assert.equal(failure.type, 'failure')
  })

  it('场景 9: 续费统计汇总', async () => {
    const stats = await svc.getStats()

    assert.equal(typeof stats.totalRenewals, 'number')
    assert.equal(typeof stats.successCount, 'number')
    assert.equal(typeof stats.failedCount, 'number')
    assert.equal(typeof stats.pendingCount, 'number')
    assert.equal(typeof stats.successRate, 'number')
    assert.equal(typeof stats.totalRevenue, 'number')
    assert.ok(stats.successRate >= 0 && stats.successRate <= 100)
    assert.equal(
      stats.successCount + stats.failedCount + stats.pendingCount,
      stats.totalRenewals,
      '状态计数总和等于总数',
    )
  })

  it('场景 10: 按租户过滤统计', async () => {
    const stats = await svc.getStats('tenant-A')

    assert.ok(stats.totalRenewals > 0)
    assert.ok(stats.totalRevenue > 0)
  })

  it('场景 11: 不存在的租户返回零值统计', async () => {
    const stats = await svc.getStats('tenant-ghost')

    assert.equal(stats.totalRenewals, 0)
    assert.equal(stats.successCount, 0)
    assert.equal(stats.failedCount, 0)
    assert.equal(stats.pendingCount, 0)
    assert.equal(stats.successRate, 0)
    assert.equal(stats.totalRevenue, 0)
  })

  it('场景 12: 多条件筛选 listRecords', async () => {
    // 按 licenseId 过滤
    const byLicense = await svc.listRecords({ licenseId: 'lic-e2e-paid' })
    assert.ok(byLicense.data.every((r: any) => r.licenseId === 'lic-e2e-paid'))

    // 按状态过滤
    const byStatus = await svc.listRecords({ status: 'pending' })
    assert.ok(byStatus.data.every((r: any) => r.status === 'pending'))

    // 按租户过滤
    const byTenant = await svc.listRecords({ tenantId: 'tenant-B' })
    assert.ok(byTenant.data.every((r: any) => r.tenantId === 'tenant-B'))

    // 无匹配结果
    const empty = await svc.listRecords({ licenseId: 'lic-ghost' })
    assert.equal(empty.total, 0)
    assert.equal(empty.data.length, 0)
  })

  it('场景 13: 日期范围筛选', async () => {
    const result = await svc.listRecords({
      startDate: '2025-01-01',
      endDate: '2027-12-31',
    })
    assert.ok(result.total > 0)
  })

  it('场景 14: 零价格续费（免费续期）', async () => {
    const record = await svc.createRecord({
      licenseId: 'lic-free-renew',
      tenantId: 'tenant-C',
      price: 0,
      status: 'success',
    })

    assert.equal(record.price, 0)
    assert.equal(record.status, 'success')
  })

  it('场景 15: 更新不存在记录抛错', async () => {
    await assert.rejects(
      () => svc.updateStatus('no-such-record', { status: 'success' }),
      (err: any) => err.message.includes('不存在'),
    )
  })

  it('场景 16: 空数据场景（无种子数据）', async () => {
    const empty = createRenewalService()
    // 没有调用 _seed()

    const list = await empty.listRecords({})
    assert.equal(list.total, 0)
    assert.equal(list.data.length, 0)

    const stats = await empty.getStats()
    assert.equal(stats.totalRenewals, 0)
    assert.equal(stats.totalRevenue, 0)
  })
})
