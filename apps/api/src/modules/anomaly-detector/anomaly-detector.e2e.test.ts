import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { AnomalyDetectorService } from './anomaly-detector.service';
import type { TimeSeriesPoint } from '../time-series/time-series-collector.service';

function makeHistory(values: number[]): TimeSeriesPoint[] {
  return values.map((v, i) => ({
    timestamp: new Date(Date.now() - (values.length - i) * 60000).toISOString(),
    value: v,
  }));
}

describe('AnomalyDetectorService · Phase-19 T26', () => {
  let service: AnomalyDetectorService;

  beforeEach(() => {
    service = new AnomalyDetectorService();
  });

  // AC-1: 3σ 检测 - 偏离均值 3 倍标准差视为异常
  it('AC-1 three-sigma detects clear outlier', () => {
    const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101]);
    const result = service.detect({
      metricKey: 'p95',
      value: 500, // 5x 均值,远超 3σ
      history,
    });
    expect(result.detectors.threeSigma?.detected).toBe(true);
    expect(result.detectors.threeSigma?.zScore).toBeGreaterThan(3);
    expect(['WARNING', 'CRITICAL']).toContain(result.severity);
  });

  // AC-2: IQR fence 检测 - Tukey 上下界
  it('AC-2 IQR fence detects outlier', () => {
    const history = makeHistory([10, 12, 11, 13, 12, 14, 11, 10, 13, 12]);
    const result = service.detect({
      metricKey: 'p95',
      value: 100, // 极端 outlier
      history,
    });
    expect(result.detectors.iqr?.detected).toBe(true);
    expect(result.detectors.iqr?.upper).toBeGreaterThan(0);
  });

  // AC-3: EWMA 漂移检测
  it('AC-3 EWMA detects gradual drift', () => {
    const history = makeHistory([100, 100, 100, 100]);
    // 灌入 EWMA 状态
    service.detect({ metricKey: 'p95', value: 100, history: [] });
    service.detect({ metricKey: 'p95', value: 100, history: [] });
    // 突然变化
    const result = service.detect({
      metricKey: 'p95',
      value: 500,
      history,
    });
    expect(result.detectors.ewma?.detected).toBe(true);
    expect(result.detectors.ewma?.deviation).toBeGreaterThan(0.5);
  });

  // AC-4: 综合评分 + severity 分级
  it('AC-4 composite score + severity', () => {
    const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101]);
    // 正常值 → NORMAL
    const normal = service.detect({ metricKey: 'm', value: 100, history });
    expect(normal.severity).toBe('NORMAL');
    expect(normal.score).toBeLessThan(0.5);

    // 异常值 → WARNING/CRITICAL
    const abnormal = service.detect({ metricKey: 'm', value: 500, history });
    expect(abnormal.severity).not.toBe('NORMAL');
    expect(abnormal.score).toBeGreaterThan(0);
  });

  // AC-5: 白名单生效 (业务已知波动)
  it('AC-5 whitelist overrides detection', () => {
    service.configure({
      whitelist: [{ metricKey: 'monthly-billing', reason: '月底业务高峰' }],
    });
    const history = makeHistory([100, 100, 100]);
    const result = service.detect({
      metricKey: 'monthly-billing',
      value: 9999,
      history,
    });
    expect(result.whitelisted).toBe(true);
    expect(result.severity).toBe('NORMAL');
    expect(result.score).toBe(0);
    expect(result.reason).toContain('Whitelisted');
  });

  // AC-6: 批量检测 + 边界场景 (history 太短)
  it('AC-6 batch + short history fallback', () => {
    // 预热 EWMA state,确保 b 已建立 baseline
    service.detect({ metricKey: 'b', value: 100, history: [] });
    service.detect({ metricKey: 'b', value: 100, history: [] });

    const results = service.detectBatch({
      points: [
        { metricKey: 'a', value: 50, history: makeHistory([50, 50, 50]) }, // 太短
        { metricKey: 'b', value: 200, history: makeHistory([100, 100, 100]) }, // 异常
      ],
    });
    expect(results.length).toBe(2);
    // history 太短不会触发 3σ (检测器静默)
    expect(results[0].detectors.threeSigma?.detected).toBe(false);
    // 但 EWMA 可能检测 (b 已预热)
    expect(results[1].detectors.ewma?.detected).toBe(true);
  });
});
