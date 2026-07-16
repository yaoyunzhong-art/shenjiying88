import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'
import { ProcurementStatus } from './procurement-order.entity'

// ═══════════════════════════════════════════════════════════════════════
// Item DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateProcurementItemDto {
  @IsString()
  name!: string

  @IsString()
  sku!: string

  @IsNumber()
  @Min(1)
  quantity!: number

  @IsNumber()
  @Min(0)
  unitPrice!: number

  @IsNumber()
  @Min(0)
  @IsOptional()
  receivedQuantity = 0
}

export class ProcurementItemDto {
  @IsString()
  id!: string

  @IsString()
  name!: string

  @IsString()
  sku!: string

  @IsNumber()
  @Min(1)
  quantity!: number

  @IsNumber()
  @Min(0)
  unitPrice!: number

  @IsNumber()
  @Min(0)
  @IsOptional()
  receivedQuantity = 0
}

// ═══════════════════════════════════════════════════════════════════════
// Order DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateProcurementOrderDto {
  @IsString()
  orderNo!: string

  @IsString()
  supplierId!: string

  @IsString()
  supplierName!: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProcurementItemDto)
  items!: CreateProcurementItemDto[]

  @IsString()
  @IsOptional()
  remark?: string

  @IsDateString()
  orderedAt!: string

  @IsDateString()
  expectedAt!: string
}

export class UpdateProcurementOrderDto {
  @IsString()
  @IsOptional()
  orderNo?: string

  @IsString()
  @IsOptional()
  supplierId?: string

  @IsString()
  @IsOptional()
  supplierName?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcurementItemDto)
  @IsOptional()
  items?: ProcurementItemDto[]

  @IsString()
  @IsOptional()
  remark?: string

  @IsDateString()
  @IsOptional()
  expectedAt?: string
}

export class UpdateProcurementStatusDto {
  @IsEnum(ProcurementStatus)
  status!: ProcurementStatus
}

export class ProcurementOrderQueryDto {
  @IsEnum(ProcurementStatus)
  @IsOptional()
  status?: ProcurementStatus

  @IsString()
  @IsOptional()
  supplierId?: string

  @IsString()
  @IsOptional()
  search?: string
}

export class ReceiveItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items!: ReceiveItemDto[]
}

export class ReceiveItemDto {
  @IsString()
  itemId!: string

  @IsNumber()
  @Min(1)
  receivedQuantity!: number
}
