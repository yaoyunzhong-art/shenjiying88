import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  ProcurementStatus,
  type ProcurementItem,
  type ProcurementOrder,
} from './procurement-order.entity'

// ── In-memory store ──

const orderStore = new Map<string, ProcurementOrder>()

// ── Mock data seeded on first use ──

let seeded = false

function seedMockOrders(): void {
  if (seeded) return
  seeded = true

  const tenant = 'tenant-001'

  interface MockOrderData {
    orderNo: string; supplierId: string; supplierName: string; status: ProcurementStatus
    items: Array<{ name: string; sku: string; quantity: number; unitPrice: number; receivedQuantity: number }>
    remark?: string; orderedAt: Date; expectedAt: Date; receivedAt?: Date
  }

  const mockOrders: MockOrderData[] = [
    { orderNo: 'PO-2026-0001', supplierId: 'supplier-001', supplierName: '深圳华强电子', status: ProcurementStatus.Received, items: [{ name: '电阻器套装', sku: 'R-1001', quantity: 1000, unitPrice: 0.5, receivedQuantity: 1000 }, { name: '电容器组', sku: 'C-2001', quantity: 500, unitPrice: 1.2, receivedQuantity: 500 }], orderedAt: new Date('2026-07-01'), expectedAt: new Date('2026-07-10'), receivedAt: new Date('2026-07-09'), remark: '常规补货' },
    { orderNo: 'PO-2026-0002', supplierId: 'supplier-002', supplierName: '广州博远包装', status: ProcurementStatus.Shipped, items: [{ name: '瓦楞纸箱', sku: 'BOX-001', quantity: 2000, unitPrice: 3.0, receivedQuantity: 0 }, { name: '气泡膜', sku: 'BUB-001', quantity: 500, unitPrice: 2.5, receivedQuantity: 0 }], orderedAt: new Date('2026-07-05'), expectedAt: new Date('2026-07-15'), remark: '紧急订单' },
    { orderNo: 'PO-2026-0003', supplierId: 'supplier-003', supplierName: '东莞华美塑料', status: ProcurementStatus.PendingApproval, items: [{ name: 'ABS塑料颗粒', sku: 'ABS-001', quantity: 3000, unitPrice: 8.5, receivedQuantity: 0 }], orderedAt: new Date('2026-07-08'), expectedAt: new Date('2026-07-20') },
    { orderNo: 'PO-2026-0004', supplierId: 'supplier-004', supplierName: '上海普瑞精密', status: ProcurementStatus.Approved, items: [{ name: '精密轴承', sku: 'BRG-001', quantity: 100, unitPrice: 45.0, receivedQuantity: 0 }, { name: '传动齿轮', sku: 'GEAR-002', quantity: 50, unitPrice: 120.0, receivedQuantity: 0 }], orderedAt: new Date('2026-07-10'), expectedAt: new Date('2026-07-25') },
    { orderNo: 'PO-2026-0005', supplierId: 'supplier-005', supplierName: '北京青云软件', status: ProcurementStatus.Draft, items: [{ name: '服务器license', sku: 'LIC-001', quantity: 5, unitPrice: 5000, receivedQuantity: 0 }], orderedAt: new Date('2026-07-12'), expectedAt: new Date('2026-07-30') },
    { orderNo: 'PO-2026-0006', supplierId: 'supplier-006', supplierName: '成都鑫源物流', status: ProcurementStatus.Cancelled, items: [{ name: '物流托盘', sku: 'PAL-001', quantity: 200, unitPrice: 25.0, receivedQuantity: 0 }], orderedAt: new Date('2026-07-01'), expectedAt: new Date('2026-07-08'), remark: '改为自购' },
    { orderNo: 'PO-2026-0007', supplierId: 'supplier-007', supplierName: '杭州西湖印刷', status: ProcurementStatus.Partial, items: [{ name: '宣传单页', sku: 'FLY-001', quantity: 10000, unitPrice: 0.15, receivedQuantity: 5000 }, { name: '产品手册', sku: 'MAN-001', quantity: 2000, unitPrice: 2.0, receivedQuantity: 2000 }], orderedAt: new Date('2026-07-03'), expectedAt: new Date('2026-07-14'), receivedAt: new Date('2026-07-12') },
    { orderNo: 'PO-2026-0008', supplierId: 'supplier-008', supplierName: '武汉长江五金', status: ProcurementStatus.Received, items: [{ name: '不锈钢螺丝M6', sku: 'SCR-M6', quantity: 5000, unitPrice: 0.3, receivedQuantity: 5000 }, { name: '弹簧垫圈', sku: 'WAS-001', quantity: 5000, unitPrice: 0.1, receivedQuantity: 5000 }], orderedAt: new Date('2026-06-25'), expectedAt: new Date('2026-07-05'), receivedAt: new Date('2026-07-04') },
    { orderNo: 'PO-2026-0009', supplierId: 'supplier-010', supplierName: '重庆力通机械', status: ProcurementStatus.Shipped, items: [{ name: '电动叉车', sku: 'FORK-001', quantity: 2, unitPrice: 35000, receivedQuantity: 0 }], orderedAt: new Date('2026-07-06'), expectedAt: new Date('2026-07-18') },
    { orderNo: 'PO-2026-0010', supplierId: 'supplier-011', supplierName: '天津渤海化工', status: ProcurementStatus.PendingApproval, items: [{ name: '盐酸(工业级)', sku: 'HCL-001', quantity: 1000, unitPrice: 3.5, receivedQuantity: 0 }, { name: '氢氧化钠', sku: 'NAOH-001', quantity: 800, unitPrice: 4.0, receivedQuantity: 0 }], orderedAt: new Date('2026-07-11'), expectedAt: new Date('2026-07-22') },
    { orderNo: 'PO-2026-0011', supplierId: 'supplier-012', supplierName: '厦门泛海食品', status: ProcurementStatus.Draft, items: [{ name: '冻虾仁', sku: 'SHRIMP-001', quantity: 500, unitPrice: 35.0, receivedQuantity: 0 }], orderedAt: new Date('2026-07-14'), expectedAt: new Date('2026-07-21') },
    { orderNo: 'PO-2026-0012', supplierId: 'supplier-013', supplierName: '青岛海晟制冷', status: ProcurementStatus.Partial, items: [{ name: '压缩机', sku: 'COMP-001', quantity: 10, unitPrice: 2800, receivedQuantity: 5 }, { name: '冷凝器', sku: 'COND-001', quantity: 10, unitPrice: 1500, receivedQuantity: 10 }], orderedAt: new Date('2026-07-02'), expectedAt: new Date('2026-07-16'), receivedAt: new Date('2026-07-14') },
    { orderNo: 'PO-2026-0013', supplierId: 'supplier-014', supplierName: '郑州中原纺织', status: ProcurementStatus.Approved, items: [{ name: '棉布面料', sku: 'COT-001', quantity: 3000, unitPrice: 12.0, receivedQuantity: 0 }], orderedAt: new Date('2026-07-09'), expectedAt: new Date('2026-07-23') },
    { orderNo: 'PO-2026-0014', supplierId: 'supplier-015', supplierName: '长沙湘江仪表', status: ProcurementStatus.Shipped, items: [{ name: '温度传感器', sku: 'TEMP-001', quantity: 100, unitPrice: 55.0, receivedQuantity: 0 }, { name: '压力表', sku: 'PRESS-001', quantity: 50, unitPrice: 80.0, receivedQuantity: 0 }], orderedAt: new Date('2026-07-07'), expectedAt: new Date('2026-07-17') },
    { orderNo: 'PO-2026-0015', supplierId: 'supplier-017', supplierName: '大连海天渔业', status: ProcurementStatus.Received, items: [{ name: '冷冻三文鱼', sku: 'SAL-001', quantity: 200, unitPrice: 60.0, receivedQuantity: 200 }], orderedAt: new Date('2026-07-04'), expectedAt: new Date('2026-07-11'), receivedAt: new Date('2026-07-10') },
    { orderNo: 'PO-2026-0016', supplierId: 'supplier-018', supplierName: '苏州工业园区电子', status: ProcurementStatus.PendingApproval, items: [{ name: 'PCB板', sku: 'PCB-001', quantity: 500, unitPrice: 22.0, receivedQuantity: 0 }, { name: 'IC芯片', sku: 'IC-001', quantity: 1000, unitPrice: 5.5, receivedQuantity: 0 }], orderedAt: new Date('2026-07-13'), expectedAt: new Date('2026-07-28') },
    { orderNo: 'PO-2026-0017', supplierId: 'supplier-020', supplierName: '哈尔滨冰雪饮料', status: ProcurementStatus.Draft, items: [{ name: '浓缩果汁', sku: 'JUIC-001', quantity: 1000, unitPrice: 8.0, receivedQuantity: 0 }, { name: 'PET瓶', sku: 'BOT-001', quantity: 10000, unitPrice: 0.5, receivedQuantity: 0 }], orderedAt: new Date('2026-07-15'), expectedAt: new Date('2026-07-25') },
    { orderNo: 'PO-2026-0018', supplierId: 'supplier-022', supplierName: '合肥科达电子', status: ProcurementStatus.Approved, items: [{ name: 'LED显示屏', sku: 'LED-001', quantity: 20, unitPrice: 1500, receivedQuantity: 0 }], orderedAt: new Date('2026-07-10'), expectedAt: new Date('2026-07-24') },
    { orderNo: 'PO-2026-0019', supplierId: 'supplier-023', supplierName: '济南泉城纸业', status: ProcurementStatus.Cancelled, items: [{ name: 'A4打印纸', sku: 'PAP-A4', quantity: 200, unitPrice: 22.0, receivedQuantity: 0 }], orderedAt: new Date('2026-07-02'), expectedAt: new Date('2026-07-09'), remark: '供应商产能不足，取消' },
    { orderNo: 'PO-2026-0020', supplierId: 'supplier-001', supplierName: '深圳华强电子', status: ProcurementStatus.Received, items: [{ name: '单片机开发板', sku: 'MCU-001', quantity: 50, unitPrice: 85.0, receivedQuantity: 50 }, { name: '传感器模块', sku: 'SENS-001', quantity: 100, unitPrice: 15.0, receivedQuantity: 100 }], orderedAt: new Date('2026-06-28'), expectedAt: new Date('2026-07-08'), receivedAt: new Date('2026-07-07') },
    { orderNo: 'PO-2026-0021', supplierId: 'supplier-003', supplierName: '东莞华美塑料', status: ProcurementStatus.Approved, items: [{ name: 'PP塑料粒子', sku: 'PP-001', quantity: 5000, unitPrice: 6.5, receivedQuantity: 0 }], orderedAt: new Date('2026-07-14'), expectedAt: new Date('2026-07-28') },
  ]

  for (const m of mockOrders) {
    const items: ProcurementItem[] = m.items.map((item) => ({
      id: `item-${randomUUID()}`,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      receivedQuantity: item.receivedQuantity,
    }))

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    const order: ProcurementOrder = {
      id: `order-${randomUUID()}`,
      orderNo: m.orderNo,
      supplierId: m.supplierId,
      supplierName: m.supplierName,
      status: m.status,
      totalAmount,
      items,
      remark: m.remark,
      orderedAt: m.orderedAt.toISOString(),
      expectedAt: m.expectedAt.toISOString(),
      receivedAt: m.receivedAt?.toISOString(),
      tenantId: tenant,
      createdAt: m.orderedAt.toISOString(),
    }
    orderStore.set(order.id, order)
  }
}

@Injectable()
export class ProcurementOrderService {
  // ═══════════════════════════════════════════════════════════════════
  // Order CRUD
  // ═══════════════════════════════════════════════════════════════════

  createOrder(input: {
    tenantId: string
    orderNo: string
    supplierId: string
    supplierName: string
    items: Array<{ name: string; sku: string; quantity: number; unitPrice: number; receivedQuantity?: number }>
    remark?: string
    orderedAt: string
    expectedAt: string
  }): ProcurementOrder {
    const now = new Date().toISOString()
    const items: ProcurementItem[] = input.items.map((item) => ({
      id: `item-${randomUUID()}`,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      receivedQuantity: item.receivedQuantity ?? 0,
    }))

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    const order: ProcurementOrder = {
      id: `order-${randomUUID()}`,
      tenantId: input.tenantId,
      orderNo: input.orderNo,
      supplierId: input.supplierId,
      supplierName: input.supplierName,
      status: ProcurementStatus.Draft,
      totalAmount,
      items,
      remark: input.remark,
      orderedAt: input.orderedAt,
      expectedAt: input.expectedAt,
      createdAt: now,
    }
    orderStore.set(order.id, order)
    return order
  }

  updateOrder(
    orderId: string,
    tenantId: string,
    input: {
      orderNo?: string
      supplierId?: string
      supplierName?: string
      items?: ProcurementItem[]
      remark?: string
      expectedAt?: string
    }
  ): ProcurementOrder {
    const order = this.requireOrder(orderId, tenantId)

    if (input.orderNo !== undefined) order.orderNo = input.orderNo
    if (input.supplierId !== undefined) order.supplierId = input.supplierId
    if (input.supplierName !== undefined) order.supplierName = input.supplierName
    if (input.remark !== undefined) order.remark = input.remark
    if (input.expectedAt !== undefined) order.expectedAt = input.expectedAt
    if (input.items !== undefined) {
      order.items = input.items
      order.totalAmount = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    }

    orderStore.set(orderId, order)
    return order
  }

  getOrder(orderId: string, tenantId: string): ProcurementOrder | undefined {
    const order = orderStore.get(orderId)
    if (!order || order.tenantId !== tenantId) return undefined
    return order
  }

  listOrders(
    tenantId: string,
    filter?: {
      status?: ProcurementStatus
      supplierId?: string
      search?: string
    }
  ): ProcurementOrder[] {
    seedMockOrders()
    return Array.from(orderStore.values())
      .filter((o) => o.tenantId === tenantId)
      .filter((o) => (filter?.status ? o.status === filter.status : true))
      .filter((o) => (filter?.supplierId ? o.supplierId === filter.supplierId : true))
      .filter((o) => {
        if (!filter?.search) return true
        const q = filter.search.toLowerCase()
        return (
          o.orderNo.toLowerCase().includes(q) ||
          o.supplierName.toLowerCase().includes(q) ||
          o.items.some((item) => item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => b.orderedAt.localeCompare(a.orderedAt))
  }

  deleteOrder(orderId: string, tenantId: string): void {
    const order = this.requireOrder(orderId, tenantId)
    if (order.status !== ProcurementStatus.Draft && order.status !== ProcurementStatus.Cancelled) {
      throw new Error('Only draft or cancelled orders can be deleted')
    }
    orderStore.delete(order.id)
  }

  // ═══════════════════════════════════════════════════════════════════
  // Status management
  // ═══════════════════════════════════════════════════════════════════

  updateOrderStatus(orderId: string, status: ProcurementStatus, tenantId: string): ProcurementOrder {
    const order = this.requireOrder(orderId, tenantId)
    this.assertValidStatusTransition(order.status, status)
    order.status = status
    orderStore.set(orderId, order)
    return order
  }

  receiveItems(
    orderId: string,
    items: Array<{ itemId: string; receivedQuantity: number }>,
    tenantId: string
  ): ProcurementOrder {
    const order = this.requireOrder(orderId, tenantId)

    if (order.status !== ProcurementStatus.Shipped && order.status !== ProcurementStatus.Partial) {
      throw new Error('Order must be in SHIPPED or PARTIAL status to receive items')
    }

    for (const incoming of items) {
      const orderItem = order.items.find((oi) => oi.id === incoming.itemId)
      if (!orderItem) throw new Error(`Item not found: ${incoming.itemId}`)
      if (incoming.receivedQuantity > orderItem.quantity - orderItem.receivedQuantity) {
        throw new Error(`Received quantity exceeds ordered quantity for item: ${orderItem.name}`)
      }
      orderItem.receivedQuantity += incoming.receivedQuantity
    }

    const allReceived = order.items.every((item) => item.receivedQuantity >= item.quantity)
    const anyReceived = order.items.some((item) => item.receivedQuantity > 0)

    if (allReceived) {
      order.status = ProcurementStatus.Received
      order.receivedAt = new Date().toISOString()
    } else if (anyReceived) {
      order.status = ProcurementStatus.Partial
    }

    orderStore.set(orderId, order)
    return order
  }

  // ═══════════════════════════════════════════════════════════════════
  // Query helpers
  // ═══════════════════════════════════════════════════════════════════

  getOrdersBySupplier(supplierId: string, tenantId: string): ProcurementOrder[] {
    seedMockOrders()
    return Array.from(orderStore.values())
      .filter((o) => o.tenantId === tenantId && o.supplierId === supplierId)
      .sort((a, b) => b.orderedAt.localeCompare(a.orderedAt))
  }

  getOverdueOrders(tenantId: string): ProcurementOrder[] {
    seedMockOrders()
    const now = new Date().toISOString()
    return Array.from(orderStore.values())
      .filter(
        (o) =>
          o.tenantId === tenantId &&
          o.expectedAt < now &&
          o.status !== ProcurementStatus.Received &&
          o.status !== ProcurementStatus.Cancelled
      )
      .sort((a, b) => a.expectedAt.localeCompare(b.expectedAt))
  }

  // ═══════════════════════════════════════════════════════════════════
  // Internals
  // ═══════════════════════════════════════════════════════════════════

  private requireOrder(orderId: string, tenantId: string): ProcurementOrder {
    const order = orderStore.get(orderId)
    if (!order || order.tenantId !== tenantId) {
      throw new Error(`Order not found: ${orderId}`)
    }
    return order
  }

  private assertValidStatusTransition(from: ProcurementStatus, to: ProcurementStatus): void {
    const validTransitions: Record<ProcurementStatus, ProcurementStatus[]> = {
      [ProcurementStatus.Draft]: [ProcurementStatus.PendingApproval, ProcurementStatus.Cancelled],
      [ProcurementStatus.PendingApproval]: [ProcurementStatus.Approved, ProcurementStatus.Draft, ProcurementStatus.Cancelled],
      [ProcurementStatus.Approved]: [ProcurementStatus.Shipped, ProcurementStatus.Cancelled],
      [ProcurementStatus.Shipped]: [ProcurementStatus.Partial, ProcurementStatus.Received, ProcurementStatus.Cancelled],
      [ProcurementStatus.Partial]: [ProcurementStatus.Received],
      [ProcurementStatus.Received]: [],
      [ProcurementStatus.Cancelled]: [],
    }
    if (!validTransitions[from].includes(to)) {
      throw new Error(`Invalid procurement status transition: ${from} → ${to}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test helpers
  // ═══════════════════════════════════════════════════════════════════

  resetOrderStoresForTests(): void {
    orderStore.clear()
    seeded = false
  }
}
