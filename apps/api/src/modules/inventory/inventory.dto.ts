import { IsString, IsNumber, IsOptional, IsEnum, IsArray, Min, Max, ArrayMinSize, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ProductStatus, StockRecordType, PurchaseOrderStatus } from './inventory.entity'

// ─── Product DTOs ───────────────────────────────────────

export class CreateProductDto {
  @IsString()
  name!: string

  @IsString()
  sku!: string

  @IsOptional()
  @IsString()
  category?: string

  @IsString()
  unit!: string

  @IsNumber()
  @Min(0)
  price!: number

  @IsNumber()
  @Min(0)
  cost!: number

  @IsNumber()
  @Min(0)
  minStock!: number

  @IsNumber()
  @Min(0)
  maxStock!: number

  @IsNumber()
  @Min(0)
  currentStock!: number

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus

  @IsOptional()
  @IsString()
  imageUrl?: string

  @IsOptional()
  @IsString()
  barcode?: string
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  sku?: string

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsString()
  unit?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStock?: number

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus

  @IsOptional()
  @IsString()
  imageUrl?: string

  @IsOptional()
  @IsString()
  barcode?: string
}

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offset?: number
}

// ─── Stock DTOs ─────────────────────────────────────────

export class StockInDto {
  @IsString()
  productId!: string

  @IsNumber()
  @Min(1)
  quantity!: number

  @IsOptional()
  @IsString()
  reason?: string

  @IsOptional()
  @IsString()
  batchNo?: string
}

export class StockOutDto {
  @IsString()
  productId!: string

  @IsNumber()
  @Min(1)
  quantity!: number

  @IsOptional()
  @IsString()
  reason?: string
}

export class AdjustStockDto {
  @IsString()
  productId!: string

  @IsNumber()
  @Min(0)
  newQuantity!: number

  @IsString()
  reason!: string
}

export class StockRecordQueryDto {
  @IsOptional()
  @IsString()
  productId?: string

  @IsOptional()
  @IsEnum(StockRecordType)
  type?: StockRecordType

  @IsOptional()
  @IsString()
  dateFrom?: string

  @IsOptional()
  @IsString()
  dateTo?: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offset?: number
}

// ─── Supplier DTOs ──────────────────────────────────────

export class CreateSupplierDto {
  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  contactName?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  address?: string
}

// ─── Purchase Order DTOs ────────────────────────────────

export class CreatePurchaseOrderItemDto {
  @IsString()
  productId!: string

  @IsString()
  productName!: string

  @IsString()
  sku!: string

  @IsNumber()
  @Min(1)
  quantity!: number

  @IsNumber()
  @Min(0)
  unitPrice!: number

  @IsNumber()
  @Min(0)
  totalPrice!: number
}

export class CreatePurchaseOrderDto {
  @IsOptional()
  @IsString()
  storeId?: string

  @IsOptional()
  @IsString()
  supplierId?: string

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items!: CreatePurchaseOrderItemDto[]

  @IsNumber()
  @Min(0)
  totalAmount!: number
}

export class PurchaseOrderQueryDto {
  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus

  @IsOptional()
  @IsString()
  supplierId?: string

  @IsOptional()
  @IsString()
  storeId?: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offset?: number
}
