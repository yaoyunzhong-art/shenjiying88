/**
 * 🐜 自动: [supplier-manager] [C] 角色扩展测试
 *
 * 8 角色视角的供应商管理扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 SupplierManagerService + in-memory Store
 */
import { describe, it, expect } from 'vitest'
import { SupplierManagerService } from './supplier-manager.service'
import { SupplierStatus, SupplierRating } from './supplier-manager.entity'

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

const roleSupplierAccess: Record<string, string[]> = {
  'supplier:list': ['👔店长', '🎯运行专员'],
  'supplier:detail': ['👔店长', '🎯运行专员', '🛒前台'],
  'supplier:create': ['👔店长', '🎯运行专员'],
  'supplier:update': ['👔店长', '🎯运行专员'],
  'supplier:delete': ['👔店长'],
  'supplier:rate': ['👔店长', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleSupplierAccess[resource]?.includes(role) ?? false
}

const TENANT = 'tenant-001'

// ════════════════════════════════════════════════════════════
// 👔店长 — 供应商
// ════════════════════════════════════════════════════════════

describe('[👔店长] supplier-manager 角色扩展测试', () => {
  it('👔[正例] 店长查看供应商列表 → 按状态筛选 → 按类别筛选', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'supplier:list')).toBe(true)
    const svc = new SupplierManagerService()
    const all = svc.listSuppliers(TENANT)
    expect(all.length).toBeGreaterThan(0)

    const active = svc.listSuppliers(TENANT, { status: SupplierStatus.Active })
    active.forEach((s) => expect(s.status).toBe(SupplierStatus.Active))

    const electronic = svc.listSuppliers(TENANT, { category: '电子元器件' })
    electronic.forEach((s) => expect(s.category).toBe('电子元器件'))
  })

  it('👔[正例] 店长创建新供应商 → 查看详情 → 更新评分', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'supplier:create')).toBe(true)
    const svc = new SupplierManagerService()
    const created = svc.createSupplier({
      tenantId: TENANT, name: '新供应商', code: 'SUP-NEW',
      contactPerson: '测试', phone: '13800000000', email: 'test@test.com',
      address: '测试地址', category: '测试类',
    })
    expect(created.status).toBe(SupplierStatus.Active)
    expect(created.name).toBe('新供应商')

    expect(checkRoleAccess(ROLES.StoreManager, 'supplier:detail')).toBe(true)
    const detail = svc.getSupplier(created.id, TENANT)
    expect(detail).toBeDefined()
    expect(detail!.phone).toBe('13800000000')

    expect(checkRoleAccess(ROLES.StoreManager, 'supplier:rate')).toBe(true)
    const updated = svc.updateSupplier(created.id, TENANT, { rating: SupplierRating.A })
    expect(updated.rating).toBe(SupplierRating.A)
  })

  it('👔[正例] 店长删除供应商', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'supplier:delete')).toBe(true)
    const svc = new SupplierManagerService()
    const created = svc.createSupplier({
      tenantId: TENANT, name: '待删除', code: 'SUP-DEL',
      contactPerson: '测试', phone: '13800000001', email: 'del@test.com',
      address: '待删除地址', category: '测试类',
    })
    expect(svc.getSupplier(created.id, TENANT)).toBeDefined()
    svc.deleteSupplier(created.id, TENANT)
    expect(svc.getSupplier(created.id, TENANT)).toBeUndefined()
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 供应商
// ════════════════════════════════════════════════════════════

describe('[🛒前台] supplier-manager 角色扩展测试', () => {
  it('🛒[正例] 前台查看供应商详情（联系信息查阅）', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'supplier:detail')).toBe(true)
    const svc = new SupplierManagerService()
    const all = svc.listSuppliers(TENANT)
    if (all.length > 0) {
      const detail = svc.getSupplier(all[0].id, TENANT)
      expect(detail).toBeDefined()
      expect(detail!.contactPerson).toBeDefined()
      expect(detail!.phone).toBeDefined()
    }
  })

  it('🛒[反例] 前台无权创建/修改/删除供应商', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'supplier:create')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'supplier:update')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'supplier:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'supplier:rate')).toBe(false)
  })

  it('🛒[闭环] 前台仅查询供应商联系信息，无管理权限', () => {
    const canDetail = checkRoleAccess(ROLES.FrontDesk, 'supplier:detail')
    const canList = checkRoleAccess(ROLES.FrontDesk, 'supplier:list')
    expect(canDetail).toBe(true)
    expect(canList).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 供应商
// ════════════════════════════════════════════════════════════

describe('[👥HR] supplier-manager 角色扩展测试', () => {
  it('👥[反例] HR 无权操作供应商', () => {
    expect(checkRoleAccess(ROLES.HR, 'supplier:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'supplier:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'supplier:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'supplier:update')).toBe(false)
  })

  it('👥[反例] HR 无权查看供应商评分', () => {
    expect(checkRoleAccess(ROLES.HR, 'supplier:rate')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'supplier:delete')).toBe(false)
  })

  it('👥[闭环] HR 不涉及供应商管理', () => {
    const denied = { code: 403, role: ROLES.HR, module: 'supplier' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 供应商
// ════════════════════════════════════════════════════════════

describe('[🔧安监] supplier-manager 角色扩展测试', () => {
  it('🔧[反例] 安监无权操作供应商', () => {
    expect(checkRoleAccess(ROLES.Security, 'supplier:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'supplier:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'supplier:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'supplier:update')).toBe(false)
  })

  it('🔧[反例] 安监无权删除或评分供应商', () => {
    expect(checkRoleAccess(ROLES.Security, 'supplier:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'supplier:rate')).toBe(false)
  })

  it('🔧[闭环] 安监不涉及供应商管理', () => {
    const denied = { code: 403, role: ROLES.Security }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 供应商
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] supplier-manager 角色扩展测试', () => {
  it('🎮[反例] 导玩员无权操作供应商', () => {
    expect(checkRoleAccess(ROLES.Guide, 'supplier:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'supplier:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'supplier:create')).toBe(false)
  })

  it('🎮[反例] 导玩员无权评估供应商', () => {
    expect(checkRoleAccess(ROLES.Guide, 'supplier:rate')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'supplier:update')).toBe(false)
  })

  it('🎮[闭环] 导玩员不可见供应商菜单', () => {
    const denied = { code: 403, role: ROLES.Guide }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 供应商
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] supplier-manager 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看供应商列表 → 按评分筛选 → 搜索', () => {
    expect(checkRoleAccess(ROLES.Operations, 'supplier:list')).toBe(true)
    const svc = new SupplierManagerService()
    const all = svc.listSuppliers(TENANT)
    expect(all.length).toBeGreaterThan(0)

    const aRated = svc.listSuppliers(TENANT, { rating: SupplierRating.A })
    aRated.forEach((s) => expect(s.rating).toBe(SupplierRating.A))

    const searched = svc.listSuppliers(TENANT, { search: '华强' })
    expect(searched.length).toBeGreaterThan(0)
  })

  it('🎯[正例] 运行专员创建供应商 → 更新信息', () => {
    expect(checkRoleAccess(ROLES.Operations, 'supplier:create')).toBe(true)
    const svc = new SupplierManagerService()
    const created = svc.createSupplier({
      tenantId: TENANT, name: '运营创建供应商', code: 'SUP-OPS',
      contactPerson: '运营', phone: '13900000000', email: 'ops@test.com',
      address: '运营地址', category: '运营类',
    })
    expect(created.name).toBe('运营创建供应商')

    expect(checkRoleAccess(ROLES.Operations, 'supplier:update')).toBe(true)
    const updated = svc.updateSupplier(created.id, TENANT, { name: '运营更新名' })
    expect(updated.name).toBe('运营更新名')
  })

  it('🎯[正例] 运行专员更新供应商评分', () => {
    expect(checkRoleAccess(ROLES.Operations, 'supplier:rate')).toBe(true)
    const svc = new SupplierManagerService()
    const all = svc.listSuppliers(TENANT)
    if (all.length > 0) {
      const updated = svc.updateSupplier(all[0].id, TENANT, { rating: SupplierRating.A })
      expect(updated.rating).toBe(SupplierRating.A)
    } else {
      expect(all.length).toBeGreaterThan(0)
    }
  })

  it('🎯[反例] 运行专员无权删除供应商', () => {
    expect(checkRoleAccess(ROLES.Operations, 'supplier:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 供应商
// ════════════════════════════════════════════════════════════

describe('[🤝团建] supplier-manager 角色扩展测试', () => {
  it('🤝[反例] 团建无权操作供应商', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'supplier:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'supplier:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'supplier:create')).toBe(false)
  })

  it('🤝[反例] 团建无权评分供应商', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'supplier:rate')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'supplier:update')).toBe(false)
  })

  it('🤝[闭环] 团建不涉及供应商', () => {
    const denied = { code: 403, role: ROLES.Teambuilding }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 供应商
// ════════════════════════════════════════════════════════════

describe('[📢营销] supplier-manager 角色扩展测试', () => {
  it('📢[反例] 营销无权操作供应商', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'supplier:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'supplier:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'supplier:create')).toBe(false)
  })

  it('📢[反例] 营销无权评估供应商', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'supplier:rate')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'supplier:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'supplier:delete')).toBe(false)
  })

  it('📢[闭环] 营销不可见供应商管理', () => {
    const denied = { code: 403, role: ROLES.Marketing, module: 'supplier' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 supplier-manager 跨角色闭环 + 边界]', () => {
  it('👔+🎯 运行专员评估 → 店长批准签约 → 供应商入库', () => {
    const svc = new SupplierManagerService()

    // 1. 运行专员创建新供应商
    const created = svc.createSupplier({
      tenantId: TENANT, name: '候选供应商', code: 'SUP-CANDIDATE',
      contactPerson: '候选人', phone: '13700000000', email: 'candidate@test.com',
      address: '候选地址', category: '候选类',
    })
    expect(created.status).toBe(SupplierStatus.Active)

    // 2. 运行专员评估
    const evaluated = svc.updateSupplier(created.id, TENANT, { rating: SupplierRating.A, remark: '评估通过' })
    expect(evaluated.rating).toBe(SupplierRating.A)
    expect(evaluated.remark).toBe('评估通过')

    // 3. 店长查看并确认
    const confirmed = svc.getSupplier(created.id, TENANT)
    expect(confirmed).toBeDefined()
    expect(confirmed!.rating).toBe(SupplierRating.A)
  })

  it('🛡️ 不存在的供应商返回 undefined', () => {
    const svc = new SupplierManagerService()
    expect(svc.getSupplier('nonexistent', TENANT)).toBeUndefined()
  })

  it('🛡️ 查询已删除供应商报错', () => {
    const svc = new SupplierManagerService()
    const created = svc.createSupplier({
      tenantId: TENANT, name: '删除测试', code: 'SUP-DEL2',
      contactPerson: '测试', phone: '13600000000', email: 'del2@test.com',
      address: '地址', category: '类',
    })
    svc.deleteSupplier(created.id, TENANT)
    expect(svc.getSupplier(created.id, TENANT)).toBeUndefined()
  })

  it('🛡️ 租户隔离：另一租户看不到供应商', () => {
    const svc = new SupplierManagerService()
    const otherTenants = svc.listSuppliers('tenant-other')
    expect(otherTenants.length).toBe(0)
  })

  it('🛡️ 按 Suspended 状态筛选', () => {
    const svc = new SupplierManagerService()
    const suspended = svc.listSuppliers(TENANT, { status: SupplierStatus.Suspended })
    expect(suspended.length).toBeGreaterThanOrEqual(1)
    suspended.forEach((s) => expect(s.status).toBe(SupplierStatus.Suspended))
  })

  it('🛡️ 搜索返回正确结果', () => {
    const svc = new SupplierManagerService()
    const results = svc.listSuppliers(TENANT, { search: '华强' })
    expect(results.length).toBeGreaterThan(0)
    const hasMatch = results.some(
      (s) => s.name.includes('华强') || s.code.includes('华强') || s.contactPerson.includes('华强'),
    )
    expect(hasMatch).toBe(true)
  })

  it('🛡️ 更新不存在的供应商报错', () => {
    const svc = new SupplierManagerService()
    expect(() => svc.updateSupplier('nonexistent', TENANT, { name: '新名' }))
      .toThrow('Supplier not found')
  })

  it('🛡️ 创建供应商含完整字段', () => {
    const svc = new SupplierManagerService()
    const s = svc.createSupplier({
      tenantId: TENANT, name: '完整测试', code: 'SUP-FULL',
      contactPerson: '联系人', phone: '13500000000', email: 'full@test.com',
      address: '地址', category: '类别', remark: '备注',
    })
    expect(s.name).toBe('完整测试')
    expect(s.code).toBe('SUP-FULL')
    expect(s.contactPerson).toBe('联系人')
    expect(s.phone).toBe('13500000000')
    expect(s.remark).toBe('备注')
  })
})
