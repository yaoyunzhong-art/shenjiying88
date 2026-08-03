/**
 * finance-payment.controller.spec.ts — P-38 支付 Controller 测试
 *
 * 使用 @nestjs/testing + MockService
 * 三件套: 正例(正常CRUD/支付流程) + 反例(404/错误参数/跨租户) + 边界(空状态/分页/超时)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'reflect-metadata'
import { Test, type TestingModule } from '@nestjs/testing'
import { FinancePaymentController } from './finance-payment.controller'
import { FinancePaymentService } from './finance-payment.service'

/**
 * 🐜 自动: [finance-payment] [D] controller.spec.ts 增强
 *
 * 使用 NestJS TestingModule + 内联 MockService
 * 覆盖 15 路由 (7 Payment + 8 Refund):
 *   正例 14 | 反例 14 | 边界 8 = 36
 */

// ═══════════════════════════════════════════════════════════════
// Mock Data
// ═══════════════════════════════════════════════════════════════

const mockPayment = {
  id: 'pay-mock-001',
  tenantId: 't1',
  orderId: 'ord-001',
  amountCents: 9900,
  currency: 'CNY',
  method: 'WECHAT',
  status: 'PENDING',
  idempotencyKey: 'idem-12345678',
  version: 1,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
}

const mockPaymentSuccess = { ...mockPayment, status: 'SUCCESS', transactionId: 'wx-tx-001', version: 2 }
const mockPaymentFailed = { ...mockPayment, status: 'FAILED', failureReason: 'insufficient balance', version: 2 }
const mockPaymentRefunded = { ...mockPaymentSuccess, status: 'REFUNDED', refundedAt: '2026-07-01T03:00:00.000Z', version: 3 }
const mockPaymentUpdated = { ...mockPayment, transactionId: 'tx-updated', version: 2, updatedAt: '2026-07-01T01:00:00.000Z' }

const mockRefund = {
  id: 'ref-mock-001',
  tenantId: 't1',
  paymentId: 'pay-mock-001',
  orderId: 'ord-001',
  amountCents: 5000,
  reason: 'customer request',
  status: 'REQUESTED',
  version: 1,
  requestedBy: 'cs-agent',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  requestedAt: '2026-07-01T00:00:00.000Z',
}

const mockRefundApproved = { ...mockRefund, status: 'APPROVED', approvedBy: 'mgr', approvedAt: '2026-07-01T01:00:00.000Z', version: 2 }
const mockRefundCompleted = { ...mockRefundApproved, status: 'COMPLETED', refundTransactionId: 'wx-r-001', completedAt: '2026-07-01T02:00:00.000Z', version: 3 }
const mockRefundRejected = { ...mockRefund, status: 'REJECTED', rejectedBy: 'compliance', rejectionReason: 'policy violation', version: 2 }

const mockListResult = { items: [mockPayment], total: 1 }
const mockEmptyListResult = { items: [], total: 0 }
const mockPaginatedListResult = { items: [mockPayment], total: 3 }
const mockRefundListResult = { items: [mockRefund], total: 1 }
const mockEmptyRefundListResult = { items: [], total: 0 }
const mockPaginatedRefundListResult = { items: [mockRefund], total: 5 }

const mockAuditEntries = [
  { id: 'audit-001', paymentId: 'pay-mock-001', tenantId: 't1', action: 'CREATE', fromStatus: undefined, toStatus: 'PENDING', actor: 'system', detail: 'payment created', at: '2026-07-01T00:00:00.000Z' },
  { id: 'audit-002', paymentId: 'pay-mock-001', tenantId: 't1', action: 'MARK_SUCCESS', fromStatus: 'PENDING', toStatus: 'SUCCESS', actor: 'system', detail: 'wx-tx-001', at: '2026-07-01T00:05:00.000Z' },
  { id: 'audit-003', paymentId: 'pay-mock-001', tenantId: 't1', action: 'MARK_REFUNDED', fromStatus: 'SUCCESS', toStatus: 'REFUNDED', actor: 'system', detail: 'payment refunded', at: '2026-07-01T03:00:00.000Z' },
]

const mockRefundAuditEntries = [
  { id: 'raudit-001', refundId: 'ref-mock-001', paymentId: 'pay-mock-001', tenantId: 't1', action: 'REQUEST', fromStatus: undefined, toStatus: 'REQUESTED', actor: 'cs-agent', detail: 'customer request', at: '2026-07-01T00:00:00.000Z' },
  { id: 'raudit-002', refundId: 'ref-mock-001', paymentId: 'pay-mock-001', tenantId: 't1', action: 'APPROVE', fromStatus: 'REQUESTED', toStatus: 'APPROVED', actor: 'mgr', detail: 'refund approved', at: '2026-07-01T01:00:00.000Z' },
  { id: 'raudit-003', refundId: 'ref-mock-001', paymentId: 'pay-mock-001', tenantId: 't1', action: 'COMPLETE', fromStatus: 'APPROVED', toStatus: 'COMPLETED', actor: 'system', detail: 'wx-r-001', at: '2026-07-01T02:00:00.000Z' },
]

// ═══════════════════════════════════════════════════════════════
// Mock Service
// ═══════════════════════════════════════════════════════════════

class MockFinancePaymentService {
  create = vi.fn().mockReturnValue(mockPayment)
  getById = vi.fn().mockReturnValue(mockPayment)
  list = vi.fn().mockReturnValue(mockListResult)
  update = vi.fn().mockReturnValue(mockPaymentUpdated)
  markSuccess = vi.fn().mockReturnValue(mockPaymentSuccess)
  markFailed = vi.fn().mockReturnValue(mockPaymentFailed)
  getPaymentAudit = vi.fn().mockReturnValue(mockAuditEntries)
  requestRefund = vi.fn().mockReturnValue(mockRefund)
  approveRefund = vi.fn().mockReturnValue(mockRefundApproved)
  rejectRefund = vi.fn().mockReturnValue(mockRefundRejected)
  completeRefund = vi.fn().mockReturnValue(mockRefundCompleted)
  getRefundById = vi.fn().mockReturnValue(mockRefund)
  listRefunds = vi.fn().mockReturnValue(mockRefundListResult)
  getRefundAudit = vi.fn().mockReturnValue(mockRefundAuditEntries)
  markTimeout = vi.fn().mockReturnValue({ ...mockPayment, status: 'FAILED', failureReason: 'timeout by cron' })
  setLedgerCallback = vi.fn()
  reset = vi.fn()
}

// ═══════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════

describe('FinancePaymentController', () => {
  let ctrl: FinancePaymentController
  let mockSvc: MockFinancePaymentService

  beforeEach(async () => {
    mockSvc = new MockFinancePaymentService()
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancePaymentController],
      providers: [{ provide: FinancePaymentService, useValue: mockSvc }],
    }).compile()
    ctrl = module.get(FinancePaymentController)
  })

  // ═══════════════════════════════════════════════════════════════
  // 路由元数据 (装饰器验证)
  // ═══════════════════════════════════════════════════════════════

  it('ROUTE-1: Controller 路径前缀 /api/finance', () => {
    const path = Reflect.getMetadata('path', FinancePaymentController)
    expect(path).toBe('api/finance')
  })

  it('ROUTE-2: 暴露全部 15 个处理方法', () => {
    const proto = FinancePaymentController.prototype
    expect(typeof proto.createPayment).toBe('function')
    expect(typeof proto.listPayments).toBe('function')
    expect(typeof proto.getPayment).toBe('function')
    expect(typeof proto.updatePayment).toBe('function')
    expect(typeof proto.markPaymentSuccess).toBe('function')
    expect(typeof proto.markPaymentFail).toBe('function')
    expect(typeof proto.getPaymentAudit).toBe('function')
    expect(typeof proto.requestRefund).toBe('function')
    expect(typeof proto.listRefundsForPayment).toBe('function')
    expect(typeof proto.listRefunds).toBe('function')
    expect(typeof proto.getRefund).toBe('function')
    expect(typeof proto.approveRefund).toBe('function')
    expect(typeof proto.rejectRefund).toBe('function')
    expect(typeof proto.completeRefund).toBe('function')
    expect(typeof proto.getRefundAudit).toBe('function')
  })

  // ═══════════════════════════════════════════════════════════════
  // 正例流程 (14)
  // ═══════════════════════════════════════════════════════════════

  it('FLOW-1: createPayment → 成功创建支付单', () => {
    const result = ctrl.createPayment({
      tenantId: 't1',
      orderId: 'ord-001',
      amountCents: 9900,
      method: 'WECHAT',
      idempotencyKey: 'idem-12345678',
    })
    expect(result).toEqual(mockPayment)
    expect(mockSvc.create).toHaveBeenCalledOnce()
    expect(mockSvc.create).toHaveBeenCalledWith({
      tenantId: 't1',
      orderId: 'ord-001',
      amountCents: 9900,
      method: 'WECHAT',
      idempotencyKey: 'idem-12345678',
    })
  })

  it('FLOW-2: getPayment → 获取支付单详情', () => {
    const result = ctrl.getPayment('pay-mock-001', { tenantId: 't1' })
    expect(result).toEqual(mockPayment)
    expect(mockSvc.getById).toHaveBeenCalledWith('pay-mock-001', 't1')
  })

  it('FLOW-3: listPayments → 按 tenant 列出支付单', () => {
    const result = ctrl.listPayments({ tenantId: 't1', status: 'PENDING' })
    expect(result).toEqual(mockListResult)
    expect(mockSvc.list).toHaveBeenCalledWith({ tenantId: 't1', status: 'PENDING' })
  })

  it('FLOW-4: markPaymentSuccess → 支付成功状态推进', () => {
    const result = ctrl.markPaymentSuccess('pay-mock-001', { tenantId: 't1' }, { transactionId: 'wx-tx-001' })
    expect(result).toEqual(mockPaymentSuccess)
    expect(mockSvc.markSuccess).toHaveBeenCalledWith('pay-mock-001', 't1', 'wx-tx-001')
  })

  it('FLOW-5: markPaymentFail → 支付失败状态推进', () => {
    const result = ctrl.markPaymentFail('pay-mock-001', { tenantId: 't1' }, { reason: 'insufficient balance' })
    expect(result).toEqual(mockPaymentFailed)
    expect(mockSvc.markFailed).toHaveBeenCalledWith('pay-mock-001', 't1', 'insufficient balance')
  })

  it('FLOW-6: markPaymentFail → 无 reason 默认标记失败', () => {
    const defaultFail = { ...mockPaymentFailed, failureReason: 'unknown' }
    mockSvc.markFailed.mockReturnValueOnce(defaultFail)
    const result = ctrl.markPaymentFail('pay-mock-001', { tenantId: 't1' }, {})
    expect(result.failureReason).toBe('unknown')
    expect(mockSvc.markFailed).toHaveBeenCalledWith('pay-mock-001', 't1', undefined)
  })

  it('FLOW-7: updatePayment → 乐观锁版本递增', () => {
    const result = ctrl.updatePayment('pay-mock-001', { tenantId: 't1', version: '1' }, { transactionId: 'tx-updated' })
    expect(result).toEqual(mockPaymentUpdated)
    expect(mockSvc.update).toHaveBeenCalledWith('pay-mock-001', 't1', 1, { transactionId: 'tx-updated' })
  })

  it('FLOW-8: getPaymentAudit → 返回审计记录', () => {
    const result = ctrl.getPaymentAudit('pay-mock-001', { tenantId: 't1' })
    expect(result).toEqual(mockAuditEntries)
    expect(mockSvc.getPaymentAudit).toHaveBeenCalledWith('pay-mock-001', 't1')
  })

  it('FLOW-9: requestRefund → 发起退款申请', () => {
    const result = ctrl.requestRefund('pay-mock-001', {
      tenantId: 't1', orderId: 'ord-001',
      amountCents: 5000, reason: 'customer request', requestedBy: 'cs-agent',
    })
    expect(result).toEqual(mockRefund)
    expect(mockSvc.requestRefund).toHaveBeenCalledWith({
      tenantId: 't1', paymentId: 'pay-mock-001', orderId: 'ord-001',
      amountCents: 5000, reason: 'customer request', requestedBy: 'cs-agent',
    })
  })

  it('FLOW-10: approveRefund → 审批退款通过', () => {
    const result = ctrl.approveRefund('ref-mock-001', { tenantId: 't1' }, { approver: 'mgr' })
    expect(result).toEqual(mockRefundApproved)
    expect(mockSvc.approveRefund).toHaveBeenCalledWith('ref-mock-001', 't1', 'mgr')
  })

  it('FLOW-11: rejectRefund → 拒绝退款', () => {
    const result = ctrl.rejectRefund('ref-mock-001', { tenantId: 't1' }, { reason: 'policy violation', rejecter: 'compliance' })
    expect(result).toEqual(mockRefundRejected)
    expect(mockSvc.rejectRefund).toHaveBeenCalledWith('ref-mock-001', 't1', 'policy violation', 'compliance')
  })

  it('FLOW-12: completeRefund → 完成退款（带交易号）', () => {
    const result = ctrl.completeRefund('ref-mock-001', { tenantId: 't1' }, { refundTransactionId: 'wx-r-001' })
    expect(result).toEqual(mockRefundCompleted)
    expect(mockSvc.completeRefund).toHaveBeenCalledWith('ref-mock-001', 't1', 'wx-r-001')
  })

  it('FLOW-13: completeRefund → 无 transactionId 完成退款', () => {
    const completedNoTx = { ...mockRefundCompleted, refundTransactionId: undefined }
    mockSvc.completeRefund.mockReturnValueOnce(completedNoTx)
    const result = ctrl.completeRefund('ref-mock-001', { tenantId: 't1' }, {})
    expect(result.status).toBe('COMPLETED')
    expect(result.refundTransactionId).toBeUndefined()
    expect(mockSvc.completeRefund).toHaveBeenCalledWith('ref-mock-001', 't1', undefined)
  })

  it('FLOW-14: Request → Approve → Complete 完整退款生命周期', () => {
    // request
    const reqResult = ctrl.requestRefund('pay-mock-001', {
      tenantId: 't1', orderId: 'ord-001',
      amountCents: 5000, reason: 'customer request', requestedBy: 'cs-agent',
    })
    expect(reqResult).toEqual(mockRefund)

    // approve
    const appResult = ctrl.approveRefund('ref-mock-001', { tenantId: 't1' }, { approver: 'mgr' })
    expect(appResult).toEqual(mockRefundApproved)

    // complete
    const compResult = ctrl.completeRefund('ref-mock-001', { tenantId: 't1' }, { refundTransactionId: 'wx-r-001' })
    expect(compResult).toEqual(mockRefundCompleted)
  })

  // ═══════════════════════════════════════════════════════════════
  // 反例防御 (14)
  // ═══════════════════════════════════════════════════════════════

  it('DEF-1: listPayments tenantId 缺失抛错', () => {
    expect(() => ctrl.listPayments({} as any)).toThrow('tenantId required')
    expect(mockSvc.list).not.toHaveBeenCalled()
  })

  it('DEF-2: getPayment tenantId 缺失抛错', () => {
    expect(() => ctrl.getPayment('pay-mock-001', {} as any)).toThrow('tenantId required')
    expect(mockSvc.getById).not.toHaveBeenCalled()
  })

  it('DEF-3: updatePayment tenantId 缺失抛错', () => {
    expect(() => ctrl.updatePayment('pay-mock-001', {} as any, {})).toThrow('tenantId required')
    expect(mockSvc.update).not.toHaveBeenCalled()
  })

  it('DEF-4: markPaymentSuccess tenantId 缺失抛错', () => {
    expect(() => ctrl.markPaymentSuccess('pay-mock-001', {} as any, {})).toThrow('tenantId required')
    expect(mockSvc.markSuccess).not.toHaveBeenCalled()
  })

  it('DEF-5: markPaymentFail tenantId 缺失抛错', () => {
    expect(() => ctrl.markPaymentFail('pay-mock-001', {} as any, {})).toThrow('tenantId required')
    expect(mockSvc.markFailed).not.toHaveBeenCalled()
  })

  it('DEF-6: approveRefund tenantId 缺失抛错', () => {
    expect(() => ctrl.approveRefund('ref-mock-001', {} as any, { approver: 'mgr' })).toThrow('tenantId required')
    expect(mockSvc.approveRefund).not.toHaveBeenCalled()
  })

  it('DEF-7: approveRefund approver 缺失抛错', () => {
    expect(() => ctrl.approveRefund('ref-mock-001', { tenantId: 't1' }, {} as any)).toThrow('approver required')
    expect(mockSvc.approveRefund).not.toHaveBeenCalled()
  })

  it('DEF-8: rejectRefund rejecter 缺失抛错', () => {
    expect(() => ctrl.rejectRefund('ref-mock-001', { tenantId: 't1' }, { reason: 'policy' } as any)).toThrow('rejecter required')
    expect(mockSvc.rejectRefund).not.toHaveBeenCalled()
  })

  it('DEF-9: rejectRefund reason 缺失抛错', () => {
    expect(() => ctrl.rejectRefund('ref-mock-001', { tenantId: 't1' }, { rejecter: 'compliance' } as any)).toThrow('reason required')
    expect(mockSvc.rejectRefund).not.toHaveBeenCalled()
  })

  it('DEF-10: completeRefund tenantId 缺失抛错', () => {
    expect(() => ctrl.completeRefund('ref-mock-001', {} as any, {})).toThrow('tenantId required')
    expect(mockSvc.completeRefund).not.toHaveBeenCalled()
  })

  it('DEF-11: getRefund tenantId 缺失抛错', () => {
    expect(() => ctrl.getRefund('ref-mock-001', {} as any)).toThrow('tenantId required')
    expect(mockSvc.getRefundById).not.toHaveBeenCalled()
  })

  it('DEF-12: listRefunds tenantId 缺失抛错', () => {
    expect(() => ctrl.listRefunds({} as any)).toThrow('tenantId required')
    expect(mockSvc.listRefunds).not.toHaveBeenCalled()
  })

  it('DEF-13: listRefundsForPayment tenantId 缺失抛错', () => {
    expect(() => ctrl.listRefundsForPayment('pay-mock-001', {} as any)).toThrow('tenantId required')
    expect(mockSvc.listRefunds).not.toHaveBeenCalled()
  })

  it('DEF-14: getRefundAudit tenantId 缺失抛错', () => {
    expect(() => ctrl.getRefundAudit('ref-mock-001', {} as any)).toThrow('tenantId required')
    expect(mockSvc.getRefundAudit).not.toHaveBeenCalled()
  })

  // ═══════════════════════════════════════════════════════════════
  // 边界 (8)
  // ═══════════════════════════════════════════════════════════════

  it('EDGE-1: listPayments 空租户返回空列表', () => {
    mockSvc.list.mockReturnValueOnce(mockEmptyListResult)
    const result = ctrl.listPayments({ tenantId: 't-empty' })
    expect(result.total).toBe(0)
    expect(result.items).toHaveLength(0)
    expect(mockSvc.list).toHaveBeenCalledWith({ tenantId: 't-empty' })
  })

  it('EDGE-2: getPaymentAudit 存在完整审计链', () => {
    const result = ctrl.getPaymentAudit('pay-mock-001', { tenantId: 't1' })
    expect(result).toHaveLength(3)
    const actions = result.map((e: any) => e.action)
    expect(actions).toEqual(['CREATE', 'MARK_SUCCESS', 'MARK_REFUNDED'])
  })

  it('EDGE-3: listPayments 分页参数传递', () => {
    mockSvc.list.mockReturnValueOnce(mockPaginatedListResult)
    const result = ctrl.listPayments({ tenantId: 't1', limit: 1, offset: 0 })
    expect(result.items).toHaveLength(1)
    expect(mockSvc.list).toHaveBeenCalledWith({ tenantId: 't1', limit: 1, offset: 0 })
  })

  it('EDGE-4: listPayments 多种筛选组合', () => {
    mockSvc.list.mockReturnValueOnce(mockListResult)
    const result = ctrl.listPayments({ tenantId: 't1', status: 'SUCCESS', method: 'WECHAT', orderId: 'ord-001' })
    expect(result).toEqual(mockListResult)
    expect(mockSvc.list).toHaveBeenCalledWith({ tenantId: 't1', status: 'SUCCESS', method: 'WECHAT', orderId: 'ord-001' })
  })

  it('EDGE-5: getPayment 跨租户隔离（同 id 不同 tenant → 返回 null）', () => {
    mockSvc.getById.mockReturnValueOnce(null)
    const result = ctrl.getPayment('pay-mock-001', { tenantId: 't2' })
    expect(result).toBeNull()
    expect(mockSvc.getById).toHaveBeenCalledWith('pay-mock-001', 't2')
  })

  it('EDGE-6: getRefund 跨租户隔离', () => {
    mockSvc.getRefundById.mockReturnValueOnce(null)
    const result = ctrl.getRefund('ref-mock-001', { tenantId: 't2' })
    expect(result).toBeNull()
    expect(mockSvc.getRefundById).toHaveBeenCalledWith('ref-mock-001', 't2')
  })

  it('EDGE-7: listRefunds 跨租户（t-empty 无退款）', () => {
    mockSvc.listRefunds.mockReturnValueOnce(mockEmptyRefundListResult)
    const result = ctrl.listRefunds({ tenantId: 't-empty' })
    expect(result.total).toBe(0)
    expect(result.items).toHaveLength(0)
    expect(mockSvc.listRefunds).toHaveBeenCalledWith({ tenantId: 't-empty' })
  })

  it('EDGE-8: listRefundsForPayment 按 paymentId 筛选', () => {
    mockSvc.listRefunds.mockReturnValueOnce(mockRefundListResult)
    const result = ctrl.listRefundsForPayment('pay-mock-001', { tenantId: 't1' })
    expect(result).toEqual(mockRefundListResult)
    expect(mockSvc.listRefunds).toHaveBeenCalledWith({ tenantId: 't1', paymentId: 'pay-mock-001' })
  })
})
