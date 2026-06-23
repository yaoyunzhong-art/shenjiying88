/**
 * Bootstrap 健康查询参数 DTO
 */
export class BootstrapHealthQueryDto {
  /** 是否返回详细依赖信息 */
  verbose?: boolean
}

/**
 * Bootstrap 元数据查询参数 DTO
 */
export class BootstrapMetadataQueryDto {
  /** 过滤指定 Foundation 模块 */
  moduleKey?: string
  /** 包含契约详情 */
  includeContracts?: boolean
}

/**
 * Bootstrap 健康响应 DTO
 */
export class BootstrapHealthResponseDto {
  status!: 'ok' | 'degraded' | 'error'
  uptime!: number
  phase!: string
  checkedAt!: string
}

/**
 * Bootstrap 元数据响应 DTO
 */
export class BootstrapMetadataResponseDto {
  tenantContext!: Record<string, unknown>
  foundationDependencies!: string[]
  foundationContracts!: string[]
  phase!: string
  generatedAt!: string
}
