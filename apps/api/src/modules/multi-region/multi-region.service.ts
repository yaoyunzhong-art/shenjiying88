/**
 * multi-region.service.ts - Phase-20 T47
 * 用途: 多区域路由 + 地理路由
 * 关联: phase-20-compliance/spec.md §Phase 4
 *
 * 区域定义:
 * - cn: 中国大陆 (default)
 * - us: 美东
 * - eu: 欧洲 (GDPR 严格)
 * - jp: 日本
 *
 * GeoIP:
 * - 简化版 IP → 国家映射 (生产环境用 MaxMind)
 * - 国家 → 区域映射
 *
 * 路由策略:
 * - 就近路由: latency-aware
 * - 租户固定区域 (pin): 跨境数据合规
 * - 健康降级: 当前区域不健康 → 备选区域
 */
import { Injectable, Logger } from '@nestjs/common';
import {
  Region,
  ALL_REGIONS,
  DEFAULT_REGION,
  RegionEndpoint,
  GeoIPResult,
  RouteDecision,
  FailoverState,
  HealthCheckResult,
  FailoverEvent,
} from './multi-region.entity';

/** 简化 GeoIP 数据库 (生产用 MaxMind GeoLite2) */
const COUNTRY_TO_REGION: Record<string, Region> = {
  CN: 'cn', HK: 'cn', TW: 'cn', MO: 'cn',
  US: 'us', CA: 'us', MX: 'us',
  GB: 'eu', DE: 'eu', FR: 'eu', IT: 'eu', ES: 'eu', NL: 'eu',
  JP: 'jp', KR: 'jp',
};
/** 私有/保留 IP → fallback region */
const PRIVATE_IP_FALLBACK: Record<string, Region> = {
  '10.': 'cn',
  '192.168.': 'cn',
  '172.': 'cn',
  '127.': 'cn',
};

@Injectable()
export class MultiRegionService {
  private readonly logger = new Logger(MultiRegionService.name);
  private readonly endpoints = new Map<Region, RegionEndpoint>();
  /** 租户固定区域 (跨境合规) */
  private readonly tenantPins = new Map<string, Region>();
  /** GeoIP 缓存 */
  private readonly geoCache = new Map<string, GeoIPResult>();
  /** 区域健康状态 */
  private readonly regionHealth = new Map<Region, 'healthy' | 'degraded' | 'down'>();

  constructor() {
    // 注册默认端点
    this.registerEndpoint({ region: 'cn', baseUrl: 'https://api-cn.example.com', latencyMs: 20, enabled: true });
    this.registerEndpoint({ region: 'us', baseUrl: 'https://api-us.example.com', latencyMs: 150, enabled: true });
    this.registerEndpoint({ region: 'eu', baseUrl: 'https://api-eu.example.com', latencyMs: 180, enabled: true });
    this.registerEndpoint({ region: 'jp', baseUrl: 'https://api-jp.example.com', latencyMs: 50, enabled: true });
    // 默认全部健康
    for (const r of ALL_REGIONS) this.regionHealth.set(r, 'healthy');
  }

  // ── Endpoint management ──

  registerEndpoint(endpoint: RegionEndpoint): void {
    this.endpoints.set(endpoint.region, endpoint);
  }

  getEndpoint(region: Region): RegionEndpoint | undefined {
    return this.endpoints.get(region);
  }

  listEndpoints(): RegionEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  // ── GeoIP ──

  /**
   * IP → 区域
   * 简化版:解析 IP 第一段作为粗略地理定位
   * 生产:MaxMind GeoLite2 / IP2Region
   */
  geoLookup(ip: string): GeoIPResult {
    // 缓存
    const cached = this.geoCache.get(ip);
    if (cached) return { ...cached, source: 'cache' };

    // 私有 IP
    for (const [prefix, region] of Object.entries(PRIVATE_IP_FALLBACK)) {
      if (ip.startsWith(prefix)) {
        const result: GeoIPResult = { country: 'ZZ', region, source: 'fallback' };
        this.geoCache.set(ip, result);
        return result;
      }
    }

    // 公开 IP 简化映射:基于国家代码启发式
    // 真实场景应使用 MaxMind,这里 mock 一个简单规则
    const country = this.extractCountryFromIp(ip);
    const region = COUNTRY_TO_REGION[country] ?? DEFAULT_REGION;
    const result: GeoIPResult = { country, region, source: 'lookup' };
    this.geoCache.set(ip, result);
    return result;
  }

  /**
   * 模拟从 IP 提取国家 (生产用 GeoIP 库)
   * 这里 mock:末段 IP >= 200 → US, 100-199 → JP, 其他 → CN
   */
  private extractCountryFromIp(ip: string): string {
    const parts = ip.split('.');
    if (parts.length !== 4) return 'ZZ';
    const last = parseInt(parts[3], 10);
    if (isNaN(last)) return 'ZZ';
    if (last >= 200) return 'US';
    if (last >= 100) return 'JP';
    return 'CN';
  }

  // ── Tenant pinning ──

  /**
   * 设置租户固定区域 (跨境合规)
   * 钉住后,该租户所有请求必须路由到该区域
   */
  pinTenantToRegion(tenantId: string, region: Region): void {
    this.tenantPins.set(tenantId, region);
    this.logger.log(`[${tenantId}] pinned to region ${region}`);
  }

  getTenantRegion(tenantId: string): Region | undefined {
    return this.tenantPins.get(tenantId);
  }

  unpinTenant(tenantId: string): void {
    this.tenantPins.delete(tenantId);
  }

  // ── Health ──

  setRegionHealth(region: Region, health: 'healthy' | 'degraded' | 'down'): void {
    this.regionHealth.set(region, health);
  }

  getRegionHealth(region: Region): 'healthy' | 'degraded' | 'down' {
    return this.regionHealth.get(region) ?? 'down';
  }

  // ── Routing ──

  /**
   * 主路由决策
   * @param clientIp 客户端 IP
   * @param tenantId 租户 ID (可能 undefined)
   */
  route(clientIp: string, tenantId?: string): RouteDecision {
    // 1. 租户固定区域 (最高优先级,跨境合规)
    if (tenantId) {
      const pinned = this.tenantPins.get(tenantId);
      if (pinned) {
        const fallbacks = this.getFallbacks(pinned);
        return { primaryRegion: pinned, fallbacks, reason: 'tenant-pin' };
      }
    }

    // 2. GeoIP 路由
    const geo = this.geoLookup(clientIp);
    const fallbacks = this.getFallbacks(geo.region);
    return {
      primaryRegion: geo.region,
      fallbacks,
      reason: 'geo',
      latencyHint: this.endpoints.get(geo.region)?.latencyMs,
    };
  }

  /**
   * 就近路由:选择 latency 最低的健康区域
   */
  routeByLatency(): RouteDecision {
    const candidates = ALL_REGIONS
      .filter((r) => this.getRegionHealth(r) === 'healthy')
      .map((r) => ({
        region: r,
        latency: this.endpoints.get(r)?.latencyMs ?? Infinity,
      }))
      .sort((a, b) => a.latency - b.latency);

    if (candidates.length === 0) {
      // 兜底:所有区域都 down,返回 default + 所有区域作为 fallback
      return {
        primaryRegion: DEFAULT_REGION,
        fallbacks: ALL_REGIONS.filter((r) => r !== DEFAULT_REGION),
        reason: 'default',
      };
    }
    return {
      primaryRegion: candidates[0].region,
      fallbacks: candidates.slice(1).map((c) => c.region),
      reason: 'health',
      latencyHint: candidates[0].latency,
    };
  }

  /**
   * 获取 fallback 链 (按 latency 排序,排除已选主区域)
   */
  private getFallbacks(primary: Region): Region[] {
    return ALL_REGIONS
      .filter((r) => r !== primary)
      .map((r) => ({ region: r, latency: this.endpoints.get(r)?.latencyMs ?? Infinity }))
      .sort((a, b) => a.latency - b.latency)
      .map((c) => c.region);
  }

  // ── Data residency ──

  /**
   * 检查租户数据是否允许迁移到目标区域 (GDPR 等合规要求)
   * EU 租户:数据只能留在 EU
   * CN 租户:数据只能留在 CN (网络安全法)
   */
  canMigrateToRegion(tenantId: string, targetRegion: Region): boolean {
    const pinned = this.tenantPins.get(tenantId);
    if (!pinned) return true; // 未钉住可自由迁移
    return pinned === targetRegion;
  }

  /**
   * 列出所有租户
   */
  listPinnedTenants(): Array<{ tenantId: string; region: Region }> {
    return Array.from(this.tenantPins.entries()).map(([tenantId, region]) => ({
      tenantId,
      region,
    }));
  }

  // ── Test helpers ──
  resetForTests(): void {
    this.tenantPins.clear();
    this.geoCache.clear();
    for (const r of ALL_REGIONS) this.regionHealth.set(r, 'healthy');
  }
}