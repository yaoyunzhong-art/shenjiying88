/**
 * store.dto.ts · 门店 DTO (class-validator)
 *
 * Phase 1 商店管理模块请求/响应对象
 */

import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { StoreStatus, StoreType } from './store.entity'
import 'reflect-metadata'

// ═══════════════════════════════════════════════════════════════════════
// CreateStoreDto：创建门店请求
// ═══════════════════════════════════════════════════════════════════════

export class CreateStoreDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  storeCode!: string

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name!: string

  @IsString()
  @MinLength(1)
  @MaxLength(512)
  address!: string

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string

  @IsEnum(StoreStatus)
  @IsOptional()
  status?: StoreStatus

  @IsEnum(StoreType)
  @IsOptional()
  type?: StoreType

  @IsNumber()
  @Min(0)
  @IsOptional()
  area?: number

  @IsString()
  @IsOptional()
  @MaxLength(32)
  managerName?: string

  @IsString()
  @IsOptional()
  @MaxLength(20)
  managerPhone?: string

  @IsString()
  @IsOptional()
  openingTime?: string

  @IsString()
  @IsOptional()
  closingTime?: string

  @IsString()
  @IsOptional()
  @MaxLength(1024)
  description?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @IsString()
  @IsOptional()
  imageUrl?: string

  @IsNumber()
  @IsOptional()
  longitude?: number

  @IsNumber()
  @IsOptional()
  latitude?: number
}

// ═══════════════════════════════════════════════════════════════════════
// UpdateStoreDto：更新门店请求（全部可选）
// ═══════════════════════════════════════════════════════════════════════

export class UpdateStoreDto {
  @IsString()
  @IsOptional()
  @MaxLength(128)
  name?: string

  @IsString()
  @IsOptional()
  @MaxLength(512)
  address?: string

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string

  @IsEnum(StoreStatus)
  @IsOptional()
  status?: StoreStatus

  @IsEnum(StoreType)
  @IsOptional()
  type?: StoreType

  @IsNumber()
  @Min(0)
  @IsOptional()
  area?: number

  @IsString()
  @IsOptional()
  @MaxLength(32)
  managerName?: string

  @IsString()
  @IsOptional()
  @MaxLength(20)
  managerPhone?: string

  @IsString()
  @IsOptional()
  openingTime?: string

  @IsString()
  @IsOptional()
  closingTime?: string

  @IsString()
  @IsOptional()
  @MaxLength(1024)
  description?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @IsString()
  @IsOptional()
  imageUrl?: string

  @IsNumber()
  @IsOptional()
  longitude?: number

  @IsNumber()
  @IsOptional()
  latitude?: number
}

// ═══════════════════════════════════════════════════════════════════════
// StoreQueryDto：门店查询参数
// ═══════════════════════════════════════════════════════════════════════

export class StoreQueryDto {
  @IsString()
  @IsOptional()
  keyword?: string

  @IsEnum(StoreStatus)
  @IsOptional()
  status?: StoreStatus

  @IsEnum(StoreType)
  @IsOptional()
  type?: StoreType

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number

  @IsString()
  @IsOptional()
  sortBy?: string

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc'
}

// ═══════════════════════════════════════════════════════════════════════
// 响应 DTO
// ═══════════════════════════════════════════════════════════════════════

export class StoreDto {
  @IsString()
  id!: string

  @IsString()
  tenantId!: string

  @IsString()
  @IsOptional()
  brandId?: string

  @IsString()
  storeCode!: string

  @IsString()
  name!: string

  @IsString()
  address!: string

  @IsString()
  @IsOptional()
  phone?: string

  @IsEnum(StoreStatus)
  status!: StoreStatus

  @IsEnum(StoreType)
  type!: StoreType

  @IsNumber()
  @IsOptional()
  area?: number

  @IsString()
  @IsOptional()
  managerName?: string

  @IsString()
  @IsOptional()
  managerPhone?: string

  @IsString()
  @IsOptional()
  openingTime?: string

  @IsString()
  @IsOptional()
  closingTime?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @IsString()
  @IsOptional()
  imageUrl?: string

  @IsNumber()
  @IsOptional()
  longitude?: number

  @IsNumber()
  @IsOptional()
  latitude?: number

  @IsString()
  createdAt!: string

  @IsString()
  updatedAt!: string
}

export class StoreListDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreDto)
  items!: StoreDto[]

  @IsNumber()
  total!: number

  @IsNumber()
  page!: number

  @IsNumber()
  limit!: number
}

export class StoreStatsDto {
  @IsString()
  storeId!: string

  @IsString()
  storeName!: string

  @IsNumber()
  totalMembers!: number

  @IsNumber()
  newMembersToday!: number

  @IsNumber()
  activeMembers!: number

  @IsNumber()
  totalDevices!: number

  @IsNumber()
  onlineDevices!: number

  @IsNumber()
  todayRevenue!: number

  @IsNumber()
  yesterdayRevenue!: number

  @IsNumber()
  @IsOptional()
  revenueMoM?: number

  @IsNumber()
  monthlyRevenue!: number

  @IsNumber()
  todayOrders!: number

  @IsNumber()
  stockAlerts!: number

  @IsNumber()
  employeeCount!: number

  @IsString()
  updatedAt!: string
}
