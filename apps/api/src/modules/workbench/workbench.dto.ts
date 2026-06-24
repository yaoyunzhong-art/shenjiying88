import 'reflect-metadata'
import {
  IsIn,
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  IsObject,
  ValidateNested,
  IsNotEmpty,
  IsEnum
} from 'class-validator'
import { Type } from 'class-transformer'
import {
  runtimeGovernanceCallbackEvents,
  runtimeGovernanceCallbackStatuses,
  runtimeGovernanceReplaySources,
  type RuntimeGovernanceCallbackEvent,
  type RuntimeGovernanceCallbackStatus,
  type RuntimeGovernanceReplaySource
} from '@m5/types'

/** 角色引导配置查询 DTO */
export class RoleBootstrapConfigQueryDto {
  @IsString()
  @IsNotEmpty()
  role!: string
}

/** 角色菜单越权检查 DTO */
export class RoleMenuAccessCheckDto {
  @IsString()
  @IsNotEmpty()
  actorRole!: string

  @IsString()
  @IsNotEmpty()
  targetMenuRole!: string
}

/**
 * 导航项查询 DTO
 */
export class NavItemQueryDto {
  @IsString()
  @IsOptional()
  role?: string

  @IsString()
  @IsOptional()
  channel?: string

  @IsString()
  @IsOptional()
  marketCode?: string

  @IsString()
  @IsOptional()
  capability?: string
}

/**
 * 工作台列表查询 DTO
 */
export class WorkbenchQueryDto {
  @IsString()
  @IsOptional()
  role?: string

  @IsString()
  @IsOptional()
  channel?: string

  @IsBoolean()
  @IsOptional()
  initialized?: boolean
}

/**
 * 租户上下文 DTO
 */
export class TenantContextDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string

  @IsString()
  @IsOptional()
  brandId?: string

  @IsString()
  @IsOptional()
  storeId?: string

  @IsString()
  @IsOptional()
  marketCode?: string
}

/**
 * Bootstrap 请求 DTO
 */
export class WorkbenchBootstrapRequestDto {
  @ValidateNested()
  @Type(() => TenantContextDto)
  @IsNotEmpty()
  tenantContext!: TenantContextDto
}

/**
 * 角色能力检查 DTO
 */
export class CapabilityCheckDto {
  @IsString()
  @IsNotEmpty()
  role!: string

  @IsString()
  @IsNotEmpty()
  capability!: string
}

/**
 * 角色能力批量检查 DTO
 */
export class CapabilityBatchCheckDto {
  @IsString()
  @IsNotEmpty()
  role!: string

  @IsArray()
  capabilities!: string[]
}

export class WorkbenchApprovalExecuteDto {
  @IsString()
  @IsNotEmpty()
  approvalCode!: string

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string

  @IsString()
  @IsOptional()
  operatorNote?: string

  @IsString()
  @IsOptional()
  challengeProfile?: string

  @IsObject()
  @IsOptional()
  payload?: Record<string, unknown>
}

export class WorkbenchSecretRotationDto {
  @IsString()
  @IsNotEmpty()
  secretName!: string

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string

  @IsString()
  @IsOptional()
  rotationReason?: string

  @IsString()
  @IsOptional()
  targetScope?: string

  @IsObject()
  @IsOptional()
  payload?: Record<string, unknown>
}

export class WorkbenchRuntimeReplaySubmitDto {
  @IsString()
  @IsNotEmpty()
  sourceReceiptCode!: string

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string

  @IsString()
  @IsOptional()
  operatorNote?: string

  @IsObject()
  @IsOptional()
  payload?: Record<string, unknown>
}

export class WorkbenchHandlerSyncDto {
  @IsString()
  @IsNotEmpty()
  ticketCode!: string

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string
}

export class WorkbenchHandlerCallbackDto {
  @IsIn(runtimeGovernanceCallbackStatuses)
  callbackStatus!: RuntimeGovernanceCallbackStatus

  @IsString()
  @IsNotEmpty()
  ackToken!: string

  @IsIn(runtimeGovernanceCallbackEvents)
  lastEvent!: RuntimeGovernanceCallbackEvent

  @IsString()
  @IsNotEmpty()
  summary!: string

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string
}

export class WorkbenchActionReplayDto {
  @IsString()
  @IsNotEmpty()
  ledgerKey!: string

  @IsIn(runtimeGovernanceReplaySources)
  requestedFrom!: RuntimeGovernanceReplaySource

  @IsString()
  @IsNotEmpty()
  ticketCode!: string

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string
}
