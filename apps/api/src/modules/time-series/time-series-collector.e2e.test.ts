import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { TimeSeriesCollectorService } from './time-series-collector.service';
import type { PerfSample } from '../perf-monitor/perf-monitor.service';

describe('TimeSeriesCollectorService · Phase-19 T25', () => {
  let service: TimeSeriesCollectorService;

  beforeEach(() => {
    service = new TimeSeriesCollectorService();
  });

  // AC-1: 记录 perf sample + 滚动窗口过滤
  it('AC-1 recordSample + window filtering', () => {
    const now = Date.now();
    // 1 小时内的样本
    service.recordSample({
      route: '/api/coupons/redeem',
      durationMs: 120,
      statusCode: 200,
      timestamp: new Date(now - 10 * 60 * 1000).toISOString(),
    });
    service.recordSample({
      route: '/api/coupons/redeem',
      durationMs: 150,
      statusCode: 200,
      timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
    });
    // 2 小时前的样本 (1h 窗口应过滤掉)
    service.recordSample({
      route: '/api/coupons/redeem',
      durationMs: 999,
      statusCode: 200,
      timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    });

    const metric1h = service.query({ metricName: '/api/coupons/redeem', window: '1h' });
    expect(metric1h.points.length).toBe(2);
    expect(metric1h.aggregate.count).toBe(2);
    expect(metric1h.aggregate.avg).toBeCloseTo(135, 0);

    const metric6h = service.query({ metricName: '/api/coupons/redeem', window: '6h' });
    expect(metric6h.points.length).toBe(3);
  });

  // AC-2: 多租户隔离 (tenantId 在 metricKey)
  it('AC-2 multi-tenant isolation', () => {
    service.recordSample({
      route: '/api/orders',
      durationMs: 100,
      statusCode: 200,
      timestamp: new Date().toISOString(),
      tenantId: 'tenant-A',
    });
    service.recordSample({
      route: '/api/orders',
      durationMs: 200,
      statusCode: 200,
      timestamp: new Date().toISOString(),
      tenantId: 'tenant-B',
    });
    const tenantA = service.query({ metricName: '/api/orders', tenantId: 'tenant-A', window: '1h' });
    const tenantB = service.query({ metricName: '/api/orders', tenantId: 'tenant-B', window: '1h' });
    expect(tenantA.aggregate.avg).toBe(100);
    expect(tenantB.aggregate.avg).toBe(200);
    expect(tenantA.aggregate.count).toBe(1);
    expect(tenantB.aggregate.count).toBe(1);
  });

  // AC-3: 聚合统计 (min/max/avg/p50/p95/p99)
  it('AC-3 aggregate stats min/max/p95/p99', () => {
    const samples = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    for (const v of samples) {
      service.recordMetric({ metricName: 'test-metric', value: v });
    }
    const metric = service.query({ metricName: 'test-metric', window: '1h' });
    expect(metric.aggregate.min).toBe(10);
    expect(metric.aggregate.max).toBe(100);
    expect(metric.aggregate.avg).toBe(55);
    // p50 用线性插值法:rank = 0.5 * 9 = 4.5 → 50 + 0.5 * (60 - 50) = 55
    expect(metric.aggregate.p50).toBe(55);
    expect(metric.aggregate.count).toBe(10);
  });

  // AC-4: 季节性识别 - 工作日 vs 周末
  it('AC-4 detectSeasonality patterns', () => {
    // 直接灌入时序数据,绕过日期计算复杂度
    // 168 个点 = 7 天 × 24 小时,标记每天的 value
    // 每周一 100,周六 200,周日 220
    const baseTimestamp = Date.parse('2026-06-22T00:00:00Z'); // 周一 UTC
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const utcDay = (dayIdx + 1) % 7; // dayIdx=0 是周一 = UTC day 1
      let dailyValue: number;
      if (utcDay === 1) dailyValue = 100; // 周一
      else if (utcDay === 6) dailyValue = 200; // 周六
      else if (utcDay === 0) dailyValue = 220; // 周日
      else dailyValue = 100 + (utcDay - 1) * 10; // 周二到周五
      for (let hour = 0; hour < 24; hour++) {
        service.recordMetric({
          metricName: 'seasonal',
          value: dailyValue,
          timestamp: new Date(baseTimestamp + dayIdx * 86400_000 + hour * 3600_000).toISOString(),
        });
      }
    }
    const pattern = service.detectSeasonality({ metricName: 'seasonal' });
    expect(pattern.weekly.length).toBe(7);
    // 周一 (UTC day 1) = 100
    expect(pattern.weekly[1]).toBe(100);
    // 周六 (UTC day 6) = 200
    expect(pattern.weekly[6]).toBe(200);
    // 周日 (UTC day 0) = 220
    expect(pattern.weekly[0]).toBe(220);
    // 季节性指数应该 > 0 (周末明显高)
    expect(service.query({ metricName: 'seasonal', window: '30d' }).seasonality).toBeGreaterThan(0);
  });

  // AC-5: Prometheus 导出格式
  it('AC-5 toPrometheus format', () => {
    service.recordSample({
      route: '/api/coupons',
      durationMs: 50,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    });
    const prom = service.toPrometheus();
    expect(prom).toContain('# HELP /api/coupons_1h');
    expect(prom).toContain('# TYPE /api/coupons_1h summary');
    expect(prom).toContain('/api/coupons_1h_avg');
    expect(prom).toContain('/api/coupons_1h_p95');
    expect(prom).toContain('/api/coupons_1h_count 1');
  });

  // AC-6: 批量写入 + listMetricKeys
  it('AC-6 recordBatch + listMetricKeys', () => {
    const samples: PerfSample[] = [
      { route: '/api/a', durationMs: 10, statusCode: 200, timestamp: new Date().toISOString() },
      { route: '/api/b', durationMs: 20, statusCode: 200, timestamp: new Date().toISOString() },
      { route: '/api/c', durationMs: 30, statusCode: 200, timestamp: new Date().toISOString() },
    ];
    const count = service.recordBatch(samples);
    expect(count).toBe(3);
    const keys = service.listMetricKeys();
    expect(keys).toContain('/api/a:global');
    expect(keys).toContain('/api/b:global');
    expect(keys).toContain('/api/c:global');
  });
});
