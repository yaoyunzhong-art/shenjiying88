/**
 * 费用报销 - DTO (V23)
 *
 * 请求/响应 DTO 定义
 */

// ============ 创建费用申请 ============

export class CreateExpenseDto {
  title!: string
  category!: string
  amount!: number
  applicantId!: string
  applicantName!: string
  storeId!: string
  expenseDate!: string
  description!: string
  attachments?: string[]
}

// ============ 审批操作 ============

export class ApproveExpenseDto {
  action!: 'approve' | 'reject'
  approverId!: string
  approverName!: string
  remark?: string
}

// ============ 报销操作 ============

export class ReimburseExpenseDto {
  method!: 'bank' | 'cash' | 'wechat' | 'alipay'
  account!: string
  operatorId!: string
  operatorName!: string
}

// ============ 费用查询 ============

export class ListExpenseQueryDto {
  status?: string
  category?: string
  applicantId?: string
  storeId?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

// ============ 统计查询 ============

export class ExpenseSummaryQueryDto {
  period?: 'daily' | 'weekly' | 'monthly' | 'custom'
  from!: string
  to!: string
  storeId?: string
}

// ============ 响应 DTO ============

export class ExpenseListResponseDto {
  items!: any[]
  total!: number
  page!: number
  pageSize!: number
}

export class ExpenseSummaryResponseDto {
  period!: string
  from!: string
  to!: string
  totalApplications!: number
  totalAmount!: number
  totalReimbursed!: number
  totalPending!: number
  totalRejected!: number
  byCategory!: Record<string, number>
  byStore!: Record<string, number>
}
