/**
 * 薪资/薪酬管理 - DTO (V23)
 *
 * 请求/响应 DTO 定义
 */

// ============ 创建薪资 ============

export class CreatePayrollDto {
  employeeId!: string
  employeeName!: string
  storeId!: string
  period!: string
  mode!: string
  baseSalary?: number
  bonus?: number
  overtimePay?: number
  commission?: number
  allowance?: number
  socialSecurity?: number
  housingFund?: number
  tax?: number
  otherDeductions?: number
  reimbursement?: number
  workingDays?: number
  attendanceDays?: number
  remark?: string
}

// ============ 审批操作 ============

export class ApprovePayrollDto {
  action!: 'approve' | 'reject'
  approverId!: string
  approverName!: string
  remark?: string
}

// ============ 发放操作 ============

export class PayPayrollDto {
  method!: 'bank' | 'cash' | 'wechat' | 'alipay'
  account!: string
  operatorId!: string
  operatorName!: string
}

// ============ 薪资查询 ============

export class ListPayrollQueryDto {
  status?: string
  storeId?: string
  employeeId?: string
  period?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

// ============ 统计查询 ============

export class SalarySummaryQueryDto {
  period?: 'daily' | 'weekly' | 'monthly' | 'custom'
  from!: string
  to!: string
  storeId?: string
}

// ============ 响应 DTO ============

export class PayrollListResponseDto {
  items!: any[]
  total!: number
  page!: number
  pageSize!: number
}

export class SalarySummaryResponseDto {
  period!: string
  from!: string
  to!: string
  totalEmployees!: number
  totalGross!: number
  totalDeductions!: number
  totalNet!: number
  totalPaid!: number
  totalPending!: number
  byStore!: Record<string, number>
  byMode!: Record<string, number>
}
