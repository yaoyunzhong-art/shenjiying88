/**
 * logistics.procurement.test.ts — P-30 耗材采购模块测试
 *
 * 状态机: draft → pending_approval → approved/rejected → ordered → received
 * 对接P-37: 审批通过时记录 approvalTicket（P-37 审批工单号）
 *
 * 覆盖:
 *   正例 × 5: 创建/提交/审批/下单/收货 完整流程
 *   反例 × 4: 状态转换错误/参数缺失
 *   边界 × 2: 不存在/跨租户
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LogisticsService } from './logistics.service'

describe('LogisticsService — 耗材采购 (Procurement)', () => {
  let service: LogisticsService

  beforeEach(() => {
    service = new LogisticsService()
    service.resetStoreForTests()
  })

  const T = { tenantId: 't-001', storeId: 'store-a' }

  // ── 正例 (5) ───────────────────────────────────────

  it('创建采购申请 → 状态为draft', () => {
    const req = service.createProcurementRequest({
      ...T,
      requesterId: 'u-1',
      requesterName: '刘采购',
      department: '运营部',
      purpose: '补充清洁耗材',
      vendorName: '清洁用品供应商',
      notes: '月度补充',
    })
    expect(req.id).toMatch(/^proc-/)
    expect(req.status).toBe('draft')
    expect(req.purpose).toBe('补充清洁耗材')
    expect(req.vendorName).toBe('清洁用品供应商')
  })

  it('提交采购申请 → 状态转为 pending_approval', () => {
    const req = service.createProcurementRequest({
      ...T, requesterId: 'u-1', requesterName: '刘', purpose: '耗材补充',
    })
    const submitted = service.submitProcurementRequest(req.id, T.tenantId)
    expect(submitted.status).toBe('pending_approval')
  })

  it('审批通过采购申请 → 记录P-37审批工单号', () => {
    const req = service.createProcurementRequest({
      ...T, requesterId: 'u-1', requesterName: '刘', purpose: '耗材补充',
    })
    service.submitProcurementRequest(req.id, T.tenantId)

    const approved = service.approveProcurementRequest(req.id, T.tenantId, {
      approverId: 'mgr-1',
      approverName: '店长',
      note: '同意采购',
      approvalTicket: 'APR-MATERIAL-001', // P-37 审批工单号
    })
    expect(approved.status).toBe('approved')
    expect(approved.approval?.approvalTicket).toBe('APR-MATERIAL-001')
    expect(approved.approval?.approverName).toBe('店长')
  })

  it('采购完整闭环: draft → 提交 → 审批 → 下单 → 收货', () => {
    const req = service.createProcurementRequest({
      ...T, requesterId: 'u-1', requesterName: '刘', purpose: '月度补给',
    })
    expect(req.status).toBe('draft')

    const s1 = service.submitProcurementRequest(req.id, T.tenantId)
    expect(s1.status).toBe('pending_approval')

    const s2 = service.approveProcurementRequest(req.id, T.tenantId, {
      approverId: 'mgr', approverName: '店长', note: '同意',
    })
    expect(s2.status).toBe('approved')

    const s3 = service.orderProcurementRequest(req.id, T.tenantId, {
      orderNumber: 'PO-2026-001',
      vendorName: '清洁用品供应商',
      operatorId: 'ops-1',
      operatorName: '运行专员',
    })
    expect(s3.status).toBe('ordered')
    expect(s3.orderRecord?.orderNumber).toBe('PO-2026-001')

    const s4 = service.receiveProcurementRequest(req.id, T.tenantId, {
      receivedBy: 'u-1',
      receivedByName: '刘采购',
      note: '已入库',
    })
    expect(s4.status).toBe('received')
    expect(s4.receiveRecord?.receivedByName).toBe('刘采购')
  })

  it('拒绝采购申请 → 状态转为 rejected', () => {
    const req = service.createProcurementRequest({
      ...T, requesterId: 'u-1', requesterName: '刘', purpose: '补充耗材',
    })
    service.submitProcurementRequest(req.id, T.tenantId)

    const rejected = service.rejectProcurementRequest(req.id, T.tenantId, {
      rejecterId: 'mgr-1',
      rejecterName: '店长',
      reason: '预算不足，下月再采购',
    })
    expect(rejected.status).toBe('rejected')
    expect(rejected.notes).toBe('预算不足，下月再采购')
  })

  // ── 反例 (4) ───────────────────────────────────────

  it('draft 状态下不能直接审批', () => {
    const req = service.createProcurementRequest({
      ...T, requesterId: 'u-1', requesterName: '刘', purpose: '测试',
    })
    expect(() =>
      service.approveProcurementRequest(req.id, T.tenantId, {
        approverId: 'mgr', approverName: '店长', note: '同意',
      })
    ).toThrow('cannot be approved from status draft')
  })

  it('pending_approval 状态下不能直接下单', () => {
    const req = service.createProcurementRequest({
      ...T, requesterId: 'u-1', requesterName: '刘', purpose: '测试',
    })
    service.submitProcurementRequest(req.id, T.tenantId)
    expect(() =>
      service.orderProcurementRequest(req.id, T.tenantId, {
        orderNumber: 'PO-001', vendorName: '供应商', operatorId: 'u-1', operatorName: '运行',
      })
    ).toThrow('cannot be ordered from status pending_approval')
  })

  it('已批准的采购不能再次批准', () => {
    const req = service.createProcurementRequest({
      ...T, requesterId: 'u-1', requesterName: '刘', purpose: '测试',
    })
    service.submitProcurementRequest(req.id, T.tenantId)
    service.approveProcurementRequest(req.id, T.tenantId, {
      approverId: 'mgr', approverName: '店长', note: '同意',
    })
    expect(() =>
      service.approveProcurementRequest(req.id, T.tenantId, {
        approverId: 'mgr', approverName: '店长', note: '再同意',
      })
    ).toThrow('cannot be approved from status approved')
  })

  it('创建采购申请缺 purpose 应报错', () => {
    expect(() =>
      service.createProcurementRequest({
        ...T, requesterId: 'u-1', requesterName: '刘', purpose: '   ',
      })
    ).toThrow('purpose')
  })

  // ── 边界 (2) ───────────────────────────────────────

  it('getProcurementRequest 不存在的 id 返回 undefined', () => {
    const result = service.getProcurementRequest('nonexistent', T.tenantId)
    expect(result).toBeUndefined()
  })

  it('跨租户隔离 — 不能操作其他租户的采购申请', () => {
    const req = service.createProcurementRequest({
      tenantId: 'other', requesterId: 'u-1', requesterName: '刘', purpose: '测试',
    })
    expect(service.getProcurementRequest(req.id, T.tenantId)).toBeUndefined()
  })
})
