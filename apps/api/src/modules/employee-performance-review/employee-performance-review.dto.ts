import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { EmployeeRole } from './employee-performance-review.entity'

export class EmployeePerformanceQueryDto {
  @ApiPropertyOptional({ description: '门店ID' })
  @IsOptional()
  @IsString()
  storeId?: string

  @ApiPropertyOptional({ enum: EmployeeRole, description: '角色过滤' })
  @IsOptional()
  @IsEnum(EmployeeRole)
  role?: EmployeeRole

  @ApiPropertyOptional({ description: '月份 (YYYY-MM)' })
  @IsOptional()
  @IsString()
  month?: string

  @ApiPropertyOptional({ description: '排序字段' })
  @IsOptional()
  @IsString()
  sortBy?: string
}

export class CreateEmployeePerformanceDto {
  @ApiProperty({ description: '员工ID' })
  @IsString()
  employeeId!: string

  @ApiProperty({ description: '员工姓名' })
  @IsString()
  name!: string

  @ApiProperty({ enum: EmployeeRole, description: '角色' })
  @IsEnum(EmployeeRole)
  role!: EmployeeRole

  @ApiProperty({ description: '门店ID' })
  @IsString()
  storeId!: string

  @ApiProperty({ description: '综合评分 (0-100)' })
  @IsNumber()
  @Type(() => Number)
  score!: number

  @ApiProperty({ description: '完成任务数' })
  @IsNumber()
  @Type(() => Number)
  completedTasks!: number

  @ApiProperty({ description: '客户评分 (0-5)' })
  @IsNumber()
  @Type(() => Number)
  customerRating!: number

  @ApiProperty({ description: '出勤率 (百分比)' })
  @IsNumber()
  @Type(() => Number)
  attendanceRate!: number

  @ApiProperty({ description: '收入贡献' })
  @IsNumber()
  @Type(() => Number)
  revenueContribution!: number

  @ApiProperty({ description: '月份 (YYYY-MM)' })
  @IsString()
  month!: string
}

export class EmployeePerformanceDto {
  @ApiProperty({ description: '记录ID' })
  id!: string

  @ApiProperty({ description: '租户ID' })
  tenantId!: string

  @ApiProperty({ description: '员工ID' })
  employeeId!: string

  @ApiProperty({ description: '员工姓名' })
  name!: string

  @ApiProperty({ enum: EmployeeRole, description: '角色' })
  role!: EmployeeRole

  @ApiProperty({ description: '门店ID' })
  storeId!: string

  @ApiProperty({ description: '综合评分 (0-100)' })
  score!: number

  @ApiProperty({ description: '完成任务数' })
  completedTasks!: number

  @ApiProperty({ description: '客户评分 (0-5)' })
  customerRating!: number

  @ApiProperty({ description: '出勤率 (百分比)' })
  attendanceRate!: number

  @ApiProperty({ description: '收入贡献' })
  revenueContribution!: number

  @ApiProperty({ description: '月份 (YYYY-MM)' })
  month!: string

  @ApiProperty({ description: '创建时间' })
  createdAt!: string
}

export class PerformanceSummaryDto {
  @ApiProperty({ description: '员工总数' })
  totalEmployees!: number

  @ApiProperty({ description: '平均评分' })
  avgScore!: number

  @ApiProperty({ description: '最佳表现员工' })
  topPerformer!: string

  @ApiProperty({ description: '最低评分领域' })
  lowestArea!: string

  @ApiProperty({ description: '团队平均分' })
  teamAverage!: number
}

export class EmployeePerformanceListDto {
  @ApiProperty({ type: [EmployeePerformanceDto], description: '员工绩效列表' })
  items!: EmployeePerformanceDto[]

  @ApiProperty({ description: '总数' })
  total!: number
}
