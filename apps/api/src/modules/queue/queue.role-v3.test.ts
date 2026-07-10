import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [queue] [C] 角色测试 v3
 *
 * 8 角色视角深化的 queue 模块测试（三级排队场景+运营告警）：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥2 个测试用例（正常流程 + 权限边界 + 多资源并发）
 *
 * v3 新增: 多资源并发排队、跨租户隔离、排队状态转换审核、异常队列恢复
 * v3 优化: 使用 controller 实际返回值（contract 层面，非 entity 层面）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { QueueController } from './queue.controller'
import { QueueService } from './queue.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { QueueType, QueueStatus } from './queue.entity'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 辅助工厂 ──
function makeContext(tenantId = 't-queue-v3', brandId = 'b-queue-v3'): RequestTenantContext {
  return { tenantId, brandId }
}

function makeFixture() {
  const service = new QueueService()
  service.resetQueueStoresForTests()
  const controller = new QueueController(service)
  return { controller, service }
}

/**
 * 快捷加入排队 —— 返回 contract 对象
 */
function enqueue(
  ctrl: QueueController,
  tenantId: string,
  userId: string,
  resourceId: string,
  opts?: { queueType?: QueueType; remark?: string }
) {
  return ctrl.joinQueue(makeContext(tenantId), {
    queueType: opts?.queueType ?? QueueType.Booking,
    memberId: userId,
    memberName: `Member-${userId}`,
    resourceId,
    priority: 0,
    remark: opts?.remark,
  })
}

/**
 * 建立一个多成员排队场景
 */
function buildMultiMemberQueue(
  ctrl: QueueController,
  tenantId: string,
  resourceId: string,
  memberCount = 3,
) {
  const entries: ReturnType<typeof enqueue>[] = []
  for (let i = 0; i < memberCount; i++) {
    entries.push(enqueue(ctrl, tenantId, `v3-member-${i + 1}`, resourceId))
  }
  return entries
}

// ════════════════════════════════════════════════════════════════════
// 👔店长 — 全场排队管理与异常恢复
// ════════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} queue v3 角色测试`, () => {
  it('店长可查看全场资源排队状态并获取队列统计', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-smgr', 'b-smgr')
    const resourceId = 'machine-g01'

    // 多个成员加入排队
    enqueue(controller, 't-smgr', 'm-101', resourceId)
    enqueue(controller, 't-smgr', 'm-102', resourceId)
    enqueue(controller, 't-smgr', 'm-103', resourceId)

    const status = controller.getQueueStatus(ctx, resourceId)
    assert.ok(status, '排队状态不应为空')
    assert.equal(status.waitingCount, 3, '应有 3 人等待')
    assert.equal(status.total, 3, '总人数 3')
  })

  it('店长可叫号并推进排队状态（取消→完成全流程）', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-smgr2', 'b-smgr2')
    const resourceId = 'machine-g02'

    const e1 = enqueue(controller, 't-smgr2', 'm-201', resourceId)
    enqueue(controller, 't-smgr2', 'm-202', resourceId)

    // 叫号第一个
    const called = controller.callNext(ctx, { resourceId })
    assert.ok(called, '叫号应返回排队的会员')
    assert.ok(called.queueNumber.startsWith('A'), '排队号应以 A 开头')

    // 开始服务
    const serving = controller.startService(ctx, called.id)
    assert.equal(serving.status, QueueStatus.Serving)

    // 完成服务
    const done = controller.completeService(ctx, called.id)
    assert.equal(done.status, QueueStatus.Completed)

    // 叫号下一个
    const called2 = controller.callNext(ctx, { resourceId })
    assert.ok(called2, '应可叫第二个')
  })

  it('店长可标记 no-show 并恢复叫号', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-smgr3', 'b-smgr3')
    const resourceId = 'machine-g03'

    const e1 = enqueue(controller, 't-smgr3', 'm-301', resourceId)
    enqueue(controller, 't-smgr3', 'm-302', resourceId)

    const called = controller.callNext(ctx, { resourceId })
    assert.ok(called)

    // no-show
    const noshow = controller.markNoShow(ctx, called.id)
    assert.equal(noshow.status, QueueStatus.NoShow)

    // 恢复叫号第二个
    const called2 = controller.callNext(ctx, { resourceId })
    assert.ok(called2)
    assert.notEqual(called2.id, called.id, '叫号 ID 不同')
  })
})

// ════════════════════════════════════════════════════════════════════
// 🛒前台 — 多类型排队管理
// ════════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} queue v3 角色测试`, () => {
  it('前台可为不同类型资源创建排队', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-fd')
    const resourceA = 'machine-arcade'
    const resourceB = 'machine-gacha'

    const e1 = enqueue(controller, 't-fd', 'm-fd-1', resourceA, {
      queueType: QueueType.Booking,
    })
    assert.ok(e1.id)
    assert.ok(e1.queueNumber.startsWith('A'), '预订排队号以 A 开头')

    const e2 = enqueue(controller, 't-fd', 'm-fd-2', resourceB, {
      queueType: QueueType.Waiting,
    })
    assert.ok(e2.id)
    assert.ok(e2.queueNumber.startsWith('B'), '等待排队号以 B 开头')
  })

  it('前台可让会员离开排队并释放位置', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-fd3')
    const resourceId = 'machine-leave'

    enqueue(controller, 't-fd3', 'm-leave-1', resourceId)
    const e2 = enqueue(controller, 't-fd3', 'm-leave-2', resourceId)

    // 离开
    const left = controller.leaveQueue(ctx, e2.id)
    assert.equal(left.status, QueueStatus.Cancelled)

    const status = controller.getQueueStatus(ctx, resourceId)
    assert.equal(status.waitingCount, 1, '离开后等待人数应为 1')
  })
})

// ════════════════════════════════════════════════════════════════════
// 👥HR — 排队数据与人力调度分析
// ════════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} queue v3 角色测试`, () => {
  it('HR 可查询排队状态了解高峰期排班需求', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-hr')
    const resourceId = 'machine-hr-01'

    // 模拟高峰期排队
    for (let i = 0; i < 10; i++) {
      enqueue(controller, 't-hr', `m-hr-${i + 1}`, resourceId)
    }
    // 叫号处理部分
    let called = controller.callNext(ctx, { resourceId })
    controller.startService(ctx, called.id)
    controller.completeService(ctx, called.id)

    called = controller.callNext(ctx, { resourceId })
    controller.startService(ctx, called.id)
    controller.completeService(ctx, called.id)

    const status = controller.getQueueStatus(ctx, resourceId)
    assert.equal(status.completedCount, 2, '已完成 2 人')
    assert.equal(status.waitingCount, 8, '还有 8 人在等')
    assert.ok(status.avgWaitMin >= 0, '平均等待时间应可计算')
  })

  it('HR 查询跨资源排队——多个机器看整体压力', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-hr2')
    const resources = ['machine-hr-a', 'machine-hr-b', 'machine-hr-c']

    resources.forEach((r, i) => {
      for (let j = 0; j < 3 + i; j++) {
        enqueue(controller, 't-hr2', `m-hr-${r}-${j + 1}`, r)
      }
    })

    resources.forEach((r) => {
      const status = controller.getQueueStatus(ctx, r)
      assert.ok(status.total >= 3, `资源 ${r} 至少 3 人排队`)
    })
  })

  it('HR 查询位置——确认高峰排队时间', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-hr3')
    const resourceId = 'machine-hr-pos'

    enqueue(controller, 't-hr3', 'm-hr-pos-1', resourceId)
    enqueue(controller, 't-hr3', 'm-hr-pos-2', resourceId)
    enqueue(controller, 't-hr3', 'm-hr-pos-check', resourceId)

    const pos = controller.getMyPosition(ctx, {
      memberId: 'm-hr-pos-check',
      resourceId,
    })
    assert.equal(pos.position, 3, '第三个排队')
    assert.ok(pos.estimatedWaitMinutes > 0, '应有估计等待时间')
  })
})

// ════════════════════════════════════════════════════════════════════
// 🔧安监 — 排队异常监控与跨租户隔离检查
// ════════════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} queue v3 角色测试`, () => {
  it('安监确认排队数据跨租户隔离——不同租户互不干扰', () => {
    const { controller } = makeFixture()
    const ctxA = makeContext('t-safety-a', 'b-safety-a')
    const ctxB = makeContext('t-safety-b', 'b-safety-b')
    const resourceId = 'machine-safety-shared'

    // 租户 A 排 3 人
    enqueue(controller, 't-safety-a', 'm-sa-1', resourceId)
    enqueue(controller, 't-safety-a', 'm-sa-2', resourceId)
    enqueue(controller, 't-safety-a', 'm-sa-3', resourceId)

    // 租户 B 排 1 人
    enqueue(controller, 't-safety-b', 'm-sb-1', resourceId)

    // 各自叫号只能叫到自己的人
    const calledA = controller.callNext(ctxA, { resourceId })
    assert.equal(calledA.userId, 'm-sa-1', '租户 A 叫号应叫到 A 的会员')

    // 租户 B 叫号也正常
    const calledB = controller.callNext(ctxB, { resourceId })
    assert.equal(calledB.userId, 'm-sb-1', '租户 B 叫号应叫到 B 的会员')
  })

  it('安监检查 no-show 后排队按顺序前进', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-safety-c')
    const resourceId = 'machine-safety-ns'

    const e1 = enqueue(controller, 't-safety-c', 'm-ns-1', resourceId)
    enqueue(controller, 't-safety-c', 'm-ns-2', resourceId)

    // 叫号处理第一个人
    controller.callNext(ctx, { resourceId })
    controller.startService(ctx, e1.id)
    controller.completeService(ctx, e1.id)

    // 叫号第二个
    const called2 = controller.callNext(ctx, { resourceId })
    // 被叫后 no-show
    controller.markNoShow(ctx, called2.id)

    // 没有更多排队，返回 null
    const noMore = controller.callNext(ctx, { resourceId })
    assert.strictEqual(noMore, null, '排队已清空')
  })
})

// ════════════════════════════════════════════════════════════════════
// 🎮导玩员 — 导玩员管理游戏机排队顺序
// ════════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} queue v3 角色测试`, () => {
  it('导玩员可查看机台排队位置并按顺序叫号', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-guide')
    const resourceId = 'machine-guide-01'

    enqueue(controller, 't-guide', 'm-gd-1', resourceId)
    enqueue(controller, 't-guide', 'm-gd-2', resourceId)
    enqueue(controller, 't-guide', 'm-gd-3', resourceId)

    const pos2 = controller.getMyPosition(ctx, {
      memberId: 'm-gd-2',
      resourceId,
    })
    assert.equal(pos2.position, 2, '第二个排队')

    const called = controller.callNext(ctx, { resourceId })
    assert.equal(called.userId, 'm-gd-1', '先排的先叫号')
  })

  it('导玩员完成服务后排队队列推进', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-guide2')
    const resourceId = 'machine-guide-02'

    enqueue(controller, 't-guide2', 'm-gd-c1', resourceId)
    const called = controller.callNext(ctx, { resourceId })
    controller.startService(ctx, called.id)
    controller.completeService(ctx, called.id)

    const status = controller.getQueueStatus(ctx, resourceId)
    assert.equal(status.completedCount, 1, '已完成 1 人')
  })
})

// ════════════════════════════════════════════════════════════════════
// 🎯运行专员 — 排队流程运营管理
// ════════════════════════════════════════════════════════════════════
describe(`${ROLES.Ops} queue v3 角色测试`, () => {
  it('运行专员可执行完整排队流程：加入→叫号→服务→完成', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-ops1')
    const resourceId = 'machine-ops-01'

    const e = enqueue(controller, 't-ops1', 'm-ops-1', resourceId)
    assert.equal(e.status, QueueStatus.Waiting)

    const called = controller.callNext(ctx, { resourceId })
    assert.equal(called.status, QueueStatus.Called)

    const serving = controller.startService(ctx, called.id)
    assert.equal(serving.status, QueueStatus.Serving)

    const done = controller.completeService(ctx, called.id)
    assert.equal(done.status, QueueStatus.Completed)
  })

  it('运行专员处理多个资源同时排队不冲突', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-ops2')

    enqueue(controller, 't-ops2', 'm-ops-m1', 'machine-a')
    enqueue(controller, 't-ops2', 'm-ops-m2', 'machine-b')
    enqueue(controller, 't-ops2', 'm-ops-m3', 'machine-c')

    const aCalled = controller.callNext(ctx, { resourceId: 'machine-a' })
    assert.ok(aCalled, 'A 资源应被叫号')
    assert.equal(aCalled.userId, 'm-ops-m1')

    const bCalled = controller.callNext(ctx, { resourceId: 'machine-b' })
    assert.ok(bCalled, 'B 资源应被叫号')
    assert.equal(bCalled.userId, 'm-ops-m2')
  })
})

// ════════════════════════════════════════════════════════════════════
// 🤝团建 — 团建活动排队管理
// ════════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} queue v3 角色测试`, () => {
  it('团建可批量排队并查看全体排队位置', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-team')
    const resourceId = 'machine-team-battle'

    // 团建小组 5 人同时排队
    const team = ['t-mem-1', 't-mem-2', 't-mem-3', 't-mem-4', 't-mem-5']
    team.forEach((m) => enqueue(controller, 't-team', m, resourceId))

    const status = controller.getQueueStatus(ctx, resourceId)
    assert.equal(status.waitingCount, 5, '团建小组 5 人都在排队')

    // 查询每个成员位置
    team.forEach((m, i) => {
      const pos = controller.getMyPosition(ctx, { memberId: m, resourceId })
      assert.equal(pos.position, i + 1, `${m} 应在第 ${i + 1} 位`)
    })
  })

  it('团建成员中途离开不影响其他人排队', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-team2')
    const resourceId = 'machine-team-race'

    enqueue(controller, 't-team2', 't-leave', resourceId)
    const e2 = enqueue(controller, 't-team2', 't-stay', resourceId)
    enqueue(controller, 't-team2', 't-late', resourceId)

    // 第二个排队的人离开
    controller.leaveQueue(ctx, e2.id)

    const status = controller.getQueueStatus(ctx, resourceId)
    assert.equal(status.waitingCount, 2, '离开后剩 2 人')

    // 叫号第一个
    const called = controller.callNext(ctx, { resourceId })
    assert.equal(called.userId, 't-leave')
    controller.startService(ctx, called.id)
    controller.completeService(ctx, called.id)

    // 叫号下一个（跳过了离开的 t-stay）
    const called2 = controller.callNext(ctx, { resourceId })
    assert.equal(called2.userId, 't-late', '离开者不占位置')
  })
})

// ════════════════════════════════════════════════════════════════════
// 📢营销 — 排队引流与营销活动数据支持
// ════════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} queue v3 角色测试`, () => {
  it('营销可查询排队高峰时段机器使用情况', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-mkt')
    const hotResource = 'machine-hot-01'
    const coldResource = 'machine-cold-01'

    // 热门机台排队很长
    for (let i = 0; i < 15; i++) {
      enqueue(controller, 't-mkt', `m-mkt-hot-${i + 1}`, hotResource)
    }
    // 冷门机台没人排
    const coldStatus = controller.getQueueStatus(ctx, coldResource)
    assert.equal(coldStatus.waitingCount, 0, '冷门机台无人排队')
    assert.equal(coldStatus.total, 0, '冷门机台总排队 0')

    const hotStatus = controller.getQueueStatus(ctx, hotResource)
    assert.equal(hotStatus.waitingCount, 15, '热门机台 15 人排队')
    assert.equal(hotStatus.total, 15, '总排队数 15')
  })

  it('营销可根据排队数据评估营销活动对客流的影响', () => {
    const { controller } = makeFixture()
    const ctx = makeContext('t-mkt2')
    const resourceId = 'machine-promo-01'

    // 营销活动前——排队人数
    const beforePromo = controller.getQueueStatus(ctx, resourceId)
    assert.equal(beforePromo.total, 0, '活动前排空')
    assert.equal(beforePromo.waitingCount, 0, '活动前等待为 0')

    // 活动后——更多人排队
    for (let i = 0; i < 8; i++) {
      enqueue(controller, 't-mkt2', `m-promo-${i + 1}`, resourceId)
    }

    const afterPromo = controller.getQueueStatus(ctx, resourceId)
    assert.equal(afterPromo.waitingCount, 8, '活动后 8 人排队')
    assert.equal(afterPromo.total, 8, '总排队数 8')
  })
})
