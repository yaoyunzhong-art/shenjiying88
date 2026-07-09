/**
 * 🐜 自动: [tenant-config] [A] contract 补全
 *
 * Tenant Config：跨模块合约类型
 * 定义 tenant-config 模块对外暴露的稳定合约接口。
 */
import type { TenantConfig, TenantFeature, ConfigValue } from './tenant-config.entity'

export interface TenantConfigContract {
  tenantId: string
  features: TenantFeature[]
  updatedAt: string
}

export function toTenantConfigContract(full: TenantConfig): TenantConfigContract {
  return {
    tenantId: full.tenantId,
    features: full.features,
    updatedAt: full.updatedAt?.toISOString() ?? new Date().toISOString(),
  }
}

export type { TenantConfig, TenantFeature, ConfigValue }
