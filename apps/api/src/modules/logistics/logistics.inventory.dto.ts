import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, Min, MaxLength, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateReservationDto {
  @IsOptional()
  @IsString()
  materialRequestId?: string

  @IsOptional()
  @IsString()
  procurementRequestId?: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  warehouseCode!: string

  @IsString()
  @IsNotEmpty()
  expiresAt!: string

  @IsString()
  @IsNotEmpty()
  operatorId!: string

  @IsString()
  @IsNotEmpty()
  operatorName!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservationItemDto)
  items!: ReservationItemDto[]
}

class ReservationItemDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string

  @IsString()
  @IsNotEmpty()
  itemName!: string

  @IsString()
  @IsNotEmpty()
  category!: string

  @IsNumber()
  @Min(1)
  quantity!: number

  @IsString()
  @IsNotEmpty()
  unit!: string
}

export class CheckInventoryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckItemDto)
  items!: CheckItemDto[]

  @IsOptional()
  @IsString()
  warehouseCode?: string
}

class CheckItemDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string

  @IsString()
  @IsNotEmpty()
  itemName!: string

  @IsNumber()
  @Min(1)
  quantity!: number
}
