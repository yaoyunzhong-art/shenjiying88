import { describe, it, expect, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 T10: procurement-order 安全审计+增强测试
 * 树哥 Trae 审查：跨租户、越权、审批流边界、并发、幂等
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ProcurementOrderService } from './procurement-order.service'
import { ProcurementOrderController } from './procurement-order.controller'
import { ProcurementStatus, type ProcurementOrder } from './procurement-order.entity'

// ═════════════════════════════════════════════════════════════════════
// 服务层安全审计测试
// ═════════════════════════════════════════════════════════════════════

describe('ProcurementOrder — 安全审计 & 边界测试 (Service)', () => {
  let service: ProcurementOrderService

  const T1 = 'tenant-001'
  const T2 = 'tenant-002' // 攻击者租户

  beforeEach(() => {
    service = new ProcurementOrderService()
  })

  afterEach(() => {
    service.resetOrderStoresForTests()
  })

  function createOrder(tenant: string, overrides: Record<string, unknown> = {}): ProcurementOrder {
    return service.createOrder({
      tenantId: tenant,
      orderNo: `PO-${tenant}-001`,
      supplierId: 'sup-001',
      supplierName: `供应商-${tenant}`,
      items: [
        { name: '安全测试商品', sku: 'SEC-001', quantity: 10, unitPrice: 100 },
      ],
      orderedAt: '2026-07-16T00:00:00.000Z',
      expectedAt: '2026-07-25T00:00:00.000Z',
      ...overrides,
    })
  }

  function advanceToStatus(order: ProcurementOrder, target: ProcurementStatus): void {
    const path: ProcurementStatus[] = []
    switch (target) {
      case ProcurementStatus.PendingApproval: path.push(ProcurementStatus.PendingApproval); break
      case ProcurementStatus.Approved: path.push(ProcurementStatus.PendingApproval, ProcurementStatus.Approved); break
      case ProcurementStatus.Shipped: path.push(ProcurementStatus.PendingApproval, ProcurementStatus.Approved, ProcurementStatus.Shipped); break
      case ProcurementStatus.Received:
        path.push(ProcurementStatus.PendingApproval, ProcurementStatus.Approved, ProcurementStatus.Shipped, ProcurementStatus.Received)
        break
      default: break
    }
    for (const s of path) {
      service.updateOrderStatus(order.id, s, T1)
    }
  }

  // ── 🛡️ 跨租户隔离 ──

  describe('🛡️ 跨租户隔离', () => {
    it('T2 不能读取 T1 的订单', () => {
      const o1 = createOrder(T1)
      const found = service.getOrder(o1.id, T2)
      assert.equal(found, undefined)
    })

    it('T2 不能更新 T1 的订单', () => {
      const o1 = createOrder(T1)
      assert.throws(
        () => service.updateOrder(o1.id, T2, { remark: 'HACKED' }),
        /Order not found/
      )
    })

    it('T2 不能删除 T1 的订单', () => {
      const o1 = createOrder(T1)
      assert.throws(
        () => service.deleteOrder(o1.id, T2),
        /Order not found/
      )
    })

    it('T2 不能修改 T1 订单状态', () => {
      const o1 = createOrder(T1)
      assert.throws(
        () => service.updateOrderStatus(o1.id, ProcurementStatus.PendingApproval, T2),
        /Order not found/
      )
    })

    it('T2 不能对 T1 订单收货', () => {
      const o1 = createOrder(T1)
      assert.throws(
        () => service.receiveItems(o1.id, [{ itemId: 'x', receivedQuantity: 1 }], T2),
        /Order not found/
      )
    })

    it('listOrders 只返回当前租户订单（不含 T2 数据）', () => {
      createOrder(T1, { orderNo: 'PO-T1-A' })
      createOrder(T1, { orderNo: 'PO-T1-B' })
      createOrder(T2, { orderNo: 'PO-T2-SECRET' })

      const t1List = service.listOrders(T1)
      const t2List = service.listOrders(T2)

      assert.ok(t1List.some((o) => o.orderNo === 'PO-T1-A'))
      assert.ok(!t1List.some((o) => o.orderNo === 'PO-T2-SECRET'))
      assert.ok(t2List.some((o) => o.orderNo === 'PO-T2-SECRET'))
      assert.ok(!t2List.some((o) => o.orderNo === 'PO-T1-A'))
    })
  })

  // ── 🔄 审批流完整路径 ──

  describe('🔄 审批流完整路径', () => {
    it('Draft → PendingApproval → Draft（退回）应成功', () => {
      const o = createOrder(T1)
      service.updateOrderStatus(o.id, ProcurementStatus.PendingApproval, T1)
      const reverted = service.updateOrderStatus(o.id, ProcurementStatus.Draft, T1)
      assert.equal(reverted.status, ProcurementStatus.Draft)
    })

    it('PendingApproval → Cancelled 应成功', () => {
      const o = createOrder(T1)
      service.updateOrderStatus(o.id, ProcurementStatus.PendingApproval, T1)
      const cancelled = service.updateOrderStatus(o.id, ProcurementStatus.Cancelled, T1)
      assert.equal(cancelled.status, ProcurementStatus.Cancelled)
    })

    it('Approved → Cancelled 应成功', () => {
      const o = createOrder(T1)
      advanceToStatus(o, ProcurementStatus.Approved)
      const cancelled = service.updateOrderStatus(o.id, ProcurementStatus.Cancelled, T1)
      assert.equal(cancelled.status, ProcurementStatus.Cancelled)
    })

    it('Shipped → Cancelled 应成功', () => {
      const o = createOrder(T1)
      advanceToStatus(o, ProcurementStatus.Shipped)
      const cancelled = service.updateOrderStatus(o.id, ProcurementStatus.Cancelled, T1)
      assert.equal(cancelled.status, ProcurementStatus.Cancelled)
    })

    it('Received → 任何操作都应拒绝', () => {
      const o = createOrder(T1)
      advanceToStatus(o, ProcurementStatus.Shipped)
      service.receiveItems(o.id, [{ itemId: o.items[0].id, receivedQuantity: 10 }], T1)
      // status is now Received
      assert.equal(o.status, ProcurementStatus.Received)
      assert.throws(
        () => service.updateOrderStatus(o.id, ProcurementStatus.Draft, T1),
        /Invalid procurement status transition/
      )
    })

    it('Cancelled 状态不可逆', () => {
      const o = createOrder(T1)
      service.updateOrderStatus(o.id, ProcurementStatus.Cancelled, T1)
      assert.throws(
        () => service.updateOrderStatus(o.id, ProcurementStatus.Draft, T1),
        /Invalid procurement status transition/
      )
    })

    it('Cancelled 订单可以删除', () => {
      const o = createOrder(T1)
      service.updateOrderStatus(o.id, ProcurementStatus.Cancelled, T1)
      service.deleteOrder(o.id, T1)
      assert.equal(service.getOrder(o.id, T1), undefined)
    })

    it('完整正向流程: Draft → PendingApproval → Approved → Shipped → Partial → Received', () => {
      const o = createOrder(T1)
      advanceToStatus(o, ProcurementStatus.Partial) // not a direct path, go Shipped + partial receive

      // Let's do it step by step more carefully
      const o2 = createOrder(T1, { orderNo: 'PO-FULL-FLOW' })
      advanceToStatus(o2, ProcurementStatus.Shipped)

      // partial receive
      service.receiveItems(o2.id, [{ itemId: o2.items[0].id, receivedQuantity: 5 }], T1)
      const partialOrder = service.getOrder(o2.id, T1)!
      assert.equal(partialOrder.status, ProcurementStatus.Partial)

      // complete
      const completed = service.receiveItems(o2.id, [{ itemId: o2.items[0].id, receivedQuantity: 5 }], T1)
      assert.equal(completed.status, ProcurementStatus.Received)
      assert.ok(completed.receivedAt)
    })
  })

  // ── 📦 收货边界 ──

  describe('📦 收货边界测试', () => {
    it('超额收货应被拒绝（单条）', () => {
      const o = createOrder(T1)
      advanceToStatus(o, ProcurementStatus.Shipped)
      assert.throws(
        () => service.receiveItems(o.id, [{ itemId: o.items[0].id, receivedQuantity: 999 }], T1),
        /Received quantity exceeds ordered quantity/
      )
    })

    it('超额收货应被拒绝（增量超额）', () => {
      const o = createOrder(T1)
      advanceToStatus(o, ProcurementStatus.Shipped)
      service.receiveItems(o.id, [{ itemId: o.items[0].id, receivedQuantity: 5 }], T1)
      assert.throws(
        () => service.receiveItems(o.id, [{ itemId: o.items[0].id, receivedQuantity: 6 }], T1), // 5+6=11 > 10
        /Received quantity exceeds ordered quantity/
      )
    })

    it('收货不存在的 itemId 应报错', () => {
      const o = createOrder(T1)
      advanceToStatus(o, ProcurementStatus.Shipped)
      assert.throws(
        () => service.receiveItems(o.id, [{ itemId: 'nonexistent-item', receivedQuantity: 1 }], T1),
        /Item not found/
      )
    })

    it('Partial 状态仍可继续收货直到 Complete', () => {
      const o = createOrder(T1)
      advanceToStatus(o, ProcurementStatus.Shipped)
      service.receiveItems(o.id, [{ itemId: o.items[0].id, receivedQuantity: 5 }], T1)
      // Now Partial, can still receive more
      const finished = service.receiveItems(o.id, [{ itemId: o.items[0].id, receivedQuantity: 5 }], T1)
      assert.equal(finished.status, ProcurementStatus.Received)
    })
  })

  // ── 🔁 幂等性 ──

  describe('🔁 幂等性', () => {
    it('多次创建相同 orderNo 会产生多个记录', () => {
      // 当前实现不检查 orderNo 唯一性 — 这是潜在风险点
      const o1 = createOrder(T1, { orderNo: 'PO-DUP' })
      const o2 = createOrder(T1, { orderNo: 'PO-DUP' })
      assert.notEqual(o1.id, o2.id)
      assert.equal(o1.orderNo, o2.orderNo)

      // 验证两边都在 store 里
      const list = service.listOrders(T1)
      const dupes = list.filter((o) => o.orderNo === 'PO-DUP')
      assert.equal(dupes.length, 2)

      // 🐜 审计意见: orderNo 应加唯一索引约束（生产 DB 层）
    })

    it('重复删除同一订单应报错', () => {
      const o = createOrder(T1)
      service.deleteOrder(o.id, T1)
      assert.throws(
        () => service.deleteOrder(o.id, T1),
        /Order not found/
      )
    })
  })

  // ── 🧪 边界条件 ──

  describe('🧪 边界条件', () => {
    it('创建订单时应设置 receivedQuantity 默认值 0', () => {
      const o = service.createOrder({
        tenantId: T1,
        orderNo: 'PO-DEF',
        supplierId: 's',
        supplierName: 'S',
        items: [{ name: 'X', sku: 'X', quantity: 5, unitPrice: 10 }],
        orderedAt: '2026-07-16T00:00:00.000Z',
        expectedAt: '2026-07-25T00:00:00.000Z',
      })
      assert.equal(o.items[0].receivedQuantity, 0)
    })

    it('totalAmount 为 0 的订单可创建', () => {
      const o = service.createOrder({
        tenantId: T1,
        orderNo: 'PO-ZERO',
        supplierId: 's',
        supplierName: 'S',
        items: [{ name: 'Free', sku: 'FREE', quantity: 100, unitPrice: 0 }],
        orderedAt: '2026-07-16T00:00:00.000Z',
        expectedAt: '2026-07-25T00:00:00.000Z',
      })
      assert.equal(o.totalAmount, 0)
    })

    it('多品类订单收货乱序应正确累加', () => {
      const o = createOrder(T1, {
        items: [
          { name: 'A', sku: 'A', quantity: 10, unitPrice: 1 },
          { name: 'B', sku: 'B', quantity: 20, unitPrice: 1 },
          { name: 'C', sku: 'C', quantity: 30, unitPrice: 1 },
        ],
      })
      advanceToStatus(o, ProcurementStatus.Shipped)

      // 先收第三个
      service.receiveItems(o.id, [{ itemId: o.items[2].id, receivedQuantity: 30 }], T1)
      const afterC = service.getOrder(o.id, T1)! // will be Partial or Received depending on others

      // 再收前两个
      const result = service.receiveItems(o.id, [
        { itemId: o.items[0].id, receivedQuantity: 10 },
        { itemId: o.items[1].id, receivedQuantity: 20 },
      ], T1)

      assert.equal(result.status, ProcurementStatus.Received)
    })
  })

  // ── 📋 listOrders 细致测试 ──

  describe('📋 listOrders 过滤功能', () => {
    it('三重过滤：status + supplierId + search', () => {
      const o = createOrder(T1, {
        orderNo: 'PO-FILTER-ME',
        supplierId: 'sup-filter',
        supplierName: '过滤测试供应商',
        items: [
          { name: '特殊螺丝', sku: 'SPECIAL-SCREW', quantity: 100, unitPrice: 1 },
        ],
      })

      const list = service.listOrders(T1, {
        status: ProcurementStatus.Draft,
        supplierId: 'sup-filter',
        search: '特殊螺丝',
      })
      assert.ok(list.some((o2) => o2.id === o.id))
    })

    it('search 匹配 orderNo', () => {
      createOrder(T1, { orderNo: 'PO-UNIQUE-999' })
      const list = service.listOrders(T1, { search: 'UNIQUE-999' })
      assert.ok(list.length >= 1)
    })

    it('search 匹配 supplierName', () => {
      createOrder(T1, { supplierName: '独家稀有供应商' })
      const list = service.listOrders(T1, { search: '稀有' })
      assert.ok(list.length >= 1)
    })

    it('search 匹配 SKU', () => {
      const o = createOrder(T1, {
        items: [{ name: '特殊物料', sku: 'MAGIC-SKU-2026', quantity: 1, unitPrice: 999 }],
      })
      const list = service.listOrders(T1, { search: 'MAGIC-SKU' })
      assert.ok(list.some((o2) => o2.id === o.id))
    })

    it('search 大小写不敏感', () => {
      createOrder(T1, { supplierName: 'TestCase' })
      const list = service.listOrders(T1, { search: 'testcase' })
      assert.ok(list.length >= 1)
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
// Controller 层安全审计测试
// ═════════════════════════════════════════════════════════════════════

describe('ProcurementOrder — Controller 安全审计', () => {
  let controller: ProcurementOrderController
  let service: ProcurementOrderService

  const T1 = { tenantId: 'tenant-001', brandId: 'b1', storeId: 's1' }
  const T2 = { tenantId: 'tenant-002', brandId: 'b2', storeId: 's2' } // 攻击者

  const items = [
    { name: '安全测试品', sku: 'SEC', quantity: 5, unitPrice: 10 },
  ]

  beforeEach(() => {
    service = new ProcurementOrderService()
    controller = new ProcurementOrderController(service)
  })

  afterEach(() => {
    service.resetOrderStoresForTests()
  })

  describe('🛡️ Controller 跨租户防护', () => {
    it('T2 不能通过 getOrder 读取 T1 数据', () => {
      const o = controller.createOrder(T1, {
        orderNo: 'PO-T1', supplierId: 's', supplierName: 'S',
        items, orderedAt: '2026-07-16T00:00:00.000Z',
        expectedAt: '2026-07-25T00:00:00.000Z',
      })

      assert.throws(
        () => controller.getOrder(T2, o.id),
        /Order not found/
      )
    })

    it('T2 不能通过 updateOrder 修改 T1 数据', () => {
      const o = controller.createOrder(T1, {
        orderNo: 'PO-T1', supplierId: 's', supplierName: 'S',
        items, orderedAt: '2026-07-16T00:00:00.000Z',
        expectedAt: '2026-07-25T00:00:00.000Z',
      })

      assert.throws(
        () => controller.updateOrder(T2, o.id, { remark: 'HACKED' }),
        /Order not found/
      )
    })

    it('T2 不能通过 deleteOrder 删除 T1 数据', () => {
      const o = controller.createOrder(T1, {
        orderNo: 'PO-T1', supplierId: 's', supplierName: 'S',
        items, orderedAt: '2026-07-16T00:00:00.000Z',
        expectedAt: '2026-07-25T00:00:00.000Z',
      })

      assert.throws(
        () => controller.deleteOrder(T2, o.id),
        /Order not found/
      )
    })

    it('T2 不能通过 updateOrderStatus 修改 T1 状态', () => {
      const o = controller.createOrder(T1, {
        orderNo: 'PO-T1', supplierId: 's', supplierName: 'S',
        items, orderedAt: '2026-07-16T00:00:00.000Z',
        expectedAt: '2026-07-25T00:00:00.000Z',
      })

      assert.throws(
        () => controller.updateOrderStatus(T2, o.id, { status: ProcurementStatus.Cancelled }),
        /Order not found/
      )
    })

    it('T2 不能对 T1 订单收货', () => {
      const o = controller.createOrder(T1, {
        orderNo: 'PO-T1', supplierId: 's', supplierName: 'S',
        items, orderedAt: '2026-07-16T00:00:00.000Z',
        expectedAt: '2026-07-25T00:00:00.000Z',
      })

      assert.throws(
        () => controller.receiveItems(T2, o.id, {
          items: [{ itemId: o.items[0].id, receivedQuantity: 1 }],
        }),
        /Order not found/
      )
    })
  })
})
