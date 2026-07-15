import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { VenueType, VenueStatus, type TimeSlotPricing, type HolidayPricing } from './venue.entity'

class TimeSlotPricingDto implements TimeSlotPricing {
  @IsString()
  label!: string

  @IsInt()
  @Min(0)
  startHour!: number

  @IsInt()
  @Min(0)
  endHour!: number

  @IsInt()
  @Min(0)
  priceCents!: number
}

class HolidayPricingDto implements HolidayPricing {
  @IsString()
  date!: string

  @IsInt()
  @Min(0)
  priceCents!: number
}

export class CreateVenueDto {
  @IsString()
  name!: string

  @IsEnum(VenueType)
  type!: VenueType

  @IsInt()
  @Min(0)
  capacity!: number

  @IsInt()
  @Min(0)
  priceCents!: number

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotPricingDto)
  timeSlotPricing?: TimeSlotPricingDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HolidayPricingDto)
  holidayPricing?: HolidayPricingDto[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsString()
  description?: string
}

export class UpdateVenueDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEnum(VenueType)
  type?: VenueType

  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number

  @IsOptional()
  @IsEnum(VenueStatus)
  status?: VenueStatus

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotPricingDto)
  timeSlotPricing?: TimeSlotPricingDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HolidayPricingDto)
  holidayPricing?: HolidayPricingDto[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsString()
  description?: string
}
