// permission.dto.ts · 权限模块请求/响应DTO
// Phase-FP P0 · 2026-07-05

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'
import { PermissionLevel, ActionType, DataScopeType } from './permission.types'

// ─── 分配角色 DTO ────────────────────────────────────────────────────────

export class AssignRoleDto {
  /** 目标用户ID */
  @IsString()
  @IsNotEmpty()
  userId!: string

  /** 角色ID或角色名 */
  @IsString()
  @IsNotEmpty()
  roleId!: string

  /** 租户ID */
  @IsString()
  @IsNotEmpty()
  tenantId!: string

  /** 关联门店ID列表（可选） */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  storeIds?: string[]

  /** 关联品牌ID列表（可选） */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  brandIds?: string[]
}

// ─── 撤销角色 DTO ────────────────────────────────────────────────────────

export class RevokeRoleDto {
  /** 目标用户ID */
  @IsString()
  @IsNotEmpty()
  userId!: string

  /** 角色ID或角色名 */
  @IsString()
  @IsNotEmpty()
  roleId!: string

  /** 租户ID */
  @IsString()
  @IsNotEmpty()
  tenantId!: string
}

// ─── 创建角色 DTO ────────────────────────────────────────────────────────

export class CreateRoleDto {
  /** 角色英文名 */
  @IsString()
  @IsNotEmpty()
  roleName!: string

  /** 角色中文名 */
  @IsString()
  @IsNotEmpty()
  roleNameZh!: string

  /** 角色描述（可选） */
  @IsOptional()
  @IsString()
  description?: string

  /** 权限等级 */
  @IsEnum(PermissionLevel)
  level!: PermissionLevel

  /** 关联权限列表 */
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  permissions!: string[]

  /** 所属租户ID（可选，内置角色不填） */
  @IsOptional()
  @IsString()
  tenantId?: string
}

// ─── 检查权限请求 DTO ────────────────────────────────────────────────────

export class CheckPermissionDto {
  /** 资源标识（如 tenant:create） */
  @IsString()
  @IsNotEmpty()
  resource!: string

  /** 操作类型 */
  @IsEnum(ActionType)
  action!: ActionType

  /** 资源实例ID（可选） */
  @IsOptional()
  @IsString()
  resourceId?: string

  /** 额外上下文数据（可选） */
  @IsOptional()
  data?: Record<string, unknown>
}

// ─── 批量检查权限请求 DTO ────────────────────────────────────────────────

export class BatchCheckPermissionItemDto {
  /** 资源标识 */
  @IsString()
  @IsNotEmpty()
  resource!: string

  /** 操作类型 */
  @IsEnum(ActionType)
  action!: ActionType

  /** 资源实例ID（可选） */
  @IsOptional()
  @IsString()
  resourceId?: string
}

export class BatchCheckPermissionDto {
  /** 权限检查条目列表 */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchCheckPermissionItemDto)
  @ArrayMinSize(1)
  checks!: BatchCheckPermissionItemDto[]
}

// ─── 权限检查响应 DTO ────────────────────────────────────────────────────

export class PermissionCheckResultDto {
  /** 是否允许 */
  allowed!: boolean

  /** 拒绝原因（仅allowed=false时） */
  reason?: string

  /** 所需权限列表 */
  requiredPermissions?: string[]

  /** 数据范围 */
  dataScope?: {
    scopeType: DataScopeType
    allowedStoreIds?: string[]
    allowedBrandIds?: string[]
    ownOnly?: boolean
  }

  /** 评估时间戳 */
  evaluatedAt!: number
}

// ─── 用户权限信息响应 DTO ────────────────────────────────────────────────

export class UserPermissionInfoDto {
  /** 用户上下文 */
  context!: {
    userId: string
    tenantId: string
    roles: string[]
  }

  /** 权限列表 */
  permissions!: string[]

  /** 数据范围 */
  dataScope!: {
    scopeType: DataScopeType
    allowedStoreIds?: string[]
    allowedBrandIds?: string[]
    ownOnly?: boolean
  }
}

// ─── 通用响应 DTO ──────────────────────────────────────────────────────

export class ApiSuccessDto<T = unknown> {
  success!: boolean
  data!: T
}

export class ApiErrorDto {
  success!: boolean
  error!: {
    code: string
    message: string
    requiredPermissions?: string[]
  }
}
