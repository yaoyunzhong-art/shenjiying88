/**
 * venue.entity.ts — P-25 场地管理实体/枚举定义
 * V24: 新增 VenueBooking / VenueBookingStatus / 场地预订核心模型
 */

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

export const VENUE_STATUS_TRANSITIONS: Record<VenueStatus, VenueStatus[]> = {
  [VenueStatus.IDLE]: [VenueStatus.OCCUPIED, VenueStatus.MAINTENANCE, VenueStatus.BOOKED],
  [VenueStatus.OCCUPIED]: [VenueStatus.IDLE, VenueStatus.MAINTENANCE],
  [VenueStatus.MAINTENANCE]: [VenueStatus.IDLE],
  [VenueStatus.BOOKED]: [VenueStatus.OCCUPIED, VenueStatus.IDLE, VenueStatus.MAINTENANCE],
}

/** 订单班次时段（营业时间内的时段分割） */
export enum VenueShift {
  MORNING = 'morning',   // 08:00–12:00
  AFTERNOON = 'afternoon', // 12:00–18:00
  EVENING = 'evening',   // 18:00–22:00
  FULL_DAY = 'full_day', // 08:00–22:00
}

/** 场地预订状态 */
export enum VenueBookingStatus {
  PENDING = 'pending',         // 待确认
  CONFIRMED = 'confirmed',     // 已确认
  IN_PROGRESS = 'in_progress', // 使用中
  COMPLETED = 'completed',     // 已完成
  CANCELLED = 'cancelled',     // 已取消
}

export const VENUE_BOOKING_STATUS_TRANSITIONS: Record<VenueBookingStatus, VenueBookingStatus[]> = {
  [VenueBookingStatus.PENDING]: [VenueBookingStatus.CONFIRMED, VenueBookingStatus.CANCELLED],
  [VenueBookingStatus.CONFIRMED]: [VenueBookingStatus.IN_PROGRESS, VenueBookingStatus.CANCELLED],
  [VenueBookingStatus.IN_PROGRESS]: [VenueBookingStatus.COMPLETED, VenueBookingStatus.CANCELLED],
  [VenueBookingStatus.COMPLETED]: [],
  [VenueBookingStatus.CANCELLED]: [],
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
  /** 租户 ID（RLS 多租户隔离字段） */
  tenantId?: string
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

/** 场地预订实体 */
export interface VenueBooking {
  id: string
  tenantId: string
  venueId: string
  venueName: string
  userId: string
  userName: string
  date: string            // ISO date YYYY-MM-DD
  shift: VenueShift
  startTime: string        // ISO datetime
  endTime: string          // ISO datetime
  status: VenueBookingStatus
  priceCents: number
  depositCents: number
  guestCount: number
  remark: string
  cancelledReason?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
}
