import { IsString, IsOptional, IsEnum, IsNumber, IsArray, Min, IsPhoneNumber } from 'class-validator'
import { GiftCardStatus } from './gift-card.entity'

/**
 * 创建礼品卡 DTO
 */
export class CreateGiftCardDto {
  @IsString()
  templateId!: string

  @IsNumber()
  @Min(1)
  denomination!: number

  @IsString()
  holderName!: string

  @IsString()
  holderPhone!: string

  @IsString()
  expiresAt!: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  storeScope?: string[]

  @IsString()
  @IsOptional()
  sourceOrderId?: string
}

/**
 * 激活礼品卡 DTO
 */
export class ActivateGiftCardDto {
  @IsString()
  @IsOptional()
  operatorId?: string
}

/**
 * 充值 DTO
 */
export class TopupGiftCardDto {
  @IsNumber()
  @Min(1)
  amount!: number

  @IsString()
  @IsOptional()
  operatorId?: string

  @IsString()
  @IsOptional()
  remark?: string
}

/**
 * 消费 DTO
 */
export class ConsumeGiftCardDto {
  @IsNumber()
  @Min(1)
  amount!: number

  @IsString()
  @IsOptional()
  orderId?: string

  @IsString()
  @IsOptional()
  operatorId?: string

  @IsString()
  @IsOptional()
  remark?: string
}

/**
 * 退款 DTO
 */
export class RefundGiftCardDto {
  @IsNumber()
  @Min(1)
  amount!: number

  @IsString()
  @IsOptional()
  operatorId?: string

  @IsString()
  @IsOptional()
  remark?: string
}

/**
 * 查询过滤 DTO
 */
export class ListGiftCardQueryDto {
  @IsEnum(['pending', 'active', 'frozen', 'expired', 'redeemed', 'cancelled'] as const)
  @IsOptional()
  status?: GiftCardStatus

  @IsString()
  @IsOptional()
  holderName?: string

  @IsString()
  @IsOptional()
  holderPhone?: string
}

/**
 * 冻结/解冻/取消 DTO
 */
export class StatusActionDto {
  @IsString()
  @IsOptional()
  operatorId?: string

  @IsString()
  @IsOptional()
  remark?: string
}
