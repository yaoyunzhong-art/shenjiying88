// deploy.dto.ts - 部署模块 DTO 定义
import { IsString, IsNumber, IsNotEmpty, IsOptional, IsBoolean, IsEnum, Min, Max, ValidateNested, IsArray, IsIn } from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

const DEPLOYMENT_MODES = ['single', 'cluster', 'kubernetes'] as const
const RESOURCE_SIZES = ['small', 'medium', 'large', 'xlarge'] as const

export class PlanOptionsDto {
  @IsOptional()
  @IsBoolean()
  enableSSL?: boolean

  @IsOptional()
  @IsBoolean()
  enableCDN?: boolean

  @IsOptional()
  @IsBoolean()
  enableMonitoring?: boolean

  @IsOptional()
  @IsBoolean()
  enableBackup?: boolean

  @IsOptional()
  @IsBoolean()
  multiRegion?: boolean
}

export class GeneratePlanDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(DEPLOYMENT_MODES)
  mode!: 'single' | 'cluster' | 'kubernetes'

  @IsString()
  @IsNotEmpty()
  @IsIn(RESOURCE_SIZES)
  size!: 'small' | 'medium' | 'large' | 'xlarge'

  @IsOptional()
  @ValidateNested()
  @Type(() => PlanOptionsDto)
  options?: PlanOptionsDto
}

export class DeployPlanDto {
  @IsString()
  @IsNotEmpty()
  planId!: string
}

export class ServerSpecDto {
  @IsString()
  @IsNotEmpty()
  cpu!: string

  @IsString()
  @IsNotEmpty()
  memory!: string

  @IsString()
  @IsNotEmpty()
  storage!: string

  @IsString()
  @IsNotEmpty()
  os!: string

  @IsBoolean()
  @IsOptional()
  privateNetwork?: boolean

  @IsBoolean()
  @IsOptional()
  publicIP?: boolean
}

export class CostQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(RESOURCE_SIZES)
  size!: 'small' | 'medium' | 'large' | 'xlarge'

  @IsString()
  @IsNotEmpty()
  @IsIn(DEPLOYMENT_MODES)
  mode!: 'single' | 'cluster' | 'kubernetes'
}

export class ResourceQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(RESOURCE_SIZES)
  size!: 'small' | 'medium' | 'large' | 'xlarge'

  @IsString()
  @IsNotEmpty()
  @IsIn(DEPLOYMENT_MODES)
  mode!: 'single' | 'cluster' | 'kubernetes'
}
