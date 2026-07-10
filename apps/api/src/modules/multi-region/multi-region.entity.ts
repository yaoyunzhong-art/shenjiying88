/**
 * multi-region.entity.ts
 * 用途: 多区域实体类型定义
 */

// ============ 跨模块合约补全 ============

/** 区域配置合约实体 (跨模块安全子集) */
export interface RegionConfig {
  regionId: string
  regionName: string
  endpoint: string
  isActive: boolean
  priority: number
}

/** 区域部署合约实体 (跨模块安全子集) */
export interface RegionDeployment {
  deploymentId: string
  regionId: string
  status: string
  deployedAt: string
  version: string
}

/** 区域健康合约实体 (跨模块安全子集) */
export interface RegionHealth {
  regionId: string
  status: 'healthy' | 'degraded' | 'down'
  latency: number
  lastChecked: string
}

// ============ 原始定义 ============

export type Region = 'cn' | 'us' | 'eu' | 'jp';
export const ALL_REGIONS: Region[] = ['cn', 'us', 'eu', 'jp'];
export const DEFAULT_REGION: Region = 'cn';

export type FailoverState = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'RECOVERING';

export interface RegionEndpoint {
  region: Region;
  baseUrl: string;
  latencyMs?: number;
  enabled: boolean;
}

export interface GeoIPResult {
  country: string;
  region: Region;
  source: 'cache' | 'lookup' | 'fallback';
}

export interface RouteDecision {
  primaryRegion: Region;
  fallbacks: Region[];
  reason: 'geo' | 'tenant-pin' | 'health' | 'default';
  latencyHint?: number;
}

export interface HealthCheckResult {
  region: Region;
  state: FailoverState;
  latencyMs: number;
  errorRate: number;
  lastCheckAt: string;
  consecutiveFailures: number;
}

export interface FailoverEvent {
  ts: string;
  region: Region;
  fromState: FailoverState;
  toState: FailoverState;
  reason: string;
}

/** 端点信息（角色测试中使用） */
export interface EndpointInfo {
  region: Region;
  baseUrl: string;
  latencyMs?: number;
  enabled: boolean;
}

export interface TenantRegionPin {
  tenantId: string;
  region: Region;
  pinnedAt: string;
}
