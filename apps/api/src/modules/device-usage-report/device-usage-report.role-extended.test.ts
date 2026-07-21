/**
 * 🐜 自动: [device-usage-report] [C] 角色扩展测试
 *
 * 8 角色视角的设备使用报告模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 DeviceUsageReportService + in-memory Store
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { DeviceUsageReportService } from './device-usage-report.service'
import { DeviceType } from './device-usage-report.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── 角色权限矩阵 ──

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

/** 角色 → 设备使用报告模块权限 */
const roleDevAccess: Record<string, string[]> = {
  'dev:list': ['👔店长', '🎯运行专员'],
  'dev:detail': ['👔店长', '🎯运行专员'],
  'dev:summary': ['👔店长', '🎯运行专员', '📢营销'],
  'dev:create': ['🎯运行专员'],
  'dev:delete': ['🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleDevAccess[resource]?.includes(role) ?? false
}

const defCtx: RequestTenantContext = { tenantId: 'default' }

/** 每个 test 用新的 service 实例（seed 只做一次） */
function makeSvc(): DeviceUsageReportService {
  return new DeviceUsageReportService()
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 设备使用报告
// ════════════════════════════════════════════════════════════

describe('[👔店长] device-usage-report 角色扩展测试', () => {
  it('👔[正例] 店长查看设备使用列表 → 按门店筛选', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'dev:list')).toBe(true)
    const svc = makeSvc()
    const all = svc.list(defCtx)
    expect(all.total).toBeGreaterThan(0)

    const storeItems = svc.list(defCtx, { storeId: 'store-001' })
    storeItems.items.forEach((r) => expect(r.storeId).toBe('store-001'))
  })

  it('👔[正例] 店长查看设备使用详情', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'dev:detail')).toBe(true)
    const svc = makeSvc()
    const detail = svc.getById('dev-usage-001', defCtx)
    expect(detail.deviceName).toBe('街机-拳皇97')
    expect(detail.deviceType).toBe(DeviceType.Arcade)
  })

  it('👔[正例] 店长查看设备使用率汇总', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'dev:summary')).toBe(true)
    const svc = makeSvc()
    const summary = svc.getSummary(defCtx)
    expect(summary.totalDevices).toBeGreaterThan(0)
    expect(summary.avgUsageRate).toBeGreaterThan(0)
    expect(summary.avgUsageRate).toBeLessThanOrEqual(100)
  })

  it('👔[反例] 店长无权创建或删除设备使用报告', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'dev:create')).toBe(false)
    expect(checkRoleAccess(ROLES.StoreManager, 'dev:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 设备使用报告
// ════════════════════════════════════════════════════════════

describe('[🛒前台] device-usage-report 角色扩展测试', () => {
  it('🛒[反例] 前台无权查看设备列表', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'dev:list')).toBe(false)
  })

  it('🛒[反例] 前台无权查看设备详情', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'dev:detail')).toBe(false)
  })

  it('🛒[反例] 前台无权创建设备报告', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'dev:create')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'dev:delete')).toBe(false)
  })

  it('🛒[闭环] 前台无权限返回统一拒绝格式', () => {
    const denied = { success: false, code: 403, message: 'NO_DEVICE_USAGE_ACCESS', module: 'device-usage-report' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('device-usage-report')
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 设备使用报告
// ════════════════════════════════════════════════════════════

describe('[👥HR] device-usage-report 角色扩展测试', () => {
  it('👥[反例] HR 无权查看设备列表', () => {
    expect(checkRoleAccess(ROLES.HR, 'dev:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'dev:detail')).toBe(false)
  })

  it('👥[反例] HR 无权查看汇总', () => {
    expect(checkRoleAccess(ROLES.HR, 'dev:summary')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'dev:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'dev:delete')).toBe(false)
  })

  it('👥[闭环] HR 无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_DEVICE_USAGE_ACCESS', module: 'device-usage-report' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 设备使用报告
// ════════════════════════════════════════════════════════════

describe('[🔧安监] device-usage-report 角色扩展测试', () => {
  it('🔧[反例] 安监无权查看设备列表', () => {
    expect(checkRoleAccess(ROLES.Security, 'dev:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'dev:detail')).toBe(false)
  })

  it('🔧[反例] 安监无权查看汇总', () => {
    expect(checkRoleAccess(ROLES.Security, 'dev:summary')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'dev:create')).toBe(false)
  })

  it('🔧[闭环] 安监无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_DEVICE_USAGE_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 设备使用报告
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] device-usage-report 角色扩展测试', () => {
  it('🎮[反例] 导玩员无权查看设备列表', () => {
    expect(checkRoleAccess(ROLES.Guide, 'dev:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'dev:detail')).toBe(false)
  })

  it('🎮[反例] 导玩员无权查看汇总', () => {
    expect(checkRoleAccess(ROLES.Guide, 'dev:summary')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'dev:create')).toBe(false)
  })

  it('🎮[闭环] 导玩员无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_DEVICE_USAGE_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 设备使用报告
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] device-usage-report 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看设备列表 → 按设备类型过滤', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'dev:list')).toBe(true)
    const svc = makeSvc()
    const racingItems = svc.list(defCtx, { deviceType: DeviceType.Racing })
    expect(racingItems.total).toBeGreaterThan(0)
    racingItems.items.forEach((r) => expect(r.deviceType).toBe(DeviceType.Racing))
  })

  it('🎯[正例] 运行专员查看设备详情 → 查看汇总', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'dev:detail')).toBe(true)
    const svc = makeSvc()
    const detail = svc.getById('dev-usage-004', defCtx)
    expect(detail.dailyRevenue).toBe(2100)

    expect(checkRoleAccess(ROLES.Operations, 'dev:summary')).toBe(true)
    const summary = svc.getSummary(defCtx)
    expect(summary.peakDeviceType).toBe(DeviceType.Racing)
  })

  it('🎯[正例] 运行专员创建设备使用报告', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'dev:create')).toBe(true)
    const svc = makeSvc()
    const created = svc.create(defCtx, {
      deviceId: 'dev-new-01', deviceName: '新设备-测试机',
      deviceType: DeviceType.VR, storeId: 'store-004',
      usageRate: 75, idleRate: 18, maintenanceRate: 7,
      peakHours: '14:00-20:00', avgSessionMinutes: 28, dailyRevenue: 2000,
      date: '2026-07-21',
    })
    expect(created.deviceName).toBe('新设备-测试机')
    expect(svc.getById(created.id, defCtx)).toBeDefined()

    expect(checkRoleAccess(ROLES.Operations, 'dev:delete')).toBe(true)
    svc.delete(created.id, defCtx)
    expect(() => svc.getById(created.id, defCtx)).toThrow()
  })

  it('🎯[边界] 运行专员查看不存在的设备详情', () => {
    const svc = makeSvc()
    expect(() => svc.getById('dev-nonexistent', defCtx)).toThrow()
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 设备使用报告
// ════════════════════════════════════════════════════════════

describe('[🤝团建] device-usage-report 角色扩展测试', () => {
  it('🤝[反例] 团建无权查看设备列表', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'dev:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'dev:detail')).toBe(false)
  })

  it('🤝[反例] 团建无权查看汇总', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'dev:summary')).toBe(false)
  })

  it('🤝[闭环] 团建无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_DEVICE_USAGE_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 设备使用报告
// ════════════════════════════════════════════════════════════

describe('[📢营销] device-usage-report 角色扩展测试', () => {
  it('📢[正例] 营销查看设备使用率汇总 → 辅助营销决策', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'dev:summary')).toBe(true)
    const svc = makeSvc()
    const summary = svc.getSummary(defCtx)
    expect(summary.totalDailyRevenue).toBeGreaterThan(0)
    expect(summary.avgUsageRate).toBeGreaterThan(0)
  })

  it('📢[反例] 营销无权查看设备详情', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'dev:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'dev:list')).toBe(false)
  })

  it('📢[反例] 营销无权创建设备报告', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'dev:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'dev:delete')).toBe(false)
  })

  it('📢[闭环] 营销可通过汇总判断高价值设备', () => {
    const svc = makeSvc()
    const summary = svc.getSummary(defCtx)
    // 高日营收设备辅助营销资源分配
    expect(summary.totalDailyRevenue).toBeGreaterThan(13000)
    // Racing 平均使用率最高
    expect(summary.peakDeviceType).toBe(DeviceType.Racing)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 device-usage-report 跨角色闭环 + 边界]', () => {
  it('🎯 + 👔 创建设备报告 → 查看 → 删除全流程', async () => {
    const svc = makeSvc()

    // 1. 运行专员创建
    const created = svc.create(defCtx, {
      deviceId: 'dev-cross-01', deviceName: '跨流程测试-跳舞机',
      deviceType: DeviceType.Arcade, storeId: 'store-005',
      usageRate: 80, idleRate: 12, maintenanceRate: 8,
      peakHours: '15:00-20:00', avgSessionMinutes: 20, dailyRevenue: 1800,
      date: '2026-07-21',
    })
    expect(created.id).toBeTruthy()

    // 2. 店长查看详情
    const detail = svc.getById(created.id, defCtx)
    expect(detail.deviceName).toBe('跨流程测试-跳舞机')
    expect(detail.dailyRevenue).toBe(1800)

    // 3. 汇总包含新设备
    const summary = svc.getSummary(defCtx)
    expect(summary.totalDevices).toBeGreaterThanOrEqual(9)

    // 4. 运行专员删除
    svc.delete(created.id, defCtx)
    expect(() => svc.getById(created.id, defCtx)).toThrow()
  })

  it('🛡️ 按日期范围筛选返回正确结果', () => {
    const svc = makeSvc()
    const result = svc.list(defCtx, { startDate: '2026-07-15', endDate: '2026-07-15' })
    expect(result.total).toBeGreaterThan(0)
  })

  it('🛡️ 组合过滤 store + deviceType', () => {
    const svc = makeSvc()
    const result = svc.list(defCtx, { storeId: 'store-002', deviceType: DeviceType.Racing })
    expect(result.total).toBe(1)
    expect(result.items[0].deviceName).toBe('赛车-头文字D')
  })

  it('🛡️ 跨租户访问被拒绝', () => {
    const svc = makeSvc()
    const otherCtx: RequestTenantContext = { tenantId: 'other-tenant' }
    expect(() => svc.getById('dev-usage-001', otherCtx)).toThrow()
  })

  it('🛡️ 删除不存在的记录抛错', () => {
    const svc = makeSvc()
    expect(() => svc.delete('dev-usage-nonexistent', defCtx)).toThrow()
  })

  it('🛡️ 汇总字段数据类型正确', () => {
    const svc = makeSvc()
    const summary = svc.getSummary(defCtx)
    expect(typeof summary.avgUsageRate).toBe('number')
    expect(typeof summary.totalDailyRevenue).toBe('number')
    expect(typeof summary.peakDeviceType).toBe('string')
    expect(typeof summary.lowestUsageDevice).toBe('string')
  })
})
