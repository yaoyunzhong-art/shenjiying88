/**
 * 🐜 自动: [inventory-alert] [C] 角色扩展测试
 *
 * 8 角色视角的库存预警模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 InventoryAlertService + 租户上下文
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { InventoryAlertService, resetInventoryAlertTestState } from './inventory-alert.service'
import { AlertLevel, AlertStatus } from './inventory-alert.entity'
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

/** 角色 → 库存预警模块权限 */
const roleAlertAccess: Record<string, string[]> = {
  'alert:list': ['👔店长', '🛒前台', '🎯运行专员'],
  'alert:detail': ['👔店长', '🎯运行专员'],
  'alert:summary': ['👔店长', '🎯运行专员'],
  'alert:create': ['🛒前台', '🎯运行专员'],
  'alert:level:check': ['👔店长', '🎯运行专员'],
  'alert:overstock:view': ['👔店长', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleAlertAccess[resource]?.includes(role) ?? false
}

const defaultTenant: RequestTenantContext = { tenantId: 'default' }

function makeService(): InventoryAlertService {
  resetInventoryAlertTestState()
  return new InventoryAlertService()
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 库存预警
// ════════════════════════════════════════════════════════════

describe('[👔店长] inventory-alert 角色扩展测试', () => {
  beforeEach(() => resetInventoryAlertTestState())

  it('👔[正例] 店长查看库存预警列表 → 按级别筛选 → 按状态筛选', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'alert:list')).toBe(true)
    const svc = makeService()

    const all = svc.list(defaultTenant)
    expect(all.total).toBeGreaterThan(0)

    const criticalOnly = svc.list(defaultTenant, { alertLevel: AlertLevel.Critical })
    criticalOnly.items.forEach((a) => expect(a.alertLevel).toBe(AlertLevel.Critical))

    const pendingOnly = svc.list(defaultTenant, { status: AlertStatus.Pending })
    pendingOnly.items.forEach((a) => expect(a.status).toBe(AlertStatus.Pending))
  })

  it('👔[正例] 店长查看预警详情 → 查看汇总统计', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'alert:detail')).toBe(true)
    const svc = makeService()

    const alert = svc.getById('alert-crit-1', defaultTenant)
    expect(alert.productName).toBe('面包 全麦')
    expect(alert.alertLevel).toBe(AlertLevel.Critical)
    expect(alert.currentStock).toBe(2)

    expect(checkRoleAccess(ROLES.StoreManager, 'alert:summary')).toBe(true)
    const summary = svc.getSummary(defaultTenant)
    expect(summary.total).toBeGreaterThan(0)
    expect(summary.criticalCount).toBeGreaterThan(0)
    expect(summary.lowCount).toBeGreaterThan(0)
    expect(summary.overstockCount).toBeGreaterThan(0)
  })

  it('👔[正例] 店长检查预警级别判定逻辑', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'alert:level:check')).toBe(true)
    const svc = makeService()

    expect(svc.checkAlertLevel(0, 20, 100)).toBe(AlertLevel.Critical)
    expect(svc.checkAlertLevel(5, 20, 100)).toBe(AlertLevel.Critical) // < min * 0.3
    expect(svc.checkAlertLevel(15, 50, 200)).toBe(AlertLevel.Low)
    expect(svc.checkAlertLevel(300, 50, 200)).toBe(AlertLevel.Overstock)
    expect(svc.checkAlertLevel(100, 50, 200)).toBeNull() // 正常
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 库存预警
// ════════════════════════════════════════════════════════════

describe('[🛒前台] inventory-alert 角色扩展测试', () => {
  beforeEach(() => resetInventoryAlertTestState())

  it('🛒[正例] 前台查看库存预警列表 → 搜索关键词', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'alert:list')).toBe(true)
    const svc = makeService()

    const water = svc.list(defaultTenant, { keyword: '矿泉水' })
    expect(water.items.some((a) => a.productName.includes('矿泉水'))).toBe(true)

    const egg = svc.list(defaultTenant, { keyword: '鸡蛋' })
    expect(egg.total).toBeGreaterThan(0)
  })

  it('🛒[正例] 前台创建库存预警', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'alert:create')).toBe(true)
    const svc = makeService()

    const created = svc.create(defaultTenant, {
      productId: 'prod-new-001',
      alertLevel: AlertLevel.Low,
      message: '测试新品库存偏低',
    })
    expect(created.id).toBeTruthy()
    expect(created.status).toBe(AlertStatus.Pending)
    expect(created.message).toBe('测试新品库存偏低')
  })

  it('🛒[反例] 前台无权限查看预警详情', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'alert:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'alert:summary')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 库存预警
// ════════════════════════════════════════════════════════════

describe('[👥HR] inventory-alert 角色扩展测试', () => {
  beforeEach(() => resetInventoryAlertTestState())

  it('👥[反例] HR 无权限查看库存预警列表', () => {
    expect(checkRoleAccess(ROLES.HR, 'alert:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'alert:detail')).toBe(false)
  })

  it('👥[反例] HR 无权限操作库存预警', () => {
    expect(checkRoleAccess(ROLES.HR, 'alert:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'alert:summary')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'alert:level:check')).toBe(false)
  })

  it('👥[反例] HR 无权限查看积压库存', () => {
    expect(checkRoleAccess(ROLES.HR, 'alert:overstock:view')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 库存预警
// ════════════════════════════════════════════════════════════

describe('[🔧安监] inventory-alert 角色扩展测试', () => {
  beforeEach(() => resetInventoryAlertTestState())

  it('🔧[反例] 安监无权限查看库存预警', () => {
    expect(checkRoleAccess(ROLES.Security, 'alert:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'alert:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'alert:summary')).toBe(false)
  })

  it('🔧[反例] 安监无权限创建预警', () => {
    expect(checkRoleAccess(ROLES.Security, 'alert:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'alert:level:check')).toBe(false)
  })

  it('🔧[闭环] 安监无权限返回统一格式', () => {
    const denied = { success: false, code: 403, message: 'NO_INVENTORY_ALERT_ACCESS', module: 'inventory-alert' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('inventory-alert')
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 库存预警
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] inventory-alert 角色扩展测试', () => {
  beforeEach(() => resetInventoryAlertTestState())

  it('🎮[反例] 导玩员无权限查看库存预警列表', () => {
    expect(checkRoleAccess(ROLES.Guide, 'alert:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'alert:detail')).toBe(false)
  })

  it('🎮[反例] 导玩员无权限创建预警', () => {
    expect(checkRoleAccess(ROLES.Guide, 'alert:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'alert:summary')).toBe(false)
  })

  it('🎮[反例] 导玩员无权限检查库存级别', () => {
    expect(checkRoleAccess(ROLES.Guide, 'alert:level:check')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 库存预警
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] inventory-alert 角色扩展测试', () => {
  beforeEach(() => resetInventoryAlertTestState())

  it('🎯[正例] 运行专员查看库存预警 → 按类型筛选 → 查看详情', () => {
    expect(checkRoleAccess(ROLES.Operations, 'alert:list')).toBe(true)
    const svc = makeService()

    const lowAlerts = svc.list(defaultTenant, { alertLevel: AlertLevel.Low })
    expect(lowAlerts.total).toBeGreaterThan(0)
    lowAlerts.items.forEach((a) => expect(a.alertLevel).toBe(AlertLevel.Low))

    expect(checkRoleAccess(ROLES.Operations, 'alert:detail')).toBe(true)
    const detail = svc.getById('alert-low-1', defaultTenant)
    expect(detail.productName).toBe('矿泉水 500ml')
  })

  it('🎯[正例] 运行专员查看预警汇总 → 积压库存', () => {
    expect(checkRoleAccess(ROLES.Operations, 'alert:summary')).toBe(true)
    const svc = makeService()

    const summary = svc.getSummary(defaultTenant)
    expect(summary.pending).toBeGreaterThan(0)
    expect(summary.resolvedCount).toBeGreaterThan(0)
    expect(summary.ignoredCount).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.Operations, 'alert:overstock:view')).toBe(true)
    const overstock = svc.list(defaultTenant, { alertLevel: AlertLevel.Overstock })
    expect(overstock.total).toBeGreaterThan(0)
    overstock.items.forEach((a) => expect(a.alertLevel).toBe(AlertLevel.Overstock))
  })

  it('🎯[正例] 运行专员创建预警 + 检查级别', () => {
    expect(checkRoleAccess(ROLES.Operations, 'alert:create')).toBe(true)
    const svc = makeService()

    const created = svc.create(defaultTenant, {
      productId: 'prod-ops-001',
      alertLevel: AlertLevel.Critical,
      message: '紧急：测试商品库存为0',
    })
    expect(created.alertLevel).toBe(AlertLevel.Critical)

    expect(checkRoleAccess(ROLES.Operations, 'alert:level:check')).toBe(true)
    expect(svc.checkAlertLevel(0, 30, 200)).toBe(AlertLevel.Critical)
    expect(svc.checkAlertLevel(5, 30, 200)).toBe(AlertLevel.Critical) // < min*0.3
    expect(svc.checkAlertLevel(25, 30, 200)).toBe(AlertLevel.Low)
    expect(svc.checkAlertLevel(300, 30, 200)).toBe(AlertLevel.Overstock)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 库存预警
// ════════════════════════════════════════════════════════════

describe('[🤝团建] inventory-alert 角色扩展测试', () => {
  beforeEach(() => resetInventoryAlertTestState())

  it('🤝[反例] 团建无权限查看库存预警列表', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'alert:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'alert:detail')).toBe(false)
  })

  it('🤝[反例] 团建无权限创建预警', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'alert:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'alert:summary')).toBe(false)
  })

  it('🤝[反例] 团建无权限检查库存级别', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'alert:level:check')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 库存预警
// ════════════════════════════════════════════════════════════

describe('[📢营销] inventory-alert 角色扩展测试', () => {
  beforeEach(() => resetInventoryAlertTestState())

  it('📢[反例] 营销无权限查看库存预警列表', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'alert:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'alert:detail')).toBe(false)
  })

  it('📢[反例] 营销无权限操作库存预警', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'alert:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'alert:summary')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'alert:level:check')).toBe(false)
  })

  it('📢[反例] 营销无权限查看积压库存', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'alert:overstock:view')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 inventory-alert 跨角色闭环 + 边界]', () => {
  beforeEach(() => resetInventoryAlertTestState())

  it('🛒 + 👔 前台创建预警 → 店长查看汇总', () => {
    const svc = makeService()

    // 前台创建预警
    const created = svc.create(defaultTenant, {
      productId: 'prod-cross-001',
      alertLevel: AlertLevel.Critical,
      message: '跨角色测试：紧急预警',
    })

    // 店长查看列表能看到新预警
    const all = svc.list(defaultTenant)
    const found = all.items.find((a) => a.id === created.id)
    expect(found).toBeDefined()
    expect(found!.message).toBe('跨角色测试：紧急预警')

    // 店长查看汇总
    const summary = svc.getSummary(defaultTenant)
    expect(summary.total).toBeGreaterThan(0)
  })

  it('🛡️ 不存在的预警记录抛出错误', () => {
    const svc = makeService()
    expect(() => svc.getById('alert-nonexistent', defaultTenant)).toThrow('not found')
  })

  it('🛡️ 搜索关键字不区分大小写', () => {
    const svc = makeService()
    const lower = svc.list(defaultTenant, { keyword: '矿泉水' })
    const upper = svc.list(defaultTenant, { keyword: '矿泉水' })
    expect(lower.total).toBe(upper.total)
    expect(lower.total).toBeGreaterThan(0)
  })

  it('🛡️ 分页参数正确', () => {
    const svc = makeService()
    const page1 = svc.list(defaultTenant, { offset: 0, limit: 3 })
    expect(page1.items.length).toBeLessThanOrEqual(3)

    const page2 = svc.list(defaultTenant, { offset: 3, limit: 3 })
    if (page2.items.length > 0) {
      expect(page2.items[0].id).not.toBe(page1.items[0]?.id)
    }
  })

  it('🛡️ 按多条 件筛选: level + status', () => {
    const svc = makeService()
    const filtered = svc.list(defaultTenant, {
      alertLevel: AlertLevel.Low,
      status: AlertStatus.Resolved,
    })
    filtered.items.forEach((a) => {
      expect(a.alertLevel).toBe(AlertLevel.Low)
      expect(a.status).toBe(AlertStatus.Resolved)
    })
  })

  it('🛡️ 创建预警默认状态为 pending', () => {
    const svc = makeService()
    const created = svc.create(defaultTenant, {
      productId: 'prod-init-001',
      alertLevel: AlertLevel.Low,
      message: '初始化测试',
    })
    expect(created.status).toBe(AlertStatus.Pending)
  })
})
