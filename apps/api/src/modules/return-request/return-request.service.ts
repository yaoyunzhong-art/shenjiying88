import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  ReturnType,
  ReturnStatus,
  type ReturnRequest,
} from './return-request.entity'

// ── In-memory store ──

const returnStore = new Map<string, ReturnRequest>()

// ── Mock data seeded on first use ──

let seeded = false

function seedMockReturns(): void {
  if (seeded) return
  seeded = true

  const tenant = 'tenant-001'

  interface MockReturnData {
    returnNo: string; orderNo: string; itemName: string; quantity: number
    type: ReturnType; reason: string; status: ReturnStatus
    customerName: string; amount: number; images?: string[]; remark?: string
    createdAt: Date; resolvedAt?: Date
  }

  const mockReturns: MockReturnData[] = [
    { returnNo: 'RT-2026-0001', orderNo: 'PO-2026-0001', itemName: '电阻器套装', quantity: 50, type: ReturnType.QualityIssue, reason: '阻值偏差超出规格', status: ReturnStatus.Refunded, customerName: '李明', amount: 25, createdAt: new Date('2026-07-10'), resolvedAt: new Date('2026-07-12'), remark: '已退款' },
    { returnNo: 'RT-2026-0002', orderNo: 'PO-2026-0001', itemName: '电容器组', quantity: 10, type: ReturnType.QualityIssue, reason: '容量异常', status: ReturnStatus.Approved, customerName: '李明', amount: 12, createdAt: new Date('2026-07-11') },
    { returnNo: 'RT-2026-0003', orderNo: 'PO-2026-0004', itemName: '精密轴承', quantity: 2, type: ReturnType.WrongItem, reason: '规格不符，订单为6205实际收到6204', status: ReturnStatus.Inspecting, customerName: '王芳', amount: 90, createdAt: new Date('2026-07-12'), remark: '待质检确认' },
    { returnNo: 'RT-2026-0004', orderNo: 'PO-2026-0005', itemName: '服务器license', quantity: 1, type: ReturnType.CustomerRemorse, reason: '购买后决定改用云服务', status: ReturnStatus.Pending, customerName: '张伟', amount: 5000, createdAt: new Date('2026-07-13') },
    { returnNo: 'RT-2026-0005', orderNo: 'PO-2026-0004', itemName: '传动齿轮', quantity: 5, type: ReturnType.Damage, reason: '运输过程中齿面受损', status: ReturnStatus.Approved, customerName: '王芳', amount: 600, createdAt: new Date('2026-07-13'), images: ['gear-damage-1.jpg', 'gear-damage-2.jpg'], remark: '附照片' },
    { returnNo: 'RT-2026-0006', orderNo: 'PO-2026-0008', itemName: '不锈钢螺丝M6', quantity: 200, type: ReturnType.QualityIssue, reason: '部分螺丝螺纹有毛刺', status: ReturnStatus.Rejected, customerName: '赵强', amount: 60, createdAt: new Date('2026-07-08'), resolvedAt: new Date('2026-07-10'), remark: '经检测不影响使用，驳回' },
    { returnNo: 'RT-2026-0007', orderNo: 'PO-2026-0009', itemName: '电动叉车', quantity: 1, type: ReturnType.Damage, reason: '液压系统漏油', status: ReturnStatus.Inspecting, customerName: '刘洋', amount: 35000, createdAt: new Date('2026-07-14'), images: ['fork-leak.jpg'] },
    { returnNo: 'RT-2026-0008', orderNo: 'PO-2026-0010', itemName: '盐酸(工业级)', quantity: 100, type: ReturnType.QualityIssue, reason: '浓度不达标', status: ReturnStatus.Pending, customerName: '陈敏', amount: 350, createdAt: new Date('2026-07-14') },
    { returnNo: 'RT-2026-0009', orderNo: 'PO-2026-0011', itemName: '冻虾仁', quantity: 50, type: ReturnType.Damage, reason: '冷链断链，部分变质', status: ReturnStatus.Refunded, customerName: '黄丽', amount: 1750, createdAt: new Date('2026-07-14'), resolvedAt: new Date('2026-07-15'), remark: '已全额退款' },
    { returnNo: 'RT-2026-0010', orderNo: 'PO-2026-0015', itemName: '冷冻三文鱼', quantity: 20, type: ReturnType.QualityIssue, reason: '产品色泽异常', status: ReturnStatus.Approved, customerName: '周杰', amount: 1200, createdAt: new Date('2026-07-15'), images: ['salmon-1.jpg'] },
    { returnNo: 'RT-2026-0011', orderNo: 'PO-2026-0016', itemName: 'PCB板', quantity: 10, type: ReturnType.WrongItem, reason: '发错版本v2.0实际需要v1.5', status: ReturnStatus.Pending, customerName: '吴敏', amount: 220, createdAt: new Date('2026-07-15') },
    { returnNo: 'RT-2026-0012', orderNo: 'PO-2026-0008', itemName: '弹簧垫圈', quantity: 500, type: ReturnType.CustomerRemorse, reason: '已超量采购', status: ReturnStatus.Pending, customerName: '赵强', amount: 50, createdAt: new Date('2026-07-15') },
    { returnNo: 'RT-2026-0013', orderNo: 'PO-2026-0012', itemName: '压缩机', quantity: 1, type: ReturnType.Damage, reason: '外壳开裂', status: ReturnStatus.Inspecting, customerName: '孙鹏', amount: 2800, createdAt: new Date('2026-07-12'), images: ['comp-crack.jpg'] },
    { returnNo: 'RT-2026-0014', orderNo: 'PO-2026-0017', itemName: '浓缩果汁', quantity: 100, type: ReturnType.QualityIssue, reason: '口感异常有发酵味', status: ReturnStatus.Approved, customerName: '林涛', amount: 800, createdAt: new Date('2026-07-15'), remark: '已退回供应商检测' },
    { returnNo: 'RT-2026-0015', orderNo: 'PO-2026-0016', itemName: 'IC芯片', quantity: 50, type: ReturnType.QualityIssue, reason: 'ESD防护失效', status: ReturnStatus.Rejected, customerName: '吴敏', amount: 275, createdAt: new Date('2026-07-10'), resolvedAt: new Date('2026-07-13'), remark: '未通过质检，不予退款' },
    { returnNo: 'RT-2026-0016', orderNo: 'PO-2026-0018', itemName: 'LED显示屏', quantity: 2, type: ReturnType.WrongItem, reason: '尺寸不符', status: ReturnStatus.Pending, customerName: '郑阳', amount: 3000, createdAt: new Date('2026-07-16') },
    { returnNo: 'RT-2026-0017', orderNo: 'PO-2026-0020', itemName: '传感器模块', quantity: 10, type: ReturnType.QualityIssue, reason: '读数偏差超5%', status: ReturnStatus.Inspecting, customerName: '李明', amount: 150, createdAt: new Date('2026-07-14') },
    { returnNo: 'RT-2026-0018', orderNo: 'PO-2026-0007', itemName: '产品手册', quantity: 200, type: ReturnType.CustomerRemorse, reason: '设计改版无需旧版', status: ReturnStatus.Approved, customerName: '马超', amount: 400, createdAt: new Date('2026-07-09') },
    { returnNo: 'RT-2026-0019', orderNo: 'PO-2026-0002', itemName: '气泡膜', quantity: 100, type: ReturnType.Damage, reason: '包装破损', status: ReturnStatus.Pending, customerName: '何静', amount: 250, createdAt: new Date('2026-07-16') },
    { returnNo: 'RT-2026-0020', orderNo: 'PO-2026-0021', itemName: 'PP塑料粒子', quantity: 500, type: ReturnType.QualityIssue, reason: '熔融指数不符合要求', status: ReturnStatus.Pending, customerName: '罗飞', amount: 3250, createdAt: new Date('2026-07-16') },
    { returnNo: 'RT-2026-0021', orderNo: 'PO-2026-0001', itemName: '电阻器套装', quantity: 20, type: ReturnType.CustomerRemorse, reason: '多余库存退货', status: ReturnStatus.Refunded, customerName: '李明', amount: 10, createdAt: new Date('2026-07-05'), resolvedAt: new Date('2026-07-07'), remark: '已退款完成' },
  ]

  for (const m of mockReturns) {
    const ret: ReturnRequest = {
      id: `return-${randomUUID()}`,
      returnNo: m.returnNo,
      orderNo: m.orderNo,
      itemName: m.itemName,
      quantity: m.quantity,
      type: m.type,
      reason: m.reason,
      status: m.status,
      customerName: m.customerName,
      amount: m.amount,
      images: m.images,
      remark: m.remark,
      createdAt: m.createdAt.toISOString(),
      resolvedAt: m.resolvedAt?.toISOString(),
      tenantId: tenant,
    }
    returnStore.set(ret.id, ret)
  }
}

@Injectable()
export class ReturnRequestService {
  // ═══════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════

  createReturn(input: {
    tenantId: string
    returnNo: string
    orderNo: string
    itemName: string
    quantity: number
    type: ReturnType
    reason: string
    customerName: string
    amount: number
    images?: string[]
    remark?: string
  }): ReturnRequest {
    const now = new Date().toISOString()
    const ret: ReturnRequest = {
      id: `return-${randomUUID()}`,
      returnNo: input.returnNo,
      orderNo: input.orderNo,
      itemName: input.itemName,
      quantity: input.quantity,
      type: input.type,
      reason: input.reason,
      status: ReturnStatus.Pending,
      customerName: input.customerName,
      amount: input.amount,
      images: input.images,
      remark: input.remark,
      createdAt: now,
      tenantId: input.tenantId,
    }
    returnStore.set(ret.id, ret)
    return ret
  }

  getReturn(returnId: string, tenantId: string): ReturnRequest | undefined {
    const ret = returnStore.get(returnId)
    if (!ret || ret.tenantId !== tenantId) return undefined
    return ret
  }

  listReturns(
    tenantId: string,
    filter?: {
      type?: ReturnType
      status?: ReturnStatus
      customerName?: string
      search?: string
    }
  ): ReturnRequest[] {
    seedMockReturns()
    return Array.from(returnStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => (filter?.type ? r.type === filter.type : true))
      .filter((r) => (filter?.status ? r.status === filter.status : true))
      .filter((r) => (filter?.customerName ? r.customerName === filter.customerName : true))
      .filter((r) => {
        if (!filter?.search) return true
        const q = filter.search.toLowerCase()
        return (
          r.returnNo.toLowerCase().includes(q) ||
          r.orderNo.toLowerCase().includes(q) ||
          r.itemName.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  updateReturn(
    returnId: string,
    tenantId: string,
    input: {
      reason?: string
      remark?: string
      images?: string[]
    }
  ): ReturnRequest {
    const ret = this.requireReturn(returnId, tenantId)
    if (input.reason !== undefined) ret.reason = input.reason
    if (input.remark !== undefined) ret.remark = input.remark
    if (input.images !== undefined) ret.images = input.images
    returnStore.set(returnId, ret)
    return ret
  }

  deleteReturn(returnId: string, tenantId: string): void {
    const ret = this.requireReturn(returnId, tenantId)
    if (ret.status !== ReturnStatus.Pending) {
      throw new Error('Only pending returns can be deleted')
    }
    returnStore.delete(ret.id)
  }

  // ═══════════════════════════════════════════════════════════════════
  // Workflow
  // ═══════════════════════════════════════════════════════════════════

  updateReturnStatus(
    returnId: string,
    status: ReturnStatus,
    tenantId: string,
    remark?: string
  ): ReturnRequest {
    const ret = this.requireReturn(returnId, tenantId)
    this.assertValidStatusTransition(ret.status, status)

    ret.status = status
    if (remark !== undefined) ret.remark = remark
    if (
      status === ReturnStatus.Approved ||
      status === ReturnStatus.Rejected ||
      status === ReturnStatus.Refunded
    ) {
      ret.resolvedAt = new Date().toISOString()
    }
    returnStore.set(returnId, ret)
    return ret
  }

  // ═══════════════════════════════════════════════════════════════════
  // Query helpers
  // ═══════════════════════════════════════════════════════════════════

  getReturnsByCustomer(customerName: string, tenantId: string): ReturnRequest[] {
    seedMockReturns()
    return Array.from(returnStore.values())
      .filter((r) => r.tenantId === tenantId && r.customerName === customerName)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  getReturnsByOrder(orderNo: string, tenantId: string): ReturnRequest[] {
    seedMockReturns()
    return Array.from(returnStore.values())
      .filter((r) => r.tenantId === tenantId && r.orderNo === orderNo)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  getPendingReturns(tenantId: string): ReturnRequest[] {
    seedMockReturns()
    return Array.from(returnStore.values())
      .filter((r) => r.tenantId === tenantId && r.status === ReturnStatus.Pending)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  // ═══════════════════════════════════════════════════════════════════
  // Internals
  // ═══════════════════════════════════════════════════════════════════

  private requireReturn(returnId: string, tenantId: string): ReturnRequest {
    const ret = returnStore.get(returnId)
    if (!ret || ret.tenantId !== tenantId) {
      throw new Error(`Return not found: ${returnId}`)
    }
    return ret
  }

  private assertValidStatusTransition(from: ReturnStatus, to: ReturnStatus): void {
    const validTransitions: Record<ReturnStatus, ReturnStatus[]> = {
      [ReturnStatus.Pending]: [ReturnStatus.Inspecting, ReturnStatus.Rejected],
      [ReturnStatus.Inspecting]: [ReturnStatus.Approved, ReturnStatus.Rejected],
      [ReturnStatus.Approved]: [ReturnStatus.Refunded],
      [ReturnStatus.Rejected]: [],
      [ReturnStatus.Refunded]: [],
    }
    if (!validTransitions[from].includes(to)) {
      throw new Error(`Invalid return status transition: ${from} → ${to}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test helpers
  // ═══════════════════════════════════════════════════════════════════

  resetReturnStoresForTests(): void {
    returnStore.clear()
    seeded = false
  }
}
