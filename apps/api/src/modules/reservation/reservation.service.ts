import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  ReservationEntity,
  ReservationStatus,
  ReservationType,
  RESERVATION_STATUS_TRANSITIONS
} from './reservation.entity'

export interface CreateReservationInput {
  tenantId: string
  type: ReservationType
  resourceId: string
  resourceName: string
  userId: string
  userName: string
  startTime: string
  endTime: string
  duration: number
  price: number
  deposit: number
  remark?: string
}

@Injectable()
export class ReservationService {
  private readonly reservationStore = new Map<string, ReservationEntity>()

  // ── CRUD ───────────────────────────────────────────────────────────

  create(input: CreateReservationInput): ReservationEntity {
    if (new Date(input.endTime) <= new Date(input.startTime)) {
      throw new Error('endTime must be after startTime')
    }

    const now = new Date()
    const reservation = new ReservationEntity()
    reservation.id = `reservation-${randomUUID()}`
    reservation.tenantId = input.tenantId
    reservation.type = input.type
    reservation.resourceId = input.resourceId
    reservation.resourceName = input.resourceName
    reservation.userId = input.userId
    reservation.userName = input.userName
    reservation.status = ReservationStatus.Pending
    reservation.startTime = new Date(input.startTime)
    reservation.endTime = new Date(input.endTime)
    reservation.duration = input.duration
    reservation.price = input.price
    reservation.deposit = input.deposit
    reservation.remark = input.remark
    reservation.createdAt = now
    reservation.updatedAt = now

    this.reservationStore.set(reservation.id, reservation)
    return reservation
  }

  findAll(
    tenantId: string,
    filter?: {
      type?: ReservationType
      resourceId?: string
      userId?: string
      status?: ReservationStatus
      startDate?: string
      endDate?: string
    }
  ): ReservationEntity[] {
    return Array.from(this.reservationStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => (filter?.type ? r.type === filter.type : true))
      .filter((r) => (filter?.resourceId ? r.resourceId === filter.resourceId : true))
      .filter((r) => (filter?.userId ? r.userId === filter.userId : true))
      .filter((r) => (filter?.status ? r.status === filter.status : true))
      .filter((r) => {
        if (!filter?.startDate) return true
        return r.startTime >= new Date(filter.startDate)
      })
      .filter((r) => {
        if (!filter?.endDate) return true
        return r.endTime <= new Date(filter.endDate)
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  findOne(id: string, tenantId: string): ReservationEntity | undefined {
    const reservation = this.reservationStore.get(id)
    if (!reservation || reservation.tenantId !== tenantId) return undefined
    return reservation
  }

  update(
    id: string,
    tenantId: string,
    data: {
      startTime?: string
      endTime?: string
      duration?: number
      price?: number
      deposit?: number
      remark?: string
      resourceName?: string
    }
  ): ReservationEntity {
    const reservation = this.assertOwned(id, tenantId)

    if (data.startTime !== undefined) {
      reservation.startTime = new Date(data.startTime)
    }
    if (data.endTime !== undefined) {
      reservation.endTime = new Date(data.endTime)
    }
    if (data.duration !== undefined) {
      reservation.duration = data.duration
    }
    if (data.price !== undefined) {
      reservation.price = data.price
    }
    if (data.deposit !== undefined) {
      reservation.deposit = data.deposit
    }
    if (data.remark !== undefined) {
      reservation.remark = data.remark
    }
    if (data.resourceName !== undefined) {
      reservation.resourceName = data.resourceName
    }

    reservation.updatedAt = new Date()
    this.reservationStore.set(id, reservation)
    return reservation
  }

  cancel(id: string, tenantId: string, reason?: string): ReservationEntity {
    const reservation = this.assertOwned(id, tenantId)
    this.assertStatusTransition(reservation.status, ReservationStatus.Cancelled)

    reservation.status = ReservationStatus.Cancelled
    reservation.cancelledAt = new Date()
    reservation.cancelledReason = reason
    reservation.updatedAt = new Date()
    this.reservationStore.set(id, reservation)
    return reservation
  }

  confirm(id: string, tenantId: string): ReservationEntity {
    const reservation = this.assertOwned(id, tenantId)
    this.assertStatusTransition(reservation.status, ReservationStatus.Confirmed)

    // Conflict detection on confirm
    this.checkConflict(
      reservation.tenantId,
      reservation.resourceId,
      reservation.startTime.toISOString(),
      reservation.endTime.toISOString(),
      reservation.id
    )

    reservation.status = ReservationStatus.Confirmed
    reservation.updatedAt = new Date()
    this.reservationStore.set(id, reservation)
    return reservation
  }

  startProgress(id: string, tenantId: string): ReservationEntity {
    const reservation = this.assertOwned(id, tenantId)
    this.assertStatusTransition(reservation.status, ReservationStatus.InProgress)

    reservation.status = ReservationStatus.InProgress
    reservation.updatedAt = new Date()
    this.reservationStore.set(id, reservation)
    return reservation
  }

  complete(id: string, tenantId: string): ReservationEntity {
    const reservation = this.assertOwned(id, tenantId)
    this.assertStatusTransition(reservation.status, ReservationStatus.Completed)

    reservation.status = ReservationStatus.Completed
    reservation.updatedAt = new Date()
    this.reservationStore.set(id, reservation)
    return reservation
  }

  // ── 冲突检测 ───────────────────────────────────────────────────────

  checkConflict(
    tenantId: string,
    resourceId: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): void {
    const conflicts = Array.from(this.reservationStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => r.resourceId === resourceId)
      .filter((r) => r.status === ReservationStatus.Confirmed)
      .filter((r) => (excludeId ? r.id !== excludeId : true))
      .filter((r) =>
        this.isOverlapping(
          r.startTime.toISOString(),
          r.endTime.toISOString(),
          startTime,
          endTime
        )
      )

    if (conflicts.length > 0) {
      throw new Error(
        `Resource ${resourceId} is already booked from ${startTime} to ${endTime}`
      )
    }
  }

  // ── Query helpers ──────────────────────────────────────────────────

  findByTimeRange(
    tenantId: string,
    startDate: string,
    endDate: string
  ): ReservationEntity[] {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Array.from(this.reservationStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => r.startTime >= start && r.endTime <= end)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  findByUser(tenantId: string, userId: string): ReservationEntity[] {
    return Array.from(this.reservationStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => r.userId === userId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  findByResource(tenantId: string, resourceId: string): ReservationEntity[] {
    return Array.from(this.reservationStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => r.resourceId === resourceId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  // ── Internals ──────────────────────────────────────────────────────

  private assertOwned(id: string, tenantId: string): ReservationEntity {
    const reservation = this.reservationStore.get(id)
    if (!reservation || reservation.tenantId !== tenantId) {
      throw new Error(`Reservation not found: ${id}`)
    }
    return reservation
  }

  private assertStatusTransition(from: ReservationStatus, to: ReservationStatus): void {
    const allowed = RESERVATION_STATUS_TRANSITIONS[from]
    if (!allowed.includes(to)) {
      throw new Error(`Invalid reservation status transition: ${from} → ${to}`)
    }
  }

  private isOverlapping(
    startA: string,
    endA: string,
    startB: string,
    endB: string
  ): boolean {
    return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB)
  }

  // Testing helper
  resetStoreForTests(): void {
    this.reservationStore.clear()
  }
}
