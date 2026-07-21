/**
 * salary.service.test.ts - 薪资管理服务单元测试
 *
 * 覆盖:
 * - calculatePayroll: 基本薪资计算
 * - 审批流程: submit → approve/reject → pay
 * - 查询与统计: list, get, summary
 * - 删除与取消
 */

import { describe, it, expect, beforeAll } from 'vitest'
import assert from 'node:assert/strict'
import { SalaryService } from './salary.service'
import type { SalaryCalculationRequest, SalaryStatus } from './salary.entity'

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
  let service: SalaryService

  beforeAll(() => {
    service = new SalaryService()
  })

  // ─── calculatePayroll ─────────────────────────────────

  describe('calculatePayroll', () => {
    it('计算月薪制薪资, 收入项和扣款项正确', () => {
      const req = makeRequest()
      const result = service.calculatePayroll(req)

      assert.equal(result.employeeName, '测试员工')
      assert.equal(result.storeId, 'store-001')
      assert.equal(result.mode, 'monthly')
      assert.equal(result.status, 'draft') // 初始草稿
      assert.match(result.code, /^SAL\d{6}$/)

      // 总收入: 10000 + 2000 + 500 + 1000 = 13500
      assert.equal(result.grossPay, 13500)
      // 总扣款: 1200 + 840 + 500 = 2540
      assert.equal(result.totalDeductions, 2540)
      // 净收入: 13500 - 2540 = 10960
      assert.equal(result.netPay, 10960)
    })

    it('提成制薪资计算', () => {
      const req = makeRequest({
        mode: 'commission',
        baseSalary: 0,
        bonus: 0,
        overtimePay: 0,
        commission: 8500,
        allowance: 0,
        socialSecurity: 600,
        housingFund: 0,
        tax: 400,
      })
      const result = service.calculatePayroll(req)

      assert.equal(result.mode, 'commission')
      assert.equal(result.grossPay, 8500)
      assert.equal(result.totalDeductions, 1000) // 600 + 400
      assert.equal(result.netPay, 7500)
    })

    it('无任何扣款时 netPay = grossPay', () => {
      const req = makeRequest({
        baseSalary: 5000,
        bonus: 0,
        overtimePay: 0,
        allowance: 0,
        socialSecurity: 0,
        housingFund: 0,
        tax: 0,
      })
      const result = service.calculatePayroll(req)
      assert.equal(result.grossPay, 5000)
      assert.equal(result.totalDeductions, 0)
      assert.equal(result.netPay, 5000)
    })

    it('创建后 status 为 draft, 可查到', () => {
      const result = service.calculatePayroll(makeRequest())
      const found = service.getPayroll(result.id)
      assert.ok(found)
      assert.equal(found!.status, 'draft')
    })
  })

  // ─── 审批流程 ──────────────────────────────────────

  describe('审批流程', () => {
    it('submitPayroll: draft → pending', () => {
      const payroll = service.calculatePayroll(makeRequest())
      const submitted = service.submitPayroll(payroll.id)

      assert.equal(submitted.status, 'pending')
      assert.ok(submitted.updatedAt >= payroll.createdAt)
    })

    it('approvePayroll: pending → approved', () => {
      const payroll = service.calculatePayroll(makeRequest())
      service.submitPayroll(payroll.id)
      const approved = service.approvePayroll(payroll.id, 'approve', 'admin-001', '管理员', '同意发放')

      assert.equal(approved.status, 'approved')
      assert.equal(approved.approverId, 'admin-001')
      assert.ok(approved.approvalAt)
    })

    it('approvePayroll: approve → reject 正确变更', () => {
      const payroll = service.calculatePayroll(makeRequest())
      service.submitPayroll(payroll.id)
      const rejected = service.approvePayroll(payroll.id, 'reject', 'admin-002', '管理员2', '不通过')

      assert.equal(rejected.status, 'rejected')
    })

    it('payPayroll: approved → paid', () => {
      const payroll = service.calculatePayroll(makeRequest())
      service.submitPayroll(payroll.id)
      service.approvePayroll(payroll.id, 'approve', 'admin-001', '管理员', '同意')
      const paid = service.payPayroll(payroll.id, 'bank', '6217****8888', 'finance-001', '财务小王')

      assert.equal(paid.status, 'paid')
      assert.equal(paid.paymentMethod, 'bank')
      assert.equal(paid.paymentAccount, '6217****8888')
      assert.ok(paid.paidAt)
    })

    it('submitPayroll 非 draft 状态抛异常', () => {
      const payroll = service.calculatePayroll(makeRequest())
      service.submitPayroll(payroll.id)

      assert.throws(
        () => service.submitPayroll(payroll.id),
        /Cannot submit/,
      )
    })

    it('approvePayroll 非 pending 状态抛异常', () => {
      assert.throws(
        () => service.approvePayroll('pay-seed-001', 'approve', 'admin', 'admin'),
        /Cannot approve/,
      )
    })

    it('payPayroll 非 approved 状态抛异常', () => {
      const payroll = service.calculatePayroll(makeRequest())

      assert.throws(
        () => service.payPayroll(payroll.id, 'bank', 'acct', 'op', 'op'),
        /Cannot pay/,
      )
    })
  })

  // ─── 取消与删除 ─────────────────────────────────────

  describe('取消与删除', () => {
    it('取消 draft 状态的薪资单', () => {
      const payroll = service.calculatePayroll(makeRequest())
      const cancelled = service.cancelPayroll(payroll.id, 'admin-001', '管理员', '测试取消')
      assert.equal(cancelled.status, 'cancelled')
    })

    it('已支付的薪资单不可取消', () => {
      assert.throws(
        () => service.cancelPayroll('pay-seed-001', 'admin', 'admin'),
        /Cannot cancel a paid/,
      )
    })

    it('删除 draft 状态的薪资单', () => {
      const payroll = service.calculatePayroll(makeRequest())
      const deleted = service.deletePayroll(payroll.id)
      assert.equal(deleted, true)
      assert.equal(service.getPayroll(payroll.id), null)
    })

    it('非 draft 状态的薪资单不可删除', () => {
      assert.throws(
        () => service.deletePayroll('pay-seed-002'),
        /Cannot delete/,
      )
    })
  })

  // ─── list 与统计 ──────────────────────────────────

  describe('listPayrolls 与 getSalarySummary', () => {
    it('listPayrolls 按状态筛选', () => {
      const paid = service.listPayrolls({ status: 'paid' })
      assert.ok(paid.length > 0)
      paid.forEach((p) => assert.equal(p.status, 'paid'))
    })

    it('listPayrolls 按门店筛选', () => {
      const store2 = service.listPayrolls({ storeId: 'store-002' })
      assert.ok(store2.length > 0)
      store2.forEach((p) => assert.equal(p.storeId, 'store-002'))
    })

    it('getSalarySummary 统计聚合', () => {
      const summary = service.getSalarySummary('2026-07', '2026-07-01', '2026-07-31')
      assert.ok(summary.totalGross > 0)
      assert.ok(summary.totalEmployees > 0)
      assert.ok(summary.totalPaid > 0)
      assert.ok(summary.byStore['store-001'] !== undefined)
      assert.ok(summary.byMode['monthly'] !== undefined)
    })

    it('getPayrollDetail 包含审批历史', () => {
      const detail = service.getPayrollDetail('pay-seed-001')
      assert.ok(detail)
      assert.equal(detail!.employeeName, '张三')
      assert.ok(detail!.approvalHistory.length >= 3)
    })

    it('getApprovalHistory 返回审批记录', () => {
      const history = service.getApprovalHistory('pay-seed-001')
      assert.ok(history.length > 0)
      assert.equal(history[0]!.payrollId, 'pay-seed-001')
    })

    it('不存在的薪资单返回 null', () => {
      assert.equal(service.getPayroll('non-existent'), null)
    })
  })
})
