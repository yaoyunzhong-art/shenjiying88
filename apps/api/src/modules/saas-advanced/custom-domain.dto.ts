import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'

const DOMAIN_STATUS_VALUES = [
  'pending_verification',
  'active',
  'ssl_issuing',
  'active_ssl',
  'ssl_failed',
  'disabled',
] as const

const DOMAIN_SCOPE_VALUES = ['TENANT', 'BRAND', 'STORE'] as const
const DOMAIN_SORT_FIELD_VALUES = ['createdAt', 'updatedAt', 'domain', 'status'] as const
const DOMAIN_SORT_ORDER_VALUES = ['asc', 'desc'] as const

export class AddDomainRequest {
  @ApiProperty({ example: 'brand.example.io', description: '待接入的平台自定义域名' })
  @IsString()
  @MinLength(1)
  @MaxLength(253)
  domain!: string
}

export class ValidateDomainRequest {
  @ApiProperty({ example: 'brand.example.io' })
  @IsString()
  @MinLength(1)
  @MaxLength(253)
  domain!: string
}

export class ValidateDomainResponse {
  @ApiProperty({ example: true })
  valid!: boolean

  @ApiPropertyOptional({ example: '域名格式不合法 (需 FQDN)' })
  error?: string
}

export class DomainVerifyHint {
  @ApiProperty({ example: '_shenjiying-verify.brand.example.io' })
  host!: string

  @ApiProperty({ example: 'shenjiying-verify=token123' })
  value!: string

  @ApiProperty({ example: 'TXT' })
  type!: 'TXT'

  @ApiProperty({ example: '请在 DNS 服务商添加 TXT 记录' })
  instructions!: string
}

export class DomainSslInfo {
  @ApiProperty({ example: 'letsencrypt' })
  provider!: string

  @ApiProperty({ example: '2026-09-29T00:00:00.000Z' })
  expiresAt!: string

  @ApiProperty({ example: 'fingerprint-abc123' })
  fingerprint!: string

  @ApiProperty({ example: '2026-06-30T00:00:00.000Z' })
  lastRenewedAt!: string
}

export class DomainListItem {
  @ApiProperty({ example: 'dom-001' })
  id!: string

  @ApiProperty({ example: 'TENANT' })
  scopeType!: string

  @ApiProperty({ example: 'tenant-abc' })
  tenantId!: string

  @ApiPropertyOptional({ example: 'brand-001' })
  brandId?: string

  @ApiPropertyOptional({ example: 'store-001' })
  storeId?: string

  @ApiPropertyOptional({ example: true })
  isPrimary?: boolean

  @ApiProperty({ example: 'brand.example.io' })
  domain!: string

  @ApiProperty({ example: 'active' })
  status!: string

  @ApiProperty({ example: 0 })
  verificationFailCount!: number

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  createdAt!: string

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  updatedAt!: string

  @ApiProperty({ example: 'user-001' })
  createdBy!: string
}

export class DomainListResponse {
  @ApiProperty({ type: () => [DomainListItem] })
  items!: DomainListItem[]

  @ApiProperty({ example: 1 })
  total!: number

  @ApiProperty({ example: 1 })
  page!: number

  @ApiProperty({ example: 10 })
  pageSize!: number

  @ApiProperty({ example: 3 })
  totalPages!: number

  @ApiProperty({ example: true })
  hasNextPage!: boolean

  @ApiProperty({ example: false })
  hasPreviousPage!: boolean

  @ApiProperty({ example: 'createdAt', enum: DOMAIN_SORT_FIELD_VALUES })
  sortBy!: (typeof DOMAIN_SORT_FIELD_VALUES)[number]

  @ApiProperty({ example: 'desc', enum: DOMAIN_SORT_ORDER_VALUES })
  sortOrder!: (typeof DOMAIN_SORT_ORDER_VALUES)[number]
}

export class DomainDetailResponse extends DomainListItem {
  @ApiPropertyOptional({ type: () => DomainSslInfo })
  ssl?: DomainSslInfo

  @ApiPropertyOptional({ example: '2026-06-30T00:00:00.000Z' })
  lastVerifiedAt?: string

  @ApiProperty({ type: () => DomainVerifyHint })
  hint!: DomainVerifyHint
}

export class ResolveHostRequest {
  @ApiProperty({ example: 'brand.example.io' })
  @IsString()
  @MinLength(1)
  @MaxLength(253)
  host!: string
}

export class ResolveHostResponse {
  @ApiProperty({ example: 'brand.example.io' })
  host!: string

  @ApiProperty({ example: 'tenant-abc', nullable: true })
  tenantId!: string | null

  @ApiProperty({ example: true })
  resolved!: boolean
}

export class DomainListQueryRequest {
  @ApiPropertyOptional({ description: '按域名关键字模糊搜索', example: 'brand-http' })
  @IsString()
  @IsOptional()
  @MaxLength(253)
  keyword?: string

  @ApiPropertyOptional({
    description: '按域名状态筛选',
    enum: DOMAIN_STATUS_VALUES,
    example: 'active',
  })
  @IsIn(DOMAIN_STATUS_VALUES)
  @IsOptional()
  status?: (typeof DOMAIN_STATUS_VALUES)[number]

  @ApiPropertyOptional({
    description: '按作用域类型筛选',
    enum: DOMAIN_SCOPE_VALUES,
    example: 'BRAND',
  })
  @IsIn(DOMAIN_SCOPE_VALUES)
  @IsOptional()
  scopeType?: (typeof DOMAIN_SCOPE_VALUES)[number]

  @ApiPropertyOptional({ description: '分页页码', example: 1, default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1

  @ApiPropertyOptional({
    description: '排序字段',
    enum: DOMAIN_SORT_FIELD_VALUES,
    example: 'createdAt',
  })
  @IsIn(DOMAIN_SORT_FIELD_VALUES)
  @IsOptional()
  sortBy?: (typeof DOMAIN_SORT_FIELD_VALUES)[number] = 'createdAt'

  @ApiPropertyOptional({
    description: '排序方向',
    enum: DOMAIN_SORT_ORDER_VALUES,
    example: 'desc',
  })
  @IsIn(DOMAIN_SORT_ORDER_VALUES)
  @IsOptional()
  sortOrder?: (typeof DOMAIN_SORT_ORDER_VALUES)[number] = 'desc'

  @ApiPropertyOptional({
    description: '每页条数',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number = 10
}
