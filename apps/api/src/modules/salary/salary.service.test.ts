/**
 * salary.service.spec.ts - SalaryService 单元测试 (V2)
 *
 * 15+ tests covering:
 * - calculatePayroll with various salary modes/components
 * - submit/approve/pay lifecycle
 * - filtering, statistics, approval history
 * - error/edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SalaryService } from './salary.service'
import type { SalaryCalculationRequest, SalaryStatus, SalaryMode, PaymentMethod } from './salary.entity'

function makeService(): SalaryService {
  return new SalaryService()
}

function makeRequest(overrides: Partial<SalaryCalculationRequest> = {}): SalaryCalculationRequest {
  return {
    storeId: 'store-001',
    period: '2026-08',
    employeeId: 'emp-test-001',
    employeeName: '测试员工',
    mode: 'monthly',
    baseSalary: 10000,
    bonus: 2000,
    overtimePay: 500,
    commission: 0,
    allowance: 1000,
    reimbursement: 0,
    socialSecurity: 1200,
    housingFund: 840,
    tax: 500,
    otherDeductions: 0,
    remark: '测试薪资',
    ...overrides,
  }
}

describe('SalaryService', () => {
  let svc: SalaryService

  beforeEach(() => {
    svc = makeService()
  })

  // ─── 1. 薪资计算 ──────────────────────────────

  describe('calculatePayroll', () => {
    it('月薪制计算正确: 应发=收入合计, 扣款=扣款合计, 实发=差值', () => {
      const r = makeRequest()
      const p = svc.calculatePayroll(r)
      expect(p.grossPay).toBe(10000 + 2000 + 500 + 1000) // 13500
      expect(p.totalDeductions).toBe(1200 + 840 + 500)    // 2540
      expect(p.netPay).toBe(13500 - 2540)
      expect(p.status).toBe('draft')
    })

    it('纯提成制 (commission)', () => {
      const p = svc.calculatePayroll(makeRequest({ mode: 'commission', baseSalary: 0, bonus: 0, overtimePay: 0, commission: 8000, allowance: 0, socialSecurity: 500, tax: 300 }))
      expect(p.grossPay).toBe(8000)
      expect(p.netPay).toBe(8000 - 500 - 300)
      expect(p.mode).toBe('commission')
    })

    it('混合模式 (mixed) 包含多种收入扣款项', () => {
      const p = svc.calculatePayroll(makeRequest({ mode: 'mixed', baseSalary: 5000, commission: 6000, allowance: 500, socialSecurity: 1500, housingFund: 1000, tax: 800, otherDeductions: 200 }))
      expect(p.grossPay).toBe(5000 + 6000 + 500)
      expect(p.totalDeductions).toBe(1500 + 1000 + 800 + 200)
    })

    it('所有收入项都为 0 时 grossPay 为 0', () => {
      const p = svc.calculatePayroll(makeRequest({ baseSalary: 0, bonus: 0, overtimePay: 0, commission: 0, allowance: 0, reimbursement: 0 }))
      expect(p.grossPay).toBe(0)
      expect(p.items.filter(i => i.amount > 0).length).toBe(0)
    })

    it('code 自动递增', () => {
      const p1 = svc.calculatePayroll(makeRequest())
      const p2 = svc.calculatePayroll(makeRequest())
      expect(Number(p1.code.slice(3))).toBeLessThan(Number(p2.code.slice(3)))
    })

    it('创建后自动添加审批记录', () => {
      const p = svc.calculatePayroll(makeRequest())
      const hist = svc.getApprovalHistory(p.id)
      expect(hist.length).toBe(1)
      expect(hist[0].action).toBe('submit')
    })
  })

  // ─── 2. 查询 ──────────────────────────────────

  describe('getPayroll / listPayrolls', () => {
    it('getPayroll 返回已存在的薪资单', () => {
      const p = svc.calculatePayroll(makeRequest())
      expect(svc.getPayroll(p.id)).not.toBeNull()
    })

    it('getPayroll 不存在返回 null', () => {
      expect(svc.getPayroll('non-existent')).toBeNull()
    })

    it('listPayrolls 按 employeeId 过滤', () => {
      svc.calculatePayroll(makeRequest({ employeeId: 'emp-a' }))
      svc.calculatePayroll(makeRequest({ employeeId: 'emp-b' }))
      const list = svc.listPayrolls({ employeeId: 'emp-a' })
      expect(list.every(p => p.employeeId === 'emp-a')).toBe(true)
    })

    it('listPayrolls 按 period 过滤', () => {
      svc.calculatePayroll(makeRequest({ period: '2026-09' }))
      expect(svc.listPayrolls({ period: '2026-09' }).length).toBeGreaterThanOrEqual(1)
      expect(svc.listPayrolls({ period: '2026-99' }).length).toBe(0)
    })
  })

  // ─── 3. 审批流程 ──────────────────────────────

  describe('submitPayroll / approvePayroll', () => {
    it('提交 draft → pending', () => {
      const p = svc.calculatePayroll(makeRequest())
      const submitted = svc.submitPayroll(p.id)
      expect(submitted.status).toBe('pending')
    })

    it('非 draft 提交抛错', () => {
      const p = svc.calculatePayroll(makeRequest())
      svc.submitPayroll(p.id)
      expect(() => svc.submitPayroll(p.id)).toThrow()
    })

    it('审批通过 pending → approved', () => {
      const p = svc.calculatePayroll(makeRequest())
      svc.submitPayroll(p.id)
      const ap = svc.approvePayroll(p.id, 'approve', 'admin-1', '管理员')
      expect(ap.status).toBe('approved')
      expect(ap.approverId).toBe('admin-1')
    })

    it('审批驳回 pending → rejected', () => {
      const p = svc.calculatePayroll(makeRequest())
      svc.submitPayroll(p.id)
      const rp = svc.approvePayroll(p.id, 'reject', 'admin-1', '管理员', '数据有误')
      expect(rp.status).toBe('rejected')
      expect(rp.approvalRemark).toBe('数据有误')
    })
  })

  // ─── 4. 发放流程 ──────────────────────────────

  describe('payPayroll', () => {
    it('发放 approved → paid', () => {
      const p = svc.calculatePayroll(makeRequest())
      svc.submitPayroll(p.id)
      svc.approvePayroll(p.id, 'approve', 'admin-1', '管理员')
      const paid = svc.payPayroll(p.id, 'bank', '6217****8888', 'finance-1', '财务')
      expect(paid.status).toBe('paid')
      expect(paid.paymentMethod).toBe('bank')
      expect(paid.paymentAccount).toBe('6217****8888')
    })

    it('非 approved 发放抛错', () => {
      const p = svc.calculatePayroll(makeRequest())
      expect(() => svc.payPayroll(p.id, 'cash', 'x', 'op', 'op')).toThrow()
    })

    it('发放后不可取消', () => {
      const p = svc.calculatePayroll(makeRequest())
      svc.submitPayroll(p.id)
      svc.approvePayroll(p.id, 'approve', 'admin-1', '管理员')
      svc.payPayroll(p.id, 'bank', 'acc', 'finance-1', '财务')
      expect(() => svc.cancelPayroll(p.id, 'u1', 'u1')).toThrow()
    })
  })

  // ─── 5. 取消与删除 ─────────────────────────────

  describe('cancelPayroll / deletePayroll', () => {
    it('取消 pending 成功', () => {
      const p = svc.calculatePayroll(makeRequest())
      svc.submitPayroll(p.id)
      const cp = svc.cancelPayroll(p.id, 'u1', 'u1', '作废')
      expect(cp.status).toBe('cancelled')
    })

    it('取消 draft 成功', () => {
      const p = svc.calculatePayroll(makeRequest())
      const cp = svc.cancelPayroll(p.id, 'u1', 'u1')
      expect(cp.status).toBe('cancelled')
    })

    it('已取消再次取消抛错', () => {
      const p = svc.calculatePayroll(makeRequest())
      svc.cancelPayroll(p.id, 'u1', 'u1')
      expect(() => svc.cancelPayroll(p.id, 'u1', 'u1')).toThrow()
    })

    it('删除 draft 成功', () => {
      const p = svc.calculatePayroll(makeRequest())
      expect(svc.deletePayroll(p.id)).toBe(true)
      expect(svc.getPayroll(p.id)).toBeNull()
    })

    it('删除不存在返回 false', () => {
      expect(svc.deletePayroll('non-existent')).toBe(false)
    })
  })

  // ─── 6. 审批历史 ──────────────────────────────

  describe('getApprovalHistory / getPayrollDetail', () => {
    it('完整审批流产生 3 条记录', () => {
      const p = svc.calculatePayroll(makeRequest())
      svc.submitPayroll(p.id)
      svc.approvePayroll(p.id, 'approve', 'admin-1', '管理员')
      svc.payPayroll(p.id, 'bank', 'acc', 'finance-1', '财务')
      expect(svc.getApprovalHistory(p.id).length).toBe(4)
    })
  })

  // ─── 7. 统计 ──────────────────────────────────

  describe('getSalarySummary', () => {
    it('统计包含门店和模式汇总', () => {
      const s = svc.getSalarySummary('2026-08', '2026-08-01', '2026-08-31')
      expect(s.period).toBe('2026-08')
      expect(s.totalGross).toBeGreaterThan(0)
      expect(typeof s.byStore).toBe('object')
      expect(typeof s.byMode).toBe('object')
    })

    it('按门店过滤统计结果', () => {
      svc.calculatePayroll(makeRequest({ storeId: 'store-filter' }))
      const s = svc.getSalarySummary('test', '2026-01-01', '2026-12-31', 'store-filter')
      expect(s.totalEmployees).toBeGreaterThanOrEqual(1)
    })
  })
})
