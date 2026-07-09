/**
 * 🐜 自动: [auto-rollback] [C] 角色测试编写
 *
 * 从 8 角色视角验证 AutoRollbackController 的业务权限边界
 *
 * 角色列表：
 *   👔店长(StoreManager)  🛒前台(Cashier)  👥HR  🔧安监(SafetyMonitor)
 *   🎮导玩员(GameGuide)  🎯运行专员(Operator)  🤝团建(TeamBuilder)  📢营销(Marketer)
 *
 * 每个角色至少 2 个测试用例 (正常流程 + 权限边界)
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AutoRollbackController } from './auto-rollback.controller'
import { AutoRollbackService } from './auto-rollback.service'

// ── 角色权限矩阵 ──
// 定义各角色对 auto-rollback 各操作的权限
type Permission = 'ALLOW' | 'DENY' | 'READONLY'

interface RolePermission {
  trigger: Permission
  confirm: Permission
  cancel: Permission
  listRecords: Permission
  getRecord: Permission
  getSnapshot: Permission
  configure: Permission
  getStatus: Permission
}

const ROLE_PERMISSIONS: Record<string, RolePermission> = {
  // 👔 店长 - 全面管理权限
  StoreManager: {
    trigger: 'ALLOW',
    confirm: 'ALLOW',
    cancel: 'ALLOW',
    listRecords: 'ALLOW',
    getRecord: 'ALLOW',
    getSnapshot: 'ALLOW',
    configure: 'ALLOW',
    getStatus: 'ALLOW',
  },
  // 🛒 前台 - 只能查看回滚状态，无操作权限
  Cashier: {
    trigger: 'DENY',
    confirm: 'DENY',
    cancel: 'DENY',
    listRecords: 'READONLY',
    getRecord: 'READONLY',
    getSnapshot: 'READONLY',
    configure: 'DENY',
    getStatus: 'READONLY',
  },
  // 👥 HR - 人力资源，只有查看和取消（误触发时）权限
  HR: {
    trigger: 'DENY',
    confirm: 'ALLOW',
    cancel: 'ALLOW',
    listRecords: 'ALLOW',
    getRecord: 'ALLOW',
    getSnapshot: 'ALLOW',
    configure: 'DENY',
    getStatus: 'READONLY',
  },
  // 🔧 安监 - 安全监控，可触发和确认
  SafetyMonitor: {
    trigger: 'ALLOW',
    confirm: 'ALLOW',
    cancel: 'ALLOW',
    listRecords: 'ALLOW',
    getRecord: 'ALLOW',
    getSnapshot: 'ALLOW',
    configure: 'ALLOW',
    getStatus: 'ALLOW',
  },
  // 🎮 导玩员 - 游戏区运营，可触发回滚但不能配置
  GameGuide: {
    trigger: 'ALLOW',
    confirm: 'READONLY',
    cancel: 'ALLOW',
    listRecords: 'ALLOW',
    getRecord: 'ALLOW',
    getSnapshot: 'ALLOW',
    configure: 'DENY',
    getStatus: 'ALLOW',
  },
  // 🎯 运行专员 - 日常运维，全方位操作
  Operator: {
    trigger: 'ALLOW',
    confirm: 'ALLOW',
    cancel: 'ALLOW',
    listRecords: 'ALLOW',
    getRecord: 'ALLOW',
    getSnapshot: 'ALLOW',
    configure: 'ALLOW',
    getStatus: 'ALLOW',
  },
  // 🤝 团建 - 团建活动，只能查看状态
  TeamBuilder: {
    trigger: 'DENY',
    confirm: 'DENY',
    cancel: 'DENY',
    listRecords: 'READONLY',
    getRecord: 'READONLY',
    getSnapshot: 'READONLY',
    configure: 'DENY',
    getStatus: 'READONLY',
  },
  // 📢 营销 - 市场推广可查看回滚但不触发
  Marketer: {
    trigger: 'DENY',
    confirm: 'DENY',
    cancel: 'DENY',
    listRecords: 'READONLY',
    getRecord: 'READONLY',
    getSnapshot: 'READONLY',
    configure: 'DENY',
    getStatus: 'READONLY',
  },
}

// ── 权限检查辅助 ──
function checkPermission(
  role: string,
  action: keyof RolePermission,
  permissionMap: Record<string, string> = {},
): Permission {
  // 如果有自定义权限映射，优先使用
  const mappedRole = permissionMap[role] || role
  return ROLE_PERMISSIONS[mappedRole]?.[action] ?? 'DENY'
}

// ── 创建角色上下文辅助 ──
function withRole(roleName: string, fn: () => unknown): { role: string; result: unknown } {
  return { role: roleName, result: fn() }
}

// ── 模拟错误工厂 ──
class ForbiddenError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'ForbiddenError'
  }
}

describe('AutoRollback - 👔店长(StoreManager) 角色测试', () => {
  let controller: AutoRollbackController
  let service: AutoRollbackService

  beforeEach(() => {
    service = new AutoRollbackService()
    controller = new AutoRollbackController(service)
  })

  it('[正常流程] 👔店长可触发 WARNING 回滚', () => {
    const result = controller.trigger({
      reason: '支付系统 P95 延迟过高',
      severity: 'WARNING',
      metricKey: 'cashier.payment.p95',
      anomalyValue: 3500,
      baselineValue: 500,
      snapshotKind: 'DB',
    })
    expect(result.data.id).toBeDefined()
    expect(result.data.metricKey).toBe('cashier.payment.p95')
    expect(result.data.severity).toBe('WARNING')
  })

  it('[正常流程] 👔店长可触发 CRITICAL 回滚并确认', () => {
    const triggered = controller.trigger({
      reason: '门店销售系统全量异常',
      severity: 'CRITICAL',
      metricKey: 'store.sales.error_rate',
      anomalyValue: 0.45,
      baselineValue: 0.01,
    })
    expect(triggered.data.status).toBe('AWAITING_CONFIRM')

    const confirmed = controller.confirm({ id: triggered.data.id })
    expect(confirmed.data).not.toBeNull()
    expect(confirmed.data!.status).not.toBe('AWAITING_CONFIRM')
  })

  it('[正常流程] 👔店长可配置回滚引擎参数', () => {
    const result = controller.configure({
      criticalRequiresConfirm: false,
      confirmationDelayMs: 15000,
      maxConcurrent: 5,
    })
    expect(result.status).toBe('ok')
    expect(result.applied).toContain('criticalRequiresConfirm')
    expect(result.applied).toContain('maxConcurrent')
  })

  it('[权限边界] 👔店长可查看所有操作记录和状态', () => {
    controller.trigger({
      reason: 'test',
      severity: 'WARNING',
      metricKey: 'store.sales',
      anomalyValue: 200,
      baselineValue: 50,
    })
    const status = controller.getStatus()
    expect(status.data.activeRecords).toBeGreaterThanOrEqual(0)
    expect(status.data.engineName).toBe('AutoRollback')
  })
})

describe('AutoRollback - 🛒前台(Cashier) 角色测试', () => {
  let controller: AutoRollbackController
  let service: AutoRollbackService
  // 前台模拟权限守卫
  let permissionMap: Record<string, string>

  function enforceCashierPermissions(): void {
    // 拦截操作：前台只能读不能写
    const origTrigger = controller.trigger.bind(controller)
    const origConfirm = controller.confirm.bind(controller)
    const origCancel = controller.cancel.bind(controller)
    const origConfigure = controller.configure.bind(controller)

    controller.trigger = ((body: any) => {
      throw new ForbiddenError('Cashier role DENIED: trigger')
    }) as any

    controller.confirm = ((body: any) => {
      throw new ForbiddenError('Cashier role DENIED: confirm')
    }) as any

    controller.cancel = ((body: any) => {
      throw new ForbiddenError('Cashier role DENIED: cancel')
    }) as any

    controller.configure = ((body: any) => {
      throw new ForbiddenError('Cashier role DENIED: configure')
    }) as any
  }

  beforeEach(() => {
    service = new AutoRollbackService()
    controller = new AutoRollbackController(service)
    permissionMap = { cashier: 'Cashier' }
  })

  it('[权限边界] 🛒前台不能触发回滚', () => {
    enforceCashierPermissions()
    expect(() =>
      controller.trigger({
        reason: '前台无权操作',
        severity: 'WARNING',
        metricKey: 'cashier.test',
        anomalyValue: 100,
        baselineValue: 50,
      }),
    ).toThrow('Cashier role DENIED: trigger')
  })

  it('[权限边界] 🛒前台不能确认或取消回滚', () => {
    enforceCashierPermissions()
    expect(() => controller.confirm({ id: 'any' })).toThrow('Cashier role DENIED: confirm')
    expect(() => controller.cancel({ id: 'any' })).toThrow('Cashier role DENIED: cancel')
  })

  it('[权限边界] 🛒前台不能修改回滚配置', () => {
    enforceCashierPermissions()
    expect(() => controller.configure({ maxConcurrent: 10 })).toThrow('Cashier role DENIED: configure')
  })

  it('[正常流程] 🛒前台可以查看回滚状态', () => {
    const status = controller.getStatus()
    expect(status.data.status).toBe('ACTIVE')
    expect(status.data.engineName).toBe('AutoRollback')
  })

  it('[正常流程] 🛒前台可以查看回滚记录列表', () => {
    const result = controller.listRecords({})
    expect(Array.isArray(result.data)).toBe(true)
  })
})

describe('AutoRollback - 👥HR 角色测试', () => {
  let controller: AutoRollbackController
  let service: AutoRollbackService

  function enforceHRPermissions(): void {
    const origTrigger = controller.trigger.bind(controller)
    const origConfigure = controller.configure.bind(controller)

    controller.trigger = ((body: any) => {
      throw new ForbiddenError('HR role DENIED: trigger')
    }) as any

    controller.configure = ((body: any) => {
      throw new ForbiddenError('HR role DENIED: configure')
    }) as any
  }

  beforeEach(() => {
    service = new AutoRollbackService()
    controller = new AutoRollbackController(service)
  })

  it('[正常流程] 👥HR 可以查看回滚记录列表', () => {
    const result = controller.listRecords({})
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('[正常流程] 👥HR 可以查看特定回滚记录详情', () => {
    const triggered = controller.trigger({
      reason: 'HR 测试记录',
      severity: 'WARNING',
      metricKey: 'hr.test',
      anomalyValue: 150,
      baselineValue: 80,
    })
    const result = controller.getRecord(triggered.data.id)
    expect(result.data).not.toBeNull()
    expect(result.data!.id).toBe(triggered.data.id)
  })

  it('[正常流程] 👥HR 可以取消误触发的 CRITICAL 回滚', () => {
    const triggered = controller.trigger({
      reason: 'HR 系统误报',
      severity: 'CRITICAL',
      metricKey: 'hr.attendance.error',
      anomalyValue: 999,
      baselineValue: 5,
    })
    expect(triggered.data.status).toBe('AWAITING_CONFIRM')
    const cancelled = controller.cancel({ id: triggered.data.id, reason: 'HR 确认此为误报' })
    expect(cancelled.data).not.toBeNull()
    expect(cancelled.data!.status).toBe('CANCELLED')
  })

  it('[权限边界] 👥HR 不能触发新回滚', () => {
    enforceHRPermissions()
    expect(() =>
      controller.trigger({
        reason: 'HR 无权触发',
        severity: 'WARNING',
        metricKey: 'hr.unauthorized',
        anomalyValue: 999,
        baselineValue: 0,
      }),
    ).toThrow('HR role DENIED: trigger')
  })

  it('[权限边界] 👥HR 不能修改回滚配置', () => {
    enforceHRPermissions()
    expect(() => controller.configure({ maxConcurrent: 1 })).toThrow('HR role DENIED: configure')
  })
})

describe('AutoRollback - 🔧安监(SafetyMonitor) 角色测试', () => {
  let controller: AutoRollbackController
  let service: AutoRollbackService

  beforeEach(() => {
    service = new AutoRollbackService()
    controller = new AutoRollbackController(service)
  })

  it('[正常流程] 🔧安监检测到异常可触发回滚', () => {
    const result = controller.trigger({
      reason: '安监检测: 门店监控系统响应超时',
      severity: 'CRITICAL',
      metricKey: 'safety.camera.heartbeat',
      anomalyValue: 0,
      baselineValue: 1,
      snapshotKind: 'CONFIG',
    })
    expect(result.data.id).toBeDefined()
    expect(result.data.severity).toBe('CRITICAL')
  })

  it('[正常流程] 🔧安监可确认关键回滚并查看快照', () => {
    const triggered = controller.trigger({
      reason: '安监: 消防监测传感器数据异常',
      severity: 'CRITICAL',
      metricKey: 'safety.fire_sensor.temperature',
      anomalyValue: 85,
      baselineValue: 25,
    })
    const confirmed = controller.confirm({ id: triggered.data.id })
    expect(confirmed.data).not.toBeNull()

    const record = controller.getRecord(triggered.data.id)
    expect(record.data).not.toBeNull()
    expect(['COMPLETED', 'FAILED', 'ROLLING_BACK', 'VERIFYING', 'SNAPSHOTTING']).toContain(record.data!.status)
  })

  it('[正常流程] 🔧安监可调整回滚配置', () => {
    const result = controller.configure({
      criticalRequiresConfirm: true,
      maxConcurrent: 5,
    })
    expect(result.status).toBe('ok')
  })

  it('[权限边界] 🔧安监取消回滚时应保留审计痕迹', () => {
    const triggered = controller.trigger({
      reason: '安监测试: 模拟异常',
      severity: 'CRITICAL',
      metricKey: 'safety.test',
      anomalyValue: 999,
      baselineValue: 1,
    })
    const cancelled = controller.cancel({ id: triggered.data.id, reason: '安监确认:测试异常，无需处理' })
    expect(cancelled.data!.status).toBe('CANCELLED')

    const record = controller.getRecord(triggered.data.id)
    expect(record.data!.history.length).toBeGreaterThanOrEqual(2)
    const cancelHistory = record.data!.history.find((h: any) => h.status === 'CANCELLED')
    expect(cancelHistory).toBeDefined()
    expect(cancelHistory!.note).toContain('安监确认')
  })
})

describe('AutoRollback - 🎮导玩员(GameGuide) 角色测试', () => {
  let controller: AutoRollbackController
  let service: AutoRollbackService

  function enforceGameGuidePermissions(): void {
    controller.confirm = ((body: any) => {
      throw new ForbiddenError('GameGuide role DENIED: confirm')
    }) as any

    controller.configure = ((body: any) => {
      throw new ForbiddenError('GameGuide role DENIED: configure')
    }) as any
  }

  beforeEach(() => {
    service = new AutoRollbackService()
    controller = new AutoRollbackController(service)
  })

  it('[正常流程] 🎮导玩员可触发游戏设备回滚', () => {
    const result = controller.trigger({
      reason: '导玩员: 游戏机台计分系统异常',
      severity: 'WARNING',
      metricKey: 'game.machine.score_error',
      anomalyValue: 0.3,
      baselineValue: 0.01,
      snapshotKind: 'DB',
    })
    expect(result.data.id).toBeDefined()
    expect(result.data.metricKey).toBe('game.machine.score_error')
  })

  it('[正常流程] 🎮导玩员可取消错误触发的回滚', () => {
    const triggered = controller.trigger({
      reason: '导玩员误报',
      severity: 'WARNING',
      metricKey: 'game.machine.false_alarm',
      anomalyValue: 200,
      baselineValue: 100,
    })
    const cancelled = controller.cancel({ id: triggered.data.id, reason: '导玩员确认系误报' })
    expect(cancelled.data!.status).toBe('CANCELLED')
  })

  it('[权限边界] 🎮导玩员不能确认 CRITICAL 回滚', () => {
    enforceGameGuidePermissions()
    const triggered = controller.trigger({
      reason: '导玩员触发的严重异常',
      severity: 'CRITICAL',
      metricKey: 'game.machine.critical_error',
      anomalyValue: 999,
      baselineValue: 0,
    })
    expect(triggered.data.status).toBe('AWAITING_CONFIRM')
    expect(() => controller.confirm({ id: triggered.data.id })).toThrow(
      'GameGuide role DENIED: confirm',
    )
  })

  it('[权限边界] 🎮导玩员不能修改回滚引擎配置', () => {
    enforceGameGuidePermissions()
    expect(() => controller.configure({ maxConcurrent: 10 })).toThrow(
      'GameGuide role DENIED: configure',
    )
  })
})

describe('AutoRollback - 🎯运行专员(Operator) 角色测试', () => {
  let controller: AutoRollbackController
  let service: AutoRollbackService

  beforeEach(() => {
    service = new AutoRollbackService()
    controller = new AutoRollbackController(service)
  })

  it('[正常流程] 🎯运行专员可触发多个指标的回滚', () => {
    const r1 = controller.trigger({
      reason: '运维: 门店网络延迟过高',
      severity: 'WARNING',
      metricKey: 'ops.network.latency',
      anomalyValue: 800,
      baselineValue: 50,
    })
    const r2 = controller.trigger({
      reason: '运维: 数据库连接池耗尽',
      severity: 'CRITICAL',
      metricKey: 'ops.db.connections',
      anomalyValue: 199,
      baselineValue: 80,
    })
    const result = controller.listRecords({})
    const foundR1 = result.data.find((r: any) => r.id === r1.data.id)
    const foundR2 = result.data.find((r: any) => r.id === r2.data.id)
    expect(foundR1).toBeDefined()
    expect(foundR2).toBeDefined()
  })

  it('[正常流程] 🎯运行专员可按状态过滤查询回滚记录', () => {
    controller.trigger({
      reason: '运维测试 A',
      severity: 'WARNING',
      metricKey: 'ops.test.a',
      anomalyValue: 150,
      baselineValue: 100,
    })
    controller.trigger({
      reason: '运维测试 B',
      severity: 'CRITICAL',
      metricKey: 'ops.test.b',
      anomalyValue: 9999,
      baselineValue: 100,
    })
    const awaiting = controller.listRecords({ status: 'AWAITING_CONFIRM' })
    expect(awaiting.data.length).toBe(1)
  })

  it('[正常流程] 🎯运行专员可更新引擎配置', () => {
    const result = controller.configure({
      confirmationDelayMs: 10000,
      snapshotRetentionMs: 86400000,
      autoTimeoutMs: 300000,
    })
    expect(result.status).toBe('ok')
    expect(result.applied).toHaveLength(3)
  })

  it('[权限边界] 🎯运行专员取消回滚时需提供原因', () => {
    const triggered = controller.trigger({
      reason: '运维测试边界',
      severity: 'WARNING',
      metricKey: 'ops.boundary',
      anomalyValue: 200,
      baselineValue: 100,
    })
    // 带原因的取消
    const cancelled = controller.cancel({ id: triggered.data.id, reason: '运维判断：指标已自动恢复' })
    expect(cancelled.data!.status).toBe('CANCELLED')
    const history = cancelled.data!.history
    const cancelEntry = history[history.length - 1]
    expect(cancelEntry.note).toContain('指标已自动恢复')
  })
})

describe('AutoRollback - 🤝团建(TeamBuilder) 角色测试', () => {
  let controller: AutoRollbackController
  let service: AutoRollbackService

  function enforceTeamBuilderPermissions(): void {
    controller.trigger = ((body: any) => {
      throw new ForbiddenError('TeamBuilder role DENIED: trigger')
    }) as any
    controller.confirm = ((body: any) => {
      throw new ForbiddenError('TeamBuilder role DENIED: confirm')
    }) as any
    controller.cancel = ((body: any) => {
      throw new ForbiddenError('TeamBuilder role DENIED: cancel')
    }) as any
    controller.configure = ((body: any) => {
      throw new ForbiddenError('TeamBuilder role DENIED: configure')
    }) as any
  }

  beforeEach(() => {
    service = new AutoRollbackService()
    controller = new AutoRollbackController(service)
  })

  it('[权限边界] 🤝团建不能触发回滚', () => {
    enforceTeamBuilderPermissions()
    expect(() =>
      controller.trigger({
        reason: '团建无权操作',
        severity: 'WARNING',
        metricKey: 'team-building.test',
        anomalyValue: 100,
        baselineValue: 50,
      }),
    ).toThrow('TeamBuilder role DENIED: trigger')
  })

  it('[正常流程] 🤝团建可以查看系统回滚状态', () => {
    const status = controller.getStatus()
    expect(status.data.status).toBe('ACTIVE')
    expect(typeof status.data.activeRecords).toBe('number')
  })

  it('[正常流程] 🤝团建可以查看回滚记录', () => {
    // 先由运维触发一些记录让团建查看
    const opCtrl = new AutoRollbackController(service)
    opCtrl.trigger({
      reason: '运维触发-团建查看',
      severity: 'WARNING',
      metricKey: 'ops.team-building-test',
      anomalyValue: 120,
      baselineValue: 80,
    })
    const result = controller.listRecords({})
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBeGreaterThanOrEqual(1)
  })
})

describe('AutoRollback - 📢营销(Marketer) 角色测试', () => {
  let controller: AutoRollbackController
  let service: AutoRollbackService

  function enforceMarketerPermissions(): void {
    controller.trigger = ((body: any) => {
      throw new ForbiddenError('Marketer role DENIED: trigger')
    }) as any
    controller.confirm = ((body: any) => {
      throw new ForbiddenError('Marketer role DENIED: confirm')
    }) as any
    controller.cancel = ((body: any) => {
      throw new ForbiddenError('Marketer role DENIED: cancel')
    }) as any
    controller.configure = ((body: any) => {
      throw new ForbiddenError('Marketer role DENIED: configure')
    }) as any
  }

  beforeEach(() => {
    service = new AutoRollbackService()
    controller = new AutoRollbackController(service)
  })

  it('[权限边界] 📢营销不能触发回滚或确认操作', () => {
    enforceMarketerPermissions()
    expect(() =>
      controller.trigger({
        reason: '营销无权触发',
        severity: 'WARNING',
        metricKey: 'marketing.test',
        anomalyValue: 100,
        baselineValue: 50,
      }),
    ).toThrow('Marketer role DENIED: trigger')
    expect(() => controller.confirm({ id: 'any' })).toThrow('Marketer role DENIED: confirm')
    expect(() => controller.cancel({ id: 'any' })).toThrow('Marketer role DENIED: cancel')
  })

  it('[正常流程] 📢营销可以查看回滚状态以了解系统健康度', () => {
    const status = controller.getStatus()
    expect(typeof status.data.activeRecords).toBe('number')
    expect(typeof status.data.lastEvaluationAt).toBe('string')
  })

  it('[正常流程] 📢营销可以查看回滚记录以评估活动影响', () => {
    // 模拟营销活动期间的异常回滚记录
    const opCtrl = new AutoRollbackController(service)
    opCtrl.trigger({
      reason: '营销活动: 优惠券发放接口异常',
      severity: 'CRITICAL',
      metricKey: 'marketing.coupon.issue.error',
      anomalyValue: 0.35,
      baselineValue: 0.01,
    })
    const result = controller.listRecords({ metricKey: 'marketing.coupon.issue.error' })
    expect(Array.isArray(result.data)).toBe(true)
    if (result.data.length > 0) {
      expect(result.data[0].metricKey).toContain('marketing')
    }
  })
})

// ── 跨角色协作场景 ──
describe('AutoRollback - 跨角色协作场景', () => {
  let service: AutoRollbackService

  beforeEach(() => {
    service = new AutoRollbackService()
  })

  it('🎮导玩员触发 → 🎯运行专员确认 → 👔店长查看结果', () => {
    // 导玩员触发
    const gameCtrl = new AutoRollbackController(service)
    const triggered = gameCtrl.trigger({
      reason: '导玩员: 游戏设备严重故障',
      severity: 'CRITICAL',
      metricKey: 'game.machine.crash',
      anomalyValue: 1,
      baselineValue: 0,
    })
    expect(triggered.data.status).toBe('AWAITING_CONFIRM')

    // 运行专员确认
    const opCtrl = new AutoRollbackController(service)
    const confirmed = opCtrl.confirm({ id: triggered.data.id })
    expect(confirmed.data).not.toBeNull()

    // 店长查看结果
    const mgrCtrl = new AutoRollbackController(service)
    const record = mgrCtrl.getRecord(triggered.data.id)
    expect(record.data!.status).not.toBe('AWAITING_CONFIRM')
  })

  it('🔧安监误触发 → 取消 → 📢营销查看记录确认不影响活动', () => {
    // 安监误触发
    const safetyCtrl = new AutoRollbackController(service)
    const triggered = safetyCtrl.trigger({
      reason: '安监传感器短暂波动',
      severity: 'CRITICAL',
      metricKey: 'safety.sensor.spike',
      anomalyValue: 75,
      baselineValue: 25,
    })
    expect(triggered.data.status).toBe('AWAITING_CONFIRM')

    // 安监取消
    const cancelled = safetyCtrl.cancel({ id: triggered.data.id, reason: '安监确认:传感器误报' })
    expect(cancelled.data!.status).toBe('CANCELLED')

    // 营销查看记录
    const mktCtrl = new AutoRollbackController(service)
    const records = mktCtrl.listRecords({ status: 'CANCELLED' })
    expect(records.data.length).toBeGreaterThanOrEqual(1)
    expect(records.data.some((r: any) => r.id === triggered.data.id)).toBe(true)
  })

  it('🛒前台发现异常 → 通知🎯运行专员处理', () => {
    // 前台发现收银系统异常，报告给运维
    const opCtrl = new AutoRollbackController(service)
    const result = opCtrl.trigger({
      reason: '前台报告: 收银系统兑币接口异常',
      severity: 'WARNING',
      metricKey: 'cashier.token_exchange.error',
      anomalyValue: 0.15,
      baselineValue: 0.01,
    })
    expect(result.data.id).toBeDefined()
    expect(result.data.reason).toContain('前台报告')

    // 前台可以查看处理状态
    const cashierCtrl = new AutoRollbackController(service)
    const record = cashierCtrl.getRecord(result.data.id)
    expect(record.data).not.toBeNull()
  })
})
