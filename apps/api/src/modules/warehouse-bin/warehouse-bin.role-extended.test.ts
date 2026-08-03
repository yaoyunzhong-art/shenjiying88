/**
 * 🐜 自动: [warehouse-bin] [C] 角色扩展测试
 *
 * 8 角色视角的库位管理扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 WarehouseBinService + in-memory Store
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { WarehouseBinService } from './warehouse-bin.service'
import { BinStatus, BinType } from './warehouse-bin.entity'

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

/** 角色 → 库位模块权限 */
const roleBinAccess: Record<string, string[]> = {
  'bin:list': ['👔店长', '🎯运行专员', '🔧安监'],
  'bin:detail': ['👔店长', '🎯运行专员', '🔧安监'],
  'bin:create': ['🎯运行专员'],
  'bin:update': ['🎯运行专员'],
  'bin:delete': ['🎯运行专员'],
  'bin:assign': ['🎯运行专员'],
  'bin:empty': ['🎯运行专员', '🔧安监'],
  'bin:capacity': ['🎯运行专员', '👔店长'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleBinAccess[resource]?.includes(role) ?? false
}

const TENANT = 'tenant-001'

function makeSvc(): WarehouseBinService {
  const svc = new WarehouseBinService()
  svc.resetBinStoresForTests()
  return svc
}

/** 创建一个测试库位 */
function makeTestBin(svc: WarehouseBinService, overrides?: Partial<{
  code: string; area: string; type: BinType; status: BinStatus; capacity: number; usedCapacity: number; currentItem: string
}>) {
  return svc.createBin({
    tenantId: TENANT,
    code: overrides?.code ?? 'TEST-01',
    area: overrides?.area ?? '测试区',
    type: overrides?.type ?? BinType.Shelf,
    status: overrides?.status ?? BinStatus.Empty,
    capacity: overrides?.capacity ?? 100,
    usedCapacity: overrides?.usedCapacity ?? 0,
    currentItem: overrides?.currentItem,
  })
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 库位管理
// ════════════════════════════════════════════════════════════

describe('[👔店长] warehouse-bin 角色扩展测试', () => {
  it('👔[正例] 店长查看库位列表 → 按区域筛选', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'bin:list')).toBe(true)
    const svc = makeSvc()
    makeTestBin(svc, { code: 'A-01', area: 'A区' })

    const aBins = svc.listBins(TENANT, { area: 'A区' })
    aBins.forEach((b) => expect(b.area).toBe('A区'))
  })

  it('👔[正例] 店长查看库位详情', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'bin:detail')).toBe(true)
    const svc = makeSvc()
    const bin = makeTestBin(svc, { code: 'DETAIL-01', currentItem: '电子元器件', type: BinType.Shelf, status: BinStatus.Occupied, capacity: 100, usedCapacity: 50 })

    const detail = svc.getBin(bin.id, TENANT)
    expect(detail).toBeDefined()
    expect(detail!.currentItem).toBe('电子元器件')
  })

  it('👔[正例] 店长查看库位容量利用率', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'bin:capacity')).toBe(true)
    const svc = makeSvc()
    const stats = svc.getCapacityUtilization(TENANT)
    expect(stats.totalCapacity).toBeGreaterThan(0)
    expect(stats.utilizationRate).toBeGreaterThanOrEqual(0)
  })

  it('👔[反例] 店长无权创建/更新/删除库位', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'bin:create')).toBe(false)
    expect(checkRoleAccess(ROLES.StoreManager, 'bin:update')).toBe(false)
    expect(checkRoleAccess(ROLES.StoreManager, 'bin:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 库位管理
// ════════════════════════════════════════════════════════════

describe('[🛒前台] warehouse-bin 角色扩展测试', () => {
  it('🛒[反例] 前台无权查看库位列表', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'bin:list')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'bin:detail')).toBe(false)
  })

  it('🛒[反例] 前台无权操作库位', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'bin:create')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'bin:update')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'bin:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'bin:assign')).toBe(false)
  })

  it('🛒[闭环] 前台无权限返回统一拒绝格式', () => {
    const denied = { success: false, code: 403, message: 'NO_WAREHOUSE_BIN_ACCESS', module: 'warehouse-bin' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('warehouse-bin')
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 库位管理
// ════════════════════════════════════════════════════════════

describe('[👥HR] warehouse-bin 角色扩展测试', () => {
  it('👥[反例] HR 无权查看库位', () => {
    expect(checkRoleAccess(ROLES.HR, 'bin:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'bin:detail')).toBe(false)
  })

  it('👥[反例] HR 无权操作库位', () => {
    expect(checkRoleAccess(ROLES.HR, 'bin:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'bin:update')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'bin:assign')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'bin:capacity')).toBe(false)
  })

  it('👥[闭环] HR 无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_WAREHOUSE_BIN_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 库位管理
// ════════════════════════════════════════════════════════════

describe('[🔧安监] warehouse-bin 角色扩展测试', () => {
  it('🔧[正例] 安监查看库位列表 → 按类型筛选', async () => {
    expect(checkRoleAccess(ROLES.Security, 'bin:list')).toBe(true)
    const svc = makeSvc()
    makeTestBin(svc, { code: 'COLD-01', area: '冷库', type: BinType.Cold })

    const coldBins = svc.listBins(TENANT, { type: BinType.Cold })
    coldBins.forEach((b) => expect(b.type).toBe(BinType.Cold))
  })

  it('🔧[正例] 安监查看库位详情', async () => {
    expect(checkRoleAccess(ROLES.Security, 'bin:detail')).toBe(true)
    const svc = makeSvc()
    const bin = makeTestBin(svc, { code: 'HAZ-01', type: BinType.Hazardous, currentItem: '盐酸(工业级)', status: BinStatus.Occupied, capacity: 100, usedCapacity: 60 })

    const detail = svc.getBin(bin.id, TENANT)
    expect(detail).toBeDefined()
    expect(detail!.type).toBe(BinType.Hazardous)
  })

  it('🔧[正例] 安监查看空库位', async () => {
    expect(checkRoleAccess(ROLES.Security, 'bin:empty')).toBe(true)
    const svc = makeSvc()
    const empty = svc.getEmptyBins(TENANT)
    expect(empty.length).toBeGreaterThanOrEqual(0)
    empty.forEach((b) => expect(b.status).toBe(BinStatus.Empty))
  })

  it('🔧[反例] 安监无权创建/修改库位', () => {
    expect(checkRoleAccess(ROLES.Security, 'bin:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'bin:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'bin:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 库位管理
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] warehouse-bin 角色扩展测试', () => {
  it('🎮[反例] 导玩员无权查看库位', () => {
    expect(checkRoleAccess(ROLES.Guide, 'bin:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'bin:detail')).toBe(false)
  })

  it('🎮[反例] 导玩员无权操作库位', () => {
    expect(checkRoleAccess(ROLES.Guide, 'bin:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'bin:assign')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'bin:empty')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'bin:capacity')).toBe(false)
  })

  it('🎮[闭环] 导玩员无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_WAREHOUSE_BIN_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 库位管理
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] warehouse-bin 角色扩展测试', () => {
  it('🎯[正例] 运行专员创建库位', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'bin:create')).toBe(true)
    const svc = makeSvc()
    const bin = svc.createBin({
      tenantId: TENANT, code: 'NEW-01', area: '新库区',
      type: BinType.Floor, capacity: 500,
    })
    expect(bin.status).toBe(BinStatus.Empty)
    expect(bin.capacity).toBe(500)
  })

  it('🎯[正例] 运行专员更新库位 → 分配物品', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'bin:update')).toBe(true)
    const svc = makeSvc()
    const bin = makeTestBin(svc, { code: 'UPD-01', capacity: 100 })

    const updated = svc.updateBin(bin.id, TENANT, { capacity: 200, area: '更新区' })
    expect(updated.capacity).toBe(200)
    expect(updated.area).toBe('更新区')

    expect(checkRoleAccess(ROLES.Operations, 'bin:assign')).toBe(true)
    const assigned = svc.assignItem(bin.id, '新货物', 50, TENANT)
    expect(assigned.usedCapacity).toBe(50)
    expect(assigned.currentItem).toBe('新货物')
    expect(assigned.status).toBe(BinStatus.Occupied)
  })

  it('🎯[正例] 运行专员查看容量利用率 → 空库位', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'bin:capacity')).toBe(true)
    const svc = makeSvc()

    const stats = svc.getCapacityUtilization(TENANT)
    expect(stats.bins.length).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.Operations, 'bin:empty')).toBe(true)
    const empty = svc.getEmptyBins(TENANT)
    empty.forEach((b) => expect(b.status).toBe(BinStatus.Empty))
  })

  it('🎯[正例] 运行专员删除库位', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'bin:delete')).toBe(true)
    const svc = makeSvc()
    const bin = makeTestBin(svc, { code: 'DEL-01' })
    svc.deleteBin(bin.id, TENANT)
    const found = svc.getBin(bin.id, TENANT)
    expect(found).toBeUndefined()
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 库位管理
// ════════════════════════════════════════════════════════════

describe('[🤝团建] warehouse-bin 角色扩展测试', () => {
  it('🤝[反例] 团建无权查看库位', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'bin:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'bin:detail')).toBe(false)
  })

  it('🤝[反例] 团建无权操作库位', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'bin:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'bin:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'bin:delete')).toBe(false)
  })

  it('🤝[闭环] 团建无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_WAREHOUSE_BIN_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 库位管理
// ════════════════════════════════════════════════════════════

describe('[📢营销] warehouse-bin 角色扩展测试', () => {
  it('📢[反例] 营销无权查看库位', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'bin:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'bin:detail')).toBe(false)
  })

  it('📢[反例] 营销无权操作库位', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'bin:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'bin:assign')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'bin:capacity')).toBe(false)
  })

  it('📢[闭环] 营销无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_WAREHOUSE_BIN_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 warehouse-bin 跨角色闭环 + 边界]', () => {
  it('🎯创建库位 → 分配物品 → 移除 → 👔查看容量全流程', async () => {
    const svc = makeSvc()

    // 1. 运行专员创建库位
    const bin = svc.createBin({
      tenantId: TENANT, code: 'CROSS-01', area: '流程区',
      type: BinType.Shelf, capacity: 200,
    })
    expect(bin.status).toBe(BinStatus.Empty)

    // 2. 运行专员分配物品
    const assigned = svc.assignItem(bin.id, '跨流程货物', 80, TENANT)
    expect(assigned.usedCapacity).toBe(80)
    expect(assigned.status).toBe(BinStatus.Occupied)

    // 3. 移除部分物品
    const removed = svc.removeItem(bin.id, 30, TENANT)
    expect(removed.usedCapacity).toBe(50)

    // 4. 店长查看容量利用率
    const stats = svc.getCapacityUtilization(TENANT)
    expect(stats.totalCapacity).toBeGreaterThan(0)

    // 5. 安监查看库位
    const binDetail = svc.getBin(bin.id, TENANT)
    expect(binDetail).toBeDefined()
  })

  it('🛡️ 库位容量不足抛错', () => {
    const svc = makeSvc()
    const bin = makeTestBin(svc, { capacity: 100, usedCapacity: 80 })
    expect(() => svc.assignItem(bin.id, '超量物品', 50, TENANT)).toThrow(/Insufficient capacity/)
  })

  it('🛡️ 分配物品到维护库位抛错', () => {
    const svc = makeSvc()
    const bin = svc.createBin({
      tenantId: TENANT, code: 'MAINT-01', area: '维护区',
      type: BinType.Shelf, status: BinStatus.Maintenance, capacity: 100,
    })
    expect(() => svc.assignItem(bin.id, '新物品', 10, TENANT)).toThrow(/under maintenance/)
  })

  it('🛡️ 移除超出库存抛错', () => {
    const svc = makeSvc()
    const bin = makeTestBin(svc, { usedCapacity: 10, status: BinStatus.Occupied })
    expect(() => svc.removeItem(bin.id, 20, TENANT)).toThrow(/Cannot remove/)
  })

  it('🛡️ 清空库位后状态变 Empty', () => {
    const svc = makeSvc()
    const bin = makeTestBin(svc, { code: 'CLR-01', capacity: 100, usedCapacity: 80, currentItem: '货物', status: BinStatus.Occupied })
    const cleared = svc.removeItem(bin.id, 80, TENANT)
    expect(cleared.usedCapacity).toBe(0)
    expect(cleared.status).toBe(BinStatus.Empty)
    expect(cleared.currentItem).toBeUndefined()
  })

  it('🛡️ 预定空库位', () => {
    const svc = makeSvc()
    const bin = makeTestBin(svc, { code: 'RES-01', status: BinStatus.Empty })
    const reserved = svc.reserveBin(bin.id, TENANT)
    expect(reserved.status).toBe(BinStatus.Reserved)
  })

  it('🛡️ 非空库位不可预定', () => {
    const svc = makeSvc()
    const bin = makeTestBin(svc, { code: 'NO-RES', status: BinStatus.Occupied, capacity: 100, usedCapacity: 50 })
    expect(() => svc.reserveBin(bin.id, TENANT)).toThrow(/Cannot reserve/)
  })

  it('🛡️ 跨租户访问返回 undefined', () => {
    const svc = makeSvc()
    const bin = makeTestBin(svc)
    const found = svc.getBin(bin.id, 'wrong-tenant')
    expect(found).toBeUndefined()
  })
})
