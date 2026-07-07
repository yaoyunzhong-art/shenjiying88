// rbac.dto.ts · RBAC 请求/响应 DTO
// 2026-07-06 · 5级权限体系校验

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator'
import { Role, Permission } from './rbac.service'

// ─── 请求 DTO ──────────────────────────────────────────────────────────

export class AssignRoleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(64)
  userId!: string

  @IsString()
  @IsNotEmpty()
  @IsEnum(['owner', 'admin', 'manager', 'staff', 'guest'], {
    message: 'Invalid role. Must be one of: owner, admin, manager, staff, guest',
  })
  role!: Role

  @IsString()
  @IsOptional()
  @MaxLength(64)
  tenantId?: string

  @IsString()
  @IsOptional()
  @MaxLength(64)
  assignedBy?: string
}

export class RevokeRoleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(64)
  userId!: string

  @IsString()
  @IsOptional()
  @MaxLength(64)
  tenantId?: string
}

export class CheckPermissionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(64)
  userId!: string

  @IsString()
  @IsNotEmpty()
  permission!: Permission

  @IsString()
  @IsOptional()
  @MaxLength(64)
  tenantId?: string
}

export class RegisterPolicyDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['owner', 'admin', 'manager', 'staff', 'guest'], {
    message: 'Invalid role. Must be one of: owner, admin, manager, staff, guest',
  })
  role!: Role

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  permissions!: Permission[]

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  deniedPermissions?: Permission[]
}

export class RegisterProtectedActionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  controllerName!: string

  @IsNotEmpty()
  actions!: Record<string, Permission[]>
}

// ─── 响应 DTO ──────────────────────────────────────────────────────────

export class PermissionReportResponse {
  roles!: Array<{
    userId: string
    role: Role
    tenantId?: string
    assignedAt: Date
    assignedBy: string
  }>
  effectivePermissions!: string[]
  deniedPermissions!: string[]
}

export class CheckPermissionResponse {
  allowed!: boolean
  reason?: string
}

export class RoleActionsResponse {
  controllerName!: string
  actions!: Record<string, Permission[]>
}
