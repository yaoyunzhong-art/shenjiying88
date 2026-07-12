import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
  ValidateNested,
  MinLength,
  MaxLength
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

// ============================================================================
// 积分交易 DTO
// ============================================================================

/** 积分变动请求 DTO */
export class PointsTransactionDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string

  @IsNumber()
  delta!: number

  @IsString()
  @IsNotEmpty()
  reason!: string

  @IsOptional()
  @IsString()
  orderId?: string

  @IsString()
  @IsNotEmpty()
  transactionId!: string
}

/** 积分转账请求 DTO */
export class PointsTransferDto {
  @IsString()
  @IsNotEmpty()
  fromMemberId!: string

  @IsString()
  @IsNotEmpty()
  toMemberId!: string

  @IsNumber()
  amount!: number

  @IsString()
  @IsNotEmpty()
  reason!: string

  @IsString()
  @IsNotEmpty()
  transactionId!: string
}

/** 批量发放请求 DTO */
export class PointsBatchAwardDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  memberIds!: string[]

  @IsNumber()
  pointsEach!: number

  @IsString()
  @IsNotEmpty()
  reason!: string

  @IsString()
  @IsNotEmpty()
  transactionId!: string
}

/** 积分抵扣请求 DTO */
export class PointsDeductDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string

  @IsNumber()
  amount!: number

  @IsString()
  @IsNotEmpty()
  orderId!: string

  @IsString()
  @IsNotEmpty()
  reason!: string
}

// ============================================================================
// 风控配置 DTO
// ============================================================================

/** 熔断器配置 DTO */
export class CircuitBreakerConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  failureThreshold?: number

  @IsOptional()
  @IsNumber()
  @Min(1000)
  recoveryTimeoutMs?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  halfOpenAttempts?: number
}

/** 过期提醒配置 DTO */
export class ExpirationReminderConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxReminders?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  remindBeforeDays?: number
}

/** 通胀监控配置 DTO */
export class InflationMonitorConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  alertThreshold?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  trendDays?: number
}

// ============================================================================
// 积分规则 DTO
// ============================================================================

/** 积分发放规则 DTO */
export class PointsIssuanceRuleDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsString()
  @IsEnum(['signin', 'purchase', 'referral', 'activity', 'manual'])
  trigger!: 'signin' | 'purchase' | 'referral' | 'activity' | 'manual'

  @IsNumber()
  @Min(0)
  pointsAmount!: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  rate?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  singleMax?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  dailyMax?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  monthlyMax?: number

  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}

/** 积分兑换规则 DTO */
export class PointsRedemptionRuleDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsNumber()
  @Min(1)
  pointsRequired!: number

  @IsString()
  @IsEnum(['cash', 'item', 'coupon'])
  rewardType!: 'cash' | 'item' | 'coupon'

  @IsNumber()
  @Min(0)
  rewardValue!: number

  @IsNumber()
  @Min(0)
  dailyLimit!: number

  @IsNumber()
  @Min(0)
  perMemberLimit!: number

  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}

// ============================================================================
// 账户管理 DTO
// ============================================================================

/** 积分账户查询 DTO */
export class PointsAccountQueryDto {
  @IsOptional()
  @IsString()
  memberId?: string

  @IsOptional()
  @IsString()
  @IsEnum(['active', 'frozen', 'closed'])
  status?: 'active' | 'frozen' | 'closed'

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number
}

/** 冻结/解冻账户 DTO */
export class PointsAccountStatusDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string

  @IsString()
  @IsEnum(['active', 'frozen', 'closed'])
  status!: 'active' | 'frozen' | 'closed'

  @IsOptional()
  @IsString()
  reason?: string
}

// ============================================================================
// 统计分析 DTO
// ============================================================================

/** 积分统计查询 DTO */
export class PointsStatisticsQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string

  @IsOptional()
  @IsString()
  endDate?: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  trendDays?: number
}

/** 积分流水查询 DTO */
export class PointsRecordQueryDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string

  @IsOptional()
  @IsString()
  @IsEnum(['award', 'redeem', 'transfer_in', 'transfer_out', 'expire', 'adjust'])
  type?: 'award' | 'redeem' | 'transfer_in' | 'transfer_out' | 'expire' | 'adjust'

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number

  @IsOptional()
  @IsString()
  startDate?: string

  @IsOptional()
  @IsString()
  endDate?: string
}
