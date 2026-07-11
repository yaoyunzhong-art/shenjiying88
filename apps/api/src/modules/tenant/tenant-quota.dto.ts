/**
 * tenant-quota.dto.ts — P-31 多租户隔离: TenantQuotaService API 校验 DTO
 *
 * 校验规则:
 *   - GetTenantQuotaParams — path param tenantId (string required)
 *   - UpdateTenantQuotaDto  — body: 可覆盖的配额字段,半可选
 *   - GetTenantQuotaUsageParams — path param tenantId (string required)
 */

import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min } from 'class-validator'
import { TenantTier } from './tenant-quota.entity'

/**
 * GET /tenants/:id/quota        — path params
 * GET /tenants/:id/quota/usage  — path params
 */
export class TenantQuotaParamsDto {
  @IsString()
  @IsNotEmpty()
  id!: string
}

/**
 * PUT /tenants/:id/quota — request body
 * 更新租户配额 (覆盖/升级降级)
 */
export class UpdateTenantQuotaDto {
  @IsOptional()
  @IsEnum(TenantTier)
  tier?: TenantTier

  @IsOptional()
  @IsInt()
  @Min(-1)
  maxBrands?: number

  @IsOptional()
  @IsInt()
  @Min(-1)
  maxStores?: number

  @IsOptional()
  @IsInt()
  @Min(-1)
  maxMembers?: number

  @IsOptional()
  @IsInt()
  @Min(-1)
  maxCampaigns?: number

  @IsOptional()
  @IsInt()
  @Min(-1)
  maxApiCallsPerDay?: number

  @IsOptional()
  @IsInt()
  @Min(-1)
  maxCouponRedemptionsPerMonth?: number
}
