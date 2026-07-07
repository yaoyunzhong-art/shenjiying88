import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  Min,
  Max,
  ArrayMinSize
} from 'class-validator'

export class RecommendationRequestDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string

  @IsOptional()
  @IsString()
  currentBrowsing?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recentViewed?: string[]

  @IsOptional()
  @IsString()
  @IsEnum(['birthday', 'festival', 'casual'])
  scenario?: 'birthday' | 'festival' | 'casual'
}

export class UpsellRequestDto {
  @IsString()
  @IsNotEmpty()
  productId!: string
}

export class CrossSellRequestDto {
  @IsString()
  @IsNotEmpty()
  productId!: string
}

export class ObjectionClassifyRequestDto {
  @IsString()
  @IsNotEmpty()
  customerReply!: string
}

export class ObjectionTypeDto {
  @IsString()
  @IsEnum(['price', 'quality', 'competitor', 'need'])
  objectionType!: 'price' | 'quality' | 'competitor' | 'need'
}

export class ObjectionResponseRequestDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string

  @IsString()
  @IsNotEmpty()
  productId!: string

  @IsString()
  @IsEnum(['price', 'quality', 'competitor', 'need'])
  objectionType!: 'price' | 'quality' | 'competitor' | 'need'

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conversationHistory?: string[]
}

export class SimulateConversationRequestDto {
  @IsString()
  @IsNotEmpty()
  objection!: string

  @IsString()
  @IsNotEmpty()
  response!: string
}

export class ScheduleFollowUpRequestDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string

  @IsString()
  @IsNotEmpty()
  salesId!: string

  @IsString()
  @IsEnum(['birthday', 'inactive', 'price_alert', 'reorder'])
  type!: 'birthday' | 'inactive' | 'price_alert' | 'reorder'

  @IsString()
  @IsDateString()
  scheduledAt!: string

  @IsOptional()
  @IsString()
  message?: string
}

export class MarkCompletedRequestDto {
  @IsString()
  @IsNotEmpty()
  followUpId!: string
}

export class SetBirthdayRequestDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string

  @IsString()
  @IsDateString()
  birthday!: string
}

export class RecordPurchaseDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string

  @IsString()
  @IsNotEmpty()
  productId!: string
}
