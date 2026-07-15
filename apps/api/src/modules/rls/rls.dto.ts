/**
 * rls.dto.ts — RLS API 数据传输对象
 *
 * 🐜 V18: CRUD增强 + 3项租户隔离增强 DTO
 *   - 新增: GetPolicyDto / UpdatePolicyDto / DeletePolicyDto / ListPoliciesDto
 *   - 新增: InitPoolDto / VerifyAccessDto / GetAuditLogDto
 *
 * 🐜 V17: P-31 RLS Extension
 */

import { IsOptional, IsString, IsInt, Matches, Max, MaxLength, Min, MinLength } from 'class-validator'
import { Type } from 'class-transformer'

const TABLE_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{0,127}$/
const COLUMN_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{0,127}$/

export class RlsStatusQueryDto {
  @IsOptional()
  @IsString()
  @Matches(TABLE_NAME_REGEX, {
    message: 'tableName must be a valid SQL identifier (alphanumeric/underscore, max 128)',
  })
  @MaxLength(128)
  table?: string
}

export class EnableRlsDto {
  @IsString()
  @Matches(TABLE_NAME_REGEX, {
    message: 'tableName must be a valid SQL identifier (alphanumeric/underscore, max 128)',
  })
  @MinLength(1)
  @MaxLength(128)
  tableName!: string
}

export class CreatePolicyDto {
  @IsString()
  @Matches(TABLE_NAME_REGEX, {
    message: 'tableName must be a valid SQL identifier (alphanumeric/underscore, max 128)',
  })
  @MinLength(1)
  @MaxLength(128)
  tableName!: string

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]{0,127}$/, {
    message: 'policyName must be a valid SQL identifier',
  })
  @MaxLength(128)
  policyName?: string

  @IsOptional()
  @IsString()
  @Matches(COLUMN_NAME_REGEX, {
    message: 'tenantColumn must be a valid column identifier',
  })
  @MaxLength(128)
  tenantColumn?: string

  @IsOptional()
  @IsString()
  @Matches(TABLE_NAME_REGEX, {
    message: 'schema must be a valid SQL identifier',
  })
  @MaxLength(128)
  schema?: string
}

export class GetPolicyDto {
  @IsString()
  @Matches(TABLE_NAME_REGEX, {
    message: 'tableName must be a valid SQL identifier',
  })
  @MinLength(1)
  @MaxLength(128)
  tableName!: string

  @IsString()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]{0,127}$/, {
    message: 'policyName must be a valid SQL identifier',
  })
  @MinLength(1)
  @MaxLength(128)
  policyName!: string

  @IsOptional()
  @IsString()
  @Matches(TABLE_NAME_REGEX, {
    message: 'schema must be a valid SQL identifier',
  })
  @MaxLength(128)
  schema?: string
}

export class ListPoliciesDto {
  @IsString()
  @Matches(TABLE_NAME_REGEX, {
    message: 'tableName must be a valid SQL identifier',
  })
  @MinLength(1)
  @MaxLength(128)
  tableName!: string

  @IsOptional()
  @IsString()
  @Matches(TABLE_NAME_REGEX, {
    message: 'schema must be a valid SQL identifier',
  })
  @MaxLength(128)
  schema?: string
}

export class UpdatePolicyDto {
  @IsString()
  @Matches(TABLE_NAME_REGEX, {
    message: 'tableName must be a valid SQL identifier',
  })
  @MinLength(1)
  @MaxLength(128)
  tableName!: string

  @IsString()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]{0,127}$/, {
    message: 'policyName must be a valid SQL identifier',
  })
  @MinLength(1)
  @MaxLength(128)
  policyName!: string

  @IsOptional()
  @IsString()
  @Matches(COLUMN_NAME_REGEX, {
    message: 'tenantColumn must be a valid column identifier',
  })
  @MaxLength(128)
  tenantColumn?: string

  @IsOptional()
  @IsString()
  @Matches(TABLE_NAME_REGEX, {
    message: 'schema must be a valid SQL identifier',
  })
  @MaxLength(128)
  schema?: string
}

export class DeletePolicyDto {
  @IsString()
  @Matches(TABLE_NAME_REGEX, {
    message: 'tableName must be a valid SQL identifier',
  })
  @MinLength(1)
  @MaxLength(128)
  tableName!: string

  @IsString()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]{0,127}$/, {
    message: 'policyName must be a valid SQL identifier',
  })
  @MinLength(1)
  @MaxLength(128)
  policyName!: string

  @IsOptional()
  @IsString()
  @Matches(TABLE_NAME_REGEX, {
    message: 'schema must be a valid SQL identifier',
  })
  @MaxLength(128)
  schema?: string
}

export class VerifyFilterDto {
  @IsString()
  @Matches(TABLE_NAME_REGEX, {
    message: 'tableName must be a valid SQL identifier',
  })
  @MinLength(1)
  @MaxLength(128)
  tableName!: string

  @IsString()
  @MinLength(1)
  @MaxLength(256)
  tenantId!: string

  @IsOptional()
  @IsString()
  @Matches(COLUMN_NAME_REGEX, {
    message: 'tenantColumn must be a valid column identifier',
  })
  @MaxLength(128)
  tenantColumn?: string

  @IsOptional()
  @IsString()
  @Matches(TABLE_NAME_REGEX, {
    message: 'schema must be a valid SQL identifier',
  })
  @MaxLength(128)
  schema?: string
}

export class SetupIsolationDto {
  @IsString()
  @Matches(TABLE_NAME_REGEX, {
    message: 'tableName must be a valid SQL identifier',
  })
  @MinLength(1)
  @MaxLength(128)
  tableName!: string

  @IsOptional()
  @IsString()
  @Matches(COLUMN_NAME_REGEX, {
    message: 'tenantColumn must be a valid column identifier',
  })
  @MaxLength(128)
  tenantColumn?: string

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]{0,127}$/, {
    message: 'policyName must be a valid SQL identifier',
  })
  @MaxLength(128)
  policyName?: string

  @IsOptional()
  @IsString()
  @Matches(TABLE_NAME_REGEX, {
    message: 'schema must be a valid SQL identifier',
  })
  @MaxLength(128)
  schema?: string
}

// ─── V18: 3项租户隔离增强 DTO ─────────────────────────────────

export class InitPoolDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  tenantId!: string
}

export class VerifyAccessDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  tenantId!: string

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  userId!: string
}

export class GetAuditLogDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  tenantId?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 50
}
