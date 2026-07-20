// notice.dto.ts · 公告通知请求 DTO
// Phase V23 · 2026-07-21

import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator'
import 'reflect-metadata'
import { NoticePriority, NoticeScope } from './notice.entity'

export class CreateNoticeDto {
  @IsString()
  @MaxLength(200)
  title!: string

  @IsString()
  @MaxLength(50000)
  content!: string

  @IsEnum(NoticeScope)
  scope!: NoticeScope

  @IsEnum(NoticePriority)
  @IsOptional()
  priority?: NoticePriority

  @IsString()
  authorId!: string

  @IsString()
  authorName!: string

  @IsString()
  @MaxLength(500)
  @IsOptional()
  summary?: string

  @IsString()
  @IsOptional()
  coverUrl?: string

  @IsString()
  @IsOptional()
  tenantId?: string

  @IsString()
  @IsOptional()
  brandId?: string

  @IsString()
  @IsOptional()
  storeId?: string

  @IsISO8601()
  @IsOptional()
  scheduledAt?: string

  @IsISO8601()
  @IsOptional()
  expireAt?: string

  @IsNumber()
  @Min(0)
  @IsOptional()
  stickyOrder?: number

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]
}

export class UpdateNoticeDto {
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string

  @IsString()
  @MaxLength(50000)
  @IsOptional()
  content?: string

  @IsEnum(NoticeScope)
  @IsOptional()
  scope?: NoticeScope

  @IsEnum(NoticePriority)
  @IsOptional()
  priority?: NoticePriority

  @IsString()
  @MaxLength(500)
  @IsOptional()
  summary?: string

  @IsString()
  @IsOptional()
  coverUrl?: string

  @IsISO8601()
  @IsOptional()
  scheduledAt?: string

  @IsISO8601()
  @IsOptional()
  expireAt?: string

  @IsNumber()
  @Min(0)
  @IsOptional()
  stickyOrder?: number

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]
}

export class ListNoticeQueryDto {
  @IsEnum(NoticeScope)
  @IsOptional()
  scope?: NoticeScope

  @IsString()
  @IsOptional()
  status?: string

  @IsString()
  @IsOptional()
  priority?: string

  @IsString()
  @IsOptional()
  authorId?: string

  @IsString()
  @IsOptional()
  keyword?: string

  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number
}

export class MarkReadDto {
  @IsString()
  userId!: string

  @IsString()
  userName!: string
}
