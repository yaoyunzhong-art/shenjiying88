import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class ObservabilityQueryDto {
  @IsOptional()
  @IsString()
  status?: string
}

export class RetryPolicyQueryDto {
  @IsOptional()
  @IsString()
  capability?: string
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
