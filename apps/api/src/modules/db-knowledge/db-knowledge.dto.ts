/**
 * db-knowledge.dto.ts — 数据库知识库 DTO 定义
 *
 * 提供查询参数校验类，供 Controller 使用。
 */

import { IsString, IsOptional, IsInt, IsIn, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

/** 搜索查询 DTO */
export class SearchQueryDto {
  @IsString()
  query!: string

  @IsOptional()
  @IsString()
  kind?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number
}

/** 按种类查询文档 DTO */
export class KindQueryDto {
  @IsString()
  kind!: string
}

/** 按团队查询专家 DTO */
export class GroupQueryDto {
  @IsOptional()
  @IsString()
  groupId?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number
}

/** 按城市查询竞品场馆 DTO */
export class CityQueryDto {
  @IsString()
  city!: string
}

/** 反模式/正向模式过滤 DTO */
export class PatternFilterDto {
  @IsOptional()
  @IsString()
  @IsIn(['anti-pattern', 'positive-pattern'])
  type?: 'anti-pattern' | 'positive-pattern'
}
