/**
 * content.dto.ts - 内容管理 DTO
 * 用途: 内容管理的接口入参出参定义
 */

import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { ContentCategory, ContentStatus, ContentMetadata } from './content.entity';

// ─── 请求 DTO ─────────────────────────────────────────────────────────────

export class CreateContentDto {
  @IsString()
  title!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsString()
  body!: string;

  @IsEnum(['notice', 'activity', 'guide', 'news', 'promotion', 'education', 'other'] as const)
  category!: ContentCategory;

  @IsString()
  authorId!: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  metadata?: ContentMetadata;
}

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsEnum(['notice', 'activity', 'guide', 'news', 'promotion', 'education', 'other'] as const)
  category?: ContentCategory;

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived', 'deleted'] as const)
  status?: ContentStatus;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  metadata?: ContentMetadata;
}

export class ContentQueryDto {
  @IsOptional()
  @IsEnum(['notice', 'activity', 'guide', 'news', 'promotion', 'education', 'other'] as const)
  category?: ContentCategory;

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived', 'deleted'] as const)
  status?: ContentStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class PublishContentDto {
  @IsOptional()
  @IsDateString()
  publishAt?: string;
}

// ─── 响应 DTO ─────────────────────────────────────────────────────────────

export class ContentResponseDto {
  id!: string;
  title!: string;
  slug!: string;
  summary?: string;
  body!: string;
  category!: ContentCategory;
  status!: ContentStatus;
  authorId!: string;
  coverImageUrl?: string;
  metadata?: ContentMetadata;
  publishedAt?: string;
  createdAt!: string;
  updatedAt!: string;
}

export class ContentPaginatedResponseDto {
  items!: ContentResponseDto[];
  total!: number;
  limit!: number;
  offset!: number;
}
