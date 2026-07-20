/**
 * 薪资/薪酬管理 - Service (V23)
 *
 * 核心能力：
 * - 薪资计算与发放 CRUD
 * - 审批流程 (draft → submit → approve → pay)
 * - 薪资统计聚合
 * - 审批历史记录
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import type {
  PayrollRecord,
  SalarySummary,
  SalaryStatus,
  SalaryItem,
  SalaryMode,
  SalaryLineItem,
  PayrollDetail,
  SalaryApprovalRecord,
  SalaryCalculationRequest,
  PaymentMethod,
} from './salary.entity'

@Injectable()
export class SalaryService {
  private readonly payrolls = new Map<string, PayrollRecord>()
  private readonly approvalRecords = new Map<string, SalaryApprovalRecord[]>()
  private nextCode = 1001

  constructor() {
    this.seed()
  }

  // ============ 1. 薪资计算与 CRUD ============

  /**
   * 计算并创建薪资（草稿状态）
   */
  calculatePayroll(input: SalaryCalculationRequest): PayrollRecord {
    const items: SalaryLineItem[] = []
    let grossPay = 0
    let totalDeductions = 0

    // ── 收入项 ──
    if (input.baseSalary) {
      items.push({ item: 'base', label: '基本工资', amount: input.baseSalary })
      grossPay += input.baseSalary
    }
    if (input.bonus) {
      items.push({ item: 'bonus', label: '绩效奖金', amount: input.bonus })
      grossPay += input.bonus
    }
    if (input.overtimePay) {
      items.push({ item: 'overtime', label: '加班费', amount: input.overtimePay })
      grossPay += input.overtimePay
    }
    if (input.commission) {
      items.push({ item: 'commission', label: '提成', amount: input.commission })
      grossPay += input.commission
    }
    if (input.allowance) {
      items.push({ item: 'allowance', label: '津贴补助', amount: input.allowance })
      grossPay += input.allowance
    }
    if (input.reimbursement) {
      items.push({ item: 'reimbursement', label: '报销补发', amount: input.reimbursement })
      grossPay += input.reimbursement
    }

    // ── 扣款项 ──
    if (input.socialSecurity) {
      items.push({ item: 'social_security', label: '社保扣款', amount: -input.socialSecurity })
      totalDeductions += input.socialSecurity
    }
    if (input.housingFund) {
      items.push({ item: 'housing_fund', label: '公积金扣款', amount: -input.housingFund })
      totalDeductions += input.housingFund
    }
    if (input.tax) {
      items.push({ item: 'tax', label: '个税扣款', amount: -input.tax })
      totalDeductions += input.tax
    }
    if (input.otherDeductions) {
      items.push({ item: 'deduction', label: '其他扣款', amount: -input.otherDeductions })
      totalDeductions += input.otherDeductions
    }

    const netPay = grossPay - totalDeductions

    const id = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const code = `SAL${String(this.nextCode++).padStart(6, '0')}`
    const now = new Date().toISOString()

    const payroll: PayrollRecord = {
      id,
      code,
      storeId: input.storeId,
      period: input.period,
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      mode: input.mode,
      grossPay,
      totalDeductions,
      netPay,
      items,
      status: 'draft',
      remark: input.remark,
      createdAt: now,
      updatedAt: now,
    }

    this.payrolls.set(id, payroll)
    this.addApprovalRecord(id, {
      action: 'submit',
      operatorId: input.employeeId,
      operatorName: input.employeeName,
      remark: '创建薪资单',
    })
    return payroll
  }

  /**
   * 提交审批（draft → pending）
   */
  submitPayroll(id: string): PayrollRecord {
    const payroll = this.payrolls.get(id)
    if (!payroll) throw new NotFoundException(`Payroll ${id} not found`)
    if (payroll.status !== 'draft') {
      throw new BadRequestException(`Cannot submit payroll in status ${payroll.status}`)
    }
    payroll.status = 'pending'
    payroll.updatedAt = new Date().toISOString()
    this.payrolls.set(id, payroll)
    this.addApprovalRecord(id, {
      action: 'submit',
      operatorId: payroll.employeeId,
      operatorName: payroll.employeeName,
      remark: '提交审批',
    })
    return payroll
  }

  getPayroll(id: string): PayrollRecord | null {
    return this.payrolls.get(id) ?? null
  }

  listPayrolls(filter?: {
    status?: SalaryStatus
    storeId?: string
    employeeId?: string
    period?: string
    from?: string
    to?: string
  }): PayrollRecord[] {
    let result = Array.from(this.payrolls.values())
    if (filter) {
      if (filter.status) result = result.filter((p) => p.status === filter.status)
      if (filter.storeId) result = result.filter((p) => p.storeId === filter.storeId)
      if (filter.employeeId) result = result.filter((p) => p.employeeId === filter.employeeId)
      if (filter.period) result = result.filter((p) => p.period === filter.period)
      if (filter.from) result = result.filter((p) => p.createdAt >= filter.from!)
      if (filter.to) result = result.filter((p) => p.createdAt <= filter.to!)
    }
    return result
  }

  /**
   * 删除薪资单（仅 draft 状态可删除）
   */
  deletePayroll(id: string): boolean {
    const payroll = this.payrolls.get(id)
    if (!payroll) return false
    if (payroll.status !== 'draft') {
      throw new BadRequestException(`Cannot delete payroll in status ${payroll.status}`)
    }
    this.payrolls.delete(id)
    this.approvalRecords.delete(id)
    return true
  }

  // ============ 2. 审批流程 ============

  /**
   * 审批操作（approve / reject）
   */
  approvePayroll(
    id: string,
    action: 'approve' | 'reject',
    approverId: string,
    approverName: string,
    remark?: string,
  ): PayrollRecord {
    const payroll = this.payrolls.get(id)
    if (!payroll) throw new NotFoundException(`Payroll ${id} not found`)
    if (payroll.status !== 'pending') {
      throw new BadRequestException(`Cannot approve payroll in status ${payroll.status}`)
    }

    const newStatus: SalaryStatus = action === 'approve' ? 'approved' : 'rejected'
    payroll.status = newStatus
    payroll.approverId = approverId
    payroll.approvalRemark = remark
    payroll.approvalAt = new Date().toISOString()
    payroll.updatedAt = new Date().toISOString()
    this.payrolls.set(id, payroll)

    this.addApprovalRecord(id, {
      action,
      operatorId: approverId,
      operatorName: approverName,
      remark,
    })
    return payroll
  }

  /**
   * 执行发放（approved → paid）
   */
  payPayroll(
    id: string,
    method: PaymentMethod,
    account: string,
    operatorId: string,
    operatorName: string,
  ): PayrollRecord {
    const payroll = this.payrolls.get(id)
    if (!payroll) throw new NotFoundException(`Payroll ${id} not found`)
    if (payroll.status !== 'approved') {
      throw new BadRequestException(`Cannot pay payroll in status ${payroll.status}`)
    }

    payroll.status = 'paid'
    payroll.paymentMethod = method
    payroll.paymentAccount = account
    payroll.paidAt = new Date().toISOString()
    payroll.paidBy = operatorId
    payroll.paidByName = operatorName
    payroll.updatedAt = new Date().toISOString()
    this.payrolls.set(id, payroll)

    this.addApprovalRecord(id, {
      action: 'pay',
      operatorId,
      operatorName,
      remark: `已通过${method}发放至${account}`,
    })
    return payroll
  }

  /**
   * 取消薪资单（paid 不可取消）
   */
  cancelPayroll(id: string, operatorId: string, operatorName: string, remark?: string): PayrollRecord {
    const payroll = this.payrolls.get(id)
    if (!payroll) throw new NotFoundException(`Payroll ${id} not found`)
    if (payroll.status === 'paid') {
      throw new BadRequestException('Cannot cancel a paid payroll')
    }
    if (payroll.status === 'cancelled') {
      throw new BadRequestException('Payroll already cancelled')
    }

    payroll.status = 'cancelled'
    payroll.updatedAt = new Date().toISOString()
    this.payrolls.set(id, payroll)

    this.addApprovalRecord(id, {
      action: 'cancel',
      operatorId,
      operatorName,
      remark: remark ?? '取消薪资单',
    })
    return payroll
  }

  // ============ 3. 审批记录 ============

  private addApprovalRecord(
    payrollId: string,
    record: { action: SalaryApprovalRecord['action']; operatorId: string; operatorName: string; remark?: string },
  ): void {
    const records = this.approvalRecords.get(payrollId) ?? []
    records.push({
      id: `ar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      payrollId,
      ...record,
      createdAt: new Date().toISOString(),
    })
    this.approvalRecords.set(payrollId, records)
  }

  getApprovalHistory(payrollId: string): SalaryApprovalRecord[] {
    return this.approvalRecords.get(payrollId) ?? []
  }

  getPayrollDetail(id: string): PayrollDetail | null {
    const payroll = this.payrolls.get(id)
    if (!payroll) return null
    return {
      ...payroll,
      approvalHistory: this.getApprovalHistory(id),
    }
  }

  // ============ 4. 薪资统计 ============

  getSalarySummary(period: string, from: string, to: string, storeId?: string): SalarySummary {
    let filtered = Array.from(this.payrolls.values())

    if (storeId) {
      filtered = filtered.filter((p) => p.storeId === storeId)
    }

    const totalGross = filtered.reduce((sum, p) => sum + p.grossPay, 0)
    const totalDeductions = filtered.reduce((sum, p) => sum + p.totalDeductions, 0)
    const totalNet = filtered.reduce((sum, p) => sum + p.netPay, 0)
    const totalPaid = filtered
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.netPay, 0)
    const totalPending = filtered
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + p.grossPay, 0)

    // 按门店汇总
    const byStore: Record<string, number> = {}
    for (const p of filtered) {
      if (p.status === 'cancelled') continue
      byStore[p.storeId] = (byStore[p.storeId] ?? 0) + p.netPay
    }

    // 按薪资模式汇总
    const byMode: Record<string, number> = {}
    for (const p of filtered) {
      if (p.status === 'cancelled') continue
      byMode[p.mode] = (byMode[p.mode] ?? 0) + p.grossPay
    }

    return {
      period,
      from,
      to,
      totalEmployees: new Set(filtered.map((p) => p.employeeId)).size,
      totalGross,
      totalDeductions,
      totalNet,
      totalPaid,
      totalPending,
      byStore,
      byMode,
    }
  }

  // ============ 5. 种子数据 ============

  private seed(): void {
    const now = new Date().toISOString()

    // 种子 1: 基本工资+绩效+社保公积金
    this.payrolls.set('pay-seed-001', {
      id: 'pay-seed-001',
      code: 'SAL000001',
      storeId: 'store-001',
      period: '2026-07',
      employeeId: 'emp-001',
      employeeName: '张三',
      mode: 'monthly',
      grossPay: 12000,
      totalDeductions: 2540,
      netPay: 9460,
      items: [
        { item: 'base', label: '基本工资', amount: 8000 },
        { item: 'bonus', label: '绩效奖金', amount: 3000 },
        { item: 'allowance', label: '津贴补助', amount: 1000 },
        { item: 'social_security', label: '社保扣款', amount: -1200 },
        { item: 'housing_fund', label: '公积金扣款', amount: -840 },
        { item: 'tax', label: '个税扣款', amount: -500 },
      ],
      status: 'paid',
      approverId: 'admin-001',
      approvalRemark: '同意发放',
      approvalAt: '2026-07-10T10:00:00Z',
      paymentMethod: 'bank',
      paymentAccount: '6217****8888',
      paidAt: '2026-07-15T09:00:00Z',
      paidBy: 'finance-001',
      paidByName: '财务小王',
      createdAt: '2026-07-05T08:00:00Z',
      updatedAt: '2026-07-15T09:00:00Z',
    })

    // 种子 2: 提成制，待审批
    this.payrolls.set('pay-seed-002', {
      id: 'pay-seed-002',
      code: 'SAL000002',
      storeId: 'store-001',
      period: '2026-07',
      employeeId: 'emp-002',
      employeeName: '李四',
      mode: 'commission',
      grossPay: 8500,
      totalDeductions: 1000,
      netPay: 7500,
      items: [
        { item: 'commission', label: '提成', amount: 7500 },
        { item: 'allowance', label: '津贴补助', amount: 1000 },
        { item: 'social_security', label: '社保扣款', amount: -600 },
        { item: 'tax', label: '个税扣款', amount: -400 },
      ],
      status: 'pending',
      createdAt: '2026-07-12T14:00:00Z',
      updatedAt: '2026-07-12T14:00:00Z',
    })

    // 种子 3: 混合模式，已审批
    this.payrolls.set('pay-seed-003', {
      id: 'pay-seed-003',
      code: 'SAL000003',
      storeId: 'store-002',
      period: '2026-07',
      employeeId: 'emp-003',
      employeeName: '王五',
      mode: 'mixed',
      grossPay: 15000,
      totalDeductions: 3500,
      netPay: 11500,
      items: [
        { item: 'base', label: '基本工资', amount: 5000 },
        { item: 'commission', label: '提成', amount: 8000 },
        { item: 'overtime', label: '加班费', amount: 2000 },
        { item: 'social_security', label: '社保扣款', amount: -1500 },
        { item: 'housing_fund', label: '公积金扣款', amount: -1000 },
        { item: 'tax', label: '个税扣款', amount: -1000 },
      ],
      status: 'approved',
      approverId: 'admin-002',
      approvalRemark: '同意',
      approvalAt: '2026-07-18T11:00:00Z',
      createdAt: '2026-07-13T09:00:00Z',
      updatedAt: '2026-07-18T11:00:00Z',
    })

    // 审批记录
    this.approvalRecords.set('pay-seed-001', [
      { id: 'ar-p1', payrollId: 'pay-seed-001', action: 'submit', operatorId: 'emp-001', operatorName: '张三', remark: '提交薪资单', createdAt: '2026-07-05T08:00:00Z' },
      { id: 'ar-p2', payrollId: 'pay-seed-001', action: 'approve', operatorId: 'admin-001', operatorName: '管理员', remark: '同意发放', createdAt: '2026-07-10T10:00:00Z' },
      { id: 'ar-p3', payrollId: 'pay-seed-001', action: 'pay', operatorId: 'finance-001', operatorName: '财务小王', remark: '已通过银行转账发放', createdAt: '2026-07-15T09:00:00Z' },
    ])
    this.approvalRecords.set('pay-seed-002', [
      { id: 'ar-p4', payrollId: 'pay-seed-002', action: 'submit', operatorId: 'emp-002', operatorName: '李四', remark: '提交薪资单', createdAt: '2026-07-12T14:00:00Z' },
    ])
    this.approvalRecords.set('pay-seed-003', [
      { id: 'ar-p5', payrollId: 'pay-seed-003', action: 'submit', operatorId: 'emp-003', operatorName: '王五', remark: '提交薪资单', createdAt: '2026-07-13T09:00:00Z' },
      { id: 'ar-p6', payrollId: 'pay-seed-003', action: 'approve', operatorId: 'admin-002', operatorName: '管理员', remark: '同意', createdAt: '2026-07-18T11:00:00Z' },
    ])
  }
}
