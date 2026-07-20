/**
 * 费用报销 - Contract (V23)
 *
 * 对外暴露的安全合约视图：
 * - 剥离内部实现细节
 * - 仅暴露纯数据接口类型
 */

import type {
  ExpenseReimbursement,
  ExpenseSummary,
  ExpenseCategory,
  ExpenseStatus,
  ExpenseDetail,
} from './expense.entity'

// ─── 费用申请合约 ───

export interface ExpenseReimbursementContract {
  id: string
  code: string
  title: string
  category: ExpenseCategory
  amount: number
  applicantId: string
  applicantName: string
  storeId: string
  expenseDate: string
  description: string
  attachments: string[]
  status: ExpenseStatus
  approverId?: string
  approvalRemark?: string
  approvalAt?: string
  reimbursementMethod?: string
  reimbursementAccount?: string
  reimbursedAt?: string
  createdAt: string
  updatedAt: string
}

// ─── 费用明细合约 ───

export interface ExpenseDetailContract extends ExpenseReimbursementContract {
  approvalHistory?: ExpenseApprovalRecordContract[]
  relatedOrderId?: string
}

// ─── 审批记录合约 ───

export interface ExpenseApprovalRecordContract {
  id: string
  expenseId: string
  action: 'submit' | 'approve' | 'reject' | 'reimburse' | 'cancel'
  operatorId: string
  operatorName: string
  remark?: string
  createdAt: string
}

// ─── 费用统计合约 ───

export interface ExpenseSummaryContract {
  period: string
  from: string
  to: string
  totalApplications: number
  totalAmount: number
  totalReimbursed: number
  totalPending: number
  totalRejected: number
  byCategory: Record<string, number>
  byStore: Record<string, number>
}

// ─── Mappers ───

export function toExpenseReimbursementContract(
  e: ExpenseReimbursement,
): ExpenseReimbursementContract {
  return {
    id: e.id,
    code: e.code,
    title: e.title,
    category: e.category,
    amount: e.amount,
    applicantId: e.applicantId,
    applicantName: e.applicantName,
    storeId: e.storeId,
    expenseDate: e.expenseDate,
    description: e.description,
    attachments: [...e.attachments],
    status: e.status,
    approverId: e.approverId,
    approvalRemark: e.approvalRemark,
    approvalAt: e.approvalAt,
    reimbursementMethod: e.reimbursementMethod,
    reimbursementAccount: e.reimbursementAccount,
    reimbursedAt: e.reimbursedAt,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  }
}

export function toExpenseDetailContract(
  e: ExpenseDetail,
): ExpenseDetailContract {
  return {
    ...toExpenseReimbursementContract(e),
    approvalHistory: e.approvalHistory?.map((r) => ({
      id: r.id,
      expenseId: r.expenseId,
      action: r.action,
      operatorId: r.operatorId,
      operatorName: r.operatorName,
      remark: r.remark,
      createdAt: r.createdAt,
    })),
    relatedOrderId: e.relatedOrderId,
  }
}

export function toExpenseSummaryContract(
  s: ExpenseSummary,
): ExpenseSummaryContract {
  return {
    period: s.period,
    from: s.from,
    to: s.to,
    totalApplications: s.totalApplications,
    totalAmount: s.totalAmount,
    totalReimbursed: s.totalReimbursed,
    totalPending: s.totalPending,
    totalRejected: s.totalRejected,
    byCategory: { ...s.byCategory },
    byStore: { ...s.byStore },
  }
}
