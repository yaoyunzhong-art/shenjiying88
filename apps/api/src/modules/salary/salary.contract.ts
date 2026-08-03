/**
 * 薪资/薪酬管理 - Contract (V23)
 *
 * 对外暴露的安全合约视图：
 * - 剥离内部实现细节
 * - 仅暴露纯数据接口类型
 */

import type {
  PayrollRecord,
  SalarySummary,
  SalaryItem,
  SalaryStatus,
  SalaryMode,
  SalaryLineItem,
  PayrollDetail,
  PaymentMethod,
} from './salary.entity'

// ─── 薪资单合约 ───

export interface PayrollRecordContract {
  id: string
  code: string
  storeId: string
  period: string
  employeeId: string
  employeeName: string
  mode: SalaryMode
  grossPay: number
  totalDeductions: number
  netPay: number
  items: SalaryLineItemContract[]
  status: SalaryStatus
  approverId?: string
  approvalRemark?: string
  approvalAt?: string
  paymentMethod?: PaymentMethod
  paymentAccount?: string
  paidAt?: string
  paidBy?: string
  paidByName?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

// ─── 薪资明细项合约 ───

export interface SalaryLineItemContract {
  item: SalaryItem
  label: string
  amount: number
  note?: string
}

// ─── 薪资明细合约 ───

export interface PayrollDetailContract extends PayrollRecordContract {
  approvalHistory?: SalaryApprovalRecordContract[]
  workingDays?: number
  attendanceDays?: number
}

// ─── 审批记录合约 ───

export interface SalaryApprovalRecordContract {
  id: string
  payrollId: string
  action: 'submit' | 'approve' | 'reject' | 'pay' | 'cancel'
  operatorId: string
  operatorName: string
  remark?: string
  createdAt: string
}

// ─── 薪资统计合约 ───

export interface SalarySummaryContract {
  period: string
  from: string
  to: string
  totalEmployees: number
  totalGross: number
  totalDeductions: number
  totalNet: number
  totalPaid: number
  totalPending: number
  byStore: Record<string, number>
  byMode: Record<string, number>
}

// ─── Mappers ───

export function toPayrollRecordContract(
  p: PayrollRecord,
): PayrollRecordContract {
  return {
    id: p.id,
    code: p.code,
    storeId: p.storeId,
    period: p.period,
    employeeId: p.employeeId,
    employeeName: p.employeeName,
    mode: p.mode,
    grossPay: p.grossPay,
    totalDeductions: p.totalDeductions,
    netPay: p.netPay,
    items: p.items.map((i) => ({
      item: i.item,
      label: i.label,
      amount: i.amount,
      note: i.note,
    })),
    status: p.status,
    approverId: p.approverId,
    approvalRemark: p.approvalRemark,
    approvalAt: p.approvalAt,
    paymentMethod: p.paymentMethod,
    paymentAccount: p.paymentAccount,
    paidAt: p.paidAt,
    paidBy: p.paidBy,
    paidByName: p.paidByName,
    remark: p.remark,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

export function toPayrollDetailContract(
  p: PayrollDetail,
): PayrollDetailContract {
  return {
    ...toPayrollRecordContract(p),
    approvalHistory: p.approvalHistory?.map((r) => ({
      id: r.id,
      payrollId: r.payrollId,
      action: r.action,
      operatorId: r.operatorId,
      operatorName: r.operatorName,
      remark: r.remark,
      createdAt: r.createdAt,
    })),
    workingDays: p.workingDays,
    attendanceDays: p.attendanceDays,
  }
}

export function toSalarySummaryContract(
  s: SalarySummary,
): SalarySummaryContract {
  return {
    period: s.period,
    from: s.from,
    to: s.to,
    totalEmployees: s.totalEmployees,
    totalGross: s.totalGross,
    totalDeductions: s.totalDeductions,
    totalNet: s.totalNet,
    totalPaid: s.totalPaid,
    totalPending: s.totalPending,
    byStore: { ...s.byStore },
    byMode: { ...s.byMode },
  }
}
