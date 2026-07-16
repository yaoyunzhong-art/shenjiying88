import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator'
import 'reflect-metadata'
import { DeliveryMethod, DeliveryStatus } from './delivery-tracking.entity'

// ═══════════════════════════════════════════════════════════════════════
// Delivery DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateDeliveryDto {
  @IsString()
  orderNo!: string

  @IsEnum(DeliveryMethod)
  method!: DeliveryMethod

  @IsString()
  carrier!: string

  @IsString()
  trackingNo!: string

  @IsString()
  sender!: string

  @IsString()
  receiver!: string

  @IsString()
  receiverPhone!: string

  @IsString()
  receiverAddress!: string

  @IsDateString()
  estimatedAt!: string

  @IsString()
  @IsOptional()
  remark?: string
}

export class UpdateDeliveryDto {
  @IsEnum(DeliveryMethod)
  @IsOptional()
  method?: DeliveryMethod

  @IsString()
  @IsOptional()
  carrier?: string

  @IsString()
  @IsOptional()
  trackingNo?: string

  @IsString()
  @IsOptional()
  sender?: string

  @IsString()
  @IsOptional()
  receiver?: string

  @IsString()
  @IsOptional()
  receiverPhone?: string

  @IsString()
  @IsOptional()
  receiverAddress?: string

  @IsDateString()
  @IsOptional()
  estimatedAt?: string

  @IsString()
  @IsOptional()
  remark?: string
}

export class UpdateDeliveryStatusDto {
  @IsEnum(DeliveryStatus)
  status!: DeliveryStatus

  @IsString()
  @IsOptional()
  remark?: string
}

export class DeliveryQueryDto {
  @IsEnum(DeliveryStatus)
  @IsOptional()
  status?: DeliveryStatus

  @IsEnum(DeliveryMethod)
  @IsOptional()
  method?: DeliveryMethod

  @IsString()
  @IsOptional()
  orderNo?: string
}

// ═══════════════════════════════════════════════════════════════════════
// Delivery Event DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateDeliveryEventDto {
  @IsEnum(DeliveryStatus)
  status!: DeliveryStatus

  @IsString()
  location!: string

  @IsString()
  description!: string

  @IsDateString()
  timestamp!: string
}
