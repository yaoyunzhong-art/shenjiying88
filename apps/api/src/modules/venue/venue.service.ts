/**
 * venue.service.ts — P-25 场地管理服务 (≥80行)
 */
import { randomUUID } from 'node:crypto'
import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import {
  Venue,
  VenueStatus,
  VenueType,
  VENUE_STATUS_TRANSITIONS,
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

@Injectable()
export class VenueService {
  private readonly logger = new Logger(VenueService.name)
  private readonly venues = new Map<string, Venue>()

  // ── CRUD ─────────────────────────────────────────────────────────

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
}
