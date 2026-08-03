import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

export enum SupplierStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum CreditLevelEnum {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

export enum ContractTypeEnum {
  ANNUAL = 'annual',
  QUARTERLY = 'quarterly',
  PROJECT = 'project',
  ONE_TIME = 'one_time',
}

export class SupplierContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone!: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string
}

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  name!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category!: string

  @IsOptional()
  @IsEnum(SupplierStatusEnum)
  status?: SupplierStatusEnum

  @IsOptional()
  @IsEnum(CreditLevelEnum)
  creditLevel?: CreditLevelEnum

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierContactDto)
  contacts?: SupplierContactDto[]

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mainProducts?: string[]

  @IsOptional()
  @IsNumber()
  @Min(0)
  cooperationYears?: number

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string
}

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string

  @IsOptional()
  @IsEnum(SupplierStatusEnum)
  status?: SupplierStatusEnum

  @IsOptional()
  @IsEnum(CreditLevelEnum)
  creditLevel?: CreditLevelEnum

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierContactDto)
  contacts?: SupplierContactDto[]

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mainProducts?: string[]

  @IsOptional()
  @IsNumber()
  @Min(0)
  cooperationYears?: number

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string
}

export class AddSupplierContractDto {
  @IsEnum(ContractTypeEnum)
  type!: ContractTypeEnum

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contractNumber!: string

  @IsString()
  @IsNotEmpty()
  startDate!: string

  @IsString()
  @IsNotEmpty()
  endDate!: string

  @IsNumber()
  @Min(0)
  amount!: number

  @IsOptional()
  autoRenew?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  terms?: string

  @IsOptional()
  @IsString()
  signedAt?: string
}

export class EvaluateSupplierDto {
  @IsNumber()
  @Min(1)
  @Max(10)
  qualityScore!: number

  @IsNumber()
  @Min(1)
  @Max(10)
  deliveryScore!: number

  @IsNumber()
  @Min(1)
  @Max(10)
  serviceScore!: number

  @IsNumber()
  @Min(1)
  @Max(10)
  priceScore!: number

  @IsString()
  @IsNotEmpty()
  evaluatorId!: string

  @IsString()
  @IsNotEmpty()
  evaluatorName!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  comment!: string
}

export class QuerySupplierDto {
  @IsOptional()
  @IsEnum(SupplierStatusEnum)
  status?: SupplierStatusEnum

  @IsOptional()
  @IsEnum(CreditLevelEnum)
  creditLevel?: CreditLevelEnum

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsString()
  search?: string
}
