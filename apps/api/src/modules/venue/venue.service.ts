/**
 * venue.service.ts — P-25 场地管理服务 + V24 场地预订服务
 * 覆盖：场地 CRUD + 时段定价 + 场地预订(预订/查询/确认/取消/释放)
 */
import { randomUUID } from 'node:crypto'
import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import {
  Venue,
  VenueStatus,
  VenueType,
  VenueShift,
  VenueBookingStatus,
  VenueBooking,
  VENUE_STATUS_TRANSITIONS,
  VENUE_BOOKING_STATUS_TRANSITIONS,
  TimeSlotPricing,
  HolidayPricing,
} from './venue.entity'

export interface CreateVenueInput {
  name: string
  type: VenueType
  capacity: number
  priceCents: number
  timeSlotPricing?: TimeSlotPricing[]
  holidayPricing?: HolidayPricing[]
  tags?: string[]
  description?: string
}

export interface UpdateVenueInput {
  name?: string
  type?: VenueType
  capacity?: number
  priceCents?: number
  status?: VenueStatus
  timeSlotPricing?: TimeSlotPricing[]
  holidayPricing?: HolidayPricing[]
  tags?: string[]
  description?: string
}

export interface ListVenueQuery {
  type?: VenueType
  status?: VenueStatus
  search?: string
}

export interface CreateBookingInput {
  venueId: string
  userId: string
  userName: string
  date: string
  shift: VenueShift
  startTime: string
  endTime: string
  priceCents: number
  depositCents: number
  guestCount: number
  remark?: string
}

export interface ListBookingQuery {
  venueId?: string
  userId?: string
  date?: string
  status?: VenueBookingStatus
  shift?: VenueShift
}

@Injectable()
export class VenueService {
  private readonly logger = new Logger(VenueService.name)
  private readonly venues = new Map<string, Venue>()
  private readonly bookings = new Map<string, VenueBooking>()

  // ═══════════════════════════════════════════════════════════════
  //  场地 CRUD
  // ═══════════════════════════════════════════════════════════════

  create(input: CreateVenueInput): Venue {
    if (!input.name?.trim()) {
      throw new BadRequestException('场地名称不能为空')
    }
    if (input.capacity < 0) {
      throw new BadRequestException('容量不能为负数')
    }
    if (input.priceCents < 0) {
      throw new BadRequestException('价格不能为负数')
    }

    this.assertNameNotTaken(input.name.trim())

    const now = new Date().toISOString()
    const venue: Venue = {
      id: `venue-${randomUUID()}`,
      name: input.name.trim(),
      type: input.type,
      capacity: input.capacity,
      status: VenueStatus.IDLE,
      tenantId: 'default-tenant',
      priceCents: input.priceCents,
      timeSlotPricing: input.timeSlotPricing ?? [],
      holidayPricing: input.holidayPricing ?? [],
      tags: input.tags ?? [],
      description: input.description ?? '',
      createdAt: now,
      updatedAt: now,
    }

    this.venues.set(venue.id, venue)
    this.logger.log(`Created venue: ${venue.id} ${venue.name}`)
    return venue
  }

  list(query?: ListVenueQuery): Venue[] {
    let result = Array.from(this.venues.values())
    if (query?.type) result = result.filter((v) => v.type === query.type)
    if (query?.status) result = result.filter((v) => v.status === query.status)
    if (query?.search) {
      const s = query.search.toLowerCase()
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(s) ||
          v.description.toLowerCase().includes(s),
      )
    }
    return result.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  getById(id: string): Venue {
    const venue = this.venues.get(id)
    if (!venue) throw new NotFoundException(`场地 ${id} 不存在`)
    return venue
  }

  update(id: string, input: UpdateVenueInput): Venue {
    const venue = this.getById(id)

    if (input.name !== undefined) {
      if (!input.name.trim()) throw new BadRequestException('场地名称不能为空')
      if (input.name.trim() !== venue.name) {
        this.assertNameNotTaken(input.name.trim(), id)
      }
      venue.name = input.name.trim()
    }
    if (input.type !== undefined) venue.type = input.type
    if (input.capacity !== undefined) {
      if (input.capacity < 0) throw new BadRequestException('容量不能为负数')
      venue.capacity = input.capacity
    }
    if (input.priceCents !== undefined) {
      if (input.priceCents < 0) throw new BadRequestException('价格不能为负数')
      venue.priceCents = input.priceCents
    }
    if (input.status !== undefined) {
      this.assertValidTransition(venue.status, input.status)
      venue.status = input.status
    }
    if (input.timeSlotPricing !== undefined) venue.timeSlotPricing = input.timeSlotPricing
    if (input.holidayPricing !== undefined) venue.holidayPricing = input.holidayPricing
    if (input.tags !== undefined) venue.tags = input.tags
    if (input.description !== undefined) venue.description = input.description

    venue.updatedAt = new Date().toISOString()
    this.venues.set(id, venue)
    return venue
  }

  delete(id: string): void {
    this.getById(id) // throws if not found
    this.venues.delete(id)
    this.logger.log(`Deleted venue: ${id}`)
  }

  // ── Status management ────────────────────────────────────────────

  changeStatus(id: string, status: VenueStatus): Venue {
    return this.update(id, { status })
  }

  // ── Time-slot pricing ────────────────────────────────────────────

  getTimeSlotPricing(id: string): TimeSlotPricing[] {
    const venue = this.getById(id)
    return venue.timeSlotPricing
  }

  setTimeSlotPricing(id: string, pricing: TimeSlotPricing[]): Venue {
    return this.update(id, { timeSlotPricing: pricing })
  }

  getHolidayPricing(id: string): HolidayPricing[] {
    const venue = this.getById(id)
    return venue.holidayPricing
  }

  setHolidayPricing(id: string, pricing: HolidayPricing[]): Venue {
    return this.update(id, { holidayPricing: pricing })
  }

  // ═══════════════════════════════════════════════════════════════
  //  场地预订
  // ═══════════════════════════════════════════════════════════════

  /** 创建场地预订 */
  createBooking(input: CreateBookingInput): VenueBooking {
    const venue = this.getById(input.venueId)

    if (!input.userId?.trim()) {
      throw new BadRequestException('用户 ID 不能为空')
    }
    if (!input.userName?.trim()) {
      throw new BadRequestException('用户名称不能为空')
    }
    if (new Date(input.endTime) <= new Date(input.startTime)) {
      throw new BadRequestException('结束时间必须晚于开始时间')
    }
    if (input.guestCount <= 0) {
      throw new BadRequestException('人数必须大于 0')
    }
    if (input.guestCount > venue.capacity) {
      throw new BadRequestException(`人数超出场地容量（最大 ${venue.capacity} 人）`)
    }
    if (input.priceCents < 0 || input.depositCents < 0) {
      throw new BadRequestException('价格和押金不能为负数')
    }

    // 冲突检测：同一场地同一时间段不能有空叠的已确认预订
    this.assertNoBookingConflict(input.venueId, input.startTime, input.endTime)

    const now = new Date().toISOString()
    const booking: VenueBooking = {
      id: `booking-${randomUUID()}`,
      tenantId: 'default-tenant',
      venueId: input.venueId,
      venueName: venue.name,
      userId: input.userId,
      userName: input.userName,
      date: input.date,
      shift: input.shift,
      startTime: input.startTime,
      endTime: input.endTime,
      status: VenueBookingStatus.PENDING,
      priceCents: input.priceCents,
      depositCents: input.depositCents,
      guestCount: input.guestCount,
      remark: input.remark ?? '',
      createdAt: now,
      updatedAt: now,
    }

    this.bookings.set(booking.id, booking)
    this.logger.log(`Created booking: ${booking.id} for venue ${input.venueId}`)
    return booking
  }

  /** 查询场地预订列表 */
  listBookings(query?: ListBookingQuery): VenueBooking[] {
    let result = Array.from(this.bookings.values())
    if (query?.venueId) result = result.filter((b) => b.venueId === query.venueId)
    if (query?.userId) result = result.filter((b) => b.userId === query.userId)
    if (query?.date) result = result.filter((b) => b.date === query.date)
    if (query?.status) result = result.filter((b) => b.status === query.status)
    if (query?.shift) result = result.filter((b) => b.shift === query.shift)
    return result.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  /** 获取单个预订详情 */
  getBookingById(id: string): VenueBooking {
    const booking = this.bookings.get(id)
    if (!booking) throw new NotFoundException(`预订 ${id} 不存在`)
    return booking
  }

  /** 确认预订 */
  confirmBooking(id: string): VenueBooking {
    const booking = this.getBookingById(id)
    this.assertBookingStatusTransition(booking.status, VenueBookingStatus.CONFIRMED)

    // 再次冲突检测
    this.assertNoBookingConflict(booking.venueId, booking.startTime, booking.endTime, id)

    booking.status = VenueBookingStatus.CONFIRMED
    booking.updatedAt = new Date().toISOString()
    this.bookings.set(id, booking)

    // 场地状态同步设为 BOOKED
    const venue = this.venues.get(booking.venueId)
    if (venue && venue.status === VenueStatus.IDLE) {
      venue.status = VenueStatus.BOOKED
      venue.updatedAt = new Date().toISOString()
      this.venues.set(venue.id, venue)
    }

    this.logger.log(`Confirmed booking: ${id}`)
    return booking
  }

  /** 开始使用（确认 → 使用中） */
  startBooking(id: string): VenueBooking {
    const booking = this.getBookingById(id)
    this.assertBookingStatusTransition(booking.status, VenueBookingStatus.IN_PROGRESS)

    booking.status = VenueBookingStatus.IN_PROGRESS
    booking.updatedAt = new Date().toISOString()
    this.bookings.set(id, booking)

    // 场地同步
    const venue = this.venues.get(booking.venueId)
    if (venue) {
      venue.status = VenueStatus.OCCUPIED
      venue.updatedAt = new Date().toISOString()
      this.venues.set(venue.id, venue)
    }

    return booking
  }

  /** 完成使用 */
  completeBooking(id: string): VenueBooking {
    const booking = this.getBookingById(id)
    this.assertBookingStatusTransition(booking.status, VenueBookingStatus.COMPLETED)

    booking.status = VenueBookingStatus.COMPLETED
    booking.updatedAt = new Date().toISOString()
    this.bookings.set(id, booking)

    // 释放场地
    this.releaseVenue(booking.venueId)

    this.logger.log(`Completed booking: ${id}`)
    return booking
  }

  /** 取消预订 */
  cancelBooking(id: string, reason?: string): VenueBooking {
    const booking = this.getBookingById(id)
    this.assertBookingStatusTransition(booking.status, VenueBookingStatus.CANCELLED)

    booking.status = VenueBookingStatus.CANCELLED
    booking.cancelledReason = reason
    booking.cancelledAt = new Date().toISOString()
    booking.updatedAt = new Date().toISOString()
    this.bookings.set(id, booking)

    // 如果没有其他活跃预订，释放场地
    this.releaseVenue(booking.venueId)

    this.logger.log(`Cancelled booking: ${id}`)
    return booking
  }

  /** 释放场地（检查是否有其他活跃预订再决定释放） */
  releaseVenue(venueId: string): boolean {
    const venue = this.venues.get(venueId)
    if (!venue) return false

    // 检查是否还有活跃预订（非 completed/cancelled）
    const activeBookings = Array.from(this.bookings.values()).filter(
      (b) =>
        b.venueId === venueId &&
        ![
          VenueBookingStatus.COMPLETED,
          VenueBookingStatus.CANCELLED,
        ].includes(b.status),
    )

    if (activeBookings.length === 0) {
      venue.status = VenueStatus.IDLE
      venue.updatedAt = new Date().toISOString()
      this.venues.set(venueId, venue)
      this.logger.log(`Released venue: ${venueId}`)
      return true
    }

    return false
  }

  /** 查询场地在某日期的可用时段 */
  getVenueAvailability(venueId: string, date: string): {
    date: string
    venueId: string
    shifts: { shift: VenueShift; available: boolean }[]
  } {
    this.getById(venueId) // ensure exists

    // 检测该日期每个时段已有的已确认/使用中预订
    const activeBookings = Array.from(this.bookings.values()).filter(
      (b) =>
        b.venueId === venueId &&
        b.date === date &&
        ![
          VenueBookingStatus.COMPLETED,
          VenueBookingStatus.CANCELLED,
        ].includes(b.status),
    )

    const activeShifts = new Set(activeBookings.map((b) => b.shift))

    const shifts = Object.values(VenueShift).map((shift) => ({
      shift,
      available: !activeShifts.has(shift),
    }))

    return { date, venueId, shifts }
  }

  // ── Private helpers ──────────────────────────────────────────────

  private assertNameNotTaken(name: string, excludeId?: string): void {
    const exists = Array.from(this.venues.values()).some(
      (v) => v.name === name && v.id !== excludeId,
    )
    if (exists) throw new ConflictException(`场地名称 "${name}" 已存在`)
  }

  private assertValidTransition(current: VenueStatus, target: VenueStatus): void {
    const allowed = VENUE_STATUS_TRANSITIONS[current]
    if (!allowed || !allowed.includes(target)) {
      throw new BadRequestException(
        `不能从 ${current} 转换到 ${target}`,
      )
    }
  }

  private assertNoBookingConflict(venueId: string, startTime: string, endTime: string, excludeId?: string): void {
    const conflicts = Array.from(this.bookings.values()).filter(
      (b) =>
        b.venueId === venueId &&
        b.id !== excludeId &&
        ![
          VenueBookingStatus.CANCELLED,
          VenueBookingStatus.COMPLETED,
        ].includes(b.status) &&
        this.isTimeOverlapping(b.startTime, b.endTime, startTime, endTime),
    )

    if (conflicts.length > 0) {
      throw new ConflictException(
        `场地 ${venueId} 在所选时间段已有预订`,
      )
    }
  }

  private assertBookingStatusTransition(from: VenueBookingStatus, to: VenueBookingStatus): void {
    const allowed = VENUE_BOOKING_STATUS_TRANSITIONS[from]
    if (!allowed || !allowed.includes(to)) {
      throw new BadRequestException(
        `预订不能从 ${from} 转换到 ${to}`,
      )
    }
  }

  private isTimeOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
    return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB)
  }

  // ── Testing helpers ──────────────────────────────────────────────

  resetStoreForTests(): void {
    this.venues.clear()
    this.bookings.clear()
  }
}
