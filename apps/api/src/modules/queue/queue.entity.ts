export enum QueueType {
  Booking = 'booking',
  Waiting = 'waiting',
  Service = 'service'
}

export enum QueueStatus {
  Waiting = 'waiting',
  Called = 'called',
  Serving = 'serving',
  Completed = 'completed',
  Cancelled = 'cancelled',
  NoShow = 'no_show'
}

export const QUEUE_STATUS_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  [QueueStatus.Waiting]: [QueueStatus.Called, QueueStatus.Cancelled],
  [QueueStatus.Called]: [QueueStatus.Serving, QueueStatus.NoShow, QueueStatus.Cancelled],
  [QueueStatus.Serving]: [QueueStatus.Completed, QueueStatus.Cancelled],
  [QueueStatus.Completed]: [],
  [QueueStatus.Cancelled]: [],
  [QueueStatus.NoShow]: []
}

export class QueueEntity {
  id!: string
  tenantId!: string
  type!: QueueType
  queueNumber!: string
  userId!: string
  userName!: string
  phone?: string
  partySize!: number
  resourceId?: string
  resourceName?: string
  status!: QueueStatus
  priority!: number
  estimatedWaitMin!: number
  actualWaitMin?: number
  calledAt?: Date
  servedAt?: Date
  completedAt?: Date
  remark?: string
  createdAt!: Date
  updatedAt!: Date
}
