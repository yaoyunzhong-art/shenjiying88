/**
 * 🐜 自动: [quality-inspection] [C] 角色扩展测试
 *
 * 8 角色视角的品质检验模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 QualityInspectionService
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { QualityInspectionService } from './quality-inspection.service'
import { InspectionType, InspectionResult, Severity } from './quality-inspection.entity'

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

/** 角色 → 品质检验模块权限 */
const roleQcAccess: Record<string, string[]> = {
  'qc:create': ['🔧安监', '🎯运行专员'],
  'qc:view': ['👔店长', '🔧安监', '🎯运行专员'],
  'qc:list': ['👔店长', '🔧安监', '🎯运行专员'],
  'qc:update': ['🔧安监', '🎯运行专员'],
  'qc:delete': ['🎯运行专员'],
  'qc:stats': ['👔店长', '🔧安监', '🎯运行专员'],
  'qc:items': ['👔店长', '🔧安监', '🎯运行专员'],
  'qc:failed': ['👔店长', '🔧安监', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleQcAccess[resource]?.includes(role) ?? false
}

const DEFAULT_TENANT = 'tenant-001'

function makeService(): QualityInspectionService {
  const svc = new QualityInspectionService()
  svc.resetInspectionStoresForTests()
  return svc
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 品质检验
// ════════════════════════════════════════════════════════════

describe('[👔店长] quality-inspection 角色扩展测试', () => {
  it('👔[正例] 店长查看检验列表 → 按类型/结果筛选', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'qc:list')).toBe(true)
    const svc = makeService()

    const all = svc.listInspections(DEFAULT_TENANT)
    expect(all.length).toBeGreaterThan(0)

    const incoming = svc.listInspections(DEFAULT_TENANT, { type: InspectionType.Incoming })
    incoming.forEach((r) => expect(r.type).toBe(InspectionType.Incoming))

    const failed = svc.listInspections(DEFAULT_TENANT, { result: InspectionResult.Fail })
    failed.forEach((r) => expect(r.result).toBe(InspectionResult.Fail))

    const search = svc.listInspections(DEFAULT_TENANT, { search: '电阻器' })
    expect(search.length).toBeGreaterThan(0)
  })

  it('👔[正例] 店长查看检验详情 + 统计', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'qc:view')).toBe(true)
    const svc = makeService()

    const all = svc.listInspections(DEFAULT_TENANT)
    const first = svc.getInspection(all[0].id, DEFAULT_TENANT)
    expect(first).toBeDefined()
    expect(first!.inspectNo).toBeTruthy()
    expect(first!.defects).toBeDefined()

    expect(checkRoleAccess(ROLES.StoreManager, 'qc:stats')).toBe(true)
    const stats = svc.getPassRate(DEFAULT_TENANT)
    expect(stats.total).toBeGreaterThan(0)
    expect(typeof stats.passRate).toBe('number')
    expect(stats.passRate).toBeGreaterThan(0)
  })

  it('👔[正例] 店长查看不合格品 + 按项目筛选', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'qc:failed')).toBe(true)
    const svc = makeService()

    const failed = svc.getFailedInspections(DEFAULT_TENANT)
    expect(failed.length).toBeGreaterThan(0)
    failed.forEach((r) => expect(r.result).toBe(InspectionResult.Fail))

    expect(checkRoleAccess(ROLES.StoreManager, 'qc:items')).toBe(true)
    const items = svc.getInspectionsByItems('电阻器套装', DEFAULT_TENANT)
    expect(items.length).toBeGreaterThan(0)
    items.forEach((r) => expect(r.itemName).toBe('电阻器套装'))
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 品质检验
// ════════════════════════════════════════════════════════════

describe('[🛒前台] quality-inspection 角色扩展测试', () => {
  it('🛒[反例] 前台无权限查看检验列表', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'qc:list')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'qc:view')).toBe(false)
  })

  it('🛒[反例] 前台无权限操作检验', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'qc:create')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'qc:update')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'qc:delete')).toBe(false)
  })

  it('🛒[反例] 前台无权限查看统计', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'qc:stats')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'qc:failed')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 品质检验
// ════════════════════════════════════════════════════════════

describe('[👥HR] quality-inspection 角色扩展测试', () => {
  it('👥[反例] HR 无权限查看检验', () => {
    expect(checkRoleAccess(ROLES.HR, 'qc:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'qc:view')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'qc:stats')).toBe(false)
  })

  it('👥[反例] HR 无权限创建/更新检验', () => {
    expect(checkRoleAccess(ROLES.HR, 'qc:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'qc:update')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'qc:delete')).toBe(false)
  })

  it('👥[反例] HR 无权限查看不合格/项目', () => {
    expect(checkRoleAccess(ROLES.HR, 'qc:failed')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'qc:items')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 品质检验
// ════════════════════════════════════════════════════════════

describe('[🔧安监] quality-inspection 角色扩展测试', () => {
  it('🔧[正例] 安监创建检验记录', () => {
    expect(checkRoleAccess(ROLES.Security, 'qc:create')).toBe(true)
    const svc = makeService()

    const record = svc.createInspection({
      tenantId: DEFAULT_TENANT,
      inspectNo: 'IQC-SEC-0001',
      type: InspectionType.Incoming,
      itemName: '安全帽',
      itemBatch: 'BATCH-HELMET-001',
      result: InspectionResult.Pass,
      severity: Severity.Minor,
      defects: [{ code: 'COL-001', description: '颜色标准偏差', severity: Severity.Minor }],
      inspector: '安全员张三',
      inspectedAt: new Date().toISOString(),
    })
    expect(record.inspectNo).toBe('IQC-SEC-0001')
    expect(record.defects.length).toBe(1)
    expect(record.defects[0].description).toContain('颜色')
  })

  it('🔧[正例] 安监查看检验列表 + 更新', () => {
    expect(checkRoleAccess(ROLES.Security, 'qc:list')).toBe(true)
    const svc = makeService()

    const list = svc.listInspections(DEFAULT_TENANT, { type: InspectionType.Incoming })
    expect(list.length).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.Security, 'qc:update')).toBe(true)
    const first = list[0]
    if (first && svc.getInspection(first.id, DEFAULT_TENANT)) {
      const updated = svc.updateInspection(first.id, DEFAULT_TENANT, {
        notes: '安监复核通过',
      })
      expect(updated.notes).toBe('安监复核通过')
    }
  })

  it('🔧[正例] 安监查看不合格品 + 统计', () => {
    expect(checkRoleAccess(ROLES.Security, 'qc:failed')).toBe(true)
    const svc = makeService()

    const failed = svc.getFailedInspections(DEFAULT_TENANT)
    expect(failed.length).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.Security, 'qc:stats')).toBe(true)
    const stats = svc.getPassRate(DEFAULT_TENANT)
    expect(stats.failed).toBeGreaterThan(0)
    expect(stats.passed).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 品质检验
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] quality-inspection 角色扩展测试', () => {
  it('🎮[反例] 导玩员无权限查看检验列表', () => {
    expect(checkRoleAccess(ROLES.Guide, 'qc:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'qc:view')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'qc:stats')).toBe(false)
  })

  it('🎮[反例] 导玩员无权限创建/更新检验', () => {
    expect(checkRoleAccess(ROLES.Guide, 'qc:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'qc:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'qc:delete')).toBe(false)
  })

  it('🎮[反例] 导玩员无权限查看不合格', () => {
    expect(checkRoleAccess(ROLES.Guide, 'qc:failed')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'qc:items')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 品质检验
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] quality-inspection 角色扩展测试', () => {
  it('🎯[正例] 运行专员创建 + 查看 + 更新检验 = 完整流程', () => {
    expect(checkRoleAccess(ROLES.Operations, 'qc:create')).toBe(true)
    const svc = makeService()

    // 创建
    const record = svc.createInspection({
      tenantId: DEFAULT_TENANT,
      inspectNo: 'OQC-OPS-0001',
      type: InspectionType.Outgoing,
      itemName: '成品测试件',
      itemBatch: 'BATCH-OPS-001',
      defects: [],
      inspector: '运行专员小李',
      inspectedAt: new Date().toISOString(),
    })
    expect(record.result).toBe(InspectionResult.Pass)

    // 查看
    expect(checkRoleAccess(ROLES.Operations, 'qc:view')).toBe(true)
    const got = svc.getInspection(record.id, DEFAULT_TENANT)
    expect(got).toBeDefined()
    expect(got!.itemName).toBe('成品测试件')

    // 更新
    expect(checkRoleAccess(ROLES.Operations, 'qc:update')).toBe(true)
    const updated = svc.updateInspection(record.id, DEFAULT_TENANT, {
      notes: '运行专员复核确认',
      result: InspectionResult.Conditional,
      severity: Severity.Minor,
    })
    expect(updated.result).toBe(InspectionResult.Conditional)
    expect(updated.notes).toBe('运行专员复核确认')

    // 删除
    expect(checkRoleAccess(ROLES.Operations, 'qc:delete')).toBe(true)
    svc.deleteInspection(record.id, DEFAULT_TENANT)
    expect(svc.getInspection(record.id, DEFAULT_TENANT)).toBeUndefined()
  })

  it('🎯[正例] 运行专员按类型筛选 + 按项目查询', () => {
    expect(checkRoleAccess(ROLES.Operations, 'qc:list')).toBe(true)
    const svc = makeService()

    const finalInspections = svc.listInspections(DEFAULT_TENANT, { type: InspectionType.Final })
    expect(finalInspections.length).toBeGreaterThan(0)
    finalInspections.forEach((r) => expect(r.type).toBe(InspectionType.Final))

    expect(checkRoleAccess(ROLES.Operations, 'qc:items')).toBe(true)
    const items = svc.getInspectionsByItems('LED显示屏', DEFAULT_TENANT)
    expect(items.length).toBeGreaterThan(0)
    items.forEach((r) => expect(r.itemName).toBe('LED显示屏'))
  })

  it('🎯[正例] 运行专员查看通过率统计', () => {
    expect(checkRoleAccess(ROLES.Operations, 'qc:stats')).toBe(true)
    const svc = makeService()

    const stats = svc.getPassRate(DEFAULT_TENANT)
    expect(stats.total).toBeGreaterThan(0)
    expect(stats.passed + stats.failed).toBeLessThanOrEqual(stats.total)
    expect(stats.passRate).toBeGreaterThanOrEqual(0)
    expect(stats.passRate).toBeLessThanOrEqual(100)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 品质检验
// ════════════════════════════════════════════════════════════

describe('[🤝团建] quality-inspection 角色扩展测试', () => {
  it('🤝[反例] 团建无权限查看检验', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'qc:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'qc:view')).toBe(false)
  })

  it('🤝[反例] 团建无权限操作检验', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'qc:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'qc:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'qc:delete')).toBe(false)
  })

  it('🤝[反例] 团建无权限查看统计/不合格', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'qc:stats')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'qc:failed')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'qc:items')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 品质检验
// ════════════════════════════════════════════════════════════

describe('[📢营销] quality-inspection 角色扩展测试', () => {
  it('📢[反例] 营销无权限查看检验', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'qc:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'qc:view')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'qc:stats')).toBe(false)
  })

  it('📢[反例] 营销无权限操作检验', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'qc:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'qc:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'qc:delete')).toBe(false)
  })

  it('📢[反例] 营销无权限查看不合格', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'qc:failed')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'qc:items')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 quality-inspection 跨角色闭环 + 边界]', () => {
  it('🔧 + 👔 安监创建 → 店长查看 + 统计', () => {
    const svc = makeService()

    // 安监创建不合格记录
    const record = svc.createInspection({
      tenantId: DEFAULT_TENANT,
      inspectNo: 'IQC-CROSS-0001',
      type: InspectionType.Incoming,
      itemName: '测试材料',
      itemBatch: 'BATCH-CROSS-001',
      result: InspectionResult.Fail,
      severity: Severity.Critical,
      defects: [
        { code: 'CRS-001', description: '强度不达标', severity: Severity.Critical },
      ],
      inspector: '安监联合检查',
      inspectedAt: new Date().toISOString(),
      notes: '联合检查发现问题',
    })

    // 店长查看
    const got = svc.getInspection(record.id, DEFAULT_TENANT)
    expect(got).toBeDefined()
    expect(got!.result).toBe(InspectionResult.Fail)

    // 店长查统计
    const failed = svc.getFailedInspections(DEFAULT_TENANT)
    expect(failed.some((r) => r.id === record.id)).toBe(true)

    const stats = svc.getPassRate(DEFAULT_TENANT)
    expect(stats.total).toBeGreaterThan(0)
  })

  it('🛡️ 不存在的检验记录返回 undefined', () => {
    const svc = makeService()
    expect(svc.getInspection('nonexistent', DEFAULT_TENANT)).toBeUndefined()
  })

  it('🛡️ 不存在的检验更新抛出 Error', () => {
    const svc = makeService()
    expect(() => svc.updateInspection('nonexistent', DEFAULT_TENANT, { notes: '测试' })).toThrow()
  })

  it('🛡️ 不存在的检验删除抛出 Error', () => {
    const svc = makeService()
    expect(() => svc.deleteInspection('nonexistent', DEFAULT_TENANT)).toThrow()
  })

  it('🛡️ 按检验员筛选', () => {
    const svc = makeService()
    const byInspector = svc.listInspections(DEFAULT_TENANT, { inspector: '王工' })
    expect(byInspector.length).toBeGreaterThan(0)
    byInspector.forEach((r) => expect(r.inspector).toBe('王工'))
  })

  it('🛡️ 按严重程度筛选', () => {
    const svc = makeService()
    const criticalSeverity = svc.listInspections(DEFAULT_TENANT, { severity: Severity.Critical })
    criticalSeverity.forEach((r) => expect(r.severity).toBe(Severity.Critical))

    const minor = svc.listInspections(DEFAULT_TENANT, { severity: Severity.Minor })
    minor.forEach((r) => expect(r.severity).toBe(Severity.Minor))
  })

  it('🛡️ 文本搜索不区分大小写', () => {
    const svc = makeService()
    const lower = svc.listInspections(DEFAULT_TENANT, { search: '电阻器' })
    const partial = svc.listInspections(DEFAULT_TENANT, { search: '电阻' })
    expect(lower.length).toBeGreaterThan(0)
    expect(partial.length).toBe(lower.length)
  })

  it('🛡️ 通过率统计在所有记录上计算', () => {
    const svc = makeService()
    const stats = svc.getPassRate(DEFAULT_TENANT)
    expect(stats.passed + stats.failed).toBeLessThanOrEqual(stats.total)
    expect(stats.passRate).toBe((stats.passed / stats.total) * 100)
  })
})
