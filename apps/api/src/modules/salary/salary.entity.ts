/**
 * 薪资/薪酬管理 - Entity (V23)
 *
 * 类型定义：
 * - 薪资结构/计算/发放/查询
 * - 薪资状态流转
 * - 薪资统计类型
 */

/** 薪资项目 */
export type SalaryItem =
  | 'base'           // 基本工资
  | 'bonus'          // 绩效奖金
  | 'overtime'       // 加班费
  | 'commission'     // 提成
  | 'allowance'      // 津贴补助
  | 'social_security'// 社保扣款
  | 'housing_fund'   // 公积金扣款
  | 'tax'            // 个税扣款
  | 'deduction'      // 其他扣款
  | 'reimbursement'  // 报销补发

/** 薪资状态 */
export type SalaryStatus =
  | 'draft'        // 草稿
  | 'pending'      // 待审批
  | 'approved'     // 已审批通过
  | 'paid'         // 已发放
  | 'rejected'     // 已驳回
  | 'cancelled'    // 已取消

/** 薪资计算模式 */
export type SalaryMode =
  | 'monthly'      // 月度薪资
  | 'hourly'       // 时薪
  | 'commission'   // 纯提成
  | 'mixed'        // 混合模式

/** 发放方式 */
export type PaymentMethod =
  | 'bank'         // 银行转账
  | 'cash'         // 现金
  | 'wechat'       // 微信支付
  | 'alipay'       // 支付宝

/** 薪资明细项 */
export interface SalaryLineItem {
  item: SalaryItem
  label: string
  amount: number
  note?: string
}

/** 薪资发放记录 */
export interface PayrollRecord {
  id: string
  /** 薪资单号 */
  code: string
  /** 所属门店 */
  storeId: string
  /** 薪资周期 */
  period: string
  /** 员工 ID */
  employeeId: string
  /** 员工姓名 */
  employeeName: string
  /** 薪资模式 */
  mode: SalaryMode
  /** 应发合计 */
  grossPay: number
  /** 扣款合计 */
  totalDeductions: number
  /** 实发金额 */
  netPay: number
  /** 明细项 */
  items: SalaryLineItem[]
  /** 当前状态 */
  status: SalaryStatus
  /** 审批人 ID */
  approverId?: string
  /** 审批备注 */
  approvalRemark?: string
  /** 审批时间 */
  approvalAt?: string
  /** 发放方式 */
  paymentMethod?: PaymentMethod
  /** 发放账户 */
  paymentAccount?: string
  /** 发放时间 */
  paidAt?: string
  /** 发放人 */
  paidBy?: string
  /** 发放人姓名 */
  paidByName?: string
  /** 备注 */
  remark?: string
  createdAt: string
  updatedAt: string
}

/** 薪资统计汇总 */
export interface SalarySummary {
  /** 统计周期 */
  period: string
  /** 起始日期 */
  from: string
  /** 结束日期 */
  to: string
  /** 总人数 */
  totalEmployees: number
  /** 应发总额 */
  totalGross: number
  /** 扣款总额 */
  totalDeductions: number
  /** 实发总额 */
  totalNet: number
  /** 已发放金额 */
  totalPaid: number
  /** 待审批金额 */
  totalPending: number
  /** 按门店汇总 */
  byStore: Record<string, number>
  /** 按薪资模式汇总 */
  byMode: Record<string, number>
}

/** 薪资明细响应 */
export interface PayrollDetail extends PayrollRecord {
  /** 审批流历史 */
  approvalHistory?: SalaryApprovalRecord[]
  /** 计薪天数 */
  workingDays?: number
  /** 出勤天数 */
  attendanceDays?: number
}

/** 审批记录 */
export interface SalaryApprovalRecord {
  id: string
  payrollId: string
  action: 'submit' | 'approve' | 'reject' | 'pay' | 'cancel'
  operatorId: string
  operatorName: string
  remark?: string
  createdAt: string
}

/** 薪资计算请求 */
export interface SalaryCalculationRequest {
  employeeId: string
  employeeName: string
  storeId: string
  period: string
  mode: SalaryMode
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

// ─── 标签与常量 ───

export const SALARY_ITEM_LABELS: Record<SalaryItem, string> = {
  base: '基本工资',
  bonus: '绩效奖金',
  overtime: '加班费',
  commission: '提成',
  allowance: '津贴补助',
  social_security: '社保扣款',
  housing_fund: '公积金扣款',
  tax: '个税扣款',
  deduction: '其他扣款',
  reimbursement: '报销补发',
}

export const SALARY_STATUS_LABELS: Record<SalaryStatus, string> = {
  draft: '草稿',
  pending: '待审批',
  approved: '已通过',
  paid: '已发放',
  rejected: '已驳回',
  cancelled: '已取消',
}

export const SALARY_MODE_LABELS: Record<SalaryMode, string> = {
  monthly: '月度薪资',
  hourly: '时薪制',
  commission: '纯提成制',
  mixed: '混合模式',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank: '银行转账',
  cash: '现金',
  wechat: '微信支付',
  alipay: '支付宝',
}
