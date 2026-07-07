import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * multi-region.e2e.test.ts - Phase-20 T47
 * 用途: 多区域路由 e2e 验证
 *
 * 验收 (7 cases):
 * - AC-1: GeoIP 解析 (中国/美国/欧洲 IP)
 * - AC-2: 私有 IP fallback
 * - AC-3: 租户钉住区域
 * - AC-4: 钉住 > GeoIP 优先级
 * - AC-5: 就近路由 (latency-aware)
 * - AC-6: 健康降级
 * - AC-7: 数据驻留合规
 */
import { MultiRegionService } from './multi-region.service';
import { Region } from './multi-region.entity';

describe('MultiRegionService · Phase-20 T47', () => {
  let svc: MultiRegionService;

  beforeEach(() => {
    svc = new MultiRegionService();
    svc.resetForTests();
  });

  // AC-1: GeoIP
  it('AC-1 geoLookup: CN/US/JP IP mapping', () => {
    // Mock:末段 >= 200 → US, 100-199 → JP, 其他 → CN
    expect(svc.geoLookup('8.8.8.50').region).toBe('cn');
    expect(svc.geoLookup('8.8.8.250').region).toBe('us');
    expect(svc.geoLookup('8.8.8.150').region).toBe('jp');
  });

  // AC-2: 私有 IP fallback
  it('AC-2 geoLookup: private IP fallback to cn', () => {
    const r1 = svc.geoLookup('192.168.1.1');
    expect(r1.region).toBe('cn');
    expect(r1.source).toBe('fallback');
    const r2 = svc.geoLookup('10.0.0.1');
    expect(r2.region).toBe('cn');
    const r3 = svc.geoLookup('127.0.0.1');
    expect(r3.region).toBe('cn');
  });

  // AC-3: 租户钉住
  it('AC-3 pinTenantToRegion: cross-region compliance', () => {
    svc.pinTenantToRegion('tenant-eu-1', 'eu');
    expect(svc.getTenantRegion('tenant-eu-1')).toBe('eu');
    expect(svc.listPinnedTenants().length).toBe(1);
    svc.unpinTenant('tenant-eu-1');
    expect(svc.getTenantRegion('tenant-eu-1')).toBeUndefined();
  });

  // AC-4: 优先级 - 钉住 > GeoIP
  it('AC-4 route priority: tenant-pin > geo', () => {
    // 中国 IP + 钉住 EU → 应路由到 EU
    svc.pinTenantToRegion('tenant-eu-1', 'eu');
    const decision = svc.route('8.8.8.50', 'tenant-eu-1'); // 中国 IP
    expect(decision.primaryRegion).toBe('eu');
    expect(decision.reason).toBe('tenant-pin');
    expect(decision.fallbacks).not.toContain('eu');
  });

  // AC-5: 就近路由
  it('AC-5 routeByLatency: lowest-latency region', () => {
    // 调整 latency: cn=20 (最低) < jp=50 < us=150 < eu=180
    const decision = svc.routeByLatency();
    expect(decision.primaryRegion).toBe('cn');
    expect(decision.reason).toBe('health');
    expect(decision.latencyHint).toBe(20);
    // fallback 按 latency 排序
    expect(decision.fallbacks[0]).toBe('jp');
    expect(decision.fallbacks[1]).toBe('us');
    expect(decision.fallbacks[2]).toBe('eu');
  });

  // AC-6: 健康降级
  it('AC-6 health: degraded region skipped in routeByLatency', () => {
    // 让 cn 不可用
    svc.setRegionHealth('cn', 'down');
    const decision = svc.routeByLatency();
    expect(decision.primaryRegion).toBe('jp'); // cn 排除,下一个最低 latency
    expect(decision.fallbacks).not.toContain('cn');

    // 全部 down → 兜底 default
    for (const r of ['cn', 'us', 'eu', 'jp'] as Region[]) {
      svc.setRegionHealth(r, 'down');
    }
    const fallback = svc.routeByLatency();
    expect(fallback.primaryRegion).toBe('cn');
    expect(fallback.reason).toBe('default');
  });

  // AC-7: 数据驻留
  it('AC-7 canMigrateToRegion: GDPR + 网络安全法 compliance', () => {
    // EU 租户只能留在 EU
    svc.pinTenantToRegion('tenant-eu', 'eu');
    expect(svc.canMigrateToRegion('tenant-eu', 'eu')).toBe(true);
    expect(svc.canMigrateToRegion('tenant-eu', 'us')).toBe(false);
    expect(svc.canMigrateToRegion('tenant-eu', 'cn')).toBe(false);

    // CN 租户只能留在 CN
    svc.pinTenantToRegion('tenant-cn', 'cn');
    expect(svc.canMigrateToRegion('tenant-cn', 'cn')).toBe(true);
    expect(svc.canMigrateToRegion('tenant-cn', 'us')).toBe(false);

    // 未钉住 → 可自由迁移
    expect(svc.canMigrateToRegion('tenant-free', 'us')).toBe(true);
  });
});
