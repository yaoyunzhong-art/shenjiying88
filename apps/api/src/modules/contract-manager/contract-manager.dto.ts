import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'
import { ContractStatus, ContractType } from './contract-manager.entity'

// ═══════════════════════════════════════════════════════════════════════
// Contract DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateContractDto {
  @IsString()
  name!: string

  @IsEnum(ContractType)
  type!: ContractType

  @IsString()
  partyA!: string

  @IsString()
  partyB!: string

  @IsNumber()
  @Min(0)
  amount!: number

  @IsDateString()
  startDate!: string

  @IsDateString()
  endDate!: string

  @IsDateString()
  @IsOptional()
  signedDate?: string

  @IsString()
  @IsOptional()
  fileName?: string

  @IsString()
  @IsOptional()
  remark?: string
}

export class UpdateContractDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsEnum(ContractType)
  @IsOptional()
  type?: ContractType

  @IsString()
  @IsOptional()
  partyA?: string

  @IsString()
  @IsOptional()
  partyB?: string

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number

  @IsDateString()
  @IsOptional()
  startDate?: string

  @IsDateString()
  @IsOptional()
  endDate?: string

  @IsDateString()
  @IsOptional()
  signedDate?: string

  @IsString()
  @IsOptional()
  fileName?: string

  @IsString()
  @IsOptional()
  remark?: string
}

export class UpdateContractStatusDto {
  @IsEnum(ContractStatus)
  status!: ContractStatus
}

export class ContractQueryDto {
  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus

  @IsEnum(ContractType)
  @IsOptional()
  type?: ContractType

  @IsString()
  @IsOptional()
  search?: string
}

// ═══════════════════════════════════════════════════════════════════════
// Clause DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateClauseDto {
  @IsString()
  title!: string

  @IsString()
  content!: string

  @IsNumber()
  @Min(0)
  sortOrder!: number
}

export class UpdateClauseDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  content?: string

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number
}

export class BulkCreateClausesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateClauseDto)
  clauses!: CreateClauseDto[]
}
