/**
 * venue.entity.ts — P-25 场地管理实体/枚举定义
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
