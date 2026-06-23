import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'
import {
  CampaignActionKind,
  CampaignConditionType,
  CampaignStatus,
  CampaignTrigger,
  type CampaignAction,
  type CampaignCondition
} from './campaign.entity'

export class CampaignConditionDto implements CampaignCondition {
  @IsEnum(CampaignConditionType)
  type!: CampaignConditionType

  value!: number | string | string[]
}

export class CampaignActionDto implements CampaignAction {
  @IsEnum(CampaignActionKind)
  kind!: CampaignActionKind

  params!: CampaignAction['params']
}

export class RegisterCampaignDto {
  @IsString()
  code!: string

  @IsString()
  title!: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(CampaignTrigger)
  triggerEvent!: CampaignTrigger

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignConditionDto)
  conditions!: CampaignConditionDto[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignActionDto)
  actions!: CampaignActionDto[]

  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number

  @IsISO8601()
  @IsOptional()
  scheduledStart?: string

  @IsISO8601()
  @IsOptional()
  scheduledEnd?: string
}

export class UpdateCampaignStatusDto {
  @IsEnum(CampaignStatus)
  status!: CampaignStatus
}
