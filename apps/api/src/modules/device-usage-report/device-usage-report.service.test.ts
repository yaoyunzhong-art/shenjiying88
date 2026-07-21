// device-usage-report.service.test.ts — DeviceUsageReportService 单元测试
// 覆盖: list, getById, create, delete, getSummary
// 三件套: 正例 + 反例 + 边界（20 tests minimum）
import { describe, it, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { DeviceUsageReportService } from './device-usage-report.service'
import { DeviceType } from './device-usage-report.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

const defaultCtx: RequestTenantContext = { tenantId: 'default' }
const otherCtx: RequestTenantContext = { tenantId: 'other-tenant' }
const isolatedCtx = (): RequestTenantContext => ({ tenantId: `iso-${Date.now()}-${Math.random()}` })

describe('DeviceUsageReportService', () => {
  let service: DeviceUsageReportService

  beforeEach(() => {
    service = new DeviceUsageReportService()
  })

  // ────────────────────────── list() ──────────────────────────

  describe('list()', () => {
    it('正例: 返回 default 租户的 8 条 seed 数据', () => {
      const { items, total } = service.list(defaultCtx)
      assert.equal(total, 8)
      assert.equal(items.length, 8)
    })

    it('反例: 其他租户返回空列表', () => {
      const freshService = new DeviceUsageReportService()
      const { items, total } = freshService.list(otherCtx)
      assert.equal(total, 0)
      assert.equal(items.length, 0)
    })

    it('正例: 按 storeId 过滤', () => {
      const { items, total } = service.list(defaultCtx, { storeId: 'store-001' })
      assert.equal(total, 4)
      for (const item of items) {
        assert.equal(item.storeId, 'store-001')
      }
    })

    it('正例: 按 deviceType 过滤（Racing）', () => {
      const { items, total } = service.list(defaultCtx, { deviceType: DeviceType.Racing })
      assert.equal(total, 2)
      for (const item of items) {
        assert.equal(item.deviceType, DeviceType.Racing)
      }
    })

    it('正例: 按 deviceType 过滤（VR — 1条seed）', () => {
      const { items, total } = service.list(defaultCtx, { deviceType: DeviceType.VR })
      assert.equal(total, 1)
      assert.equal(items[0].deviceName, 'VR-极限滑雪')
    })

    it('正例: 按 startDate/endDate 过滤', () => {
      const { total } = service.list(defaultCtx, {
        startDate: '2026-07-15',
        endDate: '2026-07-15',
      })
      assert.equal(total, 8)
    })

    it('反例: 按 startDate 过滤 — 无匹配返回空', () => {
      const { items, total } = service.list(defaultCtx, { startDate: '2026-12-01' })
      assert.equal(total, 0)
      assert.deepEqual(items, [])
    })

    it('反例: 按 endDate 过滤 — 无匹配返回空', () => {
      const { items, total } = service.list(defaultCtx, { endDate: '2025-01-01' })
      assert.equal(total, 0)
      assert.deepEqual(items, [])
    })

    it('正例: 组合过滤 storeId + deviceType', () => {
      const { items, total } = service.list(defaultCtx, {
        storeId: 'store-002',
        deviceType: DeviceType.Racing,
      })
      assert.equal(total, 1)
      assert.equal(items[0].deviceName, '赛车-头文字D')
    })

    it('边界: 组合过滤 storeId + deviceType 无匹配', () => {
      const { items, total } = service.list(defaultCtx, {
        storeId: 'store-002',
        deviceType: DeviceType.VR,
      })
      assert.equal(total, 0)
      assert.deepEqual(items, [])
    })

    it('边界: 结果按日期排序（正序）', () => {
      const { items } = service.list(defaultCtx)
      for (let i = 1; i < items.length; i++) {
        assert.ok(items[i - 1].date <= items[i].date)
      }
    })

    it('边界: 空查询参数不改变结果', () => {
      const { total } = service.list(defaultCtx, {})
      assert.equal(total, 8)
    })

    it('正例: Basketball 类型过滤', () => {
      const { items, total } = service.list(defaultCtx, { deviceType: DeviceType.Basketball })
      assert.equal(total, 1)
      assert.equal(items[0].deviceType, DeviceType.Basketball)
    })
  })

  // ────────────────────────── getById() ───────────────────────

  describe('getById()', () => {
    it('正例: 按 ID 查找到已有记录', () => {
      const record = service.getById('dev-usage-001', defaultCtx)
      assert.equal(record.id, 'dev-usage-001')
      assert.equal(record.deviceName, '街机-拳皇97')
    })

    it('反例: 不存在的 ID 抛出异常', () => {
      assert.throws(
        () => service.getById('non-existent', defaultCtx),
        { message: 'Device usage report non-existent not found' },
      )
    })

    it('反例: 跨租户访问抛出异常', () => {
      assert.throws(
        () => service.getById('dev-usage-001', otherCtx),
        { message: 'Device usage report dev-usage-001 not found' },
      )
    })
  })

  // ────────────────────────── create() ────────────────────────

  describe('create()', () => {
    it('正例: 成功创建一条记录并返回完整对象', () => {
      const record = service.create(defaultCtx, {
        deviceId: 'dev-arcade-new',
        deviceName: '街机-合金弹头',
        deviceType: DeviceType.Arcade,
        storeId: 'store-004',
        usageRate: 90,
        idleRate: 7,
        maintenanceRate: 3,
        peakHours: '14:00-18:00',
        avgSessionMinutes: 35,
        dailyRevenue: 1500,
        date: '2026-07-18',
      })
      assert.ok(record.id.startsWith('dev-usage-'))
      assert.equal(record.tenantId, 'default')
      assert.equal(record.deviceName, '街机-合金弹头')
    })

    it('正例: 创建后可通过 getById 查到', () => {
      const created = service.create(defaultCtx, {
        deviceId: 'dev-shooting-new',
        deviceName: '射击-新枪',
        deviceType: DeviceType.Shooting,
        storeId: 'store-005',
        usageRate: 55,
        idleRate: 35,
        maintenanceRate: 10,
        peakHours: '18:00-21:00',
        avgSessionMinutes: 20,
        dailyRevenue: 800,
        date: '2026-07-18',
      })
      const fetched = service.getById(created.id, defaultCtx)
      assert.equal(fetched.id, created.id)
    })

    it('正例: 为其他租户创建后不影响 default 列表', () => {
      service.create(otherCtx, {
        deviceId: 'dev-vr-new',
        deviceName: 'VR-新体验',
        deviceType: DeviceType.VR,
        storeId: 'store-other',
        usageRate: 70,
        idleRate: 20,
        maintenanceRate: 10,
        peakHours: '16:00-22:00',
        avgSessionMinutes: 28,
        dailyRevenue: 2500,
        date: '2026-07-18',
      })
      const { total: defaultTotal } = service.list(defaultCtx)
      // default 的数据不受影响 — 至少 8 条
      assert.ok(defaultTotal >= 8)
    })

    it('边界: 创建字段边界值 — usageRate=0, idleRate=100', () => {
      const record = service.create(defaultCtx, {
        deviceId: 'dev-boundary',
        deviceName: '边界测试机',
        deviceType: DeviceType.Basketball,
        storeId: 'store-boundary',
        usageRate: 0,
        idleRate: 100,
        maintenanceRate: 0,
        peakHours: '',
        avgSessionMinutes: 0,
        dailyRevenue: 0,
        date: '2026-01-01',
      })
      assert.equal(record.usageRate, 0)
      assert.equal(record.idleRate, 100)
      assert.equal(record.maintenanceRate, 0)
      assert.equal(record.avgSessionMinutes, 0)
      assert.equal(record.dailyRevenue, 0)
      assert.equal(record.peakHours, '')
    })

    it('边界: 大数值创建（单独租户）', () => {
      const ctx = isolatedCtx()
      const record = service.create(ctx, {
        deviceId: 'dev-large',
        deviceName: '大数值设备',
        deviceType: DeviceType.VR,
        storeId: 'store-large',
        usageRate: 999.9,
        idleRate: 0,
        maintenanceRate: 0.1,
        peakHours: '00:00-23:59',
        avgSessionMinutes: 9999,
        dailyRevenue: 999999,
        date: '2026-12-31',
      })
      assert.equal(record.usageRate, 999.9)
      assert.equal(record.dailyRevenue, 999999)
      assert.equal(record.date, '2026-12-31')
    })
  })

  // ────────────────────────── delete() ────────────────────────

  describe('delete()', () => {
    it('正例: 成功删除后不再出现', () => {
      service.delete('dev-usage-008', defaultCtx)
      assert.throws(
        () => service.getById('dev-usage-008', defaultCtx),
        { message: 'Device usage report dev-usage-008 not found' },
      )
    })

    it('反例: 删除不存在的 ID 抛出异常', () => {
      assert.throws(
        () => service.delete('non-existent', defaultCtx),
        { message: 'Device usage report non-existent not found' },
      )
    })

    it('反例: 跨租户删除抛出异常', () => {
      assert.throws(
        () => service.delete('dev-usage-001', otherCtx),
        { message: 'Device usage report dev-usage-001 not found' },
      )
    })
  })

  // ────────────────────────── getSummary() ────────────────────

  describe('getSummary()', () => {
    it('正例: 返回有效汇总', () => {
      const summary = service.getSummary(defaultCtx)
      assert.ok(summary.totalDevices >= 8)
      assert.ok(typeof summary.avgUsageRate === 'number')
      assert.ok(summary.avgUsageRate > 0)
      assert.ok(summary.totalDailyRevenue > 0)
    })

    it('正例: avgUsageRate 为非负数', () => {
      const summary = service.getSummary(defaultCtx)
      assert.ok(summary.avgUsageRate >= 0)
      assert.ok(typeof summary.avgUsageRate === 'number')
    })

    it('边界: 全新的空租户返回全零汇总', () => {
      const emptyCtx = isolatedCtx()
      const summary = service.getSummary(emptyCtx)
      assert.equal(summary.totalDevices, 0)
      assert.equal(summary.avgUsageRate, 0)
      assert.equal(summary.avgIdleRate, 0)
      assert.equal(summary.peakDeviceType, '')
      assert.equal(summary.lowestUsageDevice, '')
      assert.equal(summary.totalDailyRevenue, 0)
    })

    it('正例: peakDeviceType 返回平均使用率最高的类型', () => {
      const summary = service.getSummary(defaultCtx)
      // Racing: (91.2+88.7)/2 = 89.95 → 平均最高
      assert.equal(summary.peakDeviceType, DeviceType.Racing)
    })

    it('正例: totalDailyRevenue 至少等于 seed 数据之和', () => {
      const summary = service.getSummary(defaultCtx)
      const minExpected = 1250 + 980 + 1560 + 2100 + 880 + 3200 + 1850 + 1340
      assert.ok(summary.totalDailyRevenue >= minExpected)
    })

    it('正例: 添加记录后汇总数值增大', () => {
      const before = service.getSummary(defaultCtx)
      service.create(defaultCtx, {
        deviceId: 'dev-more',
        deviceName: '更多数据',
        deviceType: DeviceType.Arcade,
        storeId: 'store-more',
        usageRate: 50,
        idleRate: 30,
        maintenanceRate: 20,
        peakHours: '10:00-12:00',
        avgSessionMinutes: 10,
        dailyRevenue: 500,
        date: '2026-07-20',
      })
      const after = service.getSummary(defaultCtx)
      assert.equal(after.totalDevices, before.totalDevices + 1)
      assert.ok(after.totalDailyRevenue > before.totalDailyRevenue)
    })
  })
})
