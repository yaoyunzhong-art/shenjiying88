/**
 * Sprint 3 Phase 1 - License 套餐管理 DTOs
 */

import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, IsEnum, Min, MaxLength, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * 创建套餐 DTO
 */
export class CreatePackageDto {
  @ApiProperty({ description: '套餐名称', example: '企业版' })
  @IsString()
  @MaxLength(100)
  name!: string

  @ApiPropertyOptional({ description: '套餐描述', example: '适合中大型企业的完整解决方案' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({ description: '价格 (元)', example: 2999 })
  @IsNumber()
  @Min(0)
  price!: number

  @ApiProperty({ description: '有效期时长', example: 12 })
  @IsNumber()
  @Min(1)
  duration!: number

  @ApiProperty({ description: '有效期单位', enum: ['day', 'month', 'year'], example: 'month' })
  @IsEnum(['day', 'month', 'year'])
  durationUnit!: 'day' | 'month' | 'year'

  @ApiProperty({ description: '最大用户数量', example: 100 })
  @IsNumber()
  @Min(1)
  maxUsers!: number

  @ApiProperty({ description: '最大门店数量', example: 10 })
  @IsNumber()
  @Min(1)
  maxStores!: number

  @ApiPropertyOptional({
    description: '功能权限列表',
    type: [String],
    example: ['basic', 'analytics', 'api'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[]

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

/**
 * 更新套餐 DTO
 */
export class UpdatePackageDto {
  @ApiPropertyOptional({ description: '套餐名称' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: '套餐描述' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: '价格 (元)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number

  @ApiPropertyOptional({ description: '有效期时长' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  duration?: number

  @ApiPropertyOptional({ description: '有效期单位', enum: ['day', 'month', 'year'] })
  @IsEnum(['day', 'month', 'year'])
  @IsOptional()
  durationUnit?: 'day' | 'month' | 'year'

  @ApiPropertyOptional({ description: '最大用户数量' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxUsers?: number

  @ApiPropertyOptional({ description: '最大门店数量' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxStores?: number

  @ApiPropertyOptional({ description: '功能权限列表', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[]

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

/**
 * 套餐查询 DTO
 */
export class PackageQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1

  @ApiPropertyOptional({ description: '每页条数', default: 10 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsString()
  @IsOptional()
  keyword?: string

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @ApiPropertyOptional({ description: '价格范围 - 最小值' })
  @IsNumber()
  @IsOptional()
  minPrice?: number

  @ApiPropertyOptional({ description: '价格范围 - 最大值' })
  @IsNumber()
  @IsOptional()
  maxPrice?: number
}

/**
 * 套餐响应 DTO
 */
export class PackageResponseDto {
  @ApiProperty({ description: '套餐ID' })
  id!: string

  @ApiProperty({ description: '套餐名称' })
  name!: string

  @ApiProperty({ description: '套餐描述' })
  description!: string

  @ApiProperty({ description: '价格' })
  price!: number

  @ApiProperty({ description: '有效期时长' })
  duration!: number

  @ApiProperty({ description: '有效期单位' })
  durationUnit!: string

  @ApiProperty({ description: '最大用户数量' })
  maxUsers!: number

  @ApiProperty({ description: '最大门店数量' })
  maxStores!: number

  @ApiProperty({ description: '功能权限' })
  features!: string[]

  @ApiProperty({ description: '是否启用' })
  isActive!: boolean

  @ApiProperty({ description: '创建时间' })
  createdAt!: Date

  @ApiProperty({ description: '更新时间' })
  updatedAt!: Date

  @ApiProperty({ description: '关联的 License 数量' })
  licenseCount?: number
}

/**
 * 套餐列表响应 DTO
 */
export class PackageListResponseDto {
  @ApiProperty({ description: '套餐列表', type: [PackageResponseDto] })
  list!: PackageResponseDto[]

  @ApiProperty({ description: '总数' })
  total!: number

  @ApiProperty({ description: '当前页码' })
  page!: number

  @ApiProperty({ description: '每页条数' })
  pageSize!: number
}

/**
 * 关联套餐到 License DTO
 */
export class AssignPackageToLicenseDto {
  @ApiProperty({ description: 'License ID' })
  @IsString()
  licenseId!: string

  @ApiPropertyOptional({ description: '生效时间', default: '立即生效' })
  @IsOptional()
  effectiveDate?: Date

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string
}