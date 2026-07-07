import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsNotEmpty,
  IsOptional
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

/** 等级评估请求 DTO */
export class LevelEvaluationInputDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string

  @IsNumber()
  @Min(0)
  growthValue!: number

  @IsNumber()
  @Min(0)
  totalSpend!: number

  @IsNumber()
  @Min(0)
  totalVisits!: number

  @IsString()
  @IsNotEmpty()
  tenantId!: string
}

/** 批量评估单项 DTO */
export class BatchLevelItemDto {
  @ValidateNested()
  @Type(() => LevelEvaluationInputDto)
  input!: LevelEvaluationInputDto
}

/** 批量评估请求 DTO */
export class BatchLevelInputDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchLevelItemDto)
  items!: BatchLevelItemDto[]
}

/** 等级阈值配置 DTO */
export class LevelThresholdDto {
  @IsString()
  @IsEnum(['REGULAR', 'VIP', 'SVIP', 'DIAMOND', 'LEGEND', 'MYTH'])
  tier!: string

  @IsString()
  @IsEnum(['L1', 'L2', 'L3'])
  sub!: string

  @IsNumber()
  @Min(0)
  requiredGrowth!: number

  @IsNumber()
  @Min(0)
  requiredSpend!: number

  @IsNumber()
  @Min(0)
  requiredVisits!: number

  @IsArray()
  @IsString({ each: true })
  benefits!: string[]
}

/** 等级配置更新 DTO */
export class LevelConfigUpdateDto {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LevelThresholdDto)
  thresholds?: LevelThresholdDto[]
}

/** 等级查询 DTO */
export class LevelQueryDto {
  @IsOptional()
  @IsString()
  memberId?: string

  @IsOptional()
  @IsString()
  tier?: string
}
