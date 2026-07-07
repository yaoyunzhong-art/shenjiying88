// anomaly-detector.service.ts - Phase-19 T26
// 用途: 异常检测 - 3σ / IQR / EWMA 三种算法
// 关联: phase-19-intelligence/spec.md §Phase 1
import { Injectable, Logger } from '@nestjs/common';
import type { TimeSeriesPoint } from '../time-series/time-series-collector.service';

export type AnomalySeverity = 'NORMAL' | 'WARNING' | 'CRITICAL';

export interface AnomalyResult {
  metricKey: string;
  value: number;
  baseline: number;
  deviation: number;
  /** 0-1 综合异常分数 */
  score: number;
  severity: AnomalySeverity;
  detectors: {
    threeSigma?: { zScore: number; detected: boolean };
    iqr?: { lower: number; upper: number; deviation: number; detected: boolean };
    ewma?: { expected: number; detected: boolean; deviation: number };
  };
  whitelisted: boolean;
  reason: string;
  detectedAt: string;
}

export interface AnomalyConfig {
  /** 白名单:已知业务波动 (例:月底/周末) */
  whitelist?: Array<{ metricKey: string; reason: string; ttlMs?: number }>;
  /** 3σ 阈值,默认 3 */
  sigmaThreshold?: number;
  /** EWMA α 系数 (0-1,默认 0.3) */
  ewmaAlpha?: number;
  /** CRITICAL score 阈值,默认 0.8 */
  criticalThreshold?: number;
  /** WARNING score 阈值,默认 0.5 */
  warningThreshold?: number;
}

const DEFAULT_CONFIG: Required<AnomalyConfig> = {
  whitelist: [],
  sigmaThreshold: 3,
  ewmaAlpha: 0.3,
  criticalThreshold: 0.8,
  warningThreshold: 0.5,
};

/**
 * AnomalyDetector
 *
 * 3 种检测算法 + 综合评分:
 * 1. 3σ (Z-score): 经典正态分布假设
 * 2. IQR (Tukey fence): Q3 + 1.5 * IQR
 * 3. EWMA: 指数加权移动平均,捕捉缓慢漂移
 *
 * 综合 score = max(zScore/σ * 0.4, iqrDeviation * 0.3, ewmaDeviation * 0.3)
 * 白名单优先于检测 (业务已知波动不报警)
 */
@Injectable()
export class AnomalyDetectorService {
  private readonly logger = new Logger(AnomalyDetectorService.name);
  private config: Required<AnomalyConfig> = DEFAULT_CONFIG;

  /** EWMA 状态缓存 */
  private readonly ewmaState = new Map<string, { value: number; updatedAt: string }>();

  configure(config: AnomalyConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 检测单个数据点是否异常
   */
  detect(input: {
    metricKey: string;
    value: number;
    history: TimeSeriesPoint[];
    timestamp?: string;
  }): AnomalyResult {
    const cfg = this.config;
    const detectedAt = input.timestamp ?? new Date().toISOString();

    // 白名单检查
    const whitelistMatch = (cfg.whitelist ?? []).find((w) => w.metricKey === input.metricKey);
    const whitelisted = !!whitelistMatch;
    if (whitelisted) {
      this.advanceEwma(input.metricKey, input.value, detectedAt);
      return {
        metricKey: input.metricKey,
        value: input.value,
        baseline: this.computeBaseline(input.history),
        deviation: 0,
        score: 0,
        severity: 'NORMAL',
        detectors: {},
        whitelisted: true,
        reason: `Whitelisted: ${whitelistMatch?.reason}`,
        detectedAt,
      };
    }

    // 1. 3σ 检测
    const zScoreResult = this.threeSigma(input.history, input.value, cfg.sigmaThreshold);
    // 2. IQR 检测
    const iqrResult = this.iqrFence(input.history, input.value);
    // 3. EWMA 检测
    const ewmaResult = this.ewma(input.metricKey, input.value, cfg.ewmaAlpha, detectedAt);

    // 综合 score:任一检测器触发即视为异常,综合分 = max(detector score) + 多个检测器叠加加分
    const zScoreNormalized = zScoreResult.detected
      ? Math.min(1, Math.abs(zScoreResult.zScore) / cfg.sigmaThreshold)
      : 0;
    const iqrNormalized = iqrResult.detected
      ? Math.min(1, (iqrResult.deviation ?? 0) / 3)
      : 0;
    const ewmaNormalized = ewmaResult.detected
      ? Math.min(1, (ewmaResult.deviation ?? 0) / 0.5)
      : 0;

    // 多检测器一致 → 更确信异常
    const detectorCount = [zScoreResult.detected, iqrResult.detected, ewmaResult.detected].filter(Boolean).length;
    const detectorMax = Math.max(zScoreNormalized, iqrNormalized, ewmaNormalized);
    const confidenceBonus = detectorCount >= 2 ? 0.2 : 0;
    const score = Math.min(1, detectorMax + confidenceBonus);

    const severity: AnomalySeverity =
      score >= cfg.criticalThreshold ? 'CRITICAL' :
      score >= cfg.warningThreshold ? 'WARNING' : 'NORMAL';

    const baseline = this.computeBaseline(input.history);

    return {
      metricKey: input.metricKey,
      value: input.value,
      baseline,
      deviation: input.value - baseline,
      score,
      severity,
      detectors: {
        threeSigma: zScoreResult,
        iqr: iqrResult,
        ewma: ewmaResult,
      },
      whitelisted: false,
      reason: this.composeReason(zScoreResult, iqrResult, ewmaResult),
      detectedAt,
    };
  }

  /**
   * 批量检测 - 一次检测多个 metric 的最新点
   */
  detectBatch(input: {
    points: Array<{ metricKey: string; value: number; history: TimeSeriesPoint[] }>;
    timestamp?: string;
  }): AnomalyResult[] {
    return input.points.map((p) => this.detect({ ...p, timestamp: input.timestamp }));
  }

  // ── 检测算法 ──

  /**
   * 3σ / Z-score 检测
   * z = (value - mean) / stddev
   */
  private threeSigma(history: TimeSeriesPoint[], value: number, threshold: number) {
    if (history.length < 3) {
      return { zScore: 0, detected: false };
    }
    const values = history.map((p) => p.value);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const stddev = Math.sqrt(variance);
    if (stddev === 0) {
      return { zScore: 0, detected: false };
    }
    const zScore = (value - mean) / stddev;
    return {
      zScore,
      detected: Math.abs(zScore) > threshold,
    };
  }

  /**
   * IQR Tukey fence 检测
   * 上限 = Q3 + 1.5 * IQR,下限 = Q1 - 1.5 * IQR
   */
  private iqrFence(history: TimeSeriesPoint[], value: number) {
    if (history.length < 4) {
      return { lower: 0, upper: 0, deviation: 0, detected: false };
    }
    const values = history.map((p) => p.value).sort((a, b) => a - b);
    const q1 = this.percentile(values, 0.25);
    const q3 = this.percentile(values, 0.75);
    const iqr = q3 - q1;
    const upper = q3 + 1.5 * iqr;
    const lower = q1 - 1.5 * iqr;
    const detected = value > upper || value < lower;
    const deviation = detected
      ? value > upper
        ? (value - upper) / (iqr || 1)
        : (lower - value) / (iqr || 1)
      : 0;
    return { lower, upper, deviation, detected };
  }

  /**
   * EWMA 指数加权移动平均检测
   * EWMA_t = α * x_t + (1 - α) * EWMA_{t-1}
   * 检测: |value - EWMA| > 3 * stddev_EWMA
   */
  private ewma(metricKey: string, value: number, alpha: number, timestamp: string) {
    const state = this.ewmaState.get(metricKey);
    if (!state) {
      this.advanceEwma(metricKey, value, timestamp);
      return { expected: value, deviation: 0, detected: false };
    }
    const deviation = Math.abs(value - state.value) / (Math.abs(state.value) || 1);
    const detected = deviation > 0.5; // 50% 偏离 EWMA 视为异常
    return {
      expected: state.value,
      deviation: Math.min(1, deviation),
      detected,
    };
  }

  private advanceEwma(metricKey: string, value: number, timestamp: string): void {
    const alpha = this.config.ewmaAlpha;
    const state = this.ewmaState.get(metricKey);
    if (!state) {
      this.ewmaState.set(metricKey, { value, updatedAt: timestamp });
      return;
    }
    const newValue = alpha * value + (1 - alpha) * state.value;
    this.ewmaState.set(metricKey, { value: newValue, updatedAt: timestamp });
  }

  // ── Internals ──

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    if (sorted.length === 1) return sorted[0];
    const rank = p * (sorted.length - 1);
    const lower = Math.floor(rank);
    const upper = Math.ceil(rank);
    const weight = rank - lower;
    return sorted[lower] + weight * (sorted[upper] - sorted[lower]);
  }

  private computeBaseline(history: TimeSeriesPoint[]): number {
    if (history.length === 0) return 0;
    const values = history.map((p) => p.value);
    return values.reduce((s, v) => s + v, 0) / values.length;
  }

  private composeReason(
    z: { detected: boolean; zScore: number },
    iqr: { detected: boolean },
    ewma: { detected: boolean },
  ): string {
    const reasons: string[] = [];
    if (z.detected) reasons.push(`3σ violated (z=${z.zScore.toFixed(2)})`);
    if (iqr.detected) reasons.push('IQR fence violated');
    if (ewma.detected) reasons.push('EWMA drift detected');
    return reasons.length > 0 ? reasons.join('; ') : 'No anomaly detected';
  }

  resetForTests(): void {
    this.ewmaState.clear();
    this.config = DEFAULT_CONFIG;
  }
}
