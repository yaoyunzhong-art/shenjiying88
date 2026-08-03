/**
 * return-request.service.spec.ts — 退货申请模块 Service 单元测试
 *
 * 覆盖: CRUD / 工作流状态流转 / 查询辅助 / 边界异常 / 非法状态转换
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ReturnRequestService } from './return-request.service'
import { ReturnType, ReturnStatus } from './return-request.entity'

describe('ReturnRequestService — CRUD', () => {
  let svc: ReturnRequestService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new ReturnRequestService()
    svc.resetReturnStoresForTests()
  })

  it('createReturn 创建成功，初始状态为 Pending', () => {
    const ret = svc.createReturn({
      tenantId,
      returnNo: 'RT-2026-9999',
      orderNo: 'PO-2026-9999',
      itemName: '测试商品',
      quantity: 10,
      type: ReturnType.QualityIssue,
      reason: '质量缺陷',
      customerName: '测试客户',
      amount: 5000,
    })
    expect(ret.id).toMatch(/^return-/)
    expect(ret.returnNo).toBe('RT-2026-9999')
    expect(ret.status).toBe(ReturnStatus.Pending)
    expect(ret.images).toBeUndefined()
  })

  it('createReturn 支持附带图片', () => {
    const ret = svc.createReturn({
      tenantId, returnNo: 'RT-IMG-001', orderNo: 'PO-IMG', itemName: '带图商品',
      quantity: 1, type: ReturnType.Damage, reason: '破损', customerName: 'C', amount: 100,
      images: ['photo1.jpg', 'photo2.jpg'],
    })
    expect(ret.images).toHaveLength(2)
  })

  it('getReturn 返回正确的记录', () => {
    const created = svc.createReturn({
      tenantId, returnNo: 'RT-GET-001', orderNo: 'PO-GET', itemName: '查询测试',
      quantity: 5, type: ReturnType.CustomerRemorse, reason: '不想要了',
      customerName: '张三', amount: 200,
    })
    const found = svc.getReturn(created.id, tenantId)
    expect(found).toBeDefined()
    expect(found!.returnNo).toBe('RT-GET-001')
  })

  it('getReturn 返回 undefined 当记录不存在', () => {
    expect(svc.getReturn('fake-id', tenantId)).toBeUndefined()
  })

  it('updateReturn 更新原因和备注', () => {
    const ret = svc.createReturn({
      tenantId, returnNo: 'RT-UPD-001', orderNo: 'PO-UPD', itemName: '更新测试',
      quantity: 3, type: ReturnType.WrongItem, reason: '发错货',
      customerName: '李四', amount: 300,
    })
    const updated = svc.updateReturn(ret.id, tenantId, {
      reason: '更新原因',
      remark: '已沟通客户',
    })
    expect(updated.reason).toBe('更新原因')
    expect(updated.remark).toBe('已沟通客户')
  })

  it('deleteReturn 仅删除 Pending 状态的申请', () => {
    const ret = svc.createReturn({
      tenantId, returnNo: 'RT-DEL-001', orderNo: 'PO-DEL', itemName: '删除测试',
      quantity: 1, type: ReturnType.QualityIssue, reason: '测试删除',
      customerName: '王五', amount: 50,
    })
    svc.deleteReturn(ret.id, tenantId)
    expect(svc.getReturn(ret.id, tenantId)).toBeUndefined()
  })

  it('deleteReturn 非 Pending 状态抛 Error', () => {
    const ret = svc.createReturn({
      tenantId, returnNo: 'RT-DEL-002', orderNo: 'PO-DEL2', itemName: '不可删除',
      quantity: 1, type: ReturnType.QualityIssue, reason: '测试',
      customerName: 'A', amount: 50,
    })
    svc.updateReturnStatus(ret.id, ReturnStatus.Approved, tenantId)
    expect(() => svc.deleteReturn(ret.id, tenantId)).toThrow(/Only pending/)
  })
})

describe('ReturnRequestService — 工作流状态流转', () => {
  let svc: ReturnRequestService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new ReturnRequestService()
    svc.resetReturnStoresForTests()
  })

  it('Pending → Inspecting → Approved → Refunded 完整流程', () => {
    const ret = svc.createReturn({
      tenantId, returnNo: 'RT-FLOW-001', orderNo: 'PO-FLOW', itemName: '流程测试',
      quantity: 1, type: ReturnType.QualityIssue, reason: '测试流程',
      customerName: '赵六', amount: 100,
    })
    const inspected = svc.updateReturnStatus(ret.id, ReturnStatus.Inspecting, tenantId)
    expect(inspected.status).toBe(ReturnStatus.Inspecting)
    const approved = svc.updateReturnStatus(ret.id, ReturnStatus.Approved, tenantId)
    expect(approved.status).toBe(ReturnStatus.Approved)
    const refunded = svc.updateReturnStatus(ret.id, ReturnStatus.Refunded, tenantId)
    expect(refunded.status).toBe(ReturnStatus.Refunded)
    expect(refunded.resolvedAt).toBeDefined()
  })

  it('Pending → Rejected 设置 resolvedAt', () => {
    const ret = svc.createReturn({
      tenantId, returnNo: 'RT-REJ-001', orderNo: 'PO-REJ', itemName: '驳回测试',
      quantity: 1, type: ReturnType.QualityIssue, reason: '驳回',
      customerName: '孙七', amount: 100,
    })
    const rejected = svc.updateReturnStatus(ret.id, ReturnStatus.Rejected, tenantId, '不符合退货条件')
    expect(rejected.status).toBe(ReturnStatus.Rejected)
    expect(rejected.remark).toBe('不符合退货条件')
    expect(rejected.resolvedAt).toBeDefined()
  })

  it('Rejected → Pending 可重开', () => {
    const ret = svc.createReturn({
      tenantId, returnNo: 'RT-REOPEN', orderNo: 'PO-REOPEN', itemName: '重开测试',
      quantity: 1, type: ReturnType.QualityIssue, reason: '重开',
      customerName: '周八', amount: 100,
    })
    svc.updateReturnStatus(ret.id, ReturnStatus.Rejected, tenantId)
    const reopened = svc.updateReturnStatus(ret.id, ReturnStatus.Pending, tenantId)
    expect(reopened.status).toBe(ReturnStatus.Pending)
  })

  it('非法状态转换抛 Error', () => {
    const ret = svc.createReturn({
      tenantId, returnNo: 'RT-INVLD', orderNo: 'PO-INVLD', itemName: '非法转换',
      quantity: 1, type: ReturnType.QualityIssue, reason: '测试',
      customerName: 'A', amount: 100,
    })
    expect(() => svc.updateReturnStatus(ret.id, ReturnStatus.Refunded, tenantId)).toThrow(/Invalid/)
  })

  it('updateReturnStatus 不存在的记录抛 Error', () => {
    expect(() => svc.updateReturnStatus('fake', ReturnStatus.Approved, tenantId)).toThrow(/not found/)
  })

  it('updateReturnStatus 设置 remark 可覆盖', () => {
    const ret = svc.createReturn({
      tenantId, returnNo: 'RT-REMARK', orderNo: 'PO-REMARK', itemName: '备注测试',
      quantity: 1, type: ReturnType.QualityIssue, reason: '备注',
      customerName: 'A', amount: 100, remark: '初始备注',
    })
    const updated = svc.updateReturnStatus(ret.id, ReturnStatus.Inspecting, tenantId, '新备注')
    expect(updated.remark).toBe('新备注')
  })
})

describe('ReturnRequestService — 查询辅助', () => {
  let svc: ReturnRequestService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new ReturnRequestService()
    svc.resetReturnStoresForTests()
  })

  it('listReturns 支持按类型筛选', () => {
    const items = svc.listReturns(tenantId, { type: ReturnType.Damage })
    items.forEach((r) => expect(r.type).toBe(ReturnType.Damage))
  })

  it('listReturns 支持按状态筛选', () => {
    const items = svc.listReturns(tenantId, { status: ReturnStatus.Pending })
    items.forEach((r) => expect(r.status).toBe(ReturnStatus.Pending))
  })

  it('listReturns 支持按客户名筛选', () => {
    const items = svc.listReturns(tenantId, { customerName: '李明' })
    items.forEach((r) => expect(r.customerName).toBe('李明'))
  })

  it('listReturns 支持搜索关键字', () => {
    const items = svc.listReturns(tenantId, { search: '三文鱼' })
    expect(items.length).toBeGreaterThan(0)
  })

  it('getReturnsByCustomer 按客户查询', () => {
    const items = svc.getReturnsByCustomer('赵强', tenantId)
    items.forEach((r) => expect(r.customerName).toBe('赵强'))
  })

  it('getReturnsByOrder 按订单查询', () => {
    const items = svc.getReturnsByOrder('PO-2026-0008', tenantId)
    items.forEach((r) => expect(r.orderNo).toBe('PO-2026-0008'))
  })

  it('getPendingReturns 只返回 Pending 状态', () => {
    const items = svc.getPendingReturns(tenantId)
    items.forEach((r) => expect(r.status).toBe(ReturnStatus.Pending))
  })
})
