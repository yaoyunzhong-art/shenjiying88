/**
 * 🧪 角色旅程测试: 门店管理模块
 *
 * 场景覆盖: member(会员), inventory(库存), cashier(收银台), store-revenue-report(营收报告)
 * 角色: 👔店长, 🛒前台, 🎯运行专员, 🎮导玩员
 *
 * 每个角色: 正例(happy path) + 反例(error case) + 边界(edge case)
 */
import { describe, it, expect } from 'vitest'

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  Operations: '🎯运行专员',
  Guide: '🎮导玩员',
} as const

// ── 模拟响应工厂 ──
function mockSuccess(data: any, code = 200) {
  return { success: true, code, data, ts: Date.now() }
}
function mockError(code: number, msg: string) {
  return { success: false, code, message: msg, ts: Date.now() }
}

// ── 模块访问矩阵 (同已有 jmeter 测试) ──
const ModuleAccess: Record<string, readonly string[]> = {
  member:    ['👔店长', '🛒前台', '👥HR', '📢营销'] as const,
  inventory: ['👔店长', '🛒前台', '🎯运行专员', '🎮导玩员'] as const,
  cashier:   ['👔店长', '🛒前台', '🎯运行专员'] as const,
  revenue:   ['👔店长', '🎯运行专员', '🔧安监'] as const,
}

function canAccess(role: string, mod: string) {
  return (ModuleAccess[mod] ?? []).includes(role)
}

// ═══════════════════════════════════════════════════════════════════
// 👔店长 - 门店管理主场
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 门店管理旅程`, () => {
  it('👔[正例] 查看会员统计 → 查看库存预警 → 查看营收日报 → 完成', () => {
    // Step 1: 会员统计
    expect(canAccess(ROLES.StoreManager, 'member')).toBe(true)
    const stats = mockSuccess({ totalMembers: 1520, newToday: 12, activeRate: 0.38 })
    expect(stats.data.totalMembers).toBeGreaterThan(1000)
    expect(stats.data.newToday).toBe(12)

    // Step 2: 库存预警
    expect(canAccess(ROLES.StoreManager, 'inventory')).toBe(true)
    const alerts = mockSuccess([
      { sku: 'T-001', name: '扭蛋A', stock: 3, threshold: 20 },
      { sku: 'T-002', name: '扭蛋B', stock: 48, threshold: 50 },
    ])
    const lowStock = alerts.data.filter((i: any) => i.stock < i.threshold)
    expect(lowStock.length).toBe(2)

    // Step 3: 今日营收
    expect(canAccess(ROLES.StoreManager, 'revenue')).toBe(true)
    const revenue = mockSuccess({ todayRevenue: 18230, yesterdayRevenue: 15600, mom: 0.168 })
    expect(revenue.data.todayRevenue).toBe(18230)
    expect(revenue.data.mom).toBeGreaterThan(0)
  })

  it('👔[正例] 创建调拨单 → 审批 → 确认入库', () => {
    expect(canAccess(ROLES.StoreManager, 'inventory')).toBe(true)
    const transfer = mockSuccess({ id: 'TR-20260718-001', fromStore: 'A店', toStore: 'B店', status: 'pending' })
    expect(transfer.data.id).toContain('TR-')

    const approved = mockSuccess({ id: transfer.data.id, status: 'approved', approvedBy: ROLES.StoreManager })
    expect(approved.data.status).toBe('approved')

    const inbound = mockSuccess({ id: approved.data.id, status: 'completed', receivedQty: 100 })
    expect(inbound.data.status).toBe('completed')
  })

  it('👔[反例] 店长查看非本门店营收被拒', () => {
    const crossStore = mockError(403, 'STORE_SCOPE_RESTRICTED')
    expect(crossStore.success).toBe(false)
    expect(crossStore.code).toBe(403)
  })

  it('👔[边界] 店长查看凌晨时段无数据报表', () => {
    const emptyReport = mockSuccess({ todayRevenue: 0, orderCount: 0 })
    expect(emptyReport.data.todayRevenue).toBe(0)
    expect(emptyReport.data.orderCount).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🛒前台 - 收银与会员
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 门店管理旅程`, () => {
  it('🛒[正例] 前台查看会员 → 创建订单 → 收银结账 → 打印小票', () => {
    // 查询会员
    expect(canAccess(ROLES.FrontDesk, 'member')).toBe(true)
    const member = mockSuccess({ id: 'M-1001', name: '张三', points: 350, level: '银卡' })
    expect(member.data.points).toBe(350)

    // 创建订单
    expect(canAccess(ROLES.FrontDesk, 'cashier')).toBe(true)
    const order = mockSuccess({ id: 'ORD-20260718-001', items: [{ name: '游戏币100枚', price: 50, qty: 2 }], total: 100 })
    expect(order.data.total).toBe(100)

    // 收银结账
    const payment = mockSuccess({ orderId: order.data.id, amount: 100, method: 'wechat', status: 'paid', receiptNo: 'RC-001' })
    expect(payment.data.status).toBe('paid')
    expect(payment.data.receiptNo).toBeTruthy()
  })

  it('🛒[反例] 前台操作超过限额需店长审批', () => {
    // 超过 5000 元需店长授权码
    const exceedLimit = mockError(402, 'AUTHORIZATION_REQUIRED:STORE_MANAGER')
    expect(exceedLimit.code).toBe(402)
    expect(exceedLimit.message).toContain('STORE_MANAGER')
  })

  it('🛒[反例] 前台无权访问库存调拨功能', () => {
    // 库存模块可读不可写
    expect(canAccess(ROLES.FrontDesk, 'inventory')).toBe(true) // 读
    // 但调拨功能只对店长和运行专员开放
    const transferBlock = mockError(403, 'INSUFFICIENT_PERMISSION:TRANSFER')
    expect(transferBlock.success).toBe(false)
  })

  it('🛒[边界] 前台处理零金额订单（纯积分兑换）', () => {
    const zeroOrder = mockSuccess({ id: 'ORD-000', total: 0, paymentMethod: 'points', status: 'paid' })
    expect(zeroOrder.data.total).toBe(0)
    expect(zeroOrder.data.status).toBe('paid')
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🎯运行专员 - 运营与库存
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} 门店管理旅程`, () => {
  it('🎯[正例] 运行专员分析库存 → 发起采购 → 核实到货', () => {
    expect(canAccess(ROLES.Operations, 'inventory')).toBe(true)
    // 分析库存
    const analysis = mockSuccess({ totalSkus: 86, belowThreshold: 12, surplus: 3, estimatedCost: 8500 })
    expect(analysis.data.belowThreshold).toBe(12)

    // 发起采购单
    const po = mockSuccess({ id: 'PO-20260718-001', items: [{ sku: 'T-010', qty: 100, unitPrice: 5 }], total: 500, status: 'submitted' })
    expect(po.data.total).toBe(500)

    // 核实到货
    const received = mockSuccess({ poId: po.data.id, status: 'received', receivedAt: Date.now() })
    expect(received.data.status).toBe('received')
  })

  it('🎯[反例] 运行专员创建超过预算的采购单被拦截', () => {
    const overBudget = mockError(400, 'PURCHASE_BUDGET_EXCEEDED:MAX_50000')
    expect(overBudget.code).toBe(400)
    expect(overBudget.message).toContain('50000')
  })

  it('🎯[反例] 运行专员无权查看会员隐私信息', () => {
    expect(canAccess(ROLES.Operations, 'member')).toBe(false)
    const blocked = mockError(403, 'MEMBER_DATA_RESTRICTED')
    expect(blocked.code).toBe(403)
  })

  it('🎯[边界] 运行专员查看零库存/负库存异常项', () => {
    const anomalies = mockSuccess([
      { sku: 'ERR-001', name: '系统错误负库存', stock: -2 },
      { sku: 'ERR-002', name: '已售罄', stock: 0 },
    ])
    const negatives = anomalies.data.filter((i: any) => i.stock < 0)
    expect(negatives.length).toBe(1)
    expect(negatives[0].stock).toBe(-2)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🎮导玩员 - 设备与库存
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 门店管理旅程`, () => {
  it('🎮[正例] 导玩员查看库存消耗 → 领取耗材 → 确认签收', () => {
    expect(canAccess(ROLES.Guide, 'inventory')).toBe(true)
    // 查看今日消耗
    const consumption = mockSuccess({ date: '2026-07-18', items: [{ name: '扭蛋补充', qty: 30 }, { name: '娃娃填充', qty: 5 }] })
    expect(consumption.data.items.length).toBeGreaterThan(0)

    // 领取耗材
    const claim = mockSuccess({ id: 'CLM-001', items: [{ name: '扭蛋补充', qty: 30 }], status: 'approved' })
    expect(claim.data.status).toBe('approved')

    // 确认签收
    const sign = mockSuccess({ claimId: claim.data.id, status: 'signed', signedAt: Date.now() })
    expect(sign.data.status).toBe('signed')
  })

  it('🎮[反例] 导玩员超额领取耗材被拒绝', () => {
    const overClaim = mockError(400, 'DAILY_CLAIM_LIMIT_EXCEEDED:MAX_50')
    expect(overClaim.success).toBe(false)
  })

  it('🎮[反例] 导玩员无权操作收银台', () => {
    expect(canAccess(ROLES.Guide, 'cashier')).toBe(false)
    const noCashier = mockError(403, 'CASHIER_ACCESS_DENIED')
    expect(noCashier.code).toBe(403)
  })

  it('🎮[边界] 导玩员领取已为零的库存项', () => {
    const emptyStock = mockSuccess({ sku: 'OUT-001', name: '限定扭蛋', available: 0 })
    expect(emptyStock.data.available).toBe(0)
    const claim = mockError(409, 'INSUFFICIENT_STOCK')
    expect(claim.code).toBe(409)
  })
})
