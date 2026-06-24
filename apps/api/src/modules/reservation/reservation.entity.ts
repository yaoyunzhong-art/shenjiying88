export enum ReservationType {
  Venue = 'venue',
  Equipment = 'equipment',
  Service = 'service',
  Class = 'class'
}

export enum ReservationStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

export const RESERVATION_STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  [ReservationStatus.Pending]: [ReservationStatus.Confirmed, ReservationStatus.Cancelled],
  [ReservationStatus.Confirmed]: [ReservationStatus.InProgress, ReservationStatus.Cancelled],
  [ReservationStatus.InProgress]: [ReservationStatus.Completed, ReservationStatus.Cancelled],
  [ReservationStatus.Completed]: [],
  [ReservationStatus.Cancelled]: []
}

export class ReservationEntity {
  id!: string
  tenantId!: string
  type!: ReservationType
  resourceId!: string
  resourceName!: string
  userId!: string
  userName!: string
  status!: ReservationStatus
  startTime!: Date
  endTime!: Date
  duration!: number
  price!: number
  deposit!: number
  remark?: string
  createdAt!: Date
  updatedAt!: Date
  cancelledAt?: Date
  cancelledReason?: string
}
