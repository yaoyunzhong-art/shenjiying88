import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength, MinLength } from 'class-validator'

export enum MaintenanceOrderStatus {
  PENDING = 'pending',         // 待处理
  IN_PROGRESS = 'in_progress', // 处理中
  PENDING_ACCEPTANCE = 'pending_acceptance', // 待验收
  COMPLETED = 'completed',     // 已完成
}

export class CreateMaintenanceOrderDto {
  @IsString()
  @IsNotEmpty()
  equipmentId!: string

  @IsString()
  @IsNotEmpty()
  equipmentName!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  issueDescription!: string

  @IsString()
  @IsNotEmpty()
  reporterId!: string

  @IsString()
  @IsNotEmpty()
  reporterName!: string

  @IsOptional()
  @IsString()
  storeId?: string
}

export class UpdateMaintenanceOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  assigneeName?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  completionNote?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  acceptanceNote?: string
}

export class QueryMaintenanceOrderDto {
  @IsOptional()
  @IsEnum(MaintenanceOrderStatus)
  status?: MaintenanceOrderStatus

  @IsOptional()
  @IsString()
  equipmentId?: string

  @IsOptional()
  @IsString()
  assigneeId?: string
}

// ── Procurement (耗材采购) ────────────────────────────────────

export enum ProcurementRequestStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ORDERED = 'ordered',
  RECEIVED = 'received',
}

export class CreateProcurementRequestDto {
  @IsString()
  @IsNotEmpty()
  requesterId!: string

  @IsString()
  @IsNotEmpty()
  requesterName!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  purpose!: string

  @IsOptional()
  @IsString()
  department?: string

  @IsOptional()
  @IsString()
  vendorName?: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string
}

export class QueryProcurementRequestDto {
  @IsOptional()
  @IsEnum(ProcurementRequestStatus)
  status?: ProcurementRequestStatus

  @IsOptional()
  @IsString()
  requesterId?: string
}
