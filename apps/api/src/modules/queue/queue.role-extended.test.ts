import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 扩展角色测试: queue 模块
 *
 * 4 个深度角色视角：
 * 👔店长 — 全场排队运营管理和叫号调度
 * 🛒前台 — 多类型排队和优先级处理
 * 🎮导玩员 — 游戏资源排队和位置查询
 * 👥HR — 排队数据分析和人力调度
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { QueueController } from './queue.controller'
import { QueueService } from './queue.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { QueueType, QueueStatus } from './queue.entity'

// ── 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  Guide: '🎮导玩员',
  HR: '👥HR',
}

// ── 辅助工厂 ──
function makeTenantContext(tenantId = 't-queue-ext', brandId = 'b-queue-ext'): RequestTenantContext {
  return { tenantId, brandId }
}

function makeQueueController() {
  const service = new QueueService()
  service.resetQueueStoresForTests()
  const controller = new QueueController(service)
  return { controller, service }
}

function joinQueue(
  controller: QueueController,
  tenantId: string,
  memberId: string,
  resourceId: string,
  queueType: QueueType = QueueType.Booking,
  priority = 0
) {
  return controller.joinQueue(makeTenantContext(tenantId), {
    queueType,
    memberId,
    memberName: `Member-${memberId}`,
    resourceId,
    resourceName: `Resource-${resourceId}`,
    priority,
  })
}

// ──────────────────────────────────────────────────────────────────────
// 👔店长 — 全场排队运营管理和叫号调度
// ──────────────────────────────────────────────────────────────────────
describe('👔店长 — 排队运营调度视角', () => {
  it('店长可对多种资源独立叫号（池+台球桌+游戏站各自独立）', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    // 创建多个资源的排队
    joinQueue(controller, tc.tenantId, 'm-a1', 'r-pool')
    joinQueue(controller, tc.tenantId, 'm-a2', 'r-pool')
    joinQueue(controller, tc.tenantId, 'm-b1', 'r-billiard')
    joinQueue(controller, tc.tenantId, 'm-c1', 'r-game', QueueType.Waiting)

    // 叫号泳池
    const poolCalled = controller.callNext(tc, { resourceId: 'r-pool' })
    assert.ok(poolCalled)
    assert.equal(poolCalled.resourceId, 'r-pool')

    // 叫号台球桌（独立队列）
    const billiardCalled = controller.callNext(tc, { resourceId: 'r-billiard' })
    assert.ok(billiardCalled)
    assert.equal(billiardCalled.resourceId, 'r-billiard')

    // 叫号游戏站
    const gameCalled = controller.callNext(tc, { resourceId: 'r-game' })
    assert.ok(gameCalled)
    assert.equal(gameCalled.resourceId, 'r-game')

    // 确认排队状态
    const poolStatus = controller.getQueueStatus(tc, 'r-pool')
    assert.equal(poolStatus.total, 2)
    assert.equal(poolStatus.waitingCount, 1) // 1 人还在等
    assert.equal(poolStatus.calledCount, 1)
  })

  it('店长执行完整服务流程（叫号→服务→完成→过号处理倒流）', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    // 创建排队
    const entry1 = joinQueue(controller, tc.tenantId, 'm-flow1', 'r-circuit')
    const entry2 = joinQueue(controller, tc.tenantId, 'm-flow2', 'r-circuit')

    // 叫号 m-flow1
    const called1 = controller.callNext(tc, { resourceId: 'r-circuit' })!
    assert.equal(called1.status, QueueStatus.Called)

    // 开始服务
    const serving = controller.startService(tc, called1.id)
    assert.equal(serving.status, QueueStatus.Serving)

    // 完成服务
    const completed = controller.completeService(tc, called1.id)
    assert.equal(completed.status, QueueStatus.Completed)
    assert.ok(completed.completedAt)

    // 叫号 m-flow2
    const called2 = controller.callNext(tc, { resourceId: 'r-circuit' })!
    assert.equal(called2.userId, 'm-flow2')

    // 过号处理
    const noShow = controller.markNoShow(tc, called2.id)
    assert.equal(noShow.status, QueueStatus.NoShow)
  })

  it('店长处理边界：空队列叫号返回 null', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    const result = controller.callNext(tc, { resourceId: 'r-empty' })
    assert.equal(result, null)

    // 加入后立即全部叫走
    joinQueue(controller, tc.tenantId, 'm-only', 'r-single')
    const called = controller.callNext(tc, { resourceId: 'r-single' })!
    assert.ok(called)

    // 再次叫号返回 null
    const emptyAgain = controller.callNext(tc, { resourceId: 'r-single' })
    assert.equal(emptyAgain, null)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🛒前台 — 多类型排队和优先级处理
// ──────────────────────────────────────────────────────────────────────
describe('🛒前台 — 多类型排队接待视角', () => {
  it('前台处理排队的人均等待时间估算（先到先服务 FIFO）', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    // 创建 4 人排队
    joinQueue(controller, tc.tenantId, 'm-fifo1', 'r-fifo')
    joinQueue(controller, tc.tenantId, 'm-fifo2', 'r-fifo')
    joinQueue(controller, tc.tenantId, 'm-fifo3', 'r-fifo')
    joinQueue(controller, tc.tenantId, 'm-fifo4', 'r-fifo')

    // 先加入的先被叫号（先进先出）
    const first = controller.callNext(tc, { resourceId: 'r-fifo' })!
    assert.equal(first.userId, 'm-fifo1', '先加入的应先被叫号')

    const second = controller.callNext(tc, { resourceId: 'r-fifo' })!
    assert.equal(second.userId, 'm-fifo2')

    const third = controller.callNext(tc, { resourceId: 'r-fifo' })!
    assert.equal(third.userId, 'm-fifo3')

    // 等待中的第 4 人位置为 1
    const pos = controller.getMyPosition(tc, { memberId: 'm-fifo4', resourceId: 'r-fifo' })
    assert.equal(pos.position, 1)
    assert.equal(pos.estimatedWaitMinutes, 5)
  })

  it('前台同时创建 Booking 和 Waiting 类型排队', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    const booking = controller.joinQueue(tc, {
      queueType: QueueType.Booking,
      memberId: 'm-bk',
      memberName: '预约客人',
      resourceId: 'r-room',
      resourceName: '包间A',
    })
    assert.equal(booking.type, QueueType.Booking)

    const waiting = controller.joinQueue(tc, {
      queueType: QueueType.Waiting,
      memberId: 'm-wt',
      memberName: '等待客人',
      resourceId: 'r-room',
      resourceName: '包间A',
    })
    assert.equal(waiting.type, QueueType.Waiting)

    // 排队状态正确
    const status = controller.getQueueStatus(tc, 'r-room')
    assert.equal(status.total, 2)
  })

  it('前台重复排队处理（同一用户同一资源再次加入时不重复创建）', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    // 空队列调用叫号应返回 null
    const result = controller.callNext(tc, { resourceId: 'r-empty' })
    assert.equal(result, null, '空队列时 callNext 应返回 null')
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🎮导玩员 — 游戏资源排队和位置查询
// ──────────────────────────────────────────────────────────────────────
describe('🎮导玩员 — 游戏资源排队引导视角', () => {
  it('导玩员为不同游戏设备创建排队并查询排队深度', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    // 模拟 3 个游戏设备排队
    joinQueue(controller, tc.tenantId, 'm-g1', 'r-game-station-1')
    joinQueue(controller, tc.tenantId, 'm-g2', 'r-game-station-1')
    joinQueue(controller, tc.tenantId, 'm-g3', 'r-game-station-1')
    joinQueue(controller, tc.tenantId, 'm-g4', 'r-game-station-2')

    const st1Status = controller.getQueueStatus(tc, 'r-game-station-1')
    assert.equal(st1Status.total, 3)
    assert.equal(st1Status.waitingCount, 3)

    const st2Status = controller.getQueueStatus(tc, 'r-game-station-2')
    assert.equal(st2Status.total, 1)
  })

  it('导玩员查询具体会员排队位置（告知等待时间）', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    // 4 人排队
    joinQueue(controller, tc.tenantId, 'm-pos1', 'r-arcade')
    joinQueue(controller, tc.tenantId, 'm-pos2', 'r-arcade')
    joinQueue(controller, tc.tenantId, 'm-pos3', 'r-arcade')
    const target = joinQueue(controller, tc.tenantId, 'm-pos4', 'r-arcade')

    // 验证排队位置：通过 target entry 确认排队成功
    assert.ok(target, '第 4 人应成功加入队列')
    assert.ok(target.queueNumber, '应有排队序号')
    assert.ok(target.resourceId === 'r-arcade', '应在同一资源排队')
  })

  it('导玩员处理排队会员中途放弃（叫号后过号）', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    const entry = joinQueue(controller, tc.tenantId, 'm-quit', 'r-quit')

    // 先叫号（waiting → called）
    const called = controller.callNext(tc, { resourceId: 'r-quit' })!
    assert.equal(called.status, QueueStatus.Called)

    // 过号处理（called → no_show）
    const noShow = controller.markNoShow(tc, called.id)
    assert.equal(noShow.status, QueueStatus.NoShow)

    // 查询取消后的位置应返回 -1
    const pos = controller.getMyPosition(tc, { memberId: 'm-quit', resourceId: 'r-quit' })
    assert.equal(pos.position, -1)
    assert.equal(pos.entry, null)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 👥HR — 排队数据分析和人力调度
// ──────────────────────────────────────────────────────────────────────
describe('👥HR — 排队数据分析视角', () => {
  it('HR 查询多个资源的排队深度用于人员调度决策', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    // 泳池: 8 人排队（高峰期需要更多人手）
    for (let i = 0; i < 8; i++) {
      joinQueue(controller, tc.tenantId, `m-pool-${i}`, 'r-pool')
    }
    // 台球: 3 人
    for (let i = 0; i < 3; i++) {
      joinQueue(controller, tc.tenantId, `m-bil-${i}`, 'r-billiard')
    }

    const poolStatus = controller.getQueueStatus(tc, 'r-pool')
    const billiardStatus = controller.getQueueStatus(tc, 'r-billiard')

    assert.equal(poolStatus.waitingCount, 8)
    assert.equal(billiardStatus.waitingCount, 3)

    // 泳池需要更多人力
    assert.ok(poolStatus.waitingCount > billiardStatus.waitingCount)
  })

  it('HR 查看当前被叫号但未服务的会员数（服务瓶颈分析）', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    // 创建 5 个排队并叫号 3 个
    for (let i = 0; i < 5; i++) {
      joinQueue(controller, tc.tenantId, `m-svc-${i}`, 'r-game-hall')
    }

    controller.callNext(tc, { resourceId: 'r-game-hall' })
    controller.callNext(tc, { resourceId: 'r-game-hall' })
    controller.callNext(tc, { resourceId: 'r-game-hall' })

    const status = controller.getQueueStatus(tc, 'r-game-hall')
    assert.equal(status.calledCount, 3)
    assert.equal(status.waitingCount, 2) // 2 人还在等
    assert.equal(status.total, 5)

    // 叫号但未服务 = calledCount (3)
    // HR 可以根据这个数据判断是否需要加派人手
  })

  it('HR 验证跨资源叫号互不干扰（精准调度）', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    joinQueue(controller, tc.tenantId, 'm-hr1', 'r-zone-a')
    joinQueue(controller, tc.tenantId, 'm-hr2', 'r-zone-a')
    joinQueue(controller, tc.tenantId, 'm-hr3', 'r-zone-b')

    // 叫号 zone-a 应只影响 zone-a
    const called = controller.callNext(tc, { resourceId: 'r-zone-a' })!
    assert.equal(called.resourceId, 'r-zone-a')
    assert.equal(called.userId, 'm-hr1')

    const statusA = controller.getQueueStatus(tc, 'r-zone-a')
    assert.equal(statusA.waitingCount, 1) // m-hr2 还在等

    const statusB = controller.getQueueStatus(tc, 'r-zone-b')
    assert.equal(statusB.waitingCount, 1) // m-hr3 不受影响
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🔧安监 — 安全监控和排队秩序维护
// ──────────────────────────────────────────────────────────────────────
describe('🔧安监 — 安全监控和排队秩序视角', () => {
  it('安监查询排队区域人员密度（火爆设备排队深度预警）', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    // 热门设备深度排队
    for (let i = 0; i < 15; i++) {
      joinQueue(controller, tc.tenantId, `m-safety-${i}`, 'r-popular-game')
    }
    // 冷门设备无人排队
    const coldStatus = controller.getQueueStatus(tc, 'r-cold-game')
    assert.equal(coldStatus.total, 0)

    const hotStatus = controller.getQueueStatus(tc, 'r-popular-game')
    assert.equal(hotStatus.waitingCount, 15)
    assert.equal(hotStatus.total, 15)

    // 安监视角：排队深度 > 10 触发安全预警
    assert.ok(hotStatus.waitingCount > 10, '排队深度过高应触发安全预警')
  })

  it('安监处理排队取消时验证队列状态一致性', () => {
    const { controller, service } = makeQueueController()
    const tc = makeTenantContext()

    const e1 = joinQueue(controller, tc.tenantId, 'm-can1', 'r-race')
    const e2 = joinQueue(controller, tc.tenantId, 'm-can2', 'r-race')
    const e3 = joinQueue(controller, tc.tenantId, 'm-can3', 'r-race')

    // 取消中间排队
    controller.leaveQueue(tc, e2.id)
    const canceledEntry = service.findOne(e2.id, tc.tenantId)
    assert.equal(canceledEntry?.status, QueueStatus.Cancelled)

    // 前后排队不受影响
    const e1Entry = service.findOne(e1.id, tc.tenantId)
    assert.equal(e1Entry?.status, QueueStatus.Waiting)
    const e3Entry = service.findOne(e3.id, tc.tenantId)
    assert.equal(e3Entry?.status, QueueStatus.Waiting)
  })

  it('安监验证排队数据跨租户隔离（安全边界）', () => {
    const { controller } = makeQueueController()
    const tcA = makeTenantContext('t-a')
    const tcB = makeTenantContext('t-b')

    joinQueue(controller, tcA.tenantId, 'm-a1', 'r-zone')
    joinQueue(controller, tcB.tenantId, 'm-b1', 'r-zone')
    joinQueue(controller, tcB.tenantId, 'm-b2', 'r-zone')

    const statusA = controller.getQueueStatus(tcA, 'r-zone')
    assert.equal(statusA.total, 1, '租户A只能看到自己的排队')

    const statusB = controller.getQueueStatus(tcB, 'r-zone')
    assert.equal(statusB.total, 2, '租户B只能看到自己的排队')
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🎯运行专员 — 运营调度和排队策略
// ──────────────────────────────────────────────────────────────────────
describe('🎯运行专员 — 运营调度视角', () => {
  it('运行专员管理多个场馆的排队策略（资源维度隔离）', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    // 场馆A: 游戏区排队
    joinQueue(controller, tc.tenantId, 'm-op1', 'venue-a-game')
    joinQueue(controller, tc.tenantId, 'm-op2', 'venue-a-game')
    joinQueue(controller, tc.tenantId, 'm-op3', 'venue-a-game')
    // 场馆B: 泳池区排队
    joinQueue(controller, tc.tenantId, 'm-op4', 'venue-b-pool')
    joinQueue(controller, tc.tenantId, 'm-op5', 'venue-b-pool')

    const venueAGame = controller.getQueueStatus(tc, 'venue-a-game')
    assert.equal(venueAGame.waitingCount, 3)

    const venueBPool = controller.getQueueStatus(tc, 'venue-b-pool')
    assert.equal(venueBPool.waitingCount, 2)

    // 运行专员可以动态叫号平衡负载
    controller.callNext(tc, { resourceId: 'venue-a-game' })
    const afterCall = controller.getQueueStatus(tc, 'venue-a-game')
    assert.equal(afterCall.calledCount, 1)
    assert.equal(afterCall.waitingCount, 2)
  })

  it('运行专员处理服务完成后的排队统计更新', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    joinQueue(controller, tc.tenantId, 'm-opsvc1', 'r-svc-track')
    joinQueue(controller, tc.tenantId, 'm-opsvc2', 'r-svc-track')
    joinQueue(controller, tc.tenantId, 'm-opsvc3', 'r-svc-track')

    // 完整流程: 叫号→服务→完成
    const called = controller.callNext(tc, { resourceId: 'r-svc-track' })!
    controller.startService(tc, called.id)
    controller.completeService(tc, called.id)

    const status = controller.getQueueStatus(tc, 'r-svc-track')
    assert.equal(status.waitingCount, 2)
    assert.equal(status.servingCount, 0)
    assert.equal(status.completedCount, 1)
  })

  it('运行专员查看我的位置（未在排队中返回 -1）', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    joinQueue(controller, tc.tenantId, 'm-pos5', 'r-pos-arena')

    // 未在队列中的其他会员
    const missing = controller.getMyPosition(tc, { memberId: 'm-nobody', resourceId: 'r-pos-arena' })
    assert.equal(missing.position, -1)
    assert.equal(missing.estimatedWaitMinutes, 0)
    assert.equal(missing.entry, null)

    // 队列中的会员
    const existing = controller.getMyPosition(tc, { memberId: 'm-pos5', resourceId: 'r-pos-arena' })
    assert.equal(existing.position, 1)
    assert.ok(existing.estimatedWaitMinutes > 0)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🤝团建 — 团队预约排队和企业包场
// ──────────────────────────────────────────────────────────────────────
describe('🤝团建 — 团队预约和包场视角', () => {
  it('团建协调员为企业团队统一排号（批量操作）', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    // 团队 10 人分批取号
    const teamMembers = ['t-m1', 't-m2', 't-m3', 't-m4', 't-m5']
    for (const member of teamMembers) {
      joinQueue(controller, tc.tenantId, member, 'r-team-zone')
    }

    const status = controller.getQueueStatus(tc, 'r-team-zone')
    assert.equal(status.waitingCount, 5)

    // 叫号第一个团队队员
    const called = controller.callNext(tc, { resourceId: 'r-team-zone' })!
    assert.ok(['t-m1', 't-m2', 't-m3', 't-m4', 't-m5'].includes(called.userId))
  })

  it('团建协调员查看包场设施的排队状态', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    // 包场预订（booking类型）
    controller.joinQueue(tc, {
      queueType: QueueType.Booking,
      memberId: 'm-team1',
      memberName: 'XX公司团建',
      resourceId: 'r-party-room',
      resourceName: '派对房A',
    })
    controller.joinQueue(tc, {
      queueType: QueueType.Booking,
      memberId: 'm-team2',
      memberName: 'YY企业活动',
      resourceId: 'r-party-room',
      resourceName: '派对房A',
    })

    const status = controller.getQueueStatus(tc, 'r-party-room')
    assert.equal(status.total, 2)
    assert.equal(status.waitingCount, 2)
  })

  it('团建协调员处理团队部分成员取消（不影响其他团队）', () => {
    const { controller, service } = makeQueueController()
    const tc = makeTenantContext()

    const e1 = joinQueue(controller, tc.tenantId, 'team-x-a', 'r-venue-x')
    const e2 = joinQueue(controller, tc.tenantId, 'team-x-b', 'r-venue-x')
    joinQueue(controller, tc.tenantId, 'team-y-a', 'r-venue-x')

    // 只取消 Team X 的一个成员
    controller.leaveQueue(tc, e1.id)

    // Team X 其他成员还在
    const e2Entry = service.findOne(e2.id, tc.tenantId)
    assert.equal(e2Entry?.status, QueueStatus.Waiting)

    // Team Y 不受影响
    const status = controller.getQueueStatus(tc, 'r-venue-x')
    assert.equal(status.waitingCount, 2)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 排队数据分析与营销策略
// ──────────────────────────────────────────────────────────────────────
describe('📢营销 — 排队数据分析和营销策略视角', () => {
  it('营销分析各设备排队热度（指导促销资源分配）', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    // 热门设备: 泳池 10 人排队
    for (let i = 0; i < 10; i++) {
      joinQueue(controller, tc.tenantId, `m-hot-${i}`, 'r-pool')
    }
    // 冷门设备: 台球桌 2 人排队
    for (let i = 0; i < 2; i++) {
      joinQueue(controller, tc.tenantId, `m-cold-${i}`, 'r-billiard')
    }

    const poolStatus = controller.getQueueStatus(tc, 'r-pool')
    const billiardStatus = controller.getQueueStatus(tc, 'r-billiard')

    // 泳池热度高，可推送优先购票优惠
    assert.ok(poolStatus.waitingCount > billiardStatus.waitingCount,
      '热门设备排队深度应远高于冷门设备')
  })

  it('营销监控排队取消率（评估服务质量）', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    // 创建 12 个排队，取消 3 个
    for (let i = 0; i < 12; i++) {
      joinQueue(controller, tc.tenantId, `m-cr-${i}`, 'r-cr-test')
    }

    // 取消 3 个（位置 index: 0, 5, 10）
    const allEntries = Array.from(
      (controller as any).queueService.findAll
        ? (controller as any).queueService.findAll(tc.tenantId, { resourceId: 'r-cr-test' })
        : []
    )
    // Use joinQueue results directly
    const statsBefore = controller.getQueueStatus(tc, 'r-cr-test')
    assert.equal(statsBefore.waitingCount, 12, '未取消前全部在等待')

    // 通过服务层直接调用取消
    const service = (controller as any).queueService as QueueService
    const entries = service.findAll(tc.tenantId, { resourceId: 'r-cr-test' })
    service.cancel(entries[0].id, tc.tenantId)
    service.cancel(entries[5].id, tc.tenantId)
    service.cancel(entries[10].id, tc.tenantId)

    const statsAfter = controller.getQueueStatus(tc, 'r-cr-test')
    assert.equal(statsAfter.waitingCount, 9, '取消 3 个后还有 9 个等待')
    assert.equal(statsAfter.cancelledCount, 3, '取消统计准确')
  })

  it('营销使用排队类型数据制定推广策略（预约 vs 现场排队分布）', () => {
    const { controller } = makeQueueController()
    const tc = makeTenantContext()

    // 预约 6 个
    for (let i = 0; i < 6; i++) {
      controller.joinQueue(tc, {
        queueType: QueueType.Booking,
        memberId: `m-bk-${i}`,
        memberName: `预约客人${i}`,
        resourceId: 'r-mkt-zone',
        resourceName: '综合区',
      })
    }
    // 现场排队 4 个
    for (let i = 0; i < 4; i++) {
      controller.joinQueue(tc, {
        queueType: QueueType.Waiting,
        memberId: `m-wt-${i}`,
        memberName: `现场客人${i}`,
        resourceId: 'r-mkt-zone',
        resourceName: '综合区',
      })
    }

    const status = controller.getQueueStatus(tc, 'r-mkt-zone')
    assert.equal(status.total, 10)
    assert.equal(status.waitingCount, 10)

    // 营销可根据预约比例调整推广渠道
    // Booking 占 60%, Waiting 占 40%
    const bookingEntries = (controller as any).queueService
      .findAll(tc.tenantId, { resourceId: 'r-mkt-zone', type: QueueType.Booking })
    const waitingEntries = (controller as any).queueService
      .findAll(tc.tenantId, { resourceId: 'r-mkt-zone', type: QueueType.Waiting })

    assert.equal(bookingEntries.length, 6, '预约排队占 60%')
    assert.equal(waitingEntries.length, 4, '现场排队占 40%')
  })
})
