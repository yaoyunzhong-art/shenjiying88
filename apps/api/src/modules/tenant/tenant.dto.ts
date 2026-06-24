import 'reflect-metadata'

/**
 * 租户上下文解析请求 DTO
 */
export class TenantResolveQueryDto {
  /** 是否启用详细输出模式 */
  verbose?: boolean
  /** 请求作用域 */
  scope?: string
}

/**
 * 租户上下文解析响应 DTO
 */
export class TenantResolveResponseDto {
  /** 请求 ID */
  requestId?: string
  /** 有效的租户 ID */
  effectiveTenantId!: string
  /** 有效的品牌 ID */
  effectiveBrandId?: string
  /** 有效的门店 ID */
  effectiveStoreId?: string
  /** 有效的市场代码 */
  effectiveMarketCode?: string
  /** 演员信息 */
  actor?: TenantActorDto | null
  /** 数据来源 */
  source!: string
}

/**
 * 演员信息 DTO
 */
export class TenantActorDto {
  /** 演员 ID */
  actorId!: string
  /** 演员类型 */
  actorType!: string
  /** 演员名称 */
  actorName?: string
  /** 角色列表 */
  roles!: string[]
  /** 权限列表 */
  permissions!: string[]
  /** 是否已认证 */
  authenticated!: boolean
}

/**
 * 租户上下文设置请求 DTO
 */
export class TenantContextSetDto {
  /** 租户 ID */
  tenantId?: string
  /** 品牌 ID */
  brandId?: string
  /** 门店 ID */
  storeId?: string
  /** 市场代码 */
  marketCode?: string
}
