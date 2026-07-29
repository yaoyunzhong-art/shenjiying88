// cancellation.dto.ts · 改期/退订/取消预约 DTO
// Phase 2A 交易闭环硬化 · 2026-07-26

import { IsString, Matches, MaxLength, IsOptional } from 'class-validator'

export class CancelBookingDto {
  @IsString() @MaxLength(50)
  bookingId!: string

  @IsString() @MaxLength(100)
  storeSlug!: string

  @IsString() @MaxLength(50)
  customerPhone!: string
}

export class RescheduleBookingDto {
  @IsString() @MaxLength(50)
  bookingId!: string

  @IsString() @MaxLength(100)
  storeSlug!: string

  @IsString() @MaxLength(50)
  customerPhone!: string

  /** 新日期 YYYY-MM-DD */
  @IsString()
  newDate!: string

  /** 新时段 HH:mm */
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[03]0$/, {
    message: 'newTimeSlot 必须为 HH:00 或 HH:30 格式',
  })
  newTimeSlot!: string
}

export interface BookingStatus {
  bookingId: string
  status: 'confirmed' | 'cancelled' | 'rescheduled' | 'completed' | 'no_show'
  storeName: string
  serviceName: string
  date: string
  timeSlot: string
  customerName: string
  customerPhone: string
  amount: number
  createdAt: string
  cancelledAt?: string
  rescheduledTo?: { date: string; timeSlot: string } | null
}
