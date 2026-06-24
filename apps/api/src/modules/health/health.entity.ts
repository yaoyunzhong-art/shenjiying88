import {
  type FoundationScope,
  type LytMemberProfile
} from '@m5/domain'

/**
 * 健康检查状态枚举
 */
export enum HealthStatus {
  Ok = 'OK',
  Degraded = 'DEGRADED',
  Unavailable = 'UNAVAILABLE'
}

/**
 * 服务组件健康状态
 */
export interface ComponentHealth {
  /** 组件名称 */
  name: string
  /** 组件状态 */
  status: HealthStatus
  /** 响应耗时 (ms) */
  latencyMs: number
  /** 额外信息 */
  detail?: Record<string, unknown>
}

/**
 * 健康检查响应实体
 */
export interface HealthCheckResult {
  /** 整体状态 */
  status: HealthStatus
  /** 检查时间 */
  checkedAt: string
  /** 运行时间 (秒) */
  uptimeSeconds: number
  /** 各组件状态列表 */
  components: ComponentHealth[]
  /** 版本号 */
  version: string
  /** LYT 集成状态 */
  lytMode?: string
  /** 种子成员快照 */
  sampleMember?: LytMemberProfile | null
}

/**
 * 健康检查上下文
 */
export interface HealthCheckContext {
  /** 作用域 */
  scope: FoundationScope
  /** 请求者身份 */
  requestorId?: string
  /** 是否详细模式 */
  verbose?: boolean
}

/**
 * 从组件列表构造健康检查结果
 */
export function toHealthCheckResult(
  components: ComponentHealth[],
  overrides: {
    uptimeSeconds: number
    version: string
    lytMode?: string
    sampleMember?: LytMemberProfile | null
  }
): HealthCheckResult {
  const worstStatus = components.reduce((worst, c) => {
    if (c.status === HealthStatus.Unavailable) return HealthStatus.Unavailable
    if (c.status === HealthStatus.Degraded && worst !== HealthStatus.Unavailable)
      return HealthStatus.Degraded
    return worst
  }, HealthStatus.Ok)

  return {
    status: worstStatus,
    checkedAt: new Date().toISOString(),
    uptimeSeconds: overrides.uptimeSeconds,
    version: overrides.version,
    components,
    lytMode: overrides.lytMode,
    sampleMember: overrides.sampleMember
  }
}

/**
 * 判断系统是否健康
 */
export function isHealthy(result: HealthCheckResult): boolean {
  return result.status === HealthStatus.Ok
}

/**
 * 判断系统是否降级
 */
export function isDegraded(result: HealthCheckResult): boolean {
  return result.status === HealthStatus.Degraded
}
