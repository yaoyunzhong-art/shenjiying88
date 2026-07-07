/**
 * ab-testing.ts - Phase-23 T93
 * A/B 测试框架
 *
 * 模式:
 * - Experiment: 一个实验 (variant A vs variant B)
 * - Variant: 不同的配置 (e.g., prompt v1 vs v2, model gpt-4 vs claude)
 * - Assignment: 用户分桶 (hash-based deterministic + sticky)
 * - Metrics: 转化率 / 满意度 / 时延 等
 * - Statistics: 显著性检验 (z-test for proportions)
 *
 * 应用:
 * - Prompt 实验 (哪个 prompt 效果更好)
 * - Model 对比 (哪个模型更适合某任务)
 * - Feature flag rollout (10% / 50% / 100%)
 */
import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

// ── Types ──

export interface Variant {
  name: string;
  weight: number;
  config: Record<string, unknown>;
  description?: string;
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  variants: Variant[];
  trafficSplit?: number;
  startedAt: number;
  endedAt?: number;
  status: 'draft' | 'running' | 'paused' | 'completed';
  metadata?: Record<string, unknown>;
}

export interface Assignment {
  experimentId: string;
  unitId: string;
  variantName: string;
  config: Record<string, unknown>;
  assignedAt: number;
}

export interface MetricEvent {
  experimentId: string;
  variantName: string;
  unitId: string;
  metric: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface VariantStats {
  variantName: string;
  unitCount: number;
  eventCount: number;
  mean: number;
  stdDev: number;
  ciLower: number;
  ciUpper: number;
}

export interface ExperimentReport {
  experimentId: string;
  experimentName: string;
  metricName: string;
  variants: VariantStats[];
  winner?: string;
  pValues: Record<string, number>;
  significant: Record<string, boolean>;
  lift: Record<string, number>;
  totalEvents: number;
  totalUnits: number;
}

// ── Hash-based Assignment ──

export function hashToBucket(unitId: string, experimentId: string): number {
  const h = createHash('sha256').update(`${experimentId}:${unitId}`).digest();
  const num = h.readUInt32BE(0);
  return num / 0xffffffff;
}

// ── Statistics ──

function normalCdf(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  return 0.5 * (1.0 + sign * y);
}

export function twoProportionZTest(
  successes1: number,
  trials1: number,
  successes2: number,
  trials2: number,
): { zScore: number; pValue: number } {
  if (trials1 === 0 || trials2 === 0) return { zScore: 0, pValue: 1 };
  const p1 = successes1 / trials1;
  const p2 = successes2 / trials2;
  const pPooled = (successes1 + successes2) / (trials1 + trials2);
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / trials1 + 1 / trials2));
  if (se === 0) return { zScore: 0, pValue: 1 };
  const z = (p1 - p2) / se;
  const pValue = 2 * (1 - normalCdf(Math.abs(z)));
  return { zScore: z, pValue };
}

export function twoSampleTTest(
  mean1: number,
  stdDev1: number,
  n1: number,
  mean2: number,
  stdDev2: number,
  n2: number,
): { tStat: number; pValue: number } {
  if (n1 < 2 || n2 < 2) return { tStat: 0, pValue: 1 };
  const se = Math.sqrt((stdDev1 ** 2) / n1 + (stdDev2 ** 2) / n2);
  if (se === 0) return { tStat: 0, pValue: 1 };
  const t = (mean1 - mean2) / se;
  const pValue = 2 * (1 - normalCdf(Math.abs(t)));
  return { tStat: t, pValue };
}

// ── ExperimentRegistry ──

@Injectable()
export class ExperimentRegistry {
  private readonly experiments = new Map<string, Experiment>();
  private readonly assignments = new Map<string, Assignment>();
  private readonly events: MetricEvent[] = [];

  create(experiment: Omit<Experiment, 'startedAt' | 'status'>): Experiment {
    const exp: Experiment = { ...experiment, startedAt: Date.now(), status: 'running' };
    this.experiments.set(exp.id, exp);
    return exp;
  }

  get(id: string): Experiment | undefined {
    return this.experiments.get(id);
  }

  list(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  pause(id: string): boolean {
    const exp = this.experiments.get(id);
    if (!exp) return false;
    exp.status = 'paused';
    return true;
  }

  resume(id: string): boolean {
    const exp = this.experiments.get(id);
    if (!exp) return false;
    exp.status = 'running';
    return true;
  }

  complete(id: string): boolean {
    const exp = this.experiments.get(id);
    if (!exp) return false;
    exp.status = 'completed';
    exp.endedAt = Date.now();
    return true;
  }

  assign(experimentId: string, unitId: string): Assignment | undefined {
    const exp = this.experiments.get(experimentId);
    if (!exp || exp.status !== 'running') return undefined;

    const cacheKey = `${experimentId}:${unitId}`;
    const cached = this.assignments.get(cacheKey);
    if (cached) return cached;

    const bucket = hashToBucket(unitId, experimentId);
    const trafficSplit = exp.trafficSplit ?? 1.0;
    if (bucket > trafficSplit) return undefined;

    const variantBucket = (bucket / trafficSplit) * totalWeight(exp.variants);
    let cumulative = 0;
    let chosen = exp.variants[0];
    for (const v of exp.variants) {
      cumulative += v.weight;
      if (variantBucket < cumulative) {
        chosen = v;
        break;
      }
    }

    const assignment: Assignment = {
      experimentId,
      unitId,
      variantName: chosen.name,
      config: chosen.config,
      assignedAt: Date.now(),
    };
    this.assignments.set(cacheKey, assignment);
    return assignment;
  }

  track(event: MetricEvent): void {
    this.events.push(event);
  }

  getEvents(experimentId: string, variantName?: string, metricName?: string): MetricEvent[] {
    return this.events.filter((e) => {
      if (e.experimentId !== experimentId) return false;
      if (variantName && e.variantName !== variantName) return false;
      if (metricName && e.metric !== metricName) return false;
      return true;
    });
  }

  report(experimentId: string, metricName: string): ExperimentReport | undefined {
    const exp = this.experiments.get(experimentId);
    if (!exp) return undefined;

    const variantStats: VariantStats[] = [];
    const controlStats: VariantStats | undefined = exp.variants[0]
      ? this.computeStats(experimentId, exp.variants[0].name, metricName)
      : undefined;

    for (const variant of exp.variants) {
      const stats = this.computeStats(experimentId, variant.name, metricName);
      variantStats.push(stats);
    }

    const pValues: Record<string, number> = {};
    const significant: Record<string, boolean> = {};
    const lift: Record<string, number> = {};
    for (let i = 1; i < exp.variants.length; i++) {
      const variant = exp.variants[i];
      const vStats = variantStats[i];
      const controlMean = controlStats?.mean ?? 0;

      const tTest = twoSampleTTest(
        vStats.mean, vStats.stdDev, vStats.unitCount,
        controlMean, controlStats?.stdDev ?? 0, controlStats?.unitCount ?? 0,
      );
      pValues[variant.name] = tTest.pValue;
      significant[variant.name] = tTest.pValue < 0.05;
      lift[variant.name] = controlMean === 0 ? 0 : ((vStats.mean - controlMean) / controlMean) * 100;
    }

    const winner = variantStats.length > 0
      ? variantStats.reduce((best, cur) => (cur.mean > best.mean ? cur : best)).variantName
      : undefined;

    const totalEvents = variantStats.reduce((s, v) => s + v.eventCount, 0);
    const totalUnits = variantStats.reduce((s, v) => s + v.unitCount, 0);

    return {
      experimentId,
      experimentName: exp.name,
      metricName,
      variants: variantStats,
      winner,
      pValues,
      significant,
      lift,
      totalEvents,
      totalUnits,
    };
  }

  private computeStats(experimentId: string, variantName: string, metricName: string): VariantStats {
    const events = this.getEvents(experimentId, variantName, metricName);
    const unitSet = new Set(events.map((e) => e.unitId));
    const values = events.map((e) => e.value);
    const n = values.length;

    if (n === 0) {
      return { variantName, unitCount: 0, eventCount: 0, mean: 0, stdDev: 0, ciLower: 0, ciUpper: 0 };
    }

    const mean = values.reduce((s, v) => s + v, 0) / n;
    const variance = n > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0;
    const stdDev = Math.sqrt(variance);
    const se = stdDev / Math.sqrt(n);
    const ciLower = mean - 1.96 * se;
    const ciUpper = mean + 1.96 * se;

    return {
      variantName,
      unitCount: unitSet.size,
      eventCount: n,
      mean,
      stdDev,
      ciLower,
      ciUpper,
    };
  }
}

function totalWeight(variants: Variant[]): number {
  return variants.reduce((s, v) => s + v.weight, 0);
}
