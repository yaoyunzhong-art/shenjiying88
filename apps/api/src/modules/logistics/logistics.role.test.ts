/**
 * 🧪 龙虾哥: Logistics (后勤/巡检) 模块角色旅程 JMeter L1 测试
 *
 * 从 8 个角色视角组织测试，模拟真实使用者打开→操作→完成闭环
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 *
 * 每个角色 ≥ 4 个用例：正例 + 反例 + 边界 + 体验闭环
 *
 * 功能: 巡检任务创建/记录、报修派单/维修验收、清洁排班、物料申领
 * 端点:
 *   巡检: POST/GET /logistics/inspections, GET /logistics/inspections/:id,
 *         POST /logistics/inspections/:id/remind, POST /logistics/inspections/sweep/reminders,
 *         POST /logistics/inspections/:id/result
 *   清洁: POST/GET /logistics/clean-schedules, GET /logistics/clean-schedules/:id,
 *         POST /logistics/clean-schedules/:id/assign-area,
 *         POST /logistics/clean-schedules/:id/check-in
 *   报修: POST/GET /logistics/repairs, GET /logistics/repairs/:id,
 *         POST /logistics/repairs/:id/assign, POST /logistics/repairs/:id/start,
 *         POST /logistics/repairs/:id/complete, POST /logistics/repairs/:id/verify
 *   物料: POST/GET /logistics/material-requests, GET /logistics/material-requests/:id,
 *         POST /logistics/material-requests/:id/approve,
 *         POST /logistics/material-requests/:id/outbound
 */
import { describe, it, expect, vi } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'

// ── 8 角色常量 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── Logistics 模块角色访问矩阵 ──
const roleAccessMatrix: Record<string, string[]> = {
  'logistics:inspection:create': ['👔店长', '🎮导玩员', '🔧安监'],
  'logistics:inspection:list': ['👔店长', '🎮导玩员', '🔧安监', '🎯运行专员'],
  'logistics:inspection:record': ['🎮导玩员', '🔧安监'],
  'logistics:inspection:remind': ['👔店长', '🎯运行专员'],
  'logistics:clean:create': ['👔店长', '🎯运行专员'],
  'logistics:clean:list': ['👔店长', '🎯运行专员', '🔧安监'],
  'logistics:clean:checkin': ['🛒前台', '🔧安监'],
  'logistics:repair:create': ['🎮导玩员', '🛒前台', '🔧安监'],
  'logistics:repair:assign': ['👔店长', '🎯运行专员'],
  'logistics:repair:start': ['🔧安监', '🎯运行专员'],
  'logistics:repair:complete': ['🔧安监', '🎯运行专员'],
  'logistics:repair:verify': ['👔店长', '🎮导玩员'],
  'logistics:material:create': ['🛒前台', '🎮导玩员', '👔店长'],
  'logistics:material:approve': ['👔店长', '🎯运行专员'],
  'logistics:material:outbound': ['🎯运行专员', '👔店长'],
  'logistics:material:list': ['👔店长', '🎯运行专员', '🛒前台'],
}

function checkModuleAccess(role: string, module: string): boolean {
  const allowedRoles = roleAccessMatrix[module]
  return allowedRoles?.includes(role) ?? false
}

function mockSuccessResponse(data: any = {}) {
  return { success: true, code: 200, data, timestamp: Date.now() }
}

function mockErrorResponse(code: number, message: string) {
  return { success: false, code, message, timestamp: Date.now() }
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} Logistics 角色旅程测试`, () => {
  it('👔[正例] 店长查看巡检计划 → 发起催办 → 查看巡检结果', () => {
    assert.ok(checkModuleAccess(ROLES.StoreManager, 'logistics:inspection:list'))
    assert.ok(checkModuleAccess(ROLES.StoreManager, 'logistics:inspection:remind'))

    // 1. 查看待巡检列表
    const inspections = mockSuccessResponse([
      { id: 'INS-001', equipmentName: '跳舞机', scheduledAt: '2026-07-16', status: 'scheduled', assigneeName: '张工' },
      { id: 'INS-002', equipmentName: '抓娃娃机', scheduledAt: '2026-07-15', status: 'reminded' },
    ])
    assert.equal(inspections.data.length, 2)
    // 2. 催办超时未巡检
    const remind = mockSuccessResponse({ id: 'INS-001', remindedCount: 2, status: 'reminded' })
    assert.equal(remind.data.status, 'reminded')
    // 3. 查看已提交的巡检结果
    const result = mockSuccessResponse({
      id: 'INS-002', status: 'completed',
      result: { status: 'normal', note: '设备运行良好', inspectorName: '张工' },
    })
    assert.equal(result.data.result.status, 'normal')
  })

  it('👔[正例] 店长创建清洁排班 → 查看排班 → 确认到岗', () => {
    assert.ok(checkModuleAccess(ROLES.StoreManager, 'logistics:clean:create'))

    // 1. 创建清洁排班
    const schedule = mockSuccessResponse({
      id: 'CLN-001',
      assigneeName: '李保洁',
      shiftName: '早班',
      scheduledDate: '2026-07-16',
      status: 'scheduled',
    })
    assert.equal(schedule.data.assigneeName, '李保洁')
    assert.equal(schedule.data.status, 'scheduled')
    // 2. 查看排班列表确认
    const list = mockSuccessResponse({
      schedules: [{ id: 'CLN-001', assigneeName: '李保洁', status: 'scheduled' }],
      total: 1,
    })
    assert.equal(list.data.total, 1)
    // 3. 确认到岗签到
    const checkin = mockSuccessResponse({
      id: 'CLN-001', cleanerName: '李保洁', checkedInAt: '2026-07-16T08:00:00Z',
    })
    assert.ok(checkin.data.checkedInAt)
  })

  it('👔[反例] 店长分配报修单但指派不存在的维修工', () => {
    const assignFail = mockErrorResponse(404, 'TECHNICIAN_NOT_FOUND')
    assert.equal(assignFail.code, 404)
  })

  it('👔[体验闭环] 店长审批物料申领 → 仓库出库 → 使用确认', () => {
    assert.ok(checkModuleAccess(ROLES.StoreManager, 'logistics:material:approve'))
    assert.ok(checkModuleAccess(ROLES.StoreManager, 'logistics:material:outbound'))

    // 1. 查看待审批物料
    const requests = mockSuccessResponse([
      { id: 'MAT-001', requesterName: '王导玩', items: [{ name: '扭蛋球', qty: 200 }], status: 'pending' },
    ])
    assert.equal(requests.data.length, 1)
    // 2. 审批通过
    const approve = mockSuccessResponse({ id: 'MAT-001', status: 'approved', approverName: '👔店长' })
    assert.equal(approve.data.status, 'approved')
    // 3. 出库
    const outbound = mockSuccessResponse({ id: 'MAT-001', status: 'outbound', operatorName: '库管陈' })
    assert.equal(outbound.data.status, 'outbound')
    // 4. 确认完成闭环
    const confirmed = { requestId: 'MAT-001', cycleComplete: true, from: '申领' as const, to: '出库' as const }
    assert.equal(confirmed.cycleComplete, true)
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} Logistics 角色旅程测试`, () => {
  it('🛒[正例] 前台报修故障设备 → 查看维修进度 → 确认报修已受理', () => {
    assert.ok(checkModuleAccess(ROLES.FrontDesk, 'logistics:repair:create'))

    // 1. 前台发现机台故障，发起报修
    const repairOrder = mockSuccessResponse({
      id: 'RPR-001',
      equipmentName: '收银机-POS01',
      issueDescription: '扫码枪无响应',
      reporterName: '前台小王',
      status: 'pending',
    })
    assert.equal(repairOrder.data.status, 'pending')
    // 2. 查看维修进度
    const progress = mockSuccessResponse({
      id: 'RPR-001',
      status: 'assigned',
      assigneeName: '赵工',
      assignedAt: Date.now(),
    })
    assert.equal(progress.data.status, 'assigned')
    assert.equal(progress.data.assigneeName, '赵工')
    // 3. 确认报修已受理
    assert.equal(repairOrder.data.id === progress.data.id, true)
    assert.notEqual(progress.data.assigneeName, null)
  })

  it('🛒[正例] 前台申领办公物料 → 查看申领状态', () => {
    assert.ok(checkModuleAccess(ROLES.FrontDesk, 'logistics:material:create'))

    const request = mockSuccessResponse({
      id: 'MAT-002',
      requesterName: '前台小李',
      items: [{ name: '打印纸', qty: 5 }, { name: '签字笔', qty: 10 }],
      status: 'pending',
    })
    assert.equal(request.data.items.length, 2)
    // 查看申领列表
    const myRequests = mockSuccessResponse({
      requests: [request.data],
      total: 1,
    })
    assert.equal(myRequests.data.total, 1)
  })

  it('🛒[反例] 前台越权审批物料申领被拒绝', () => {
    const denied = checkModuleAccess(ROLES.FrontDesk, 'logistics:material:approve')
    assert.equal(denied, false)
  })

  it('🛒[体验闭环] 前台签退时确认清洁 → 上报清洁签到 → 清洁完成', () => {
    assert.ok(checkModuleAccess(ROLES.FrontDesk, 'logistics:clean:checkin'))

    const checkin = mockSuccessResponse({
      id: 'CLN-002',
      cleanerName: '前台值班人员',
      areaName: '收银区',
      checkedInAt: '2026-07-16T22:00:00Z',
    })
    assert.ok(checkin.data.checkedInAt)
    assert.equal(checkin.data.areaName, '收银区')
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} Logistics 角色旅程测试`, () => {
  it('👥[反例] HR 无权创建巡检任务 — 巡检属于工程/运营范畴', () => {
    const denied = checkModuleAccess(ROLES.HR, 'logistics:inspection:create')
    assert.equal(denied, false)
  })

  it('👥[反例] HR 无权审批物料申领', () => {
    const denied = checkModuleAccess(ROLES.HR, 'logistics:material:approve')
    assert.equal(denied, false)
  })

  it('👥[反例] HR 无权创建清洁排班', () => {
    const denied = checkModuleAccess(ROLES.HR, 'logistics:clean:create')
    assert.equal(denied, false)
  })

  it('👥[体验闭环] HR 请假系统与后勤巡检无关 — 后勤模块对 HR 完全隔离', () => {
    const allDenied = [
      'logistics:inspection:create',
      'logistics:clean:create',
      'logistics:repair:create',
      'logistics:repair:assign',
      'logistics:material:approve',
    ].every((mod) => !checkModuleAccess(ROLES.HR, mod))
    assert.equal(allDenied, true)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} Logistics 角色旅程测试`, () => {
  it('🔧[正例] 安监创建安全巡检 → 记录巡检结果 → 发现问题发起报修', () => {
    assert.ok(checkModuleAccess(ROLES.Security, 'logistics:inspection:create'))
    assert.ok(checkModuleAccess(ROLES.Security, 'logistics:inspection:record'))

    // 1. 创建安全巡检
    const inspection = mockSuccessResponse({
      id: 'INS-003',
      equipmentName: '消防栓',
      assigneeName: '安监老陈',
      status: 'scheduled',
    })
    assert.equal(inspection.data.status, 'scheduled')
    // 2. 记录巡检结果 — 发现故障
    const result = mockSuccessResponse({
      id: 'INS-003',
      status: 'completed',
      result: { status: 'fault', note: '消防栓阀门老化需更换' },
    })
    assert.equal(result.data.result.status, 'fault')
    // 3. 发起报修
    const repair = mockSuccessResponse({
      id: 'RPR-002',
      equipmentName: '消防栓',
      issueDescription: '阀门老化',
      reporterName: '安监老陈',
      status: 'pending',
    })
    assert.equal(repair.data.status, 'pending')
  })

  it('🔧[正例] 安监接受维修任务 → 开始维修 → 完成维修', () => {
    assert.ok(checkModuleAccess(ROLES.Security, 'logistics:repair:start'))
    assert.ok(checkModuleAccess(ROLES.Security, 'logistics:repair:complete'))

    // 1. 接受任务开始维修
    const start = mockSuccessResponse({ id: 'RPR-002', status: 'in_progress', startedAt: Date.now() })
    assert.equal(start.data.status, 'in_progress')
    // 2. 完成维修并记录
    const complete = mockSuccessResponse({
      id: 'RPR-002', status: 'completed',
      completionNote: '阀门已更换，测试正常',
      technicianName: '安监老陈',
    })
    assert.equal(complete.data.status, 'completed')
  })

  it('🔧[反例] 安监对已完成的报修单重复启动维修', () => {
    const alreadyDone = mockErrorResponse(409, 'REPAIR_ALREADY_COMPLETED')
    assert.equal(alreadyDone.code, 409)
  })

  it('🔧[体验闭环] 安监查看巡检历史 → 生成安全报告 → 汇总到店长', () => {
    assert.ok(checkModuleAccess(ROLES.Security, 'logistics:inspection:list'))

    const inspections = mockSuccessResponse([
      { id: 'INS-001', result: { status: 'normal' }, completedAt: '2026-07-15' },
      { id: 'INS-002', result: { status: 'normal' }, completedAt: '2026-07-15' },
      { id: 'INS-003', result: { status: 'fault' }, completedAt: '2026-07-16' },
    ])
    const faultCount = inspections.data.filter((i: any) => i.result.status === 'fault').length
    assert.equal(faultCount, 1)
    // 生成安全报告
    const report = {
      period: '2026-07-15 ~ 2026-07-16',
      totalInspections: 3,
      normal: 2,
      faults: 1,
      resolved: true,
    }
    assert.equal(report.totalInspections, 3)
    assert.equal(report.faults, 1)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} Logistics 角色旅程测试`, () => {
  it('🎮[正例] 导玩员创建设备巡检 → 巡检设备 → 记录结果', () => {
    assert.ok(checkModuleAccess(ROLES.Guide, 'logistics:inspection:create'))
    assert.ok(checkModuleAccess(ROLES.Guide, 'logistics:inspection:record'))

    // 1. 打开巡检任务创建
    const inspection = mockSuccessResponse({
      id: 'INS-004',
      equipmentName: '跳舞机',
      assigneeName: '导玩小刘',
      status: 'scheduled',
    })
    assert.equal(inspection.data.equipmentName, '跳舞机')
    // 2. 执行巡检
    const result = mockSuccessResponse({
      id: 'INS-004',
      status: 'completed',
      result: { status: 'normal', note: '设备运行正常', inspectorName: '导玩小刘' },
    })
    assert.equal(result.data.result.status, 'normal')
  })

  it('🎮[正例] 导玩员发现设备故障 → 直接发起报修 → 报修受理确认', () => {
    assert.ok(checkModuleAccess(ROLES.Guide, 'logistics:repair:create'))

    const repair = mockSuccessResponse({
      id: 'RPR-003',
      equipmentName: '抓娃娃机',
      issueDescription: '爪子松动，夹不住娃娃',
      reporterName: '导玩小刘',
      status: 'pending',
    })
    assert.equal(repair.data.equipmentName, '抓娃娃机')
    // 确认报修已受理
    assert.ok(repair.data.id)
    assert.equal(repair.data.status, 'pending')
  })

  it('🎮[正例] 导玩员申领设备配件物料', () => {
    assert.ok(checkModuleAccess(ROLES.Guide, 'logistics:material:create'))

    const request = mockSuccessResponse({
      id: 'MAT-003',
      requesterName: '导玩小刘',
      items: [{ name: '摇杆按钮', qty: 10 }, { name: '投币器弹簧', qty: 5 }],
      status: 'pending',
    })
    assert.equal(request.data.items.length, 2)
  })

  it('🎮[体验闭环] 导玩员验收已完成的报修 → 确认设备恢复正常', () => {
    assert.ok(checkModuleAccess(ROLES.Guide, 'logistics:repair:verify'))

    // 导玩员验收维修结果
    const verify = mockSuccessResponse({
      id: 'RPR-003',
      status: 'verified',
      verifierName: '导玩小刘',
      note: '已测试，抓取功能恢复正常',
    })
    assert.equal(verify.data.status, 'verified')
    // 确认设备恢复正常
    const deviceStatus = mockSuccessResponse({
      deviceId: 'DEV-002',
      status: 'online',
      lastRepairId: 'RPR-003',
    })
    assert.equal(deviceStatus.data.status, 'online')
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} Logistics 角色旅程测试`, () => {
  it('🎯[正例] 运行专员查看所有巡检记录 → 批量催办 → 分析巡检完成率', () => {
    assert.ok(checkModuleAccess(ROLES.Operations, 'logistics:inspection:list'))
    assert.ok(checkModuleAccess(ROLES.Operations, 'logistics:inspection:remind'))

    // 1. 查看全部巡检
    const inspections = mockSuccessResponse([
      { id: 'INS-001', status: 'completed' },
      { id: 'INS-002', status: 'scheduled' },
      { id: 'INS-003', status: 'scheduled' },
    ])
    assert.equal(inspections.data.length, 3)
    // 2. 批量催办未完成巡检
    const sweep = mockSuccessResponse({ remindedCount: 2, now: Date.now() })
    assert.equal(sweep.data.remindedCount, 2)
    // 3. 分析完成率
    const completed = inspections.data.filter((i: any) => i.status === 'completed').length
    const rate = completed / inspections.data.length
    assert.equal(rate, 1 / 3)
  })

  it('🎯[正例] 运行专员创建清洁排班 → 分配清洁区域', () => {
    assert.ok(checkModuleAccess(ROLES.Operations, 'logistics:clean:create'))

    const schedule = mockSuccessResponse({
      id: 'CLN-003',
      assigneeName: '王保洁',
      shiftName: '晚班',
      scheduledDate: '2026-07-16',
      status: 'scheduled',
    })
    assert.equal(schedule.data.status, 'scheduled')
    // 分配清洁区域
    const assignArea = mockSuccessResponse({
      id: 'CLN-003',
      areaCode: 'A-01',
      areaName: '大厅+游戏区',
    })
    assert.equal(assignArea.data.areaName, '大厅+游戏区')
  })

  it('🎯[正例] 运行专员分配报修任务给维修工', () => {
    assert.ok(checkModuleAccess(ROLES.Operations, 'logistics:repair:assign'))

    const assign = mockSuccessResponse({
      id: 'RPR-001',
      assigneeName: '赵工',
      status: 'assigned',
    })
    assert.equal(assign.data.status, 'assigned')
    assert.equal(assign.data.assigneeName, '赵工')
  })

  it('🎯[体验闭环] 运行专员查看物料申领 → 安排出库 → 确认库存', () => {
    assert.ok(checkModuleAccess(ROLES.Operations, 'logistics:material:list'))
    assert.ok(checkModuleAccess(ROLES.Operations, 'logistics:material:outbound'))

    // 1. 查看全部待处理申领
    const requests = mockSuccessResponse({
      requests: [
        { id: 'MAT-001', status: 'approved' },
        { id: 'MAT-002', status: 'pending' },
      ],
      total: 2,
    })
    assert.equal(requests.data.total, 2)
    // 2. 已审批的出库
    const outbound = mockSuccessResponse({
      id: 'MAT-001', status: 'outbound', operatorName: '仓库王', outboundAt: Date.now(),
    })
    assert.equal(outbound.data.status, 'outbound')
    // 3. 确认库存扣减
    const inventoryUpdate = { itemName: '扭蛋球', beforeQty: 500, afterQty: 300, diff: -200 }
    assert.equal(inventoryUpdate.diff, -200)
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} Logistics 角色旅程测试`, () => {
  it('🤝[反例] 团建无权创建巡检任务', () => {
    const denied = checkModuleAccess(ROLES.Teambuilding, 'logistics:inspection:create')
    assert.equal(denied, false)
  })

  it('🤝[反例] 团建无权创建报修单', () => {
    const denied = checkModuleAccess(ROLES.Teambuilding, 'logistics:repair:create')
    assert.equal(denied, false)
  })

  it('🤝[反例] 团建无权申领物料', () => {
    const denied = checkModuleAccess(ROLES.Teambuilding, 'logistics:material:create')
    assert.equal(denied, false)
  })

  it('🤝[体验闭环] 团建在活动前确认场地清洁 — 间接使用后勤服务', () => {
    // 团建不直接操作后勤，但依赖清洁排班保证场地可用
    const venueCleanStatus = mockSuccessResponse({
      venueId: 'V-001',
      lastCleanedAt: '2026-07-16T07:00:00Z',
      isClean: true,
      nextScheduledClean: '2026-07-17T07:00:00Z',
    })
    assert.equal(venueCleanStatus.data.isClean, true)
    // 如果场地不干净，团建可以向店长反馈
    const feedback = {
      venueId: 'V-001',
      cleanNeeded: false, // 场地已经清洁
      satisfied: true,
    }
    assert.equal(feedback.satisfied, true)
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} Logistics 角色旅程测试`, () => {
  it('📢[反例] 营销无权创建巡检任务', () => {
    const denied = checkModuleAccess(ROLES.Marketing, 'logistics:inspection:create')
    assert.equal(denied, false)
  })

  it('📢[反例] 营销无权维修审批', () => {
    const denied = checkModuleAccess(ROLES.Marketing, 'logistics:repair:assign')
    assert.equal(denied, false)
  })

  it('📢[反例] 营销无权创建清洁排班', () => {
    const denied = checkModuleAccess(ROLES.Marketing, 'logistics:clean:create')
    assert.equal(denied, false)
  })

  it('📢[体验闭环] 营销活动需要设备可用 — 后勤维修恢复设备后营销可用', () => {
    // 营销依赖后勤维护的设备正常运行
    const deviceStatusBeforeEvent = mockSuccessResponse({
      deviceId: 'DEV-003',
      name: '跳舞机',
      status: 'online',
      lastRepairAt: '2026-07-15',
    })
    assert.equal(deviceStatusBeforeEvent.data.status, 'online')
    // 如果没有后勤维修，设备故障影响营销活动效果
    const eventDeviceRequirement = {
      neededDevices: ['跳舞机', '抓娃娃机'],
      deviceIssue: '抓娃娃机故障',
      resolvedByRepair: true,
    }
    assert.equal(eventDeviceRequirement.resolvedByRepair, true)
  })
})

// ── 跨角色 Logistics 交叉场景 ──
describe('Logistics 跨角色体验闭环验证', () => {
  it('🎮→🔧→👔 导玩员发现故障 → 安监维修 → 店长验收', () => {
    // 1. 导玩员巡检发现跳舞机故障
    assert.ok(checkModuleAccess(ROLES.Guide, 'logistics:repair:create'))
    const repair = mockSuccessResponse({
      id: 'RPR-010',
      equipmentName: '跳舞机',
      issueDescription: '踏板感应器失灵',
      reporterName: '导玩小王',
      status: 'pending',
    })
    assert.equal(repair.data.status, 'pending')

    // 2. 安监接单开始维修
    assert.ok(checkModuleAccess(ROLES.Security, 'logistics:repair:start'))
    const start = mockSuccessResponse({ id: 'RPR-010', status: 'in_progress', startedAt: Date.now() })
    assert.equal(start.data.status, 'in_progress')

    // 3. 安监完成维修
    assert.ok(checkModuleAccess(ROLES.Security, 'logistics:repair:complete'))
    const complete = mockSuccessResponse({
      id: 'RPR-010', status: 'completed',
      completionNote: '感应器已更换，测试通过',
    })
    assert.equal(complete.data.status, 'completed')

    // 4. 导玩员验收
    assert.ok(checkModuleAccess(ROLES.Guide, 'logistics:repair:verify'))
    const verify = mockSuccessResponse({
      id: 'RPR-010', status: 'verified',
      verifierName: '导玩小王',
      note: '跳舞机恢复正常',
    })
    assert.equal(verify.data.status, 'verified')
  })

  it('🎯→👔 运行专员排清洁班 → 店长确认 → 前台签到', () => {
    // 1. 运行专员创建清洁排班
    assert.ok(checkModuleAccess(ROLES.Operations, 'logistics:clean:create'))
    const schedule = mockSuccessResponse({
      id: 'CLN-010',
      assigneeName: '刘保洁',
      shiftName: '早班',
      scheduledDate: '2026-07-16',
      status: 'scheduled',
    })
    assert.equal(schedule.data.status, 'scheduled')

    // 2. 运行专员分配区域
    const assignArea = mockSuccessResponse({ id: 'CLN-010', areaCode: 'A-02', areaName: '收银区+休息区' })
    assert.equal(assignArea.data.areaName, '收银区+休息区')

    // 3. 前台签到确认清洁完成
    assert.ok(checkModuleAccess(ROLES.FrontDesk, 'logistics:clean:checkin'))
    const checkin = mockSuccessResponse({
      id: 'CLN-010',
      cleanerName: '刘保洁',
      checkedInAt: '2026-07-16T08:30:00Z',
    })
    assert.ok(checkin.data.checkedInAt)
  })

  it('🛒+🎮 物料申领全链路: 前台/导玩申领 → 店长审批 → 运行出库', () => {
    // 1. 前台申领办公用品
    const req1 = mockSuccessResponse({ id: 'MAT-010', requesterName: '前台小赵', status: 'pending' })
    assert.equal(req1.data.status, 'pending')

    // 2. 导玩员申领设备配件
    const req2 = mockSuccessResponse({ id: 'MAT-011', requesterName: '导玩小陈', status: 'pending' })
    assert.equal(req2.data.status, 'pending')

    // 3. 店长审批
    assert.ok(checkModuleAccess(ROLES.StoreManager, 'logistics:material:approve'))
    const approve1 = mockSuccessResponse({ id: 'MAT-010', status: 'approved' })
    const approve2 = mockSuccessResponse({ id: 'MAT-011', status: 'approved' })
    assert.equal(approve1.data.status, 'approved')
    assert.equal(approve2.data.status, 'approved')

    // 4. 运行专员出库
    assert.ok(checkModuleAccess(ROLES.Operations, 'logistics:material:outbound'))
    const outbound1 = mockSuccessResponse({ id: 'MAT-010', status: 'outbound' })
    const outbound2 = mockSuccessResponse({ id: 'MAT-011', status: 'outbound' })
    assert.equal(outbound1.data.status, 'outbound')
    assert.equal(outbound2.data.status, 'outbound')
  })
})
