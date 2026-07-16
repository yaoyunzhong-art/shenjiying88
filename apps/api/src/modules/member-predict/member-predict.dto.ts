import { IsString, IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator'
import 'reflect-metadata'
import { RiskLevel, PredictHorizon } from './member-predict.entity'

/** 预测查询 DTO */
export class PredictQueryDto {
  @IsOptional()
  @IsString()
  storeId?: string

  @IsOptional()
  @IsString()
  @IsEnum(RiskLevel)
  riskLevel?: string

  @IsOptional()
  @IsNumber()
  @IsEnum(PredictHorizon)
  predictHorizon?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minScore?: number
}

/** 会员预测 DTO */
export interface MemberPredictDto {
  memberId: string
  memberName: string
  memberLevel: string
  riskScore: number
  riskLevel: string
  churnProbability: number
  predictedChurnDate: string
  mainReason: string
  suggestedAction: string
  lastActiveDate: string
}

/** 预测汇总 DTO */
export interface PredictSummaryDto {
  totalPredicted: number
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
  avgRiskScore: number
  predictedLossAmount: number
  recommendedActions: string[]
}

/** 预测列表 DTO */
export interface MemberPredictListDto {
  items: MemberPredictDto[]
  total: number
}
