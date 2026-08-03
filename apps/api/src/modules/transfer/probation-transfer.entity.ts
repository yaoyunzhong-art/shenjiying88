// ── Probation Transfer Entities ──

export enum ProbationStatus {
  Ongoing = 'ONGOING',
  Completed = 'COMPLETED',
  Extended = 'EXTENDED',
  Terminated = 'TERMINATED',
}

export enum ProbationDuration {
  OneMonth = 1,
  TwoMonths = 2,
  ThreeMonths = 3,
  SixMonths = 6,
}

export interface ProbationTransfer {
  id: string
  employeeId: string
  employeeName: string
  department: string
  position: string
  probationDuration: ProbationDuration // months
  probationStart: string               // YYYY-MM-DD
  probationEnd: string                 // YYYY-MM-DD
  status: ProbationStatus
  /** 转正日期（审批通过后设置） */
  transferDate?: string
  /** 评价等级: A/B/C/D */
  performanceRating?: string
  /** 评估意见 */
  evaluation: string
  /** 审批人 */
  approver: string
  /** 审批意见 */
  approvalRemark?: string
  /** 驳回原因 */
  rejectReason?: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

// ── Probation Transfer Statistics ──

export interface ProbationStats {
  total: number
  byStatus: Record<ProbationStatus, number>
  byDepartment: Array<{ department: string; count: number }>
  completedRate: number  // 0~1
  extensionRate: number  // 0~1
  terminationRate: number // 0~1
  averageDurationDays: number
  monthlyTrend: Array<{ month: string; completed: number; extended: number; terminated: number }>
  performanceDistribution: Array<{ rating: string; count: number }>
}
