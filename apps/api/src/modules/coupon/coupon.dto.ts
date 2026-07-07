/**
 * coupon.dto.ts · Coupon API DTO 定义 (Phase-17)
 *
 * class-validator 装饰器实现请求参数校验。
 * 设计依据: spec.md §1.1.2 · E40 P0 跨门店优惠券
 */

import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
  ArrayMinSize,
  IsObject,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

// ─── 嵌套 DTO ──────────────────────────────────────────────────────────

export class CouponScopeDto {
  @IsEnum(['single-store', 'multi-store', 'tenant-wide'] as const)
  type!: 'single-store' | 'multi-store' | 'tenant-wide'

  @IsArray()
  @IsString({ each: true })
  storeIds!: string[]

  @IsBoolean()
  includeSubordinates!: boolean
}

export class CouponRedemptionRulesDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableCategories?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeItems?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userSegments?: string[]
}

// ─── 主请求 DTO ────────────────────────────────────────────────────────

export class CreateCouponDto {
  @IsString()
  @MinLength(1)
  code!: string

  @IsString()
  @MinLength(1)
  tenantId!: string

  @ValidateNested()
  @Type(() => CouponScopeDto)
  scope!: CouponScopeDto

  @ValidateNested()
  @Type(() => CouponRedemptionRulesDto)
  redemptionRules!: CouponRedemptionRulesDto

  @IsNumber()
  @Min(0)
  value!: number

  @IsEnum(['fixed', 'percentage'] as const)
  valueType!: 'fixed' | 'percentage'

  @IsISO8601()
  expiresAt!: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptions?: number
}

export class UpdateCouponStatusDto {
  @IsEnum(['active', 'paused'] as const)
  status!: 'active' | 'paused'
}

export class RedeemCouponDto {
  @IsString()
  @MinLength(1)
  userId!: string

  @IsString()
  @MinLength(1)
  couponCode!: string

  @IsString()
  @MinLength(1)
  storeId!: string

  @IsNumber()
  @Min(0)
  orderAmount!: number

  @IsString()
  orderId!: string

  @IsString()
  idempotencyKey!: string

  @IsOptional()
  @IsString()
  category?: string
}

export class BatchRedeemDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RedeemCouponDto)
  redemptions!: RedeemCouponDto[]
}

export class ListCouponDto {
  @IsOptional()
  @IsEnum(['active', 'paused', 'expired', 'exhausted'] as const)
  status?: 'active' | 'paused' | 'expired' | 'exhausted'

  @IsOptional()
  @IsString()
  tenantId?: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  pageSize?: number
}
