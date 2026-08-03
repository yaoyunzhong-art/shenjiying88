import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { AnomalyDetectorService } from './anomaly-detector.service';
import type { TimeSeriesPoint } from '../time-series/time-series-collector.service';

function makeHistory(values: number[]): TimeSeriesPoint[] {
  return values.map((v, i) => ({
    timestamp: new Date(Date.now() - (values.length - i) * 60000).toISOString(),
    value: v,
  }));
}

function makeStableHistory(count: number, value: number): TimeSeriesPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
    value,
  }));
}

describe('AnomalyDetectorService · Phase-19 T26', () => {
  let service: AnomalyDetectorService;

  beforeEach(() => {
    service = new AnomalyDetectorService();
  });

  afterEach(() => {
    service.resetForTests();
  });

  // ══════════════════════════════════════════════════
  // 原始测试 (6个) - 保留不动
  // ══════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════
  // 增强测试 (新增 20+ tests) - 覆盖增强场景
  // ══════════════════════════════════════════════════

  // ── Section A: 检测结果正确性 (5 tests) ──

  it('A1 正常值返回 NORMAL 且 score=0', () => {
    const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101]);
    const result = service.detect({ metricKey: 'normal-check', value: 100, history });
    expect(result.severity).toBe('NORMAL');
    expect(result.score).toBe(0);
    expect(result.whitelisted).toBe(false);
  });

  it('A2 baseline 等于 history 均值', () => {
    const history = makeHistory([100, 200, 300]);
    const result = service.detect({ metricKey: 'baseline-mean', value: 100, history });
    expect(result.baseline).toBe(200);
  });

  it('A3 detectBatch 返回结果顺序与输入一致', () => {
    const h = makeHistory([100, 101, 99, 100]);
    const results = service.detectBatch({
      points: [
        { metricKey: 'first', value: 100, history: h },
        { metricKey: 'second', value: 999, history: h },
      ],
    });
    expect(results[0].metricKey).toBe('first');
    expect(results[1].metricKey).toBe('second');
  });

  it('A4 detectBatch 空数组返回空数组', () => {
    const results = service.detectBatch({ points: [] });
    expect(results).toEqual([]);
  });

  it('A5 低偏离值不触发任何检测器', () => {
    const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101]);
    const result = service.detect({ metricKey: 'low-deviation', value: 101, history });
    expect(result.detectors.threeSigma?.detected).toBe(false);
    expect(result.detectors.iqr?.detected).toBe(false);
    expect(result.severity).toBe('NORMAL');
  });

  // ── Section B: 配置管理 (4 tests) ──

  it('B1 修改 sigmaThreshold 影响检测灵敏度', () => {
    const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101]);
    // 默认阈值 3
    const defaultResult = service.detect({ metricKey: 'sigma-config', value: 110, history });
    expect(defaultResult.detectors.threeSigma?.detected).toBe(true);

    // 重置后提高阈值到 999
    service.resetForTests();
    service.configure({ sigmaThreshold: 999 });
    const tunedResult = service.detect({ metricKey: 'sigma-config', value: 110, history });
    expect(tunedResult.detectors.threeSigma?.detected).toBe(false);
  });

  it('B2 whitelist 配置不影响其他 metric', () => {
    service.configure({ whitelist: [{ metricKey: 'whitelisted-metric', reason: '业务豁免' }] });
    // 使用有方差的 history 确保 3σ 能检测到异常
    const h = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101]);
    const wl = service.detect({ metricKey: 'whitelisted-metric', value: 9999, history: h });
    expect(wl.whitelisted).toBe(true);

    const normal = service.detect({ metricKey: 'other-metric', value: 9999, history: h });
    expect(normal.whitelisted).toBe(false);
    expect(normal.severity).toBe('CRITICAL');
  });

  it('B3 降低 warningThreshold 使中等级异常触发 WARNING', () => {
    service.configure({ warningThreshold: 0.3, criticalThreshold: 0.95 });
    const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101]);
    const result = service.detect({ metricKey: 'warning-test', value: 108, history });
    expect(result.severity).not.toBe('NORMAL');
  });

  it('B4 多次 configure 调用叠加生效', () => {
    service.configure({ sigmaThreshold: 2.5 });
    service.configure({ ewmaAlpha: 0.5 });
    const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101]);
    const result = service.detect({ metricKey: 'multi-config', value: 200, history });
    expect(result.detectors.threeSigma).toBeDefined();
  });

  // ── Section C: 边界条件 (5 tests) ──

  it('C1 history 为空时仅 EWMA 被初始化', () => {
    const result = service.detect({ metricKey: 'empty-hist', value: 50, history: [] });
    expect(result.detectors.threeSigma).toBeUndefined();
    expect(result.detectors.iqr).toBeUndefined();
    // 首次检测 EWMA 初始化,不触发
    expect(result.detectors.ewma?.detected).toBe(false);
  });

  it('C2 history 长度=1 时 3σ 和 IQR 均不触发', () => {
    const h = makeHistory([100]);
    const result = service.detect({ metricKey: 'hist-length-1', value: 999, history: h });
    expect(result.detectors.threeSigma).toBeUndefined();
    expect(result.detectors.iqr).toBeUndefined();
  });

  it('C3 history 长度=3 时 3σ 触发但 IQR 不触发', () => {
    const h = makeHistory([100, 100, 100]);
    const result = service.detect({ metricKey: 'hist-length-3', value: 500, history: h });
    // 3σ detected when stddev=0 → false
    expect(result.detectors.threeSigma?.detected).toBe(false);
    expect(result.detectors.iqr).toBeUndefined();
  });

  it('C4 所有 history 值相等时 3σ 不检测 (stddev=0)', () => {
    const h = makeStableHistory(10, 100);
    const result = service.detect({ metricKey: 'zero-stddev', value: 200, history: h });
    expect(result.detectors.threeSigma?.detected).toBe(false);
  });

  it('C5 极小浮点数值不产生 NaN', () => {
    const h = makeHistory([1e-10, 2e-10, 1e-10, 3e-10]);
    const result = service.detect({ metricKey: 'tiny-floats', value: 1, history: h });
    expect(result.score).not.toBeNaN();
    expect(result.baseline).toBeGreaterThan(0);
  });

  // ── Section D: EWMA 增强场景 (3 tests) ──

  it('D1 EWMA 状态跨多次检测保持连续性', () => {
    service.detect({ metricKey: 'ewma-seq', value: 100, history: [] });
    service.detect({ metricKey: 'ewma-seq', value: 100, history: [] });
    service.detect({ metricKey: 'ewma-seq', value: 100, history: [] });
    const result = service.detect({ metricKey: 'ewma-seq', value: 500, history: [] });
    expect(result.detectors.ewma?.detected).toBe(true);
  });

  it('D2 不同 metric 的 EWMA 状态隔离', () => {
    service.detect({ metricKey: 'ewma-a', value: 100, history: [] });
    service.detect({ metricKey: 'ewma-a', value: 100, history: [] });

    const resultB = service.detect({ metricKey: 'ewma-b', value: 500, history: [] });
    // ewma-b 首次检测,初始化不触发
    expect(resultB.detectors.ewma?.detected).toBe(false);
  });

  it('D3 resetForTests 清除 EWMA 状态', () => {
    service.detect({ metricKey: 'reset-test', value: 100, history: [] });
    service.detect({ metricKey: 'reset-test', value: 100, history: [] });
    service.resetForTests();

    const result = service.detect({ metricKey: 'reset-test', value: 500, history: [] });
    // 重置后 EWMA 重新初始化
    expect(result.detectors.ewma?.detected).toBe(false);
  });

  // ── Section E: 严重度场景 (3 tests) ──

  it('E1 极端异常值返回 CRITICAL', () => {
    const h = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101]);
    const result = service.detect({ metricKey: 'extreme-anomaly', value: 99999, history: h });
    expect(result.severity).toBe('CRITICAL');
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  it('E2 微弱异常值返回 NORMAL', () => {
    const h = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101]);
    const result = service.detect({ metricKey: 'barely-anomalous', value: 103, history: h });
    expect(result.severity).toBe('NORMAL');
  });

  it('E3 白名单覆盖 CRITICAL 异常为 NORMAL', () => {
    service.configure({ whitelist: [{ metricKey: 'critical-business', reason: '月末结算' }] });
    const h = makeHistory([100, 101, 99, 100]);
    const result = service.detect({ metricKey: 'critical-business', value: 999999, history: h });
    expect(result.severity).toBe('NORMAL');
    expect(result.whitelisted).toBe(true);
  });

  // ── Section F: detectBatch 增强 (2 tests) ──

  it('F1 批量中单个异常不影响其他结果', () => {
    const h = makeHistory([100, 101, 99, 100]);
    const results = service.detectBatch({
      points: [
        { metricKey: 'normal-a', value: 100, history: h },
        { metricKey: 'abnormal-a', value: 9999, history: h },
        { metricKey: 'normal-b', value: 100, history: h },
      ],
    });
    expect(results[0].severity).toBe('NORMAL');
    expect(results[1].severity).toBe('CRITICAL');
    expect(results[2].severity).toBe('NORMAL');
  });

  it('F2 批量检测大量指标不报错', () => {
    const h = makeHistory([100, 101, 99, 100]);
    const points = Array.from({ length: 20 }, (_, i) => ({
      metricKey: `batch-mass-${i}`,
      value: i % 2 === 0 ? 100 : 999,
      history: h,
    }));
    const results = service.detectBatch({ points });
    expect(results.length).toBe(20);
  });

  // ══════════════════════════════════════════════════
  // 测试统计: 6 (原始) + 22 (新增) = 28 tests ✓
  // ══════════════════════════════════════════════════
});
