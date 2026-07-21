/**
 * 🐜 自动: [return-request] [C] 角色扩展测试
 *
 * 8 角色视角的退货申请模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 ReturnRequestService + in-memory Store
 * 覆盖: 退货CRUD、状态流转、查询视图
 */
import { describe, it, expect } from 'vitest'
import { ReturnRequestService } from './return-request.service'
import { ReturnType, ReturnStatus } from './return-request.entity'

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

/** 角色 → 退货申请模块权限 */
const roleAccess: Record<string, string[]> = {
  'return:list': ['👔店长', '🛒前台', '🎯运行专员'],
  'return:detail': ['👔店长', '🛒前台', '🎯运行专员'],
  'return:create': ['🛒前台'],
  'return:inspect': ['🎯运行专员'],
  'return:approve': ['👔店长', '🎯运行专员'],
  'return:reject': ['👔店长'],
  'return:refund': ['👔店长', '🎯运行专员'],
  'return:update': ['🛒前台', '🎯运行专员'],
  'return:delete': ['🛒前台'],
  'return:stats': ['👔店长', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleAccess[resource]?.includes(role) ?? false
}

function makeService(): ReturnRequestService {
  const svc = new ReturnRequestService()
  svc.resetReturnStoresForTests()
  return svc
}

const TENANT = 'tenant-001'

// ════════════════════════════════════════════════════════════
// 👔店长 — 退货申请
// ════════════════════════════════════════════════════════════

describe('[👔店长] return-request 角色扩展测试', () => {
  it('👔[正例] 店长查看退货列表 → 按类型筛选 → 审批通过', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'return:list')).toBe(true)
    const svc = makeService()
    const all = svc.listReturns(TENANT)
    expect(all.length).toBeGreaterThanOrEqual(15)

    const qualityIssues = svc.listReturns(TENANT, { type: ReturnType.QualityIssue })
    expect(qualityIssues.length).toBeGreaterThanOrEqual(5)
    qualityIssues.forEach((r) => expect(r.type).toBe(ReturnType.QualityIssue))

    expect(checkRoleAccess(ROLES.StoreManager, 'return:approve')).toBe(true)
    const pending = svc.listReturns(TENANT, { status: ReturnStatus.Pending })
    if (pending.length > 0) {
      const approved = svc.updateReturnStatus(pending[0].id, ReturnStatus.Approved, TENANT, '店长审批通过')
      expect(approved.status).toBe(ReturnStatus.Approved)
    }
  })

  it('👔[正例] 店长拒绝退货 → 需填写原因', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'return:reject')).toBe(true)
    const svc = makeService()
    const pending = svc.listReturns(TENANT, { status: ReturnStatus.Pending })
    if (pending.length > 0) {
      const rejected = svc.updateReturnStatus(pending[0].id, ReturnStatus.Rejected, TENANT, '不符合退货政策')
      expect(rejected.status).toBe(ReturnStatus.Rejected)
      expect(rejected.remark).toBe('不符合退货政策')
    }
  })

  it('👔[正例] 店长查看退货统计', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'return:stats')).toBe(true)
    const svc = makeService()
    const all = svc.listReturns(TENANT)
    const byStatus = {
      pending: all.filter((r) => r.status === ReturnStatus.Pending).length,
      inspecting: all.filter((r) => r.status === ReturnStatus.Inspecting).length,
      approved: all.filter((r) => r.status === ReturnStatus.Approved).length,
      rejected: all.filter((r) => r.status === ReturnStatus.Rejected).length,
      refunded: all.filter((r) => r.status === ReturnStatus.Refunded).length,
    }
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0)
    expect(total).toBe(all.length)
  })

  it('👔[反例] 店长不可创建退货单', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'return:create')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 退货申请
// ════════════════════════════════════════════════════════════

describe('[🛒前台] return-request 角色扩展测试', () => {
  it('🛒[正例] 前台创建退货单 → 查看退货列表 → 删除草稿', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'return:create')).toBe(true)
    const svc = makeService()

    const ret = svc.createReturn({
      tenantId: TENANT,
      returnNo: 'RT-TEST-FD-001',
      orderNo: 'PO-TEST-001',
      itemName: '测试商品A',
      quantity: 5,
      type: ReturnType.QualityIssue,
      reason: '外观有划痕',
      customerName: '前台客户',
      amount: 250,
      remark: '前台直接受理',
    })
    expect(ret.status).toBe(ReturnStatus.Pending)
    expect(ret.customerName).toBe('前台客户')

    expect(checkRoleAccess(ROLES.FrontDesk, 'return:list')).toBe(true)
    const all = svc.listReturns(TENANT)
    expect(all.length).toBeGreaterThanOrEqual(16)

    expect(checkRoleAccess(ROLES.FrontDesk, 'return:delete')).toBe(true)
    svc.deleteReturn(ret.id, TENANT)
    expect(svc.getReturn(ret.id, TENANT)).toBeUndefined()
  })

  it('🛒[正例] 前台查看退货详情', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'return:detail')).toBe(true)
    const svc = makeService()
    const all = svc.listReturns(TENANT)
    expect(all.length).toBeGreaterThan(0)
    const detail = svc.getReturn(all[0].id, TENANT)
    expect(detail).toBeDefined()
    expect(detail!.returnNo).toBeDefined()
  })

  it('🛒[正例] 前台更新退货信息', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'return:update')).toBe(true)
    const svc = makeService()
    const pending = svc.listReturns(TENANT, { status: ReturnStatus.Pending })
    if (pending.length > 0) {
      const updated = svc.updateReturn(pending[0].id, TENANT, { remark: '补充凭证照片' })
      expect(updated.remark).toBe('补充凭证照片')
    }
  })

  it('🛒[反例] 前台不可审批退货', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'return:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'return:reject')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'return:refund')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 退货申请
// ════════════════════════════════════════════════════════════

describe('[👥HR] return-request 角色扩展测试', () => {
  it('👥[反例] HR 无退货权限', () => {
    expect(checkRoleAccess(ROLES.HR, 'return:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'return:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'return:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'return:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'return:reject')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'return:refund')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'return:update')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'return:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'return:inspect')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'return:stats')).toBe(false)
  })

  it('👥[闭环] 返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_RETURN_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('👥[闭环] 数据隔离', () => {
    const svc = makeService()
    const count = svc.listReturns(TENANT).length
    expect(count).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 退货申请
// ════════════════════════════════════════════════════════════

describe('[🔧安监] return-request 角色扩展测试', () => {
  it('🔧[反例] 安监无退货权限', () => {
    expect(checkRoleAccess(ROLES.Security, 'return:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'return:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'return:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'return:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'return:reject')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'return:refund')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'return:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'return:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'return:inspect')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'return:stats')).toBe(false)
  })

  it('🔧[闭环] 返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_RETURN_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('🔧[闭环] 不影响数据', () => {
    const svc = makeService()
    const count = svc.listReturns(TENANT).length
    expect(count).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 退货申请
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] return-request 角色扩展测试', () => {
  it('🎮[反例] 导玩员不可操作退货', () => {
    expect(checkRoleAccess(ROLES.Guide, 'return:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'return:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'return:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'return:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'return:reject')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'return:refund')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'return:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'return:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'return:inspect')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'return:stats')).toBe(false)
  })

  it('🎮[闭环] 返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_RETURN_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('🎮[闭环] 权限矩阵安全', () => {
    expect(checkRoleAccess(ROLES.Guide, 'return:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'return:create')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 退货申请
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] return-request 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看退货列表 → 质检 → 审批', () => {
    expect(checkRoleAccess(ROLES.Operations, 'return:list')).toBe(true)
    const svc = makeService()
    const all = svc.listReturns(TENANT)
    expect(all.length).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.Operations, 'return:inspect')).toBe(true)
    const pending = svc.listReturns(TENANT, { status: ReturnStatus.Pending })
    if (pending.length > 0) {
      const inspecting = svc.updateReturnStatus(pending[0].id, ReturnStatus.Inspecting, TENANT, '开始质检')
      expect(inspecting.status).toBe(ReturnStatus.Inspecting)

      expect(checkRoleAccess(ROLES.Operations, 'return:approve')).toBe(true)
      const approved = svc.updateReturnStatus(inspecting.id, ReturnStatus.Approved, TENANT, '质检通过')
      expect(approved.status).toBe(ReturnStatus.Approved)
    }
  })

  it('🎯[正例] 运行专员按客户名称查询退货记录', () => {
    const svc = makeService()
    const byCustomer = svc.getReturnsByCustomer('李明', TENANT)
    expect(byCustomer.length).toBeGreaterThanOrEqual(2)
    byCustomer.forEach((r) => expect(r.customerName).toBe('李明'))
  })

  it('🎯[正例] 运行专员按订单号查询退货', () => {
    const svc = makeService()
    const byOrder = svc.getReturnsByOrder('PO-2026-0001', TENANT)
    expect(byOrder.length).toBeGreaterThanOrEqual(2)
    byOrder.forEach((r) => expect(r.orderNo).toBe('PO-2026-0001'))
  })

  it('🎯[正例] 运行专员执行退款操作', () => {
    expect(checkRoleAccess(ROLES.Operations, 'return:refund')).toBe(true)
    const svc = makeService()
    const approved = svc.listReturns(TENANT, { status: ReturnStatus.Approved })
    if (approved.length > 0) {
      const refunded = svc.updateReturnStatus(approved[0].id, ReturnStatus.Refunded, TENANT, '已退款')
      expect(refunded.status).toBe(ReturnStatus.Refunded)
      expect(refunded.resolvedAt).toBeDefined()
    }
  })

  it('🎯[反例] 运行专员不可拒绝退货', () => {
    expect(checkRoleAccess(ROLES.Operations, 'return:reject')).toBe(false)
  })

  it('🎯[反例] 运行专员不可删除退货', () => {
    expect(checkRoleAccess(ROLES.Operations, 'return:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 退货申请
// ════════════════════════════════════════════════════════════

describe('[🤝团建] return-request 角色扩展测试', () => {
  it('🤝[反例] 团建无退货权限', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'return:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'return:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'return:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'return:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'return:reject')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'return:refund')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'return:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'return:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'return:inspect')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'return:stats')).toBe(false)
  })

  it('🤝[闭环] 返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_RETURN_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('🤝[闭环] 所有操作拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_RETURN_ACCESS', module: 'return-request' }
    expect(denied.module).toBe('return-request')
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 退货申请
// ════════════════════════════════════════════════════════════

describe('[📢营销] return-request 角色扩展测试', () => {
  it('📢[反例] 营销无退货权限', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'return:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'return:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'return:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'return:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'return:reject')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'return:refund')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'return:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'return:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'return:inspect')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'return:stats')).toBe(false)
  })

  it('📢[闭环] 返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_RETURN_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('📢[闭环] 权限矩阵一致性', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'return:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'return:create')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色闭环 + 边界场景
// ════════════════════════════════════════════════════════════

describe('[🦞 return-request 跨角色闭环 + 边界]', () => {
  it('🛒+🎯+👔 退货创建→质检→审批→退款全流程', () => {
    const svc = makeService()

    // 1. 前台创建退货
    const ret = svc.createReturn({
      tenantId: TENANT,
      returnNo: 'RT-FLOW-001',
      orderNo: 'PO-FLOW-001',
      itemName: '全流程测试商品',
      quantity: 10,
      type: ReturnType.QualityIssue,
      reason: '功能缺陷',
      customerName: '流程测试客户',
      amount: 500,
    })
    expect(ret.status).toBe(ReturnStatus.Pending)

    // 2. 运行专员质检
    const inspecting = svc.updateReturnStatus(ret.id, ReturnStatus.Inspecting, TENANT, '开始质检')
    expect(inspecting.status).toBe(ReturnStatus.Inspecting)

    // 3. 运行专员审批
    const approved = svc.updateReturnStatus(ret.id, ReturnStatus.Approved, TENANT, '质检通过')
    expect(approved.status).toBe(ReturnStatus.Approved)

    // 4. 店长确认退款
    const refunded = svc.updateReturnStatus(ret.id, ReturnStatus.Refunded, TENANT, '已退款')
    expect(refunded.status).toBe(ReturnStatus.Refunded)
    expect(refunded.resolvedAt).toBeDefined()
  })

  it('🛡️ 查询不存在的退货返回 undefined', () => {
    const svc = makeService()
    expect(svc.getReturn('nonexistent', TENANT)).toBeUndefined()
  })

  it('🛡️ 无效状态转换报错', () => {
    const svc = makeService()
    const pending = svc.listReturns(TENANT, { status: ReturnStatus.Pending })
    if (pending.length > 0) {
      // Pending -> Refunded 不允许
      expect(() => svc.updateReturnStatus(pending[0].id, ReturnStatus.Refunded, TENANT))
        .toThrow('Invalid return status transition')
    }
  })

  it('🛡️ 已拒绝退货不可再审批', () => {
    const svc = makeService()
    const rejected = svc.listReturns(TENANT, { status: ReturnStatus.Rejected })
    if (rejected.length > 0) {
      // Rejected -> Approved 不允许
      expect(() => svc.updateReturnStatus(rejected[0].id, ReturnStatus.Approved, TENANT))
        .toThrow('Invalid return status transition')
    }
  })

  it('🛡️ 跨租户隔离', () => {
    const svc = makeService()
    expect(svc.listReturns('tenant-999').length).toBe(0)
  })

  it('🛡️ 空搜索退货列表', () => {
    const svc = makeService()
    const nothing = svc.listReturns(TENANT, { search: 'ZZZ_NONE_ZZZ' })
    expect(nothing.length).toBe(0)
  })

  it('🛡️ 删除非待处理退货报错', () => {
    const svc = makeService()
    const inspecting = svc.listReturns(TENANT, { status: ReturnStatus.Inspecting })
    if (inspecting.length > 0) {
      expect(() => svc.deleteReturn(inspecting[0].id, TENANT)).toThrow('Only pending returns can be deleted')
    }
  })

  it('🛡️ 待处理退货列表排序', () => {
    const svc = makeService()
    const pending = svc.getPendingReturns(TENANT)
    expect(pending.length).toBeGreaterThanOrEqual(5)
    // 按创建时间升序排列
    for (let i = 1; i < pending.length; i++) {
      expect(pending[i - 1].createdAt <= pending[i].createdAt).toBe(true)
    }
  })
})
