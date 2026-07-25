// create-booking.dto.ts · 创建预约 DTO
// Phase 1 核心交易闭环 · 2026-07-26

import {
  IsString,
  IsOptional,
  IsDateString,
  Matches,
  MaxLength,
} from 'class-validator'

export class CreateBookingDto {
  /**
   * 门店 slug（用于路由标识）
   *
   * 示例: "beijing-chaoyang"
   */
  @IsString()
  @MaxLength(100)
  storeSlug!: string

  /**
   * 服务项目 ID
   */
  @IsString()
  @MaxLength(50)
  serviceId!: string

  /**
   * 预约日期 YYYY-MM-DD
   */
  @IsDateString()
  date!: string

  /**
   * 时段选择 HH:mm（30 分钟粒度）
   *
   * 示例: "09:00", "09:30", "14:00"
   */
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[03]0$/, {
    message: 'timeSlot 必须为 HH:00 或 HH:30 格式（30 分钟粒度）',
  })
  timeSlot!: string

  /**
   * 客户姓名
   */
  @IsString()
  @MaxLength(50)
  customerName!: string

  /**
   * 客户手机号
   */
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, {
    message: 'customerPhone 必须是有效中国大陆手机号',
  })
  customerPhone!: string

  /**
   * 优惠券码（可选）
   */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  couponCode?: string
}
