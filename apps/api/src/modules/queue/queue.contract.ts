import type { QueueEntity } from './queue.entity'

export interface QueueEntryContract {
  id: string
  tenantId: string
  type: QueueEntity['type']
  queueNumber: string
  userId: string
  userName: string
  phone?: string
  partySize: number
  resourceId?: string
  resourceName?: string
  status: QueueEntity['status']
  priority: number
  estimatedWaitMin: number
  actualWaitMin?: number
  calledAt?: string
  servedAt?: string
  completedAt?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface QueueStatsContract {
  total: number
  waitingCount: number
  calledCount: number
  servingCount: number
  completedCount: number
  cancelledCount: number
  noShowCount: number
  avgWaitMin: number
}

export interface PaginatedResultContract<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function toQueueEntryContract(entry: QueueEntity): QueueEntryContract {
  return {
    id: entry.id,
    tenantId: entry.tenantId,
    type: entry.type,
    queueNumber: entry.queueNumber,
    userId: entry.userId,
    userName: entry.userName,
    phone: entry.phone,
    partySize: entry.partySize,
    resourceId: entry.resourceId,
    resourceName: entry.resourceName,
    status: entry.status,
    priority: entry.priority,
    estimatedWaitMin: entry.estimatedWaitMin,
    actualWaitMin: entry.actualWaitMin,
    calledAt: entry.calledAt?.toISOString(),
    servedAt: entry.servedAt?.toISOString(),
    completedAt: entry.completedAt?.toISOString(),
    remark: entry.remark,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString()
  }
}
