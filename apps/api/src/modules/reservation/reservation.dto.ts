import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min
} from 'class-validator'
import { ReservationType, ReservationStatus } from './reservation.entity'

export class CreateReservationDto {
  @IsEnum(ReservationType)
  type!: ReservationType

  @IsString()
  resourceId!: string

  @IsString()
  resourceName!: string

  @IsString()
  userId!: string

  @IsString()
  userName!: string

  @IsDateString()
  startTime!: string

  @IsDateString()
  endTime!: string

  @IsInt()
  @Min(1)
  duration!: number

  @IsNumber()
  @Min(0)
  price!: number

  @IsNumber()
  @Min(0)
  deposit!: number

  @IsString()
  @IsOptional()
  remark?: string
}

export class UpdateReservationDto {
  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus

  @IsDateString()
  @IsOptional()
  startTime?: string

  @IsDateString()
  @IsOptional()
  endTime?: string

  @IsInt()
  @Min(1)
  @IsOptional()
  duration?: number

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number

  @IsNumber()
  @Min(0)
  @IsOptional()
  deposit?: number

  @IsString()
  @IsOptional()
  remark?: string

  @IsString()
  @IsOptional()
  resourceName?: string
}

export class ReservationQueryDto {
  @IsEnum(ReservationType)
  @IsOptional()
  type?: ReservationType

  @IsString()
  @IsOptional()
  resourceId?: string

  @IsString()
  @IsOptional()
  userId?: string

  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus

  @IsDateString()
  @IsOptional()
  startDate?: string

  @IsDateString()
  @IsOptional()
  endDate?: string
}
