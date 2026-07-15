/**
 * venue.entity.ts — P-25 场地管理实体/枚举定义 + Service
 */
import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 6)}`
}

// ─── 类型定义 ─────────────────────────────────────────────

export enum VenueType {
  INDOOR = 'indoor',
  OUTDOOR = 'outdoor',
  BOOTH = 'booth',
  HALL = 'hall',
  GAME_AREA = 'game_area',
  DINING = 'dining',
}

export enum VenueStatus {
  IDLE = 'idle',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  BOOKED = 'booked',
}

export interface TimeSlotPricing {
  label: string
  startHour: number
  endHour: number
  priceCents: number
}

export interface HolidayPricing {
  date: string
  priceCents: number
}

export interface Venue {
  id: string
  name: string
  type: VenueType
  capacity: number
  status: VenueStatus
  priceCents: number
  timeSlotPricing: TimeSlotPricing[]
  holidayPricing: HolidayPricing[]
  tags: string[]
  description: string
  createdAt: string
  updatedAt: string
}

// ─── Service ─────────────────────────────────────────────

@Injectable()
export class VenueService {
  private readonly logger = new Logger(VenueService.name)
  private venues: Map<string, Venue> = new Map()

  constructor() {
    this.initializeDefaults()
  }

  private initializeDefaults(): void {
    const defaults: Venue[] = [
      {
        id: generateId(), name: '主大厅', type: VenueType.HALL, capacity: 200,
        status: VenueStatus.IDLE, priceCents: 500000,
        timeSlotPricing: [
          { label: '早场(08-12)', startHour: 8, endHour: 12, priceCents: 300000 },
          { label: '午场(12-18)', startHour: 12, endHour: 18, priceCents: 400000 },
          { label: '晚场(18-22)', startHour: 18, endHour: 22, priceCents: 500000 },
        ],
        holidayPricing: [{ date: '节假日', priceCents: 600000 }],
        tags: ['大厅', '活动'], description: '主活动大厅', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: generateId(), name: 'VIP包厢A', type: VenueType.BOOTH, capacity: 20,
        status: VenueStatus.IDLE, priceCents: 200000,
        timeSlotPricing: [
          { label: '全天', startHour: 8, endHour: 22, priceCents: 200000 },
        ],
        holidayPricing: [{ date: '节假日', priceCents: 250000 }],
        tags: ['VIP', '包厢'], description: 'VIP包厢', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    ]
    for (const v of defaults) {
      this.venues.set(v.id, v)
    }
  }

  list(query?: { type?: VenueType; status?: VenueStatus; search?: string }): Venue[] {
    let result = Array.from(this.venues.values())
    if (query?.type) result = result.filter((v) => v.type === query.type)
    if (query?.status) result = result.filter((v) => v.status === query.status)
    if (query?.search) {
      const s = query.search.toLowerCase()
      result = result.filter((v) => v.name.toLowerCase().includes(s) || v.description.toLowerCase().includes(s))
    }
    return result.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  getById(id: string): Venue {
    const venue = this.venues.get(id)
    if (!venue) throw new NotFoundException(`场地 ${id} 不存在`)
    return venue
  }

  create(data: {
    name: string; type: VenueType; capacity: number; priceCents: number
    timeSlotPricing?: TimeSlotPricing[]; holidayPricing?: HolidayPricing[]
    tags?: string[]; description?: string
  }): Venue {
    if (!data.name?.trim()) throw new BadRequestException('场地名称不能为空')
    if (data.capacity < 0) throw new BadRequestException('容量不能为负数')
    if (data.priceCents < 0) throw new BadRequestException('价格不能为负数')

    const exists = Array.from(this.venues.values()).some((v) => v.name === data.name.trim())
    if (exists) throw new ConflictException(`场地名称 "${data.name}" 已存在`)

    const venue: Venue = {
      id: generateId(),
      name: data.name.trim(),
      type: data.type,
      capacity: data.capacity,
      status: VenueStatus.IDLE,
      priceCents: data.priceCents,
      timeSlotPricing: data.timeSlotPricing ?? [],
      holidayPricing: data.holidayPricing ?? [],
      tags: data.tags ?? [],
      description: data.description ?? '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.venues.set(venue.id, venue)
    this.logger.log(`Created venue: ${venue.id} ${venue.name}`)
    return venue
  }

  update(id: string, data: Partial<{
    name: string; type: VenueType; capacity: number; priceCents: number
    status: VenueStatus; timeSlotPricing: TimeSlotPricing[]
    holidayPricing: HolidayPricing[]; tags: string[]; description: string
  }>): Venue {
    const venue = this.getById(id)

    if (data.name !== undefined) {
      if (!data.name?.trim()) throw new BadRequestException('场地名称不能为空')
      const exists = Array.from(this.venues.values()).some((v) => v.name === data.name.trim() && v.id !== id)
      if (exists) throw new ConflictException(`场地名称 "${data.name}" 已存在`)
      venue.name = data.name.trim()
    }
    if (data.type !== undefined) venue.type = data.type
    if (data.capacity !== undefined) {
      if (data.capacity < 0) throw new BadRequestException('容量不能为负数')
      venue.capacity = data.capacity
    }
    if (data.priceCents !== undefined) {
      if (data.priceCents < 0) throw new BadRequestException('价格不能为负数')
      venue.priceCents = data.priceCents
    }
    if (data.status !== undefined) venue.status = data.status
    if (data.timeSlotPricing !== undefined) venue.timeSlotPricing = data.timeSlotPricing
    if (data.holidayPricing !== undefined) venue.holidayPricing = data.holidayPricing
    if (data.tags !== undefined) venue.tags = data.tags
    if (data.description !== undefined) venue.description = data.description
    venue.updatedAt = new Date().toISOString()

    this.venues.set(id, venue)
    return venue
  }

  delete(id: string): void {
    this.getById(id)
    this.venues.delete(id)
    this.logger.log(`Deleted venue: ${id}`)
  }

  changeStatus(id: string, status: VenueStatus): Venue {
    return this.update(id, { status })
  }
}
