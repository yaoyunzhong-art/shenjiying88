import type { FoundationModuleKey } from '@m5/types'
import type { RequestTenantContext } from '../tenant/tenant.types'

/**
 * Bootstrap 阶段枚举
 */
export enum BootstrapPhase {
  Scaffold = 'scaffold',
  Provision = 'provision',
  Handoff = 'handoff',
  Ready = 'ready'
}

/**
 * Bootstrap 健康状态实体
 */
export interface BootstrapHealth {
  /** 整体状态 */
  status: 'ok' | 'degraded' | 'error'
  /** 运行时间 (秒) */
  uptime: number
  /** 当前启动阶段 */
  phase: BootstrapPhase
  /** 检查时间 */
  checkedAt: string
}

/**
 * Bootstrap 元数据实体
 */
export interface BootstrapMetadata {
  /** 租户上下文（已解析） */
  tenantContext: RequestTenantContext
  /** 依赖的 Foundation 模块 */
  foundationDependencies: FoundationModuleKey[]
  /** 契约列表 */
  foundationContracts: string[]
  /** 当前启动阶段 */
  phase: BootstrapPhase
  /** 生成时间 */
  generatedAt: string
}

/**
 * 区域登录策略实体
 */
export interface RegionalLoginPolicy {
  /** 默认登录路径 */
  defaultLoginPath: string
  /** 是否启用 SSO */
  ssoEnabled: boolean
  /** 支持的市场代码列表 */
  supportedMarkets: string[]
}

/**
 * Bootstrap 消费者依赖描述
 */
export interface BootstrapConsumerDependency {
  /** 消费者模块名称 */
  consumerName: string
  /** 依赖的 Foundation 模块 */
  dependsOn: FoundationModuleKey[]
  /** 依赖的契约列表 */
  contracts: string[]
  /** 责任描述 */
  responsibility: string
}

/**
 * 构造 Bootstrap 健康响应
 */
export function toBootstrapHealth(overrides?: Partial<BootstrapHealth>): BootstrapHealth {
  return {
    status: 'ok',
    uptime: process.uptime(),
    phase: BootstrapPhase.Scaffold,
    checkedAt: new Date().toISOString(),
    ...overrides
  }
}

/**
 * 构造 Bootstrap 元数据
 */
export function toBootstrapMetadata(
  tenantContext: RequestTenantContext,
  overrides?: Partial<BootstrapMetadata>
): BootstrapMetadata {
  return {
    tenantContext,
    foundationDependencies: [],
    foundationContracts: [],
    phase: BootstrapPhase.Scaffold,
    generatedAt: new Date().toISOString(),
    ...overrides
  }
}
