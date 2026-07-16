import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator'
import 'reflect-metadata'
import {
  SupplierStatus,
  SupplierRating,
} from './supplier-manager.entity'

export class CreateSupplierDto {
  @IsString()
  name!: string

  @IsString()
  code!: string

  @IsString()
  contactPerson!: string

  @IsString()
  phone!: string

  @IsEmail()
  email!: string

  @IsString()
  address!: string

  @IsEnum(SupplierStatus)
  @IsOptional()
  status?: SupplierStatus

  @IsEnum(SupplierRating)
  @IsOptional()
  rating?: SupplierRating

  @IsString()
  category!: string

  @IsString()
  @IsOptional()
  remark?: string
}

export class UpdateSupplierDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  code?: string

  @IsString()
  @IsOptional()
  contactPerson?: string

  @IsString()
  @IsOptional()
  phone?: string

  @IsEmail()
  @IsOptional()
  email?: string

  @IsString()
  @IsOptional()
  address?: string

  @IsEnum(SupplierStatus)
  @IsOptional()
  status?: SupplierStatus

  @IsEnum(SupplierRating)
  @IsOptional()
  rating?: SupplierRating

  @IsString()
  @IsOptional()
  category?: string

  @IsString()
  @IsOptional()
  remark?: string
}

export class SupplierQueryDto {
  @IsEnum(SupplierStatus)
  @IsOptional()
  status?: SupplierStatus

  @IsEnum(SupplierRating)
  @IsOptional()
  rating?: SupplierRating

  @IsString()
  @IsOptional()
  category?: string

  @IsString()
  @IsOptional()
  search?: string
}
