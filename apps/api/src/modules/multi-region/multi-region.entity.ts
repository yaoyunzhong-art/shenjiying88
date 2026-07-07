/**
 * multi-region.entity.ts
 * 用途: 多区域实体类型定义
 */

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

export interface TenantRegionPin {
  tenantId: string;
  region: Region;
  pinnedAt: string;
}
