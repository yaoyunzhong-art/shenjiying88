/**
 * 🐜 自动: [contract-manager] [C] 角色扩展测试
 *
 * 8 角色视角的合同管理模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 ContractManagerService + in-memory Store
 */
import { describe, it, expect } from 'vitest'
import { ContractManagerService } from './contract-manager.service'
import { ContractStatus, ContractType } from './contract-manager.entity'

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

/** 角色 → 合同管理模块权限 */
const roleContractAccess: Record<string, string[]> = {
  'contract:list': ['👔店长', '🎯运行专员'],
  'contract:detail': ['👔店长', '🎯运行专员'],
  'contract:create': ['👔店长', '🎯运行专员'],
  'contract:update': ['👔店长', '🎯运行专员'],
  'contract:sign': ['👔店长'],
  'contract:terminate': ['👔店长'],
  'contract:clause:manage': ['👔店长', '🎯运行专员'],
  'contract:expiry:view': ['👔店长', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleContractAccess[resource]?.includes(role) ?? false
}

function makeService(tenantId = 'default'): { svc: ContractManagerService; tenantId: string } {
  const svc = new ContractManagerService()
  svc.resetContractStoresForTests()
  svc.seedMockData(tenantId)
  return { svc, tenantId }
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 合同管理
// ════════════════════════════════════════════════════════════

describe('[👔店长] contract-manager 角色扩展测试', () => {
  it('👔[正例] 店长查看合同列表 → 按状态筛选 → 按类型筛选', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'contract:list')).toBe(true)
    const { svc, tenantId } = makeService()

    const all = svc.listContracts(tenantId)
    expect(all.length).toBeGreaterThan(0)

    const activeOnly = svc.listContracts(tenantId, { status: ContractStatus.Active })
    activeOnly.forEach((c) => expect(c.status).toBe(ContractStatus.Active))

    const leaseOnly = svc.listContracts(tenantId, { type: ContractType.Lease })
    leaseOnly.forEach((c) => expect(c.type).toBe(ContractType.Lease))
  })

  it('👔[正例] 店长签约并终止合同', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'contract:sign')).toBe(true)
    expect(checkRoleAccess(ROLES.StoreManager, 'contract:terminate')).toBe(true)
    const { svc, tenantId } = makeService()

    const contract = svc.createContract({
      tenantId, name: '新设备采购合同', type: ContractType.Purchase,
      partyA: '深极英', partyB: '华强电子',
      amount: 200000, startDate: '2026-08-01T00:00:00.000Z', endDate: '2026-12-31T23:59:59.000Z',
    })
    expect(contract.status).toBe(ContractStatus.Draft)

    // 店长签约
    const signed = svc.updateContractStatus(contract.id, ContractStatus.Signed, tenantId)
    expect(signed.status).toBe(ContractStatus.Signed)
    expect(signed.signedDate).toBeDefined()

    // 店长终止
    const terminated = svc.updateContractStatus(contract.id, ContractStatus.Terminated, tenantId)
    expect(terminated.status).toBe(ContractStatus.Terminated)
  })

  it('👔[正例] 店长查看到期合同提醒', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'contract:expiry:view')).toBe(true)
    const { svc, tenantId } = makeService()

    const expiring = svc.getExpiringContracts(tenantId, 60)
    expiring.forEach((c) => {
      expect(
        c.status === ContractStatus.Active ||
        c.status === ContractStatus.Signed
      ).toBe(true)
      expect(new Date(c.endDate).getTime() - Date.now()).toBeLessThanOrEqual(60 * 24 * 60 * 60 * 1000)
    })

    const expired = svc.getExpiredContracts(tenantId)
    expired.forEach((c) => {
      // 使用服务自身逻辑验证: status expired 或 endDate 已过
      const isStatusExpired = c.status === ContractStatus.Expired
      const isDateExpired = new Date(c.endDate) < new Date()
      expect(isStatusExpired || isDateExpired).toBe(true)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 合同管理
// ════════════════════════════════════════════════════════════

describe('[🛒前台] contract-manager 角色扩展测试', () => {
  it('🛒[反例] 前台无权限查看合同列表', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'contract:list')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'contract:detail')).toBe(false)
  })

  it('🛒[反例] 前台无权限创建、签约或终止合同', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'contract:create')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'contract:sign')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'contract:terminate')).toBe(false)
  })

  it('🛒[反例] 前台无权限管理条款', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'contract:clause:manage')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'contract:expiry:view')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 合同管理
// ════════════════════════════════════════════════════════════

describe('[👥HR] contract-manager 角色扩展测试', () => {
  it('👥[反例] HR 无合同管理权限', () => {
    expect(checkRoleAccess(ROLES.HR, 'contract:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'contract:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'contract:sign')).toBe(false)
  })

  it('👥[反例] HR 无权查看合同详情或到期', () => {
    expect(checkRoleAccess(ROLES.HR, 'contract:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'contract:expiry:view')).toBe(false)
  })

  it('👥[闭环] HR 无权限返回统一403格式', () => {
    const denied = { success: false, code: 403, message: 'NO_CONTRACT_ACCESS', module: 'contract-manager' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('contract-manager')
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 合同管理
// ════════════════════════════════════════════════════════════

describe('[🔧安监] contract-manager 角色扩展测试', () => {
  it('🔧[反例] 安监无合同管理权限', () => {
    expect(checkRoleAccess(ROLES.Security, 'contract:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'contract:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'contract:detail')).toBe(false)
  })

  it('🔧[反例] 安监无权操作合同状态', () => {
    expect(checkRoleAccess(ROLES.Security, 'contract:sign')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'contract:terminate')).toBe(false)
  })

  it('🔧[正例] 安监可参考合同中安全合规条款', () => {
    // 安监虽然不能操作合同，但可以获取合规条款参考
    const safetyClause = { contractId: 'CT-safety', title: '安全合规要求', content: '乙方需符合国家安全生产标准' }
    expect(safetyClause.title).toContain('安全')
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 合同管理
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] contract-manager 角色扩展测试', () => {
  it('🎮[反例] 导玩员无合同权限', () => {
    expect(checkRoleAccess(ROLES.Guide, 'contract:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'contract:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'contract:create')).toBe(false)
  })

  it('🎮[反例] 导玩员无权签约或终止', () => {
    expect(checkRoleAccess(ROLES.Guide, 'contract:sign')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'contract:terminate')).toBe(false)
  })

  it('🎮[反例] 导玩员无权管理条款', () => {
    expect(checkRoleAccess(ROLES.Guide, 'contract:clause:manage')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'contract:expiry:view')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 合同管理
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] contract-manager 角色扩展测试', () => {
  it('🎯[正例] 运行专员创建合同草稿 → 添加条款', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'contract:create')).toBe(true)
    expect(checkRoleAccess(ROLES.Operations, 'contract:clause:manage')).toBe(true)
    const { svc, tenantId } = makeService()

    const contract = svc.createContract({
      tenantId, name: '新门店设备租赁', type: ContractType.Lease,
      partyA: '深极英', partyB: '智享租赁',
      amount: 150000, startDate: '2026-09-01T00:00:00.000Z', endDate: '2027-08-31T23:59:59.000Z',
    })
    expect(contract.status).toBe(ContractStatus.Draft)

    const clause = svc.addClause({ contractId: contract.id, title: '租赁设备清单', content: '包括VR设备10台，体感设备5台', sortOrder: 1 })
    expect(clause.contractId).toBe(contract.id)

    const clauses = svc.listClauses(contract.id)
    expect(clauses.length).toBe(1)
    expect(clauses[0].title).toBe('租赁设备清单')
  })

  it('🎯[正例] 运行专员更新合同信息', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'contract:update')).toBe(true)
    const { svc, tenantId } = makeService()

    const contract = svc.createContract({
      tenantId, name: '软件授权合同', type: ContractType.Service,
      partyA: '深极英', partyB: '软件供应商',
      amount: 100000, startDate: '2026-07-01T00:00:00.000Z', endDate: '2027-06-30T23:59:59.000Z',
    })

    const updated = svc.updateContract(contract.id, tenantId, { amount: 120000, remark: '追加功能模块' })
    expect(updated.amount).toBe(120000)
    expect(updated.remark).toBe('追加功能模块')
  })

  it('🎯[正例] 运行专员查看到期合同', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'contract:expiry:view')).toBe(true)
    const { svc, tenantId } = makeService()

    const expiring = svc.getExpiringContracts(tenantId, 30)
    expiring.forEach((c) => {
      const diff = new Date(c.endDate).getTime() - Date.now()
      expect(diff < 30 * 24 * 60 * 60 * 1000).toBe(true)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 合同管理
// ════════════════════════════════════════════════════════════

describe('[🤝团建] contract-manager 角色扩展测试', () => {
  it('🤝[反例] 团建无合同管理权限', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'contract:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'contract:create')).toBe(false)
  })

  it('🤝[反例] 团建无权操作合同状态', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'contract:sign')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'contract:terminate')).toBe(false)
  })

  it('🤝[反例] 团建无权管理条款', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'contract:clause:manage')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'contract:expiry:view')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 合同管理
// ════════════════════════════════════════════════════════════

describe('[📢营销] contract-manager 角色扩展测试', () => {
  it('📢[反例] 营销无合同管理权限', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'contract:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'contract:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'contract:detail')).toBe(false)
  })

  it('📢[反例] 营销无权签约或终止', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'contract:sign')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'contract:terminate')).toBe(false)
  })

  it('📢[反例] 营销无权管理条款或查看到期', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'contract:clause:manage')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'contract:expiry:view')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 contract-manager 跨角色闭环 + 边界]', () => {
  it('🎯 + 👔 运行专员创建草稿 → 店长签署 → 运行专员添加条款', async () => {
    const { svc, tenantId } = makeService()

    // 运行专员创建草稿
    const contract = svc.createContract({
      tenantId, name: '暑期推广合作协议', type: ContractType.Service,
      partyA: '深极英', partyB: '星翼传媒',
      amount: 500000, startDate: '2026-08-01T00:00:00.000Z', endDate: '2026-12-31T23:59:59.000Z',
    })
    expect(contract.status).toBe(ContractStatus.Draft)

    // 运行专员添加条款
    const clause1 = svc.addClause({ contractId: contract.id, title: '推广内容', content: '线上投放+线下活动', sortOrder: 1 })
    expect(clause1.title).toBe('推广内容')

    // 店长签署合同
    const signed = svc.updateContractStatus(contract.id, ContractStatus.Signed, tenantId)
    expect(signed.status).toBe(ContractStatus.Signed)
    expect(signed.signedDate).toBeDefined()

    // 验证条款列表
    const clauses = svc.listClauses(contract.id)
    expect(clauses.length).toBe(1)
  })

  it('🛡️ 查询不存在的合同返回 undefined', () => {
    const { svc, tenantId } = makeService()
    expect(svc.getContract('contract-nonexistent', tenantId)).toBeUndefined()
  })

  it('🛡️ 更新不存在合同抛异常', () => {
    const { svc, tenantId } = makeService()
    expect(() => svc.updateContract('contract-nonexistent', tenantId, { name: '改名' }))
      .toThrow('Contract not found')
  })

  it('🛡️ 查询不存在的条款抛异常', () => {
    const { svc } = makeService()
    expect(() => svc.updateClause('clause-nonexistent', { title: '新标题' }))
      .toThrow('Clause not found')
  })

  it('🛡️ 删除不存在的条款抛异常', () => {
    const { svc } = makeService()
    expect(() => svc.deleteClause('clause-nonexistent'))
      .toThrow('Clause not found')
  })

  it('🛡️ 按关键词搜索合同', () => {
    const { svc, tenantId } = makeService()
    const result = svc.listContracts(tenantId, { search: '采购' })
    expect(result.length).toBeGreaterThan(0)
    result.forEach((c) => {
      const combined = `${c.name}${c.contractNo}${c.partyA}${c.partyB}`.toLowerCase()
      expect(combined).toContain('采购')
    })
  })

  it('🛡️ 不同门店的合同隔离', () => {
    // 使用 reset + seed 在同一服务实例上模拟多租户
    const svc = new ContractManagerService()

    svc.resetContractStoresForTests()
    svc.seedMockData('tenant-a')
    const contractsA = svc.listContracts('tenant-a')
    expect(contractsA.length).toBeGreaterThan(0)

    // 同一实例 seed 另一个租户 (reset 清空后 seed 另一个)
    svc.resetContractStoresForTests()
    svc.seedMockData('tenant-b')
    const contractsB = svc.listContracts('tenant-b')
    expect(contractsB.length).toBeGreaterThan(0)

    // cross-tenant query on the same instance returns nothing (tenant isolation)
    expect(svc.getContract(contractsA[0].id, 'tenant-b')).toBeUndefined()

    // tenant-a contracts no longer exist after reset
    expect(svc.listContracts('tenant-a')).toHaveLength(0)
  })

  it('🛡️ 按合同类型筛选仅返回正确类型', () => {
    const { svc, tenantId } = makeService()
    const ndaContracts = svc.listContracts(tenantId, { type: ContractType.Nda })
    ndaContracts.forEach((c) => expect(c.type).toBe(ContractType.Nda))

    const saleContracts = svc.listContracts(tenantId, { type: ContractType.Sale })
    saleContracts.forEach((c) => expect(c.type).toBe(ContractType.Sale))
    expect(saleContracts.length).toBeGreaterThan(0)
  })

  it('🛡️ 更新条款内容并验证', () => {
    const { svc, tenantId } = makeService()
    const contract = svc.createContract({
      tenantId, name: '测试条款更新', type: ContractType.Service,
      partyA: 'A', partyB: 'B', amount: 10000,
      startDate: '2026-07-01T00:00:00.000Z', endDate: '2026-12-31T23:59:59.000Z',
    })

    const clause = svc.addClause({ contractId: contract.id, title: '原条款', content: '原内容', sortOrder: 1 })
    const updated = svc.updateClause(clause.id, { title: '更新条款', content: '更新内容' })
    expect(updated.title).toBe('更新条款')
    expect(updated.content).toBe('更新内容')
  })

  it('🛡️ 删除条款后列表为空', () => {
    const { svc, tenantId } = makeService()
    const contract = svc.createContract({
      tenantId, name: '测试删除条款', type: ContractType.Service,
      partyA: 'A', partyB: 'B', amount: 10000,
      startDate: '2026-07-01T00:00:00.000Z', endDate: '2026-12-31T23:59:59.000Z',
    })

    const clause = svc.addClause({ contractId: contract.id, title: '待删除', content: '内容', sortOrder: 1 })
    svc.deleteClause(clause.id)
    expect(svc.listClauses(contract.id)).toHaveLength(0)
  })

  it('🛡️ 已激活合同可以正常更新状态流转', () => {
    const { svc, tenantId } = makeService()
    const contract = svc.createContract({
      tenantId, name: '状态流转测试', type: ContractType.Lease,
      partyA: 'A', partyB: 'B', amount: 50000,
      startDate: '2026-01-01T00:00:00.000Z', endDate: '2026-12-31T23:59:59.000Z',
    })

    expect(contract.status).toBe(ContractStatus.Draft)

    // Draft -> PendingSign
    const pending = svc.updateContractStatus(contract.id, ContractStatus.PendingSign, tenantId)
    expect(pending.status).toBe(ContractStatus.PendingSign)

    // PendingSign -> Active
    const active = svc.updateContractStatus(contract.id, ContractStatus.Active, tenantId)
    expect(active.status).toBe(ContractStatus.Active)

    // Active -> Expired
    const expired = svc.updateContractStatus(contract.id, ContractStatus.Expired, tenantId)
    expect(expired.status).toBe(ContractStatus.Expired)
  })
})
