/**
 * 预约模块跨边界通信契约
 *
 * 定义其他模块消费预约数据的稳定表面层。
 */

import type { ReservationEntity, ReservationType, ReservationStatus } from './reservation.entity'

/** 预约信息契约（跨模块安全子集） */
export interface ReservationContract {
  id: string
  tenantId: string
  type: ReservationType
  resourceId: string
  resourceName: string
  userId: string
  userName: string
  status: ReservationStatus
  startTime: string
  endTime: string
  duration: number
  price: number
  deposit: number
  remark?: string
  createdAt: string
  updatedAt: string
}

/** 预约统计契约 */
export interface ReservationStatsContract {
  total: number
  pendingCount: number
  confirmedCount: number
  inProgressCount: number
  completedCount: number
  cancelledCount: number
}

/**
 * 将内部 ReservationEntity 转换为跨模块契约
 */
export function toReservationContract(entity: ReservationEntity): ReservationContract {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    type: entity.type,
    resourceId: entity.resourceId,
    resourceName: entity.resourceName,
    userId: entity.userId,
    userName: entity.userName,
    status: entity.status,
    startTime: entity.startTime instanceof Date ? entity.startTime.toISOString() : entity.startTime,
    endTime: entity.endTime instanceof Date ? entity.endTime.toISOString() : entity.endTime,
    duration: entity.duration,
    price: entity.price,
    deposit: entity.deposit,
    remark: entity.remark,
    createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
    updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt
  }
}

/**
 * 构建预约统计
 */
export function toReservationStatsContract(
  reservations: ReservationEntity[]
): ReservationStatsContract {
  return {
    total: reservations.length,
    pendingCount: reservations.filter((r) => r.status === ('pending' as ReservationStatus)).length,
    confirmedCount: reservations.filter((r) => r.status === ('confirmed' as ReservationStatus)).length,
    inProgressCount: reservations.filter((r) => r.status === ('in_progress' as ReservationStatus)).length,
    completedCount: reservations.filter((r) => r.status === ('completed' as ReservationStatus)).length,
    cancelledCount: reservations.filter((r) => r.status === ('cancelled' as ReservationStatus)).length
  }
}

/**
 * 预约统计契约别名（导出 for 其他模块消费）
 */
export type ReservationStatusContract = ReservationStatus
export type ReservationTypeContract = ReservationType
