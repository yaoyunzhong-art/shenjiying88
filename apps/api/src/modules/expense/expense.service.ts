/**
 * 费用报销 - Service (V23)
 *
 * 核心能力：
 * - 费用申请 CRUD
 * - 审批流程 (submit → approve/reject → reimburse)
 * - 费用统计聚合
 * - 审批历史记录
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import type {
  ExpenseReimbursement,
  ExpenseSummary,
  ExpenseStatus,
  ExpenseCategory,
  ExpenseDetail,
  ExpenseApprovalRecord,
} from './expense.entity'

@Injectable()
export class ExpenseService {
  private readonly expenses = new Map<string, ExpenseReimbursement>()
  private readonly approvalRecords = new Map<string, ExpenseApprovalRecord[]>()
  private nextCode = 1001

  constructor() {
    this.seed()
  }

  // ============ 1. 费用申请 CRUD ============

  /**
   * 创建费用申请（草稿状态）
   */
  createExpense(input: {
    title: string
    category: ExpenseCategory
    amount: number
    applicantId: string
    applicantName: string
    storeId: string
    expenseDate: string
    description: string
    attachments?: string[]
  }): ExpenseReimbursement {
    const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const code = `EXP${String(this.nextCode++).padStart(6, '0')}`
    const now = new Date().toISOString()
    const expense: ExpenseReimbursement = {
      id,
      code,
      ...input,
      attachments: input.attachments ?? [],
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }
    this.expenses.set(id, expense)
    this.addApprovalRecord(id, {
      action: 'submit',
      operatorId: input.applicantId,
      operatorName: input.applicantName,
      remark: '创建申请',
    })
    return expense
  }

  /**
   * 提交申请（draft → pending）
   */
  submitExpense(id: string): ExpenseReimbursement {
    const expense = this.expenses.get(id)
    if (!expense) throw new NotFoundException(`Expense ${id} not found`)
    if (expense.status !== 'draft') throw new BadRequestException(`Cannot submit expense in status ${expense.status}`)
    expense.status = 'pending'
    expense.updatedAt = new Date().toISOString()
    this.expenses.set(id, expense)
    this.addApprovalRecord(id, {
      action: 'submit',
      operatorId: expense.applicantId,
      operatorName: expense.applicantName,
      remark: '提交审批',
    })
    return expense
  }

  getExpense(id: string): ExpenseReimbursement | null {
    return this.expenses.get(id) ?? null
  }

  listExpenses(filter?: {
    status?: ExpenseStatus
    category?: ExpenseCategory
    applicantId?: string
    storeId?: string
    from?: string
    to?: string
  }): ExpenseReimbursement[] {
    let result = Array.from(this.expenses.values())
    if (filter) {
      if (filter.status) result = result.filter((e) => e.status === filter.status)
      if (filter.category) result = result.filter((e) => e.category === filter.category)
      if (filter.applicantId) result = result.filter((e) => e.applicantId === filter.applicantId)
      if (filter.storeId) result = result.filter((e) => e.storeId === filter.storeId)
      if (filter.from) result = result.filter((e) => e.createdAt >= filter.from!)
      if (filter.to) result = result.filter((e) => e.createdAt <= filter.to!)
    }
    return result
  }

  /**
   * 删除费用申请（仅 draft 状态可删除）
   */
  deleteExpense(id: string): boolean {
    const expense = this.expenses.get(id)
    if (!expense) return false
    if (expense.status !== 'draft') throw new BadRequestException(`Cannot delete expense in status ${expense.status}`)
    this.expenses.delete(id)
    this.approvalRecords.delete(id)
    return true
  }

  // ============ 2. 审批流程 ============

  /**
   * 审批操作（approve / reject）
   */
  approveExpense(
    id: string,
    action: 'approve' | 'reject',
    approverId: string,
    approverName: string,
    remark?: string,
  ): ExpenseReimbursement {
    const expense = this.expenses.get(id)
    if (!expense) throw new NotFoundException(`Expense ${id} not found`)
    if (expense.status !== 'pending') throw new BadRequestException(`Cannot approve expense in status ${expense.status}`)

    const newStatus: ExpenseStatus = action === 'approve' ? 'approved' : 'rejected'
    expense.status = newStatus
    expense.approverId = approverId
    expense.approvalRemark = remark
    expense.approvalAt = new Date().toISOString()
    expense.updatedAt = new Date().toISOString()
    this.expenses.set(id, expense)

    this.addApprovalRecord(id, {
      action,
      operatorId: approverId,
      operatorName: approverName,
      remark,
    })
    return expense
  }

  /**
   * 执行报销（approved → reimbursed）
   */
  reimburseExpense(
    id: string,
    method: 'bank' | 'cash' | 'wechat' | 'alipay',
    account: string,
    operatorId: string,
    operatorName: string,
  ): ExpenseReimbursement {
    const expense = this.expenses.get(id)
    if (!expense) throw new NotFoundException(`Expense ${id} not found`)
    if (expense.status !== 'approved') throw new BadRequestException(`Cannot reimburse expense in status ${expense.status}`)

    expense.status = 'reimbursed'
    expense.reimbursementMethod = method
    expense.reimbursementAccount = account
    expense.reimbursedAt = new Date().toISOString()
    expense.updatedAt = new Date().toISOString()
    this.expenses.set(id, expense)

    this.addApprovalRecord(id, {
      action: 'reimburse',
      operatorId,
      operatorName,
      remark: `已通过${method}报销至${account}`,
    })
    return expense
  }

  /**
   * 取消申请（任意状态 → cancelled，已报销不可取消）
   */
  cancelExpense(id: string, operatorId: string, operatorName: string, remark?: string): ExpenseReimbursement {
    const expense = this.expenses.get(id)
    if (!expense) throw new NotFoundException(`Expense ${id} not found`)
    if (expense.status === 'reimbursed') throw new BadRequestException('Cannot cancel a reimbursed expense')
    if (expense.status === 'cancelled') throw new BadRequestException('Expense already cancelled')

    expense.status = 'cancelled'
    expense.updatedAt = new Date().toISOString()
    this.expenses.set(id, expense)

    this.addApprovalRecord(id, {
      action: 'cancel',
      operatorId,
      operatorName,
      remark: remark ?? '取消申请',
    })
    return expense
  }

  // ============ 3. 审批记录 ============

  private addApprovalRecord(
    expenseId: string,
    record: { action: ExpenseApprovalRecord['action']; operatorId: string; operatorName: string; remark?: string },
  ): void {
    const records = this.approvalRecords.get(expenseId) ?? []
    records.push({
      id: `ar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      expenseId,
      ...record,
      createdAt: new Date().toISOString(),
    })
    this.approvalRecords.set(expenseId, records)
  }

  getApprovalHistory(expenseId: string): ExpenseApprovalRecord[] {
    return this.approvalRecords.get(expenseId) ?? []
  }

  getExpenseDetail(id: string): ExpenseDetail | null {
    const expense = this.expenses.get(id)
    if (!expense) return null
    return {
      ...expense,
      approvalHistory: this.getApprovalHistory(id),
    }
  }

  // ============ 4. 费用统计 ============

  getExpenseSummary(period: string, from: string, to: string, storeId?: string): ExpenseSummary {
    let filtered = Array.from(this.expenses.values())

    if (storeId) {
      filtered = filtered.filter((e) => e.storeId === storeId)
    }

    const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0)
    const totalReimbursed = filtered
      .filter((e) => e.status === 'reimbursed')
      .reduce((sum, e) => sum + e.amount, 0)
    const totalPending = filtered
      .filter((e) => e.status === 'pending')
      .reduce((sum, e) => sum + e.amount, 0)
    const totalRejected = filtered
      .filter((e) => e.status === 'rejected')
      .reduce((sum, e) => sum + e.amount, 0)

    // 按类别汇总
    const byCategory = {} as Record<ExpenseCategory, number>
    const categories: ExpenseCategory[] = ['travel', 'accommodation', 'meals', 'office', 'equipment', 'marketing', 'training', 'maintenance', 'other']
    for (const cat of categories) {
      byCategory[cat] = filtered
        .filter((e) => e.category === cat && e.status !== 'cancelled')
        .reduce((sum, e) => sum + e.amount, 0)
    }

    // 按门店汇总
    const byStore: Record<string, number> = {}
    for (const e of filtered) {
      if (e.status === 'cancelled') continue
      byStore[e.storeId] = (byStore[e.storeId] ?? 0) + e.amount
    }

    return {
      period,
      from,
      to,
      totalApplications: filtered.length,
      totalAmount,
      totalReimbursed,
      totalPending,
      totalRejected,
      byCategory,
      byStore,
    }
  }

  // ============ 5. 种子数据 ============

  private seed(): void {
    const now = new Date().toISOString()

    // 种子：3 个费用申请
    this.expenses.set('exp-seed-travel', {
      id: 'exp-seed-travel',
      code: 'EXP000001',
      title: '出差交通费',
      category: 'travel',
      amount: 2500,
      applicantId: 'user-001',
      applicantName: '张三',
      storeId: 'store-001',
      expenseDate: '2026-07-15',
      description: '北京出差往返高铁票',
      attachments: ['https://example.com/ticket-1.pdf'],
      status: 'approved',
      approverId: 'admin-001',
      approvalRemark: '同意',
      approvalAt: now,
      createdAt: '2026-07-15T08:00:00Z',
      updatedAt: now,
    })

    this.expenses.set('exp-seed-meals', {
      id: 'exp-seed-meals',
      code: 'EXP000002',
      title: '客户招待用餐',
      category: 'meals',
      amount: 1800,
      applicantId: 'user-002',
      applicantName: '李四',
      storeId: 'store-001',
      expenseDate: '2026-07-16',
      description: '接待重要客户晚餐',
      attachments: ['https://example.com/receipt-1.jpg'],
      status: 'pending',
      createdAt: '2026-07-16T18:30:00Z',
      updatedAt: '2026-07-16T18:30:00Z',
    })

    this.expenses.set('exp-seed-office', {
      id: 'exp-seed-office',
      code: 'EXP000003',
      title: '办公用品采购',
      category: 'office',
      amount: 3500,
      applicantId: 'user-001',
      applicantName: '张三',
      storeId: 'store-002',
      expenseDate: '2026-07-14',
      description: '打印机墨盒及打印纸',
      attachments: [],
      status: 'reimbursed',
      approverId: 'admin-002',
      approvalRemark: '同意报销',
      approvalAt: '2026-07-15T10:00:00Z',
      reimbursementMethod: 'bank',
      reimbursementAccount: '6217********1234',
      reimbursedAt: '2026-07-16T14:00:00Z',
      createdAt: '2026-07-14T09:00:00Z',
      updatedAt: '2026-07-16T14:00:00Z',
    })

    // 审批记录
    this.approvalRecords.set('exp-seed-travel', [
      { id: 'ar-1', expenseId: 'exp-seed-travel', action: 'submit', operatorId: 'user-001', operatorName: '张三', remark: '提交费用申请', createdAt: '2026-07-15T08:00:00Z' },
      { id: 'ar-2', expenseId: 'exp-seed-travel', action: 'approve', operatorId: 'admin-001', operatorName: '管理员', remark: '同意', createdAt: now },
    ])
    this.approvalRecords.set('exp-seed-meals', [
      { id: 'ar-3', expenseId: 'exp-seed-meals', action: 'submit', operatorId: 'user-002', operatorName: '李四', remark: '提交费用申请', createdAt: '2026-07-16T18:30:00Z' },
    ])
    this.approvalRecords.set('exp-seed-office', [
      { id: 'ar-4', expenseId: 'exp-seed-office', action: 'submit', operatorId: 'user-001', operatorName: '张三', remark: '提交费用申请', createdAt: '2026-07-14T09:00:00Z' },
      { id: 'ar-5', expenseId: 'exp-seed-office', action: 'approve', operatorId: 'admin-002', operatorName: '财务', remark: '同意报销', createdAt: '2026-07-15T10:00:00Z' },
      { id: 'ar-6', expenseId: 'exp-seed-office', action: 'reimburse', operatorId: 'admin-002', operatorName: '财务', remark: '已通过银行转账报销', createdAt: '2026-07-16T14:00:00Z' },
    ])
  }
}
