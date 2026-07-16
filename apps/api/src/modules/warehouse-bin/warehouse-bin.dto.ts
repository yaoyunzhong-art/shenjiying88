import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import 'reflect-metadata'
import { BinStatus, BinType } from './warehouse-bin.entity'

export class CreateWarehouseBinDto {
  @IsString()
  code!: string

  @IsString()
  area!: string

  @IsEnum(BinType)
  type!: BinType

  @IsEnum(BinStatus)
  @IsOptional()
  status?: BinStatus

  @IsNumber()
  @Min(1)
  capacity!: number

  @IsNumber()
  @Min(0)
  @IsOptional()
  usedCapacity?: number

  @IsString()
  @IsOptional()
  currentItem?: string
}

export class UpdateWarehouseBinDto {
  @IsString()
  @IsOptional()
  code?: string

  @IsString()
  @IsOptional()
  area?: string

  @IsEnum(BinType)
  @IsOptional()
  type?: BinType

  @IsEnum(BinStatus)
  @IsOptional()
  status?: BinStatus

  @IsNumber()
  @Min(1)
  @IsOptional()
  capacity?: number

  @IsNumber()
  @Min(0)
  @IsOptional()
  usedCapacity?: number

  @IsString()
  @IsOptional()
  currentItem?: string
}

export class WarehouseBinQueryDto {
  @IsEnum(BinStatus)
  @IsOptional()
  status?: BinStatus

  @IsEnum(BinType)
  @IsOptional()
  type?: BinType

  @IsString()
  @IsOptional()
  area?: string

  @IsString()
  @IsOptional()
  search?: string
}

export class AssignItemDto {
  @IsString()
  itemName!: string

  @IsInt()
  @Min(1)
  quantity!: number
}
