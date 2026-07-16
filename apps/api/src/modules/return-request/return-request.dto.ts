import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import 'reflect-metadata'
import { ReturnType, ReturnStatus } from './return-request.entity'

// ═══════════════════════════════════════════════════════════════════════
// Return Request DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateReturnRequestDto {
  @IsString()
  returnNo!: string

  @IsString()
  orderNo!: string

  @IsString()
  itemName!: string

  @IsNumber()
  @Min(1)
  quantity!: number

  @IsEnum(ReturnType)
  type!: ReturnType

  @IsString()
  reason!: string

  @IsString()
  customerName!: string

  @IsNumber()
  @Min(0)
  amount!: number

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[]

  @IsString()
  @IsOptional()
  remark?: string
}

export class UpdateReturnRequestDto {
  @IsString()
  @IsOptional()
  reason?: string

  @IsString()
  @IsOptional()
  remark?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[]
}

export class UpdateReturnStatusDto {
  @IsEnum(ReturnStatus)
  status!: ReturnStatus

  @IsString()
  @IsOptional()
  remark?: string
}

export class ReturnRequestQueryDto {
  @IsEnum(ReturnType)
  @IsOptional()
  type?: ReturnType

  @IsEnum(ReturnStatus)
  @IsOptional()
  status?: ReturnStatus

  @IsString()
  @IsOptional()
  customerName?: string

  @IsString()
  @IsOptional()
  search?: string
}
