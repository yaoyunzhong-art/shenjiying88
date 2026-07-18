import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsArray,
  IsBoolean,
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
const GOVERNANCE_SORT_FIELD_VALUES = [
  'activeCount',
  'scopeType',
  'recommendedDomain',
  'latestUpdatedAt',
] as const

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

export class CurrentPrimaryDomainQueryRequest {
  @ApiPropertyOptional({
    description: '查询的作用域类型，默认按当前租户上下文推断',
    enum: DOMAIN_SCOPE_VALUES,
    example: 'BRAND',
  })
  @IsIn(DOMAIN_SCOPE_VALUES)
  @IsOptional()
  scopeType?: (typeof DOMAIN_SCOPE_VALUES)[number]

  @ApiPropertyOptional({ description: '品牌作用域标识，不传则尝试使用当前上下文 brandId', example: 'brand-001' })
  @IsString()
  @IsOptional()
  brandId?: string

  @ApiPropertyOptional({ description: '门店作用域标识，不传则尝试使用当前上下文 storeId', example: 'store-001' })
  @IsString()
  @IsOptional()
  storeId?: string
}

export class CurrentPrimaryDomainResponse {
  @ApiProperty({ example: 'BRAND' })
  scopeType!: string

  @ApiProperty({ example: 'tenant-abc' })
  tenantId!: string

  @ApiPropertyOptional({ example: 'brand-001' })
  brandId?: string

  @ApiPropertyOptional({ example: 'store-001' })
  storeId?: string

  @ApiProperty({ example: true })
  resolved!: boolean

  @ApiPropertyOptional({ type: () => DomainListItem, nullable: true })
  item?: DomainListItem | null
}

export class BatchCurrentPrimaryDomainQueryItem {
  @ApiProperty({
    description: '查询的作用域类型',
    enum: DOMAIN_SCOPE_VALUES,
    example: 'BRAND',
  })
  @IsIn(DOMAIN_SCOPE_VALUES)
  scopeType!: (typeof DOMAIN_SCOPE_VALUES)[number]

  @ApiPropertyOptional({ description: '品牌作用域标识', example: 'brand-001' })
  @IsString()
  @IsOptional()
  brandId?: string

  @ApiPropertyOptional({ description: '门店作用域标识', example: 'store-001' })
  @IsString()
  @IsOptional()
  storeId?: string
}

export class BatchCurrentPrimaryDomainRequest {
  @ApiProperty({ type: () => [BatchCurrentPrimaryDomainQueryItem] })
  @IsArray()
  @Type(() => BatchCurrentPrimaryDomainQueryItem)
  items!: BatchCurrentPrimaryDomainQueryItem[]
}

export class BatchCurrentPrimaryDomainResponse {
  @ApiProperty({ type: () => [CurrentPrimaryDomainResponse] })
  items!: CurrentPrimaryDomainResponse[]
}

export class ActiveWithoutPrimaryScopeItem {
  @ApiProperty({ example: 'BRAND' })
  scopeType!: string

  @ApiProperty({ example: 'tenant-abc' })
  tenantId!: string

  @ApiPropertyOptional({ example: 'brand-001' })
  brandId?: string

  @ApiPropertyOptional({ example: 'store-001' })
  storeId?: string

  @ApiProperty({ example: 2 })
  activeCount!: number

  @ApiProperty({ example: '2026-07-18T02:00:00.000Z' })
  latestUpdatedAt!: string

  @ApiPropertyOptional({ type: () => DomainListItem, nullable: true })
  recommendedItem?: DomainListItem | null

  @ApiPropertyOptional({ example: '优先推荐 active_ssl，且最近一次校验/更新时间更新' })
  recommendationReason?: string

  @ApiProperty({ type: () => [DomainListItem] })
  candidateDomains!: DomainListItem[]
}

export class ActiveWithoutPrimaryGovernanceResponse {
  @ApiProperty({ example: 1 })
  total!: number

  @ApiProperty({ type: () => [ActiveWithoutPrimaryScopeItem] })
  items!: ActiveWithoutPrimaryScopeItem[]

  @ApiProperty({ example: 1 })
  page!: number

  @ApiProperty({ example: 10 })
  pageSize!: number

  @ApiProperty({ example: 1 })
  totalPages!: number

  @ApiProperty({ example: false })
  hasNextPage!: boolean

  @ApiProperty({ example: false })
  hasPreviousPage!: boolean

  @ApiProperty({ example: 'activeCount', enum: GOVERNANCE_SORT_FIELD_VALUES })
  sortBy!: (typeof GOVERNANCE_SORT_FIELD_VALUES)[number]

  @ApiProperty({ example: 'desc', enum: DOMAIN_SORT_ORDER_VALUES })
  sortOrder!: (typeof DOMAIN_SORT_ORDER_VALUES)[number]
}

export class ActiveWithoutPrimaryGovernanceQueryRequest {
  @ApiPropertyOptional({
    description: '按作用域类型筛选治理视图',
    enum: DOMAIN_SCOPE_VALUES,
    example: 'BRAND',
  })
  @IsIn(DOMAIN_SCOPE_VALUES)
  @IsOptional()
  scopeType?: (typeof DOMAIN_SCOPE_VALUES)[number]

  @ApiPropertyOptional({ description: '按品牌作用域过滤', example: 'brand-001' })
  @IsString()
  @IsOptional()
  brandId?: string

  @ApiPropertyOptional({ description: '按门店作用域过滤', example: 'store-001' })
  @IsString()
  @IsOptional()
  storeId?: string

  @ApiPropertyOptional({
    description: '治理视图分页页码',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1

  @ApiPropertyOptional({
    description: '治理视图每页条数',
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

  @ApiPropertyOptional({
    description: '治理视图排序字段',
    enum: GOVERNANCE_SORT_FIELD_VALUES,
    example: 'activeCount',
  })
  @IsIn(GOVERNANCE_SORT_FIELD_VALUES)
  @IsOptional()
  sortBy?: (typeof GOVERNANCE_SORT_FIELD_VALUES)[number] = 'activeCount'

  @ApiPropertyOptional({
    description: '治理视图排序方向',
    enum: DOMAIN_SORT_ORDER_VALUES,
    example: 'desc',
  })
  @IsIn(DOMAIN_SORT_ORDER_VALUES)
  @IsOptional()
  sortOrder?: (typeof DOMAIN_SORT_ORDER_VALUES)[number] = 'desc'
}

export class RecommendPrimaryDomainRequest {
  @ApiProperty({
    description: '目标作用域类型',
    enum: DOMAIN_SCOPE_VALUES,
    example: 'BRAND',
  })
  @IsIn(DOMAIN_SCOPE_VALUES)
  scopeType!: (typeof DOMAIN_SCOPE_VALUES)[number]

  @ApiPropertyOptional({ description: '品牌作用域标识', example: 'brand-001' })
  @IsString()
  @IsOptional()
  brandId?: string

  @ApiPropertyOptional({ description: '门店作用域标识', example: 'store-001' })
  @IsString()
  @IsOptional()
  storeId?: string

  @ApiPropertyOptional({
    description: '仅预览推荐结果，不真正执行主域名切换',
    example: false,
    default: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean = false
}

export class RecommendPrimaryDomainResponse {
  @ApiProperty({ example: 'BRAND' })
  scopeType!: string

  @ApiProperty({ example: 'tenant-abc' })
  tenantId!: string

  @ApiPropertyOptional({ example: 'brand-001' })
  brandId?: string

  @ApiPropertyOptional({ example: 'store-001' })
  storeId?: string

  @ApiProperty({ example: true })
  applied!: boolean

  @ApiProperty({ example: false })
  dryRun!: boolean

  @ApiProperty({ example: true })
  resolved!: boolean

  @ApiProperty({ example: 2 })
  candidateCount!: number

  @ApiPropertyOptional({ example: '优先推荐 active_ssl，且最近一次校验/更新时间更新' })
  recommendationReason?: string

  @ApiPropertyOptional({ example: 'brand_admin 只能操作 BRAND scope 域名' })
  failureReason?: string

  @ApiPropertyOptional({ type: () => DomainListItem, nullable: true })
  item?: DomainListItem | null
}

export class BatchRecommendPrimaryDomainRequest {
  @ApiProperty({ type: () => [RecommendPrimaryDomainRequest] })
  @IsArray()
  @Type(() => RecommendPrimaryDomainRequest)
  items!: RecommendPrimaryDomainRequest[]
}

export class BatchRecommendPrimaryDomainResponse {
  @ApiProperty({ example: 2 })
  total!: number

  @ApiProperty({ example: 1 })
  appliedCount!: number

  @ApiPropertyOptional({ example: 2 })
  matchedTotal?: number

  @ApiPropertyOptional({ example: 0 })
  skippedCount?: number

  @ApiPropertyOptional({ example: 0 })
  failedCount?: number

  @ApiProperty({ example: 2 })
  resolvedCount!: number

  @ApiProperty({ type: () => [RecommendPrimaryDomainResponse] })
  items!: RecommendPrimaryDomainResponse[]
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

export class DomainGovernanceScopeSummaryItem {
  @ApiProperty({ example: 'BRAND' })
  scopeType!: string

  @ApiProperty({ example: 'tenant-abc' })
  tenantId!: string

  @ApiPropertyOptional({ example: 'brand-001' })
  brandId?: string

  @ApiPropertyOptional({ example: 'store-001' })
  storeId?: string

  @ApiProperty({ example: 2 })
  activeDomainCount!: number

  @ApiProperty({ example: true })
  missingPrimary!: boolean

  @ApiPropertyOptional({ example: 'brand.example.io', nullable: true })
  currentPrimaryDomain?: string | null

  @ApiPropertyOptional({ example: 'brand-recommend.example.io', nullable: true })
  recommendedDomain?: string | null

  @ApiPropertyOptional({ example: '优先推荐 active_ssl，且最近一次校验/更新时间更新' })
  recommendationReason?: string
}

export class DomainGovernanceSummaryResponse {
  @ApiProperty({ example: 3 })
  totalMissingPrimaryScopes!: number

  @ApiProperty({ example: 5 })
  totalActiveWithoutPrimaryDomains!: number

  @ApiProperty({ example: 2 })
  recommendedReadyScopes!: number

  @ApiProperty({ example: 1 })
  tenantMissingPrimaryScopes!: number

  @ApiProperty({ example: 1 })
  brandMissingPrimaryScopes!: number

  @ApiProperty({ example: 1 })
  storeMissingPrimaryScopes!: number

  @ApiProperty({ example: true })
  requiresAttention!: boolean

  @ApiProperty({ example: '2026-07-19T00:00:00.000Z' })
  lastEvaluatedAt!: string

  @ApiProperty({ type: () => [DomainGovernanceScopeSummaryItem] })
  currentScopes!: DomainGovernanceScopeSummaryItem[]
}

export class RecommendPrimaryByQueryRequest {
  @ApiPropertyOptional({
    description: '按作用域类型筛选',
    enum: DOMAIN_SCOPE_VALUES,
    example: 'BRAND',
  })
  @IsIn(DOMAIN_SCOPE_VALUES)
  @IsOptional()
  scopeType?: (typeof DOMAIN_SCOPE_VALUES)[number]

  @ApiPropertyOptional({ description: '按品牌作用域过滤', example: 'brand-001' })
  @IsString()
  @IsOptional()
  brandId?: string

  @ApiPropertyOptional({ description: '按门店作用域过滤', example: 'store-001' })
  @IsString()
  @IsOptional()
  storeId?: string

  @ApiPropertyOptional({
    description: '仅预览推荐结果，不真正执行主域名切换',
    example: false,
    default: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean = false

  @ApiPropertyOptional({
    description: '批量操作时使用上一页的 total 展示页列表，分页查询筛选结果',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1

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

  @ApiPropertyOptional({
    description: '治理视图排序字段',
    enum: GOVERNANCE_SORT_FIELD_VALUES,
    example: 'activeCount',
  })
  @IsIn(GOVERNANCE_SORT_FIELD_VALUES)
  @IsOptional()
  sortBy?: (typeof GOVERNANCE_SORT_FIELD_VALUES)[number] = 'activeCount'

  @ApiPropertyOptional({
    description: '排序方向',
    enum: DOMAIN_SORT_ORDER_VALUES,
    example: 'desc',
  })
  @IsIn(DOMAIN_SORT_ORDER_VALUES)
  @IsOptional()
  sortOrder?: (typeof DOMAIN_SORT_ORDER_VALUES)[number] = 'desc'

  @ApiPropertyOptional({
    description: '是否批量匹配全部筛选结果（而非仅当前页）',
    example: false,
    default: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  applyAllMatched?: boolean = false
}
