/**
 * 费用报销 - Entity (V23)
 *
 * 类型定义：
 * - 费用申请/审批/报销全流程
 * - 费用类别定义
 * - 数据统计类型
 */

/** 费用类别 */
export type ExpenseCategory =
  | 'travel'           // 差旅交通
  | 'accommodation'    // 住宿
  | 'meals'            // 餐饮招待
  | 'office'           // 办公用品
  | 'equipment'        // 设备采购
  | 'marketing'        // 市场推广
  | 'training'         // 培训教育
  | 'maintenance'      // 维修保养
  | 'other'            // 其他

/** 费用报销状态 */
export type ExpenseStatus =
  | 'draft'       // 草稿
  | 'pending'     // 待审批
  | 'approved'    // 已审批通过
  | 'rejected'    // 已驳回
  | 'reimbursed'  // 已报销
  | 'cancelled'   // 已取消

/** 费用报销申请 */
export interface ExpenseReimbursement {
  id: string
  /** 申请单号 */
  code: string
  /** 申请标题 */
  title: string
  /** 费用类别 */
  category: ExpenseCategory
  /** 费用金额 */
  amount: number
  /** 申请人 ID */
  applicantId: string
  /** 申请人姓名 */
  applicantName: string
  /** 所属门店 */
  storeId: string
  /** 费用发生日期 */
  expenseDate: string
  /** 费用描述 */
  description: string
  /** 附件列表 (URL) */
  attachments: string[]
  /** 当前状态 */
  status: ExpenseStatus
  /** 审批人 ID */
  approverId?: string
  /** 审批备注 */
  approvalRemark?: string
  /** 审批时间 */
  approvalAt?: string
  /** 报销方式 */
  reimbursementMethod?: 'bank' | 'cash' | 'wechat' | 'alipay'
  /** 报销账户 */
  reimbursementAccount?: string
  /** 报销时间 */
  reimbursedAt?: string
  createdAt: string
  updatedAt: string
}

/** 费用统计摘要 */
export interface ExpenseSummary {
  /** 统计周期 */
  period: string
  /** 起始日期 */
  from: string
  /** 结束日期 */
  to: string
  /** 总申请数 */
  totalApplications: number
  /** 总金额 */
  totalAmount: number
  /** 已报销金额 */
  totalReimbursed: number
  /** 待审批金额 */
  totalPending: number
  /** 已驳回金额 */
  totalRejected: number
  /** 按类别汇总 */
  byCategory: Record<ExpenseCategory, number>
  /** 按门店汇总 */
  byStore: Record<string, number>
}

/** 费用明细响应 */
export interface ExpenseDetail extends ExpenseReimbursement {
  /** 审批流历史 */
  approvalHistory?: ExpenseApprovalRecord[]
  /** 关联订单 */
  relatedOrderId?: string
}

/** 审批记录 */
export interface ExpenseApprovalRecord {
  id: string
  expenseId: string
  action: 'submit' | 'approve' | 'reject' | 'reimburse' | 'cancel'
  operatorId: string
  operatorName: string
  remark?: string
  createdAt: string
}

// ─── 标签与常量 ───

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  travel: '差旅交通',
  accommodation: '住宿',
  meals: '餐饮招待',
  office: '办公用品',
  equipment: '设备采购',
  marketing: '市场推广',
  training: '培训教育',
  maintenance: '维修保养',
  other: '其他',
}

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  draft: '草稿',
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  reimbursed: '已报销',
  cancelled: '已取消',
}

export const REIMBURSEMENT_METHOD_LABELS: Record<string, string> = {
  bank: '银行转账',
  cash: '现金',
  wechat: '微信支付',
  alipay: '支付宝',
}
