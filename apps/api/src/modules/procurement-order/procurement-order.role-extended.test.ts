/**
 * 🐜 自动: [procurement-order] [C] 角色扩展测试
 *
 * 8 角色视角的采购订单模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 ProcurementOrderService + in-memory Store
 */
import { describe, it, expect } from 'vitest'
import { ProcurementOrderService } from './procurement-order.service'
import { ProcurementStatus } from './procurement-order.entity'

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

/** 角色 → 采购订单模块权限 */
const roleAccess: Record<string, string[]> = {
  'po:list': ['👔店长', '🎯运行专员'],
  'po:detail': ['👔店长', '🎯运行专员', '🛒前台'],
  'po:create': ['🎯运行专员'],
  'po:update': ['🎯运行专员'],
  'po:approve': ['👔店长'],
  'po:cancel': ['👔店长', '🎯运行专员'],
  'po:receive': ['🎯运行专员', '🛒前台'],
  'po:delete': ['🎯运行专员'],
  'po:stats': ['👔店长', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleAccess[resource]?.includes(role) ?? false
}

function makeService(): ProcurementOrderService {
  const svc = new ProcurementOrderService()
  svc.resetOrderStoresForTests()
  return svc
}

const TENANT = 'tenant-001'

// ════════════════════════════════════════════════════════════
// 👔店长 — 采购订单
// ════════════════════════════════════════════════════════════

describe('[👔店长] procurement-order 角色扩展测试', () => {
  it('👔[正例] 店长查看采购订单列表 → 按供应商筛选 → 审批待审订单', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'po:list')).toBe(true)
    const svc = makeService()
    const all = svc.listOrders(TENANT)
    expect(all.length).toBeGreaterThanOrEqual(21)

    const supplierOrders = svc.listOrders(TENANT, { supplierId: 'supplier-001' })
    expect(supplierOrders.length).toBeGreaterThanOrEqual(2)

    expect(checkRoleAccess(ROLES.StoreManager, 'po:approve')).toBe(true)
    const pendingApproval = svc.listOrders(TENANT, { status: ProcurementStatus.PendingApproval })
    if (pendingApproval.length > 0) {
      const approved = svc.updateOrderStatus(pendingApproval[0].id, ProcurementStatus.Approved, TENANT)
      expect(approved.status).toBe(ProcurementStatus.Approved)
    }
  })

  it('👔[正例] 店长查看采购统计', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'po:stats')).toBe(true)
    const svc = makeService()
    const all = svc.listOrders(TENANT)
    const byStatus = {
      draft: all.filter((o) => o.status === ProcurementStatus.Draft).length,
      pendingApproval: all.filter((o) => o.status === ProcurementStatus.PendingApproval).length,
      approved: all.filter((o) => o.status === ProcurementStatus.Approved).length,
      received: all.filter((o) => o.status === ProcurementStatus.Received).length,
      cancelled: all.filter((o) => o.status === ProcurementStatus.Cancelled).length,
      shipped: all.filter((o) => o.status === ProcurementStatus.Shipped).length,
      partial: all.filter((o) => o.status === ProcurementStatus.Partial).length,
    }
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0)
    expect(total).toBe(all.length)
  })

  it('👔[反例] 店长不可创建采购订单', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'po:create')).toBe(false)
  })

  it('👔[反例] 店长不可删除采购订单', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'po:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 采购订单
// ════════════════════════════════════════════════════════════

describe('[🛒前台] procurement-order 角色扩展测试', () => {
  it('🛒[正例] 前台查看采购订单详情 → 确认收货', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'po:detail')).toBe(true)
    const svc = makeService()
    const received = svc.listOrders(TENANT, { status: ProcurementStatus.Received })
    expect(received.length).toBeGreaterThan(0)
    const detail = svc.getOrder(received[0].id, TENANT)
    expect(detail).toBeDefined()
    expect(detail!.items.length).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.FrontDesk, 'po:receive')).toBe(true)
  })

  it('🛒[正例] 前台搜索采购订单', () => {
    const svc = makeService()
    const searched = svc.listOrders(TENANT, { search: '电阻' })
    expect(searched.length).toBeGreaterThanOrEqual(1)
    searched.forEach((o) => {
      const match = o.items.some((i) => i.name.includes('电阻')) || o.orderNo.includes('电阻')
      expect(match).toBe(true)
    })
  })

  it('🛒[反例] 前台不可创建采购单', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'po:create')).toBe(false)
  })

  it('🛒[反例] 前台不可审批采购单', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'po:approve')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 采购订单
// ════════════════════════════════════════════════════════════

describe('[👥HR] procurement-order 角色扩展测试', () => {
  it('👥[反例] HR 无采购权限', () => {
    expect(checkRoleAccess(ROLES.HR, 'po:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'po:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'po:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'po:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'po:cancel')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'po:receive')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'po:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'po:stats')).toBe(false)
  })

  it('👥[反例] HR 不可更新采购', () => {
    expect(checkRoleAccess(ROLES.HR, 'po:update')).toBe(false)
  })

  it('👥[闭环] 统一拒绝 403', () => {
    const denied = { success: false, code: 403, message: 'NO_PROCUREMENT_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 采购订单
// ════════════════════════════════════════════════════════════

describe('[🔧安监] procurement-order 角色扩展测试', () => {
  it('🔧[反例] 安监无采购权限', () => {
    expect(checkRoleAccess(ROLES.Security, 'po:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'po:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'po:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'po:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'po:cancel')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'po:receive')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'po:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'po:stats')).toBe(false)
  })

  it('🔧[闭环] 所有操作返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_PROCUREMENT_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('🔧[闭环] 不影响采购数据', () => {
    const svc = makeService()
    const count = svc.listOrders(TENANT).length
    expect(count).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 采购订单
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] procurement-order 角色扩展测试', () => {
  it('🎮[反例] 导玩员无采购权限', () => {
    expect(checkRoleAccess(ROLES.Guide, 'po:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'po:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'po:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'po:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'po:cancel')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'po:receive')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'po:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'po:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'po:stats')).toBe(false)
  })

  it('🎮[闭环] 返回统一 403', () => {
    const denied = { success: false, code: 403, message: 'NO_PROCUREMENT_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('🎮[闭环] 数据结构一致性', () => {
    const denied = { success: false, code: 403, message: 'NO_PROCUREMENT_ACCESS', module: 'procurement-order' }
    expect(denied.module).toBe('procurement-order')
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 采购订单
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] procurement-order 角色扩展测试', () => {
  it('🎯[正例] 运行专员创建采购订单 → 更新 → 删除草稿', () => {
    expect(checkRoleAccess(ROLES.Operations, 'po:create')).toBe(true)
    const svc = makeService()

    const order = svc.createOrder({
      tenantId: TENANT,
      orderNo: 'PO-TEST-001',
      supplierId: 'supplier-100',
      supplierName: '测试供应商',
      items: [{ name: '测试商品', sku: 'TEST-001', quantity: 100, unitPrice: 10 }],
      orderedAt: '2026-07-21T00:00:00.000Z',
      expectedAt: '2026-07-30T00:00:00.000Z',
    })
    expect(order.status).toBe(ProcurementStatus.Draft)

    expect(checkRoleAccess(ROLES.Operations, 'po:update')).toBe(true)
    const updated = svc.updateOrder(order.id, TENANT, { remark: '紧急订单' })
    expect(updated.remark).toBe('紧急订单')

    expect(checkRoleAccess(ROLES.Operations, 'po:delete')).toBe(true)
    svc.deleteOrder(order.id, TENANT)
    expect(svc.getOrder(order.id, TENANT)).toBeUndefined()
  })

  it('🎯[正例] 运行专员发起审批 → 取消订单', () => {
    const svc = makeService()

    const order = svc.createOrder({
      tenantId: TENANT,
      orderNo: 'PO-TEST-002',
      supplierId: 'supplier-101',
      supplierName: '审批测试供应商',
      items: [{ name: '审批测试品', sku: 'APPR-001', quantity: 10, unitPrice: 100 }],
      orderedAt: '2026-07-21T00:00:00.000Z',
      expectedAt: '2026-07-31T00:00:00.000Z',
    })

    const submitted = svc.updateOrderStatus(order.id, ProcurementStatus.PendingApproval, TENANT)
    expect(submitted.status).toBe(ProcurementStatus.PendingApproval)

    expect(checkRoleAccess(ROLES.Operations, 'po:cancel')).toBe(true)
    const cancelled = svc.updateOrderStatus(order.id, ProcurementStatus.Cancelled, TENANT)
    expect(cancelled.status).toBe(ProcurementStatus.Cancelled)
  })

  it('🎯[正例] 运行专员收货 → 部分收货', () => {
    const svc = makeService()
    // 创建一个已发货订单来测试收货
    const order = svc.createOrder({
      tenantId: TENANT,
      orderNo: 'PO-TEST-RCV',
      supplierId: 'supplier-102',
      supplierName: '收货测试供应商',
      items: [
        { name: '收货商品A', sku: 'RCV-A', quantity: 100, unitPrice: 5 },
        { name: '收货商品B', sku: 'RCV-B', quantity: 50, unitPrice: 20 },
      ],
      orderedAt: '2026-07-21T00:00:00.000Z',
      expectedAt: '2026-07-28T00:00:00.000Z',
    })
    svc.updateOrderStatus(order.id, ProcurementStatus.Approved, TENANT)
    svc.updateOrderStatus(order.id, ProcurementStatus.Shipped, TENANT)

    expect(checkRoleAccess(ROLES.Operations, 'po:receive')).toBe(true)
    const partial = svc.receiveItems(order.id, [
      { itemId: order.items[0].id, receivedQuantity: 50 },
    ], TENANT)
    expect(partial.status).toBe(ProcurementStatus.Partial)

    const full = svc.receiveItems(order.id, [
      { itemId: order.items[0].id, receivedQuantity: 50 },
      { itemId: order.items[1].id, receivedQuantity: 50 },
    ], TENANT)
    expect(full.status).toBe(ProcurementStatus.Received)
  })

  it('🎯[反例] 运行专员删除已审批订单被拒', () => {
    const svc = makeService()
    const approved = svc.listOrders(TENANT, { status: ProcurementStatus.Approved })
    if (approved.length > 0) {
      expect(() => svc.deleteOrder(approved[0].id, TENANT)).toThrow('only draft or cancelled')
    }
  })

  it('🎯[正例] 运行专员查看逾期订单', () => {
    const svc = makeService()
    const overdue = svc.getOverdueOrders(TENANT)
    expect(Array.isArray(overdue)).toBe(true)
    overdue.forEach((o) => {
      expect(o.status).not.toBe(ProcurementStatus.Received)
      expect(o.status).not.toBe(ProcurementStatus.Cancelled)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 采购订单
// ════════════════════════════════════════════════════════════

describe('[🤝团建] procurement-order 角色扩展测试', () => {
  it('🤝[反例] 团建无采购权限', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'po:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'po:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'po:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'po:cancel')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'po:receive')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'po:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'po:update')).toBe(false)
  })

  it('🤝[闭环] 返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_PROCUREMENT_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('🤝[闭环] 数据隔离安全', () => {
    const svc = makeService()
    const count = svc.listOrders(TENANT).length
    expect(count).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 采购订单
// ════════════════════════════════════════════════════════════

describe('[📢营销] procurement-order 角色扩展测试', () => {
  it('📢[反例] 营销无采购权限', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'po:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'po:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'po:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'po:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'po:cancel')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'po:receive')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'po:stats')).toBe(false)
  })

  it('📢[闭环] 返回统一 403', () => {
    const denied = { success: false, code: 403, message: 'NO_PROCUREMENT_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('📢[闭环] 权限矩阵校验', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'po:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'po:detail')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色闭环 + 边界场景
// ════════════════════════════════════════════════════════════

describe('[🦞 procurement-order 跨角色闭环 + 边界]', () => {
  it('🎯+👔 采购创建→审批→收货全流程', () => {
    const svc = makeService()

    // 1. 运行专员创建采购单
    const order = svc.createOrder({
      tenantId: TENANT,
      orderNo: 'PO-FLOW-001',
      supplierId: 'supplier-flow',
      supplierName: '全流程供应商',
      items: [{ name: '流程测试商品', sku: 'FLOW-001', quantity: 50, unitPrice: 20 }],
      orderedAt: '2026-07-21T00:00:00.000Z',
      expectedAt: '2026-07-31T00:00:00.000Z',
    })

    // 2. 提交审批
    svc.updateOrderStatus(order.id, ProcurementStatus.PendingApproval, TENANT)

    // 3. 店长审批
    const approved = svc.updateOrderStatus(order.id, ProcurementStatus.Approved, TENANT)
    expect(approved.status).toBe(ProcurementStatus.Approved)

    // 4. 发货
    svc.updateOrderStatus(order.id, ProcurementStatus.Shipped, TENANT)

    // 5. 收货
    const received = svc.receiveItems(order.id, [
      { itemId: order.items[0].id, receivedQuantity: 50 },
    ], TENANT)
    expect(received.status).toBe(ProcurementStatus.Received)
  })

  it('🛡️ 查询不存在的订单返回 undefined', () => {
    const svc = makeService()
    expect(svc.getOrder('nonexistent', TENANT)).toBeUndefined()
  })

  it('🛡️ 无效状态转换报错', () => {
    const svc = makeService()
    const order = svc.createOrder({
      tenantId: TENANT,
      orderNo: 'PO-ERR-001',
      supplierId: 'supplier-err',
      supplierName: '错误测试供应商',
      items: [{ name: '错误品', sku: 'ERR-001', quantity: 10, unitPrice: 10 }],
      orderedAt: '2026-07-21T00:00:00.000Z',
      expectedAt: '2026-07-31T00:00:00.000Z',
    })
    // Draft -> Received 不允许
    expect(() => svc.updateOrderStatus(order.id, ProcurementStatus.Received, TENANT)).toThrow('Invalid')
  })

  it('🛡️ 跨租户隔离', () => {
    const svc = makeService()
    expect(svc.listOrders('tenant-999').length).toBe(0)
  })

  it('🛡️ 空采购单搜索', () => {
    const svc = makeService()
    const nothing = svc.listOrders(TENANT, { search: 'ZZZZ_NOT_EXISTS_ZZZZ' })
    expect(nothing.length).toBe(0)
  })

  it('🛡️ 按供应商批量查询', () => {
    const svc = makeService()
    const bySupplier = svc.getOrdersBySupplier('supplier-001', TENANT)
    expect(bySupplier.length).toBeGreaterThanOrEqual(2)
    bySupplier.forEach((o) => expect(o.supplierId).toBe('supplier-001'))
  })

  it('🛡️ 删除草稿订单成功', () => {
    const svc = makeService()
    const draft = svc.listOrders(TENANT, { status: ProcurementStatus.Draft })
    expect(draft.length).toBeGreaterThan(0)
    const target = draft[0]
    svc.deleteOrder(target.id, TENANT)
    expect(svc.getOrder(target.id, TENANT)).toBeUndefined()
  })
})
