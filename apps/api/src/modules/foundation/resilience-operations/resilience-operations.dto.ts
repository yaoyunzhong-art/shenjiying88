import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class ObservabilityQueryDto {
  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number
}

export class RetryPolicyQueryDto {
  @IsOptional()
  @IsString()
  capability?: string

  @IsOptional()
  @IsString()
  resource?: string
}

export class RecoveryPlanQueryDto {
  @IsOptional()
  @IsString()
  status?: string
}

export class StageEdgeReplayDto {
  @IsString()
  storeId!: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  operationCount!: number
}
