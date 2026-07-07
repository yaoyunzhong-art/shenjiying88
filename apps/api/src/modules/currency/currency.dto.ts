import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsIn,
  Min,
  IsEnum
} from 'class-validator'
import 'reflect-metadata'

const CURRENCY_CODES = ['CNY', 'USD', 'HKD', 'TWD', 'JPY', 'KRW', 'THB', 'VND', 'IDR', 'MYR', 'SGD'] as const

/**
 * 转换请求 DTO
 */
export class ConvertRequestDto {
  @IsNumber()
  @Min(0)
  amount!: number

  @IsString()
  @IsEnum(CURRENCY_CODES)
  from!: string

  @IsString()
  @IsEnum(CURRENCY_CODES)
  to!: string
}

/**
 * 设置汇率 DTO
 */
export class SetRateRequestDto {
  @IsString()
  @IsEnum(CURRENCY_CODES)
  from!: string

  @IsString()
  @IsEnum(CURRENCY_CODES)
  to!: string

  @IsNumber()
  @Min(0.0001)
  rate!: number

  @IsOptional()
  @IsString()
  @IsIn(['manual', 'market'])
  source?: 'manual' | 'market'
}

/**
 * 金额计算 DTO
 */
export class MoneyOperandDto {
  @IsNumber()
  amount!: number

  @IsString()
  @IsEnum(CURRENCY_CODES)
  currency!: string
}

/**
 * 算术运算 DTO
 */
export class ArithmeticRequestDto {
  @IsNotEmpty()
  a!: MoneyOperandDto

  @IsNotEmpty()
  b!: MoneyOperandDto

  @IsString()
  @IsIn(['add', 'subtract'])
  operation!: 'add' | 'subtract'
}

/**
 * 配置更新 DTO
 */
export class ConfigUpdateDto {
  @IsOptional()
  @IsString()
  @IsEnum(CURRENCY_CODES)
  baseCurrency?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  decimalPlaces?: number

  @IsOptional()
  @IsString()
  @IsIn(['floor', 'round', 'ceil'])
  roundingMode?: 'floor' | 'round' | 'ceil'
}
