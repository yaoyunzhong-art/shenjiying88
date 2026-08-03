import { describe, it, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { DeviceUsageReportService } from './device-usage-report.service'
import { DeviceType } from './device-usage-report.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ----------------------------------------------------------------
// 原则：fetch mock → URL-pattern responseRegistry；测试隔离 → beforeEach
// 覆盖：正例 + 反例 + 边界（三件套）
// 禁止: as any / describe.skip / it.only
// ----------------------------------------------------------------

const defaultCtx: RequestTenantContext = { tenantId: 'default' }
const otherCtx: RequestTenantContext = { tenantId: 'other-tenant' }

describe('DeviceUsageReportService', () => {
  let service: DeviceUsageReportService

  /** Fresh instance per test — seed data is lazily loaded once across instances
   *  but the in-memory Map is shared. We cannot fully isolate across tests
   *  since the Map is a module-level singleton. We'll test around that.
   *
   *  NOTE: Because usageStore is module-level and shared across all tests in this file
   *  (and across test files that import the service), tests that make assertions on
   *  counts assume at least the seed data; create/delete tests may have added extra
   *  records. Summary tests use defensive assertions where possible. */
  beforeEach(() => {
    service = new DeviceUsageReportService()
  })

  // ────────────────────────── list() ──────────────────────────

  describe('list()', () => {
    it('返回 default 租户的全部 8 条 seed 数据', () => {
      const { items, total } = service.list(defaultCtx)
      assert.equal(total, 8)
      assert.equal(items.length, 8)
    })

    it('其他租户返回空列表', () => {
      // otherCtx 在初始化时没有数据 — seed 只填充 default 租户
    // 但由于其他 test 可能调用 create(otherCtx)，首次 run 一定为 0
    // 我们只检查第一个 list 调用时 other 为空即可
    const freshService = new DeviceUsageReportService()
    const { items, total } = freshService.list(otherCtx)
    assert.equal(total, 0)
    assert.equal(items.length, 0)
    })

    it('按 storeId 过滤', () => {
      const { items, total } = service.list(defaultCtx, { storeId: 'store-001' })
      assert.equal(total, 4)
      for (const item of items) {
        assert.equal(item.storeId, 'store-001')
      }
    })

    it('按 deviceType 过滤（Racing）', () => {
      const { items, total } = service.list(defaultCtx, { deviceType: DeviceType.Racing })
      assert.equal(total, 2)
      for (const item of items) {
        assert.equal(item.deviceType, DeviceType.Racing)
      }
    })

    it('按 startDate/endDate 过滤', () => {
      const { total } = service.list(defaultCtx, {
        startDate: '2026-07-15',
        endDate: '2026-07-15',
      })
      assert.equal(total, 8)
    })

    it('按 startDate 过滤 — 无匹配日期返回空', () => {
      const { items, total } = service.list(defaultCtx, { startDate: '2026-12-01' })
      assert.equal(total, 0)
      assert.deepEqual(items, [])
    })

    it('组合过滤 storeId + deviceType', () => {
      const { items, total } = service.list(defaultCtx, {
        storeId: 'store-002',
        deviceType: DeviceType.Racing,
      })
      assert.equal(total, 1)
      assert.equal(items[0].deviceName, '赛车-头文字D')
    })

    it('结果按日期排序（正序）', () => {
      const { items } = service.list(defaultCtx)
      for (let i = 1; i < items.length; i++) {
        assert.ok(items[i - 1].date <= items[i].date)
      }
    })
  })

  // ────────────────────────── getById() ───────────────────────

  describe('getById()', () => {
    it('按 ID 查找到已有记录', () => {
      const record = service.getById('dev-usage-001', defaultCtx)
      assert.equal(record.id, 'dev-usage-001')
      assert.equal(record.deviceName, '街机-拳皇97')
      assert.equal(record.deviceType, DeviceType.Arcade)
    })

    it('不存在的 ID 抛出异常', () => {
      assert.throws(
        () => service.getById('non-existent', defaultCtx),
        { message: 'Device usage report non-existent not found' },
      )
    })

    it('跨租户访问抛出异常', () => {
      // dev-usage-001 属于 default tenant
      assert.throws(
        () => service.getById('dev-usage-001', otherCtx),
        { message: 'Device usage report dev-usage-001 not found' },
      )
    })
  })

  // ────────────────────────── create() ────────────────────────

  describe('create()', () => {
    it('成功创建一条记录并返回完整对象', () => {
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
      assert.equal(record.deviceType, DeviceType.Arcade)
      assert.equal(record.dailyRevenue, 1500)
      assert.ok(record.createdAt.length > 0)
    })

    it('创建后可通过 getById 查到', () => {
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
      assert.equal(fetched.deviceName, '射击-新枪')
    })

    it('为其他租户创建后不影响 default 租户列表', () => {
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
      const { total: otherTotal } = service.list(otherCtx)
      // 创建了 other 的记录，list(other) 至少有 1 条
      assert.ok(otherTotal >= 1)
      // default 的数据不受影响 — 但其他测试也可能 create
      assert.ok(defaultTotal >= 8)
    })

    it('创建字段边界值 — usageRate=0, idleRate=100', () => {
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
  })

  // ────────────────────────── delete() ────────────────────────

  describe('delete()', () => {
    it('成功删除后不再出现在列表中', () => {
      service.delete('dev-usage-008', defaultCtx)
      assert.throws(
        () => service.getById('dev-usage-008', defaultCtx),
        { message: 'Device usage report dev-usage-008 not found' },
      )
    })

    it('删除不存在的 ID 抛出异常', () => {
      assert.throws(
        () => service.delete('non-existent', defaultCtx),
        { message: 'Device usage report non-existent not found' },
      )
    })

    it('跨租户删除抛出异常', () => {
      assert.throws(
        () => service.delete('dev-usage-001', otherCtx),
        { message: 'Device usage report dev-usage-001 not found' },
      )
    })
  })

  // ────────────────────────── getSummary() ────────────────────

  describe('getSummary()', () => {
    it('返回汇总字段 — 所有字段类型正确且基础值合理', () => {
      const summary = service.getSummary(defaultCtx)
      // 至少包含 seed 的 8 条（可能被其他 create 测试追加）
      assert.ok(summary.totalDevices >= 8)
      assert.ok(typeof summary.avgUsageRate === 'number')
      assert.ok(summary.avgUsageRate > 0)
      assert.ok(summary.avgIdleRate > 0)
      assert.ok(summary.totalDailyRevenue > 0)
      assert.ok(summary.peakDeviceType.length > 0)
      assert.ok(summary.lowestUsageDevice.length > 0)
    })

    it('avgUsageRate 在所有记录范围内', () => {
      const summary = service.getSummary(defaultCtx)
      // 使用率应该在 0-100 之间
      assert.ok(summary.avgUsageRate >= 0)
      assert.ok(summary.avgUsageRate <= 100)
    })

    it('全新的空租户返回全零汇总', () => {
      // 用完全不带数据的租户 ID 验证空结果
      const emptyCtx: RequestTenantContext = { tenantId: 'empty-tenant-' + Date.now() }
      const summary = service.getSummary(emptyCtx)
      assert.equal(summary.totalDevices, 0)
      assert.equal(summary.avgUsageRate, 0)
      assert.equal(summary.avgIdleRate, 0)
      assert.equal(summary.peakDeviceType, '')
      assert.equal(summary.lowestUsageDevice, '')
      assert.equal(summary.totalDailyRevenue, 0)
    })

    it('peakDeviceType 返回平均使用率最高的类型', () => {
      const summary = service.getSummary(defaultCtx)
      // Racing: (91.2+88.7)/2 = 89.95 → 平均最高
      assert.equal(summary.peakDeviceType, DeviceType.Racing)
    })

    it('lowestUsageDevice 返回有效设备名', () => {
      const summary = service.getSummary(defaultCtx)
      assert.ok(summary.lowestUsageDevice.length > 0)
      // 最低使用率设备应该是某台 seed 中的设备
      const seedDevices = ['街机-拳皇97', '街机-三国战纪', '射击-猎枪精英',
        '赛车-头文字D', '篮球机-投篮王', 'VR-极限滑雪',
        '赛车-湾岸竞速', '射击-僵尸围城']
      // 如果有额外 create 记录也属于合理
      assert.ok(seedDevices.includes(summary.lowestUsageDevice) ||
        summary.lowestUsageDevice.startsWith('边界') ||
        summary.lowestUsageDevice.startsWith('射击-新'))
    })

    it('totalDailyRevenue 至少等于 seed 数据之和', () => {
      const summary = service.getSummary(defaultCtx)
      const minExpected = 1250 + 980 + 1560 + 2100 + 880 + 3200 + 1850 + 1340
      // 可能有其他 create 追加的记录，所以至少是 seed 的和
      assert.ok(summary.totalDailyRevenue >= minExpected)
    })
  })
})
