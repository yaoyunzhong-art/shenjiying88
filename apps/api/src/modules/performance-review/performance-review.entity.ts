// ── Performance Review Entities ──

export enum ReviewPeriod {
  Monthly = 'MONTHLY',
  Quarterly = 'QUARTERLY',
  HalfYearly = 'HALF_YEARLY',
  Yearly = 'YEARLY',
}

export enum ReviewStatus {
  Draft = 'DRAFT',
  PendingReview = 'PENDING_REVIEW',
  Reviewed = 'REVIEWED',
  Acknowledged = 'ACKNOWLEDGED',
  Archived = 'ARCHIVED',
}

export type OverallRating = 'A' | 'B' | 'C' | 'D'

export interface ReviewScore {
  id: string
  dimension: string
  score: number // 1-5
  weight: number
  comment: string
}

export interface PerformanceReview {
  id: string
  reviewNo: string
  employeeId: string
  employeeName: string
  reviewer: string
  period: ReviewPeriod
  status: ReviewStatus
  scores: ReviewScore[]
  overallRating: OverallRating
  comments: string
  reviewDate: string
  ackDate?: string
  tenantId: string
  createdAt: string
}
