import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsDateString,
  Min,
  Max,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

// ── 采购订单状态枚举 ────────────────────────────────────────────────────────

export enum SupplyOrderStatusEnum {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  ORDERED = 'ordered',
  PARTIAL_RECEIVED = 'partial_received',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

// ── 采购订单物品 DTO ────────────────────────────────────────────────────────

export class SupplyOrderItemDto {
  @IsString()
  @IsNotEmpty()
  inventoryItemId!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  itemName!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unit!: string

  @IsNumber()
  @Min(1)
  quantity!: number

  @IsNumber()
  @Min(0)
  unitPrice!: number
}

// ── 创建采购订单 DTO ────────────────────────────────────────────────────────

export class CreateSupplyOrderDto {
  @IsString()
  @IsNotEmpty()
  orderNumber!: string

  @IsString()
  @IsNotEmpty()
  vendorId!: string

  @IsString()
  @IsNotEmpty()
  vendorName!: string

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SupplyOrderItemDto)
  items!: SupplyOrderItemDto[]

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string

  @IsOptional()
  @IsString()
  createdByName?: string

  @IsOptional()
  @IsString()
  storeId?: string
}

// ── 更新采购订单 DTO ────────────────────────────────────────────────────────

export class UpdateSupplyOrderDto {
  @IsOptional()
  @IsEnum(SupplyOrderStatusEnum)
  status?: SupplyOrderStatusEnum

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string

  @IsOptional()
  @IsDateString()
  actualDeliveryDate?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string
}

// ── 供应商状态/评级枚举 ─────────────────────────────────────────────────────

export enum VendorStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum VendorGradeEnum {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

export class VendorContactDto {
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

// ── 创建供应商 DTO ──────────────────────────────────────────────────────────

export class CreateSupplyVendorDto {
  @IsString()
  @IsNotEmpty()
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

  @IsEnum(VendorGradeEnum)
  grade!: VendorGradeEnum

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorContactDto)
  contacts!: VendorContactDto[]

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
  @MaxLength(500)
  notes?: string
}

// ── 更新供应商 DTO ──────────────────────────────────────────────────────────

export class UpdateSupplyVendorDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string

  @IsOptional()
  @IsEnum(VendorStatusEnum)
  status?: VendorStatusEnum

  @IsOptional()
  @IsEnum(VendorGradeEnum)
  grade?: VendorGradeEnum

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mainProducts?: string[]

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string
}

// ── 库存物品分类枚举 ────────────────────────────────────────────────────────

export enum InventoryCategoryEnum {
  CONSUMABLE = 'consumable',
  SPARE_PART = 'spare_part',
  TOOL = 'tool',
  EQUIPMENT = 'equipment',
  CLEANING_SUPPLY = 'cleaning_supply',
  OFFICE_SUPPLY = 'office_supply',
  OTHER = 'other',
}

// ── 创建库存物品 DTO ────────────────────────────────────────────────────────

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  itemCode!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  name!: string

  @IsEnum(InventoryCategoryEnum)
  category!: InventoryCategoryEnum

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unit!: string

  @IsNumber()
  @Min(0)
  quantity!: number

  @IsNumber()
  @Min(0)
  minQuantity!: number

  @IsOptional()
  @IsString()
  @MaxLength(200)
  specification?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number

  @IsOptional()
  @IsString()
  @MaxLength(50)
  warehouseCode?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string

  @IsOptional()
  @IsString()
  storeId?: string
}

// ── 更新库存物品 DTO ────────────────────────────────────────────────────────

export class UpdateInventoryItemDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  minQuantity?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string
}

// ── 维护任务类型/优先级/状态枚举 ─────────────────────────────────────────────

export enum MaintenanceTaskTypeEnum {
  ROUTINE_INSPECTION = 'routine_inspection',
  REPAIR = 'repair',
  PREVENTIVE_MAINTENANCE = 'preventive_maintenance',
  EMERGENCY_REPAIR = 'emergency_repair',
  CLEANING = 'cleaning',
}

export enum MaintenanceTaskPriorityEnum {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum MaintenanceTaskStatusEnum {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// ── 创建维护任务 DTO ────────────────────────────────────────────────────────

export class CreateMaintenanceTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  equipmentName!: string

  @IsOptional()
  @IsString()
  equipmentId?: string

  @IsEnum(MaintenanceTaskTypeEnum)
  taskType!: MaintenanceTaskTypeEnum

  @IsEnum(MaintenanceTaskPriorityEnum)
  priority!: MaintenanceTaskPriorityEnum

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string

  @IsOptional()
  @IsString()
  assigneeId?: string

  @IsOptional()
  @IsString()
  assigneeName?: string

  @IsOptional()
  @IsDateString()
  scheduledAt?: string

  @IsOptional()
  @IsString()
  reportedByName?: string

  @IsOptional()
  @IsString()
  storeId?: string
}

// ── 更新维护任务 DTO ────────────────────────────────────────────────────────

export class UpdateMaintenanceTaskDto {
  @IsOptional()
  @IsEnum(MaintenanceTaskStatusEnum)
  status?: MaintenanceTaskStatusEnum

  @IsOptional()
  @IsString()
  assigneeId?: string

  @IsOptional()
  @IsString()
  assigneeName?: string

  @IsOptional()
  @IsDateString()
  scheduledAt?: string

  @IsOptional()
  @IsDateString()
  startedAt?: string

  @IsOptional()
  @IsDateString()
  completedAt?: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  completionNote?: string
}

// ── 查询 DTO ────────────────────────────────────────────────────────────────

export class QuerySupplyOrderDto {
  @IsOptional()
  @IsEnum(SupplyOrderStatusEnum)
  status?: SupplyOrderStatusEnum

  @IsOptional()
  @IsString()
  vendorId?: string
}

export class QueryInventoryItemDto {
  @IsOptional()
  @IsEnum(InventoryCategoryEnum)
  category?: InventoryCategoryEnum

  @IsOptional()
  @IsString()
  storeId?: string

  @IsOptional()
  @IsString()
  search?: string
}

export class QueryMaintenanceTaskDto {
  @IsOptional()
  @IsEnum(MaintenanceTaskStatusEnum)
  status?: MaintenanceTaskStatusEnum

  @IsOptional()
  @IsEnum(MaintenanceTaskTypeEnum)
  taskType?: MaintenanceTaskTypeEnum

  @IsOptional()
  @IsString()
  storeId?: string
}
