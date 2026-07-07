import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { PerfMonitorService } from './perf-monitor.service';

describe('PerfMonitorService - Phase-18 T15', () => {
  let service: PerfMonitorService;

  beforeEach(() => {
    service = new PerfMonitorService();
    service.reset();
  });

  it('AC-1: 记录 100 次采样 + 计算 P95', () => {
    for (let i = 1; i <= 100; i++) {
      service.record({ route: '/api/coupons/redeem', durationMs: i, statusCode: 200, timestamp: new Date().toISOString() });
    }
    const stats = service.getStatsForRoute('/api/coupons/redeem');
    expect(stats.count).toBe(100);
    expect(stats.p95).toBeGreaterThanOrEqual(95);
    expect(stats.errorRate).toBe(0);
  });

  it('AC-2: SLA 违规检测 (P95 > 200ms 目标)', () => {
    service.registerSla({ route: '/api/coupons/redeem', targetP95Ms: 200, warnThresholdP95Ms: 250 });
    for (let i = 100; i <= 500; i += 10) {
      service.record({ route: '/api/coupons/redeem', durationMs: i, statusCode: 200, timestamp: new Date().toISOString() });
    }
    const violations = service.getSlaViolations();
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].route).toBe('/api/coupons/redeem');
  });

  it('AC-3: 慢查询检测 (> 500ms)', () => {
    service.record({ route: '/api/slow', durationMs: 100, statusCode: 200, timestamp: '' });
    service.record({ route: '/api/slow', durationMs: 800, statusCode: 200, timestamp: '' });
    service.record({ route: '/api/slow', durationMs: 1500, statusCode: 200, timestamp: '' });
    const slow = service.getSlowQueries();
    expect(slow.length).toBe(2);
    expect(slow.every(s => s.durationMs > 500)).toBe(true);
  });

  it('AC-4: 错误率统计', () => {
    for (let i = 0; i < 100; i++) {
      service.record({
        route: '/api/test',
        durationMs: 50,
        statusCode: i < 5 ? 500 : 200,
        timestamp: '',
      });
    }
    const stats = service.getStatsForRoute('/api/test');
    expect(stats.errorRate).toBeCloseTo(0.05, 2);
  });

  it('AC-5: 多路由独立统计', () => {
    service.record({ route: '/a', durationMs: 100, statusCode: 200, timestamp: '' });
    service.record({ route: '/b', durationMs: 200, statusCode: 200, timestamp: '' });
    const stats = service.getAllStats();
    expect(stats.length).toBe(2);
    expect(stats.find(s => s.route === '/a')?.p50).toBe(100);
    expect(stats.find(s => s.route === '/b')?.p50).toBe(200);
  });
});
