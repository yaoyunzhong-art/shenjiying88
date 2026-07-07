import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 扩展角色测试: reservation 模块
 *
 * 4 个深度角色视角：
 * 🛒前台 — 复杂到店接待和即时预约处理
 * 🎯运行专员 — 全状态流转管理和运营调度
 * 🎮导玩员 — 设备预约排程和冲突检测
 * 📢营销 — 活动场地预约和营销活动调度
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ReservationController } from './reservation.controller'
import { ReservationService } from './reservation.service'
import { ReservationStatus, ReservationType } from './reservation.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── 角色定义 ──
const ROLES = {
  Reception: '🛒前台',
  Ops: '🎯运行专员',
  Guide: '🎮导玩员',
  Marketing: '📢营销',
}

const TENANT_A = 't-rsv-ext-a'
const TENANT_B = 't-rsv-ext-b'

function tenantCtx(tenantId: string = TENANT_A): RequestTenantContext {
  return { tenantId }
}

const BASE_BODY = {
  type: ReservationType.Venue,
  resourceId: 'room-ext-01',
  resourceName: '扩展测试包厢',
  userId: 'u-ext-01',
  userName: '扩展用户',
  startTime: '2026-07-01T10:00:00.000Z',
  endTime: '2026-07-01T12:00:00.000Z',
  duration: 120,
  price: 200,
  deposit: 50,
}

function makeService(): ReservationService {
  const svc = new ReservationService()
  svc.resetStoreForTests()
  return svc
}

function makeController(service?: ReservationService): ReservationController {
  return new ReservationController(service ?? makeService())
}

// ──────────────────────────────────────────────────────────────────────
// 🛒前台 — 复杂到店接待和即时预约处理
// ──────────────────────────────────────────────────────────────────────
describe('🛒前台 — 即时预约接待视角', () => {
  it('前台为到店客人创建即时预约并确认', () => {
    const svc = makeService()
    const ctrl = makeController(svc)

    // 创建预约
    const r = ctrl.createReservation(tenantCtx(), {
      ...BASE_BODY,
      userId: 'u-walkin',
      userName: '到店客人王五',
      remark: '到店直接预约',
    })
    assert.equal(r.status, ReservationStatus.Pending)
    assert.equal(r.userName, '到店客人王五')

    // 前台即时确认
    const confirmed = ctrl.updateReservation(tenantCtx(), r.id, {
      status: ReservationStatus.Confirmed,
    })
    assert.equal(confirmed.status, ReservationStatus.Confirmed)
    assert.ok(confirmed.updatedAt instanceof Date)

    // 使用 findOne 验证
    const found = ctrl.findOne(tenantCtx(), r.id)
    assert.equal(found.id, r.id)
    assert.equal(found.status, ReservationStatus.Confirmed)
  })

  it('前台查询客人历史预约（同一用户全部记录）', () => {
    const svc = makeService()
    const ctrl = makeController(svc)

    // 为用户创建多个预约
    ctrl.createReservation(tenantCtx(), { ...BASE_BODY, userId: 'u-hist', userName: '历史用户', startTime: '2026-06-01T10:00:00.000Z', endTime: '2026-06-01T11:00:00.000Z' })
    ctrl.createReservation(tenantCtx(), { ...BASE_BODY, userId: 'u-hist', userName: '历史用户', startTime: '2026-06-05T10:00:00.000Z', endTime: '2026-06-05T11:00:00.000Z', resourceId: 'room-other', resourceName: '其他包厢' })
    ctrl.createReservation(tenantCtx(), { ...BASE_BODY, userId: 'u-other', userName: '其他用户', resourceId: 'room-other', resourceName: '其他包厢' })

    const hist = ctrl.findByUser(tenantCtx(), 'u-hist')
    assert.equal(hist.length, 2)
    for (const r of hist) {
      assert.equal(r.userId, 'u-hist')
    }

    // 其他用户只有 1 条
    const other = ctrl.findByUser(tenantCtx(), 'u-other')
    assert.equal(other.length, 1)
  })

  it('前台创建重复时间冲突预约（同一资源时间段重叠）', () => {
    const svc = makeService()
    const ctrl = makeController(svc)

    // 创建并确认第一个预约
    const r1 = ctrl.createReservation(tenantCtx(), BASE_BODY)
    ctrl.updateReservation(tenantCtx(), r1.id, { status: ReservationStatus.Confirmed })

    // 同一资源同一时间段创建第二个预约（创建不触发冲突，确认时触发）
    const r2 = ctrl.createReservation(tenantCtx(), {
      ...BASE_BODY,
      userId: 'u-conflict-02',
      userName: '冲突用户',
    })

    // 确认时触发时间冲突
    assert.throws(() => {
      ctrl.updateReservation(tenantCtx(), r2.id, { status: ReservationStatus.Confirmed })
    }, /is already booked/)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🎯运行专员 — 全状态流转管理和运营调度
// ──────────────────────────────────────────────────────────────────────
describe('🎯运行专员 — 预约状态全生命周期视角', () => {
  it('运行专员执行预约完整状态链：Pending → Confirmed → InProgress → Completed', () => {
    const svc = makeService()
    const ctrl = makeController(svc)

    const r = ctrl.createReservation(tenantCtx(), {
      ...BASE_BODY,
      resourceId: 'room-full-cycle',
      resourceName: '全生命周期包厢',
      price: 500,
      deposit: 100,
    })
    assert.equal(r.status, ReservationStatus.Pending)

    // Pending → Confirmed
    const c1 = ctrl.updateReservation(tenantCtx(), r.id, { status: ReservationStatus.Confirmed })
    assert.equal(c1.status, ReservationStatus.Confirmed)

    // Confirmed → InProgress
    const c2 = ctrl.updateReservation(tenantCtx(), r.id, { status: ReservationStatus.InProgress })
    assert.equal(c2.status, ReservationStatus.InProgress)

    // InProgress → Completed
    const c3 = ctrl.updateReservation(tenantCtx(), r.id, { status: ReservationStatus.Completed })
    assert.equal(c3.status, ReservationStatus.Completed)

    // 查询最终状态
    const final = ctrl.findOne(tenantCtx(), r.id)
    assert.equal(final.status, ReservationStatus.Completed)
  })

  it('运行专员处理取消预约（Pending → Cancelled 和 Confirmed → Cancelled）', () => {
    const svc = makeService()
    const ctrl = makeController(svc)

    // Pending 取消
    const r1 = ctrl.createReservation(tenantCtx(), {
      ...BASE_BODY,
      resourceId: 'room-cancel-1',
      userId: 'u-cancel-1',
    })
    const cancelled1 = ctrl.cancelReservation(tenantCtx(), r1.id, '客人行程变更')
    assert.equal(cancelled1.status, ReservationStatus.Cancelled)
    assert.equal(cancelled1.cancelledReason, '客人行程变更')

    // Confirmed 取消
    const r2 = ctrl.createReservation(tenantCtx(), {
      ...BASE_BODY,
      resourceId: 'room-cancel-2',
      userId: 'u-cancel-2',
    })
    ctrl.updateReservation(tenantCtx(), r2.id, { status: ReservationStatus.Confirmed })
    const cancelled2 = ctrl.cancelReservation(tenantCtx(), r2.id, '门店系统升级')
    assert.equal(cancelled2.status, ReservationStatus.Cancelled)
    assert.equal(cancelled2.cancelledReason, '门店系统升级')
  })

  it('运行专员验证非法状态流转全部被拦截', () => {
    const svc = makeService()
    const ctrl = makeController(svc)

    // 创建 pending 预约后直接尝试以下非法流转
    const r = ctrl.createReservation(tenantCtx(), BASE_BODY)

    // Pending → Completed: 非法
    assert.throws(() => {
      ctrl.updateReservation(tenantCtx(), r.id, { status: ReservationStatus.Completed })
    }, /Invalid reservation status transition/)

    // Pending → Cancelled: 允许（通过 cancelReservation）
    const cancelled = ctrl.cancelReservation(tenantCtx(), r.id, '直接取消')
    assert.equal(cancelled.status, ReservationStatus.Cancelled)

    // Cancelled → Confirmed: 非法（已取消不能逆转）
    assert.throws(() => {
      ctrl.updateReservation(tenantCtx(), r.id, { status: ReservationStatus.Confirmed })
    }, /Invalid reservation status transition/)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🎮导玩员 — 设备预约排程和冲突检测
// ──────────────────────────────────────────────────────────────────────
describe('🎮导玩员 — 设备预约排程视角', () => {
  it('导玩员按资源 ID 查询预约时间排程', () => {
    const svc = makeService()
    const ctrl = makeController(svc)

    // 为同一设备创建多个预约
    ctrl.createReservation(tenantCtx(), {
      ...BASE_BODY, resourceId: 'gear-ps5-01', resourceName: 'PS5-01',
      userId: 'u-device1', startTime: '2026-07-02T10:00:00.000Z', endTime: '2026-07-02T11:00:00.000Z',
    })
    ctrl.createReservation(tenantCtx(), {
      ...BASE_BODY, resourceId: 'gear-ps5-01', resourceName: 'PS5-01',
      userId: 'u-device2', startTime: '2026-07-02T14:00:00.000Z', endTime: '2026-07-02T15:00:00.000Z',
    })

    const deviceReservations = ctrl.findByResource(tenantCtx(), 'gear-ps5-01')
    assert.equal(deviceReservations.length, 2)
    for (const r of deviceReservations) {
      assert.equal(r.resourceId, 'gear-ps5-01')
    }
  })

  it('导玩员使用 checkConflict 判断设备空闲时段', () => {
    const svc = makeService()
    const ctrl = makeController(svc)

    // 已有预约 10:00-12:00 被确认
    const r1 = ctrl.createReservation(tenantCtx(), {
      ...BASE_BODY, resourceId: 'gear-vr-01', resourceName: 'VR-01',
      startTime: '2026-07-01T10:00:00.000Z',
      endTime: '2026-07-01T12:00:00.000Z',
    })
    ctrl.updateReservation(tenantCtx(), r1.id, { status: ReservationStatus.Confirmed })

    // 同一设备不同非重叠时段: 无冲突
    const noConflict = ctrl.checkConflict(tenantCtx(), 'gear-vr-01', '2026-07-01T13:00:00.000Z', '2026-07-01T14:00:00.000Z')
    assert.equal(noConflict.hasConflict, false)

    // 搜索不存在的设备（无预约的资源）
    const nonExist = ctrl.checkConflict(tenantCtx(), 'non-existent-device', '2026-07-01T10:00:00.000Z', '2026-07-01T11:00:00.000Z')
    assert.equal(nonExist.hasConflict, false)
  })

  it('导玩员查询用户预约（判断设备使用分配）', () => {
    const svc = makeService()
    const ctrl = makeController(svc)

    // 同一个用户预约多个设备
    ctrl.createReservation(tenantCtx(), { ...BASE_BODY, resourceId: 'gear-ps5-01', userId: 'u-gamer', userName: '游戏玩家' })
    ctrl.createReservation(tenantCtx(), { ...BASE_BODY, resourceId: 'gear-vr-01', resourceName: 'VR-01', userId: 'u-gamer', userName: '游戏玩家' })

    const userReservations = ctrl.findByUser(tenantCtx(), 'u-gamer')
    assert.equal(userReservations.length, 2)
    for (const r of userReservations) {
      assert.equal(r.userId, 'u-gamer')
    }
  })
})

// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 活动场地预约和营销活动调度
// ──────────────────────────────────────────────────────────────────────
describe('📢营销 — 活动场地调度视角', () => {
  it('营销专员预约大时段场地用于促销活动', () => {
    const ctrl = makeController()
    const r = ctrl.createReservation(tenantCtx(), {
      ...BASE_BODY,
      type: ReservationType.Venue,
      resourceId: 'venue-plaza',
      resourceName: '门店广场',
      userId: 'u-market',
      userName: '活动策划专员',
      startTime: '2026-08-01T08:00:00.000Z',
      endTime: '2026-08-01T20:00:00.000Z',
      duration: 720,
      price: 3000,
      deposit: 1000,
      remark: '暑期促销嘉年华',
    })
    assert.equal(r.status, ReservationStatus.Pending)
    assert.equal(r.resourceName, '门店广场')
    assert.equal(r.duration, 720)
    assert.equal(r.price, 3000)
    assert.equal(r.remark, '暑期促销嘉年华')
  })

  it('营销专员按时间范围查询可用场地（避免多活动冲突）', () => {
    const svc = makeService()
    const ctrl = makeController(svc)

    // 在 7 月已经预约了广场
    const rPlaza = ctrl.createReservation(tenantCtx(), {
      ...BASE_BODY,
      resourceId: 'venue-plaza',
      resourceName: '门店广场',
      userId: 'u-summer',
      userName: '暑期活动',
      startTime: '2026-07-15T09:00:00.000Z',
      endTime: '2026-07-15T18:00:00.000Z',
      duration: 540,
      price: 2500,
      deposit: 500,
    })
    ctrl.updateReservation(tenantCtx(), rPlaza.id, { status: ReservationStatus.Confirmed })

    // 查询 7 月的预约
    const july = ctrl.findByTimeRange(tenantCtx(), '2026-07-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z')
    assert.equal(july.length, 1)

    // 查询 8 月（没有预约）
    const august = ctrl.findByTimeRange(tenantCtx(), '2026-08-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z')
    assert.equal(august.length, 0)
  })

  it('营销专员查看预约详情用于活动物料准备', () => {
    const svc = makeService()
    const ctrl = makeController(svc)

    const r = ctrl.createReservation(tenantCtx(), {
      ...BASE_BODY,
      resourceId: 'exhibition-hall',
      resourceName: '展销厅',
      userId: 'u-expo',
      userName: '展会专员',
      duration: 480,
      deposit: 2000,
      remark: '新品发布会及媒体签到',
    })

    const detail = ctrl.findOne(tenantCtx(), r.id)
    assert.equal(detail.resourceName, '展销厅')
    assert.equal(detail.deposit, 2000)
    assert.equal(detail.remark, '新品发布会及媒体签到')
    assert.ok(detail.createdAt instanceof Date)

    // 活动物料准备需要完整预约信息
    assert.ok(detail.startTime)
    assert.ok(detail.endTime)
    assert.equal(detail.userName, '展会专员')
  })
})
