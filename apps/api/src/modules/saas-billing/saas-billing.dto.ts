/**
 * SaaS 计费模块 — DTO（数据传输对象）
 *
 * 定义所有 API 请求/响应结构，支持 class-validator 校验。
 */

import { IsString, IsNumber, IsEnum, IsArray, IsOptional, IsBoolean, IsObject, Min, Max } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { BillingCycle, PricingTier, QuotaType, SubscriptionStatus, InvoiceStatus } from './saas-billing.entity'

// ── 请求 DTO ──────────────────────────────────────────────────────────────

export class CreatePlanDto {
  @ApiProperty({ enum: ['starter', 'professional', 'enterprise'] })
  @IsEnum(['starter', 'professional', 'enterprise'] as const)
  tier!: PricingTier

  @ApiProperty()
  @IsString()
  name!: string

  @ApiProperty({ description: '月基础价格 (CNY)' })
  @IsNumber()
  @Min(0)
  basePrice!: number

  @ApiProperty({ type: [String], enum: ['monthly', 'quarterly', 'annually'] })
  @IsArray()
  @IsEnum(['monthly', 'quarterly', 'annually'] as const, { each: true })
  billingCycles!: BillingCycle[]

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  features!: string[]

  @ApiProperty({ description: '配额上限', example: { api_calls: 100000, storage_gb: 5, users: 5, transactions: -1, devices: 10 } })
  @IsObject()
  quotas!: Record<QuotaType, number>

  @ApiProperty({ description: '超额费率' })
  @IsObject()
  overageRates!: Record<QuotaType, number>

  @ApiProperty({ description: '折扣百分比' })
  @IsObject()
  discountPercent!: Record<BillingCycle, number>
}

export class SubscribeDto {
  @ApiProperty()
  @IsString()
  tenantId!: string

  @ApiProperty()
  @IsString()
  planId!: string

  @ApiProperty({ enum: ['monthly', 'quarterly', 'annually'] })
  @IsEnum(['monthly', 'quarterly', 'annually'] as const)
  billingCycle!: BillingCycle
}

export class ChangePlanDto {
  @ApiProperty()
  @IsString()
  newPlanId!: string
}

export class RecordUsageDto {
  @ApiProperty({ enum: ['api_calls', 'storage_gb', 'users', 'transactions', 'devices'] })
  @IsEnum(['api_calls', 'storage_gb', 'users', 'transactions', 'devices'] as const)
  quota!: QuotaType

  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount!: number
}

export class StartTrialDto {
  @ApiProperty()
  @IsString()
  tenantId!: string

  @ApiProperty()
  @IsString()
  planId!: string
}

export class CheckQuotaDto {
  @ApiProperty({ enum: ['api_calls', 'storage_gb', 'users', 'transactions', 'devices'] })
  @IsEnum(['api_calls', 'storage_gb', 'users', 'transactions', 'devices'] as const)
  quota!: QuotaType

  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount!: number
}

// ── 响应 DTO ──────────────────────────────────────────────────────────────

export class PricingPlanResponseDto {
  planId!: string
  tier!: string
  name!: string
  basePrice!: number
  billingCycles!: string[]
  features!: string[]
  quotas!: Record<string, number>
  overageRates!: Record<string, number>
  discountPercent!: Record<string, number>
}

export class TenantSubscriptionResponseDto {
  tenantId!: string
  planId!: string
  tier!: string
  status!: string
  startedAt!: string
  expiresAt?: string
  trialEndsAt?: string
  billingCycle!: string
  nextBillingDate!: string
  autoRenew!: boolean
}

export class InvoiceResponseDto {
  invoiceId!: string
  tenantId!: string
  amount!: number
  currency!: string
  status!: string
  items!: Array<{ description: string; amount: number }>
  issuedAt!: string
  dueAt!: string
  paidAt?: string
}

export class QuotaUsageResponseDto {
  tenantId!: string
  quota!: string
  used!: number
  limit!: number
  resetAt!: string
  overage!: number
}

export class QuotaCheckResponseDto {
  allowed!: boolean
  current!: number
  limit!: number
  overage!: number
}

export class TrialStatusResponseDto {
  isTrial!: boolean
  daysRemaining!: number
  expiresAt!: string
}

export class OverageResponseDto {
  api_calls!: number
  storage_gb!: number
  users!: number
  transactions!: number
  devices!: number
}
