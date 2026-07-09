/**
 * Sprint 3 Phase 2 - License 续费管理 DTOs
 */

export class CreateRenewalRecordDto {
  licenseId!: string
  tenantId!: string
  packageId?: string
  packageName?: string
  previousExpireAt?: string
  newExpireAt?: string
  price!: number
  status?: 'pending' | 'success' | 'failed'
  errorMessage?: string
}

export class UpdateRenewalStatusDto {
  status!: 'pending' | 'success' | 'failed'
  errorMessage?: string
  paymentId?: string
  paidAt?: string
}

export class RenewalRecordQueryDto {
  page?: number = 1
  pageSize?: number = 10
  licenseId?: string
  tenantId?: string
  status?: 'pending' | 'success' | 'failed'
  startDate?: string
  endDate?: string
  packageName?: string
}

export class RenewalRecordResponseDto {
  id!: string
  licenseId!: string
  tenantId!: string
  packageId?: string
  packageName?: string
  previousExpireAt?: string
  newExpireAt?: string
  price!: number
  status!: string
  errorMessage?: string
  paymentId?: string
  paidAt?: string
  createdAt!: string
  updatedAt!: string
}

export class RenewalRecordListResponseDto {
  data!: RenewalRecordResponseDto[]
  total!: number
  page!: number
  pageSize!: number
}

export class CreateNotificationDto {
  licenseId!: string
  tenantId!: string
  type!: 'reminder' | 'success' | 'failure'
  reminderDays?: number
  sentAt!: string
}

export class NotificationResponseDto {
  id!: string
  licenseId!: string
  tenantId!: string
  type!: string
  reminderDays?: number
  sentAt!: string
  createdAt!: string
}

export class NotificationListResponseDto {
  data!: NotificationResponseDto[]
  total!: number
}

export class RenewalStatsResponseDto {
  totalRenewals!: number
  successCount!: number
  failedCount!: number
  pendingCount!: number
  successRate!: number
  totalRevenue!: number
  monthlyBreakdown?: Array<{
    month: string
    renewals: number
    revenue: number
  }>
}
