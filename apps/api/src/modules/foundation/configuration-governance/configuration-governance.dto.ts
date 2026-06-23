import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator'

export class ConfigurationScopeDto {
  @IsOptional()
  @IsString()
  tenantId?: string

  @IsOptional()
  @IsString()
  brandId?: string

  @IsOptional()
  @IsString()
  storeId?: string

  @IsOptional()
  @IsString()
  marketCode?: string
}

export class FeatureFlagQueryDto extends ConfigurationScopeDto {
  @IsOptional()
  @IsString()
  subjectKey?: string
}

export class RotateSecretDto {
  @IsOptional()
  @IsString()
  rotatedBy?: string

  @IsOptional()
  @IsString()
  requestedBy?: string

  @IsOptional()
  @IsString()
  approvalTicket?: string

  @IsOptional()
  @IsIn(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'])
  approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
}

export class ConfigEntryQueryDto extends ConfigurationScopeDto {
  @IsOptional()
  @IsString()
  namespace?: string

  @IsOptional()
  @IsString()
  key?: string
}

export class CertificateQueryDto extends ConfigurationScopeDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsIn(['active', 'expiring-soon', 'expired'])
  status?: 'active' | 'expiring-soon' | 'expired'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  expiringWithinDays?: number
}

export class UpsertConfigEntryDto extends ConfigurationScopeDto {
  @IsString()
  namespace!: string

  @IsString()
  key!: string

  @IsIn(['JSON', 'STRING', 'NUMBER', 'BOOLEAN'])
  valueType!: 'JSON' | 'STRING' | 'NUMBER' | 'BOOLEAN'

  @IsIn(['PLATFORM', 'TENANT', 'BRAND', 'STORE', 'MARKET', 'PORTAL', 'USER', 'DEVICE', 'INTEGRATION'])
  scopeType!: 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE' | 'MARKET' | 'PORTAL' | 'USER' | 'DEVICE' | 'INTEGRATION'

  @IsDefined()
  value!: unknown

  @IsOptional()
  @IsString()
  marketProfileId?: string

  @IsOptional()
  @IsString()
  portalSiteId?: string

  @IsOptional()
  @IsString()
  schemaRef?: string

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  changedBy?: string

  @IsOptional()
  @IsString()
  changeReason?: string

  @IsOptional()
  @IsString()
  requestedBy?: string

  @IsOptional()
  @IsString()
  approvalTicket?: string

  @IsOptional()
  @IsIn(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'])
  approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
}

export class PersistFeatureFlagDto extends ConfigurationScopeDto {
  @IsString()
  key!: string

  @IsString()
  name!: string

  @IsIn(['PLATFORM', 'TENANT', 'BRAND', 'STORE', 'MARKET', 'PORTAL', 'USER', 'DEVICE', 'INTEGRATION'])
  scopeType!: 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE' | 'MARKET' | 'PORTAL' | 'USER' | 'DEVICE' | 'INTEGRATION'

  @IsIn(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'])
  status!: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'

  @IsIn(['ALL', 'PERCENTAGE', 'ALLOW_LIST', 'SCOPE_MATCH'])
  strategy!: 'ALL' | 'PERCENTAGE' | 'ALLOW_LIST' | 'SCOPE_MATCH'

  @IsBoolean()
  enabled!: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  percentage?: number

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  allowList?: string[]

  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown>

  @IsOptional()
  @IsString()
  marketProfileId?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  note?: string

  @IsOptional()
  @IsString()
  startsAt?: string

  @IsOptional()
  @IsString()
  endsAt?: string

  @IsOptional()
  @IsString()
  requestedBy?: string

  @IsOptional()
  @IsString()
  approvalTicket?: string

  @IsOptional()
  @IsIn(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'])
  approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
}

export class RegisterSecretDto extends ConfigurationScopeDto {
  @IsString()
  key!: string

  @IsIn(['api-key', 'webhook-signing', 'certificate'])
  type!: 'api-key' | 'webhook-signing' | 'certificate'

  @IsIn(['PLATFORM', 'TENANT', 'BRAND', 'STORE', 'MARKET', 'PORTAL', 'USER', 'DEVICE', 'INTEGRATION'])
  scopeType!: 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE' | 'MARKET' | 'PORTAL' | 'USER' | 'DEVICE' | 'INTEGRATION'

  @IsOptional()
  @IsIn(['DATABASE', 'VAULT', 'KMS', 'EXTERNAL'])
  provider?: 'DATABASE' | 'VAULT' | 'KMS' | 'EXTERNAL'

  @IsOptional()
  @IsString()
  integrationAppId?: string

  @IsOptional()
  @IsString()
  reference?: string

  @IsOptional()
  @IsString()
  value?: string

  @IsOptional()
  @IsString()
  algorithm?: string

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  scopes?: string[]

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  consumers?: string[]

  @IsOptional()
  @IsString()
  expiresAt?: string

  @IsOptional()
  @IsString()
  rotatedBy?: string

  @IsOptional()
  @IsString()
  requestedBy?: string

  @IsOptional()
  @IsString()
  approvalTicket?: string

  @IsOptional()
  @IsIn(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'])
  approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
}
