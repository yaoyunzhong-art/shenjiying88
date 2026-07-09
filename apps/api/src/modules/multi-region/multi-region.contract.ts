/**
 * 🐜 自动: [multi-region] [A] contract 补全
 *
 * Multi-Region：跨模块合约类型
 * 定义 multi-region 模块对外暴露的稳定合约接口。
 */
import type { RegionConfig, RegionDeployment, RegionHealth } from './multi-region.entity'

export interface RegionConfigContract {
  regionId: string
  regionName: string
  endpoint: string
  isActive: boolean
  priority: number
}

export interface RegionDeploymentContract {
  deploymentId: string
  regionId: string
  status: string
  deployedAt: string
  version: string
}

export interface RegionHealthContract {
  regionId: string
  status: 'healthy' | 'degraded' | 'down'
  latency: number
  lastChecked: string
}

export function toRegionConfigContract(full: RegionConfig): RegionConfigContract {
  return {
    regionId: full.regionId,
    regionName: full.regionName,
    endpoint: full.endpoint,
    isActive: full.isActive,
    priority: full.priority,
  }
}

export function toRegionHealthContract(full: RegionHealth): RegionHealthContract {
  return { ...full, lastChecked: full.lastChecked ?? new Date().toISOString() }
}

export type { RegionConfig, RegionDeployment, RegionHealth }
