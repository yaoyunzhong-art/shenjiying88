export enum VenueType {
  Indoor = 'indoor',
  Outdoor = 'outdoor',
  Booth = 'booth',
  Hall = 'hall',
  GameArea = 'game-area',
  Dining = 'dining',
}

export enum VenueStatus {
  Idle = 'idle',
  Occupied = 'occupied',
  Maintenance = 'maintenance',
  Booked = 'booked',
}

export const VENUE_STATUS_TRANSITIONS: Record<VenueStatus, VenueStatus[]> = {
  [VenueStatus.Idle]: [VenueStatus.Occupied, VenueStatus.Maintenance, VenueStatus.Booked],
  [VenueStatus.Occupied]: [VenueStatus.Idle, VenueStatus.Maintenance],
  [VenueStatus.Maintenance]: [VenueStatus.Idle],
  [VenueStatus.Booked]: [VenueStatus.Occupied, VenueStatus.Idle, VenueStatus.Maintenance],
}

/**
 * Time-pricing segments for a venue.
 */
export interface TimeSlotPricing {
  /** Segment label, e.g. 'morning', 'afternoon', 'evening' */
  label: string
  /** Start hour (0-23) */
  startHour: number
  /** End hour (0-23) */
  endHour: number
  /** Price in cents (分) */
  priceCents: number
}

export interface HolidayPricing {
  /** ISO date string YYYY-MM-DD */
  date: string
  /** Price in cents (分) */
  priceCents: number
}

export class VenueEntity {
  id!: string
  name!: string
  type!: VenueType
  capacity!: number
  status!: VenueStatus
  priceCents!: number
  timeSlotPricing?: TimeSlotPricing[]
  holidayPricing?: HolidayPricing[]
  tags?: string[]
  description?: string
  createdAt!: Date
  updatedAt!: Date
}
