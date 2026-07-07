/**
 * ai-push.service.ts - Phase-24 T113-2
 * AI 精准推送任务（分群 + 时机 + A/B）
 *
 * 模块:
 * - MemberSegmentationService: 会员分群（行为/价值/生命周期）
 * - OptimalTimingService: 最优推送时机预测
 * - ABTestService: A/B 测试框架
 */
import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

// ── Types ───────────────────────────────────────────────────────────────────

export type BehaviorSegment = 'newcomer' | 'active' | 'sleeping' | 'churned';
export type ValueSegment = 'high' | 'medium' | 'low' | 'rfm';
export type LifecycleSegment = 'newborn' | 'growth' | 'mature' | 'declining';

export interface MemberBehavior {
  memberId: string;
  lastActiveAt: number;
  purchaseCount: number;
  totalSpent: number;
  avgOrderValue: number;
  sessionCount: number;
  lastPurchaseAt: number;
  churnDays: number;
}

export interface SegmentProfile {
  segmentId: string;
  segmentType: string;
  description: string;
  tags: string[];
  avgMetrics: {
    purchaseCount: number;
    totalSpent: number;
    activeDaysAgo: number;
  };
}

export interface OptimalTimeWindow {
  startHour: number;
  endHour: number;
  score: number;
  channel: string;
}

export interface ExperimentConfig {
  id: string;
  name: string;
  description?: string;
  variants: VariantConfig[];
  trafficSplit?: number;
  startAt?: number;
}

export interface VariantConfig {
  name: string;
  weight: number;
  config: Record<string, unknown>;
}

export interface ExperimentResult {
  experimentId: string;
  experimentName: string;
  variants: VariantResult[];
  winner?: string;
  confidence: number;
  liftMap: Record<string, number>;
  totalSamples: number;
  isSignificant: boolean;
}

export interface VariantResult {
  name: string;
  sampleCount: number;
  conversionCount: number;
  conversionRate: number;
  avgValue: number;
}

export interface ABTestAssignment {
  memberId: string;
  experimentId: string;
  variantName: string;
  config: Record<string, unknown>;
  assignedAt: number;
}

// ── MemberSegmentationService ───────────────────────────────────────────────

@Injectable()
export class MemberSegmentationService {
  // In-memory store for member behavior data
  private readonly memberBehaviors = new Map<string, MemberBehavior>();

  upsertBehavior(behavior: MemberBehavior): void {
    this.memberBehaviors.set(behavior.memberId, behavior);
  }

  /**
   * 按行为分群：新用户 / 活跃 / 沉睡 / 流失
   * - newcomer: 注册 < 7 天且无购买
   * - active: 30 天内有互动且购买次数 >= 3
   * - sleeping: 30-90 天无互动
   * - churned: 90 天以上无互动
   */
  segmentByBehavior(memberIds: string[]): Map<string, BehaviorSegment> {
    const now = Date.now();
    const dayMs = 86400000;
    const result = new Map<string, BehaviorSegment>();

    for (const id of memberIds) {
      const b = this.memberBehaviors.get(id);
      if (!b) {
        result.set(id, 'churned');
        continue;
      }
      const daysSinceActive = (now - b.lastActiveAt) / dayMs;
      const daysSincePurchase = (now - b.lastPurchaseAt) / dayMs;

      if (daysSincePurchase < 7 && b.purchaseCount === 0) {
        result.set(id, 'newcomer');
      } else if (daysSinceActive <= 30 && b.purchaseCount >= 3) {
        result.set(id, 'active');
      } else if (daysSinceActive > 30 && daysSinceActive <= 90) {
        result.set(id, 'sleeping');
      } else {
        result.set(id, 'churned');
      }
    }
    return result;
  }

  /**
   * 按价值分群：高价值 / 中价值 / 低价值 / RFM
   * RFM = Recency(近度) + Frequency(频度) + Monetary(额度) 三维评分
   */
  segmentByValue(memberIds: string[]): Map<string, ValueSegment> {
    const now = Date.now();
    const dayMs = 86400000;
    const result = new Map<string, ValueSegment>();

    // Collect metrics for normalization
    const metrics = memberIds.map((id) => {
      const b = this.memberBehaviors.get(id);
      const recency = b ? (now - b.lastPurchaseAt) / dayMs : 999;
      const frequency = b?.purchaseCount ?? 0;
      const monetary = b?.totalSpent ?? 0;
      return { id, recency, frequency, monetary };
    });

    const medianMonetary = this.percentile(metrics.map((m) => m.monetary), 0.5);
    const medianFreq = this.percentile(metrics.map((m) => m.frequency), 0.5);

    for (const m of metrics) {
      // High/Medium/Low based on monetary value
      if (m.monetary >= medianMonetary * 2) {
        result.set(m.id, 'high');
      } else if (m.monetary >= medianMonetary) {
        result.set(m.id, 'medium');
      } else if (m.monetary > 0) {
        result.set(m.id, 'low');
      } else {
        result.set(m.id, 'rfm');
      }
    }

    return result;
  }

  /**
   * RFM 三维评分
   * Returns: { recencyScore, frequencyScore, monetaryScore, totalScore }
   */
  computeRFM(memberId: string): { recencyScore: number; frequencyScore: number; monetaryScore: number; totalScore: number } {
    const b = this.memberBehaviors.get(memberId);
    const now = Date.now();
    const dayMs = 86400000;

    const recencyDays = b ? (now - b.lastPurchaseAt) / dayMs : 999;
    const frequency = b?.purchaseCount ?? 0;
    const monetary = b?.totalSpent ?? 0;

    // Recency: 越近分越高 (1-5分)
    const recencyScore = Math.max(1, Math.min(5, 6 - Math.ceil(recencyDays / 30)));
    // Frequency: 购买次数越多分越高 (1-5分)
    const frequencyScore = Math.max(1, Math.min(5, Math.ceil(frequency / 3)));
    // Monetary: 消费金额越高分越高 (1-5分)
    const monetaryScore = Math.max(1, Math.min(5, Math.ceil(monetary / 500)));

    return {
      recencyScore,
      frequencyScore,
      monetaryScore,
      totalScore: recencyScore + frequencyScore + monetaryScore,
    };
  }

  /**
   * 按生命周期分群：新人 / 成长 / 成熟 / 衰退
   */
  segmentByLifecycle(memberIds: string[]): Map<string, LifecycleSegment> {
    const now = Date.now();
    const dayMs = 86400000;
    const result = new Map<string, LifecycleSegment>();

    for (const id of memberIds) {
      const b = this.memberBehaviors.get(id);
      if (!b) {
        result.set(id, 'declining');
        continue;
      }
      const memberAge = (now - b.lastActiveAt) / dayMs;
      const purchaseFreq = b.purchaseCount / Math.max(1, memberAge / 30);

      if (b.purchaseCount <= 1 && memberAge <= 30) {
        result.set(id, 'newborn');
      } else if (purchaseFreq >= 1 && b.totalSpent > 1000) {
        result.set(id, 'growth');
      } else if (b.totalSpent > 5000 && b.purchaseCount >= 10) {
        result.set(id, 'mature');
      } else {
        result.set(id, 'declining');
      }
    }
    return result;
  }

  /**
   * 获取分群特征描述
   */
  getSegmentProfile(segmentType: string, segmentId: string): SegmentProfile {
    const profiles: Record<string, SegmentProfile> = {
      'behavior-newcomer': {
        segmentId: 'behavior-newcomer',
        segmentType: 'behavior',
        description: '新注册会员，尚未产生购买行为',
        tags: ['拉新', '激活', '新手引导'],
        avgMetrics: { purchaseCount: 0, totalSpent: 0, activeDaysAgo: 5 },
      },
      'behavior-active': {
        segmentId: 'behavior-active',
        segmentType: 'behavior',
        description: '高频互动会员，购买频次高，活跃度高',
        tags: ['复购', '会员权益', '专属优惠'],
        avgMetrics: { purchaseCount: 8, totalSpent: 5000, activeDaysAgo: 3 },
      },
      'behavior-sleeping': {
        segmentId: 'behavior-sleeping',
        segmentType: 'behavior',
        description: '30-90天未互动的沉睡会员',
        tags: ['唤醒', '限时优惠', '召回'],
        avgMetrics: { purchaseCount: 2, totalSpent: 800, activeDaysAgo: 60 },
      },
      'behavior-churned': {
        segmentId: 'behavior-churned',
        segmentType: 'behavior',
        description: '90天以上未互动，已流失会员',
        tags: ['流失召回', '大额优惠', '问卷调研'],
        avgMetrics: { purchaseCount: 1, totalSpent: 200, activeDaysAgo: 180 },
      },
      'value-high': {
        segmentId: 'value-high',
        segmentType: 'value',
        description: '高价值会员，累计消费金额高',
        tags: ['VIP权益', '专属客服', '优先体验'],
        avgMetrics: { purchaseCount: 15, totalSpent: 20000, activeDaysAgo: 7 },
      },
      'lifecycle-newborn': {
        segmentId: 'lifecycle-newborn',
        segmentType: 'lifecycle',
        description: '生命周期早期会员，需要培养忠诚度',
        tags: ['新手礼包', '成长路径', '首单优惠'],
        avgMetrics: { purchaseCount: 1, totalSpent: 150, activeDaysAgo: 15 },
      },
      'lifecycle-growth': {
        segmentId: 'lifecycle-growth',
        segmentType: 'lifecycle',
        description: '成长期会员，消费频次上升中',
        tags: ['升级礼包', '复购提醒', '积分加倍'],
        avgMetrics: { purchaseCount: 5, totalSpent: 3000, activeDaysAgo: 10 },
      },
      'lifecycle-mature': {
        segmentId: 'lifecycle-mature',
        segmentType: 'lifecycle',
        description: '成熟期会员，价值稳定',
        tags: ['维系', '专属活动', '生日福利'],
        avgMetrics: { purchaseCount: 12, totalSpent: 8000, activeDaysAgo: 5 },
      },
      'lifecycle-declining': {
        segmentId: 'lifecycle-declining',
        segmentType: 'lifecycle',
        description: '衰退期会员，需要激活或召回',
        tags: ['激活', '流失预防', '定向补贴'],
        avgMetrics: { purchaseCount: 2, totalSpent: 500, activeDaysAgo: 90 },
      },
    };

    const key = `${segmentType}-${segmentId}`;
    return profiles[key] ?? {
      segmentId: key,
      segmentType,
      description: '未知分群',
      tags: [],
      avgMetrics: { purchaseCount: 0, totalSpent: 0, activeDaysAgo: 0 },
    };
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.floor(sorted.length * p);
    return sorted[idx];
  }
}

// ── OptimalTimingService ────────────────────────────────────────────────────

@Injectable()
export class OptimalTimingService {
  // member -> preferred hours (0-23)
  private readonly memberPreferredHours = new Map<string, number[]>();
  // channel -> global optimal windows
  private readonly channelOptimalWindows = new Map<string, OptimalTimeWindow[]>();

  constructor() {
    // Default global optimal windows per channel
    this.channelOptimalWindows.set('push', [
      { startHour: 9, endHour: 11, score: 0.9, channel: 'push' },
      { startHour: 19, endHour: 21, score: 0.85, channel: 'push' },
      { startHour: 12, endHour: 14, score: 0.6, channel: 'push' },
    ]);
    this.channelOptimalWindows.set('sms', [
      { startHour: 10, endHour: 12, score: 0.8, channel: 'sms' },
      { startHour: 17, endHour: 19, score: 0.7, channel: 'sms' },
    ]);
    this.channelOptimalWindows.set('email', [
      { startHour: 9, endHour: 10, score: 0.85, channel: 'email' },
      { startHour: 14, endHour: 16, score: 0.75, channel: 'email' },
    ]);
  }

  /**
   * 预测最佳推送时间
   * 基于用户历史活跃时间 + 全局最优时段 + 时区调整
   */
  predictBestTime(memberId: string, channel: string): { timestamp: number; score: number; window: OptimalTimeWindow } {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const localHour = this.adjustForTimezone(memberId, utcHour);

    const preferredHours = this.memberPreferredHours.get(memberId) ?? [];
    const windows = this.channelOptimalWindows.get(channel) ?? [];

    // Find best matching window
    let bestWindow = windows[0] ?? { startHour: 9, endHour: 11, score: 0.5, channel };
    let bestScore = 0;

    for (const w of windows) {
      let score = w.score;
      // Boost if matches member's preferred hours
      if (preferredHours.includes(w.startHour)) {
        score *= 1.2;
      }
      if (score > bestScore) {
        bestScore = score;
        bestWindow = w;
      }
    }

    // Calculate next occurrence of best window
    const nextTimestamp = this.getNextWindowTime(bestWindow, now);
    return { timestamp: nextTimestamp, score: Math.min(1, bestScore), window: bestWindow };
  }

  /**
   * 获取全局最佳时段
   */
  getGlobalOptimalWindows(): OptimalTimeWindow[] {
    const allWindows: OptimalTimeWindow[] = [];
    for (const windows of this.channelOptimalWindows.values()) {
      allWindows.push(...windows);
    }
    return allWindows.sort((a, b) => b.score - a.score);
  }

  /**
   * 时区调整
   * 模拟：基于 memberId hash 分配时区偏移 (-12 ~ +12)
   */
  adjustForTimezone(memberId: string, utcHour: number): number {
    const hash = createHash('md5').update(memberId).digest();
    const tzOffset = (hash[0] % 25) - 12; // -12 ~ +12
    return (utcHour + tzOffset + 24) % 24;
  }

  /**
   * 设置会员偏好时段
   */
  setMemberPreferredHours(memberId: string, hours: number[]): void {
    this.memberPreferredHours.set(memberId, hours);
  }

  private getNextWindowTime(window: OptimalTimeWindow, from: Date): number {
    const result = new Date(from);
    result.setUTCHours(window.startHour, 0, 0, 0);
    if (result.getTime() <= from.getTime()) {
      result.setDate(result.getDate() + 1);
    }
    return result.getTime();
  }
}

// ── ABTestService ────────────────────────────────────────────────────────────

@Injectable()
export class ABTestService {
  private readonly experiments = new Map<string, ExperimentConfig>();
  private readonly assignments = new Map<string, ABTestAssignment>();
  private readonly conversions = new Map<string, { variantName: string; value: number; timestamp: number }[]>();

  createExperiment(config: ExperimentConfig): ExperimentConfig {
    const exp: ExperimentConfig = {
      ...config,
      startAt: config.startAt ?? Date.now(),
    };
    this.experiments.set(exp.id, exp);
    return exp;
  }

  getExperiment(id: string): ExperimentConfig | undefined {
    return this.experiments.get(id);
  }

  /**
   * 分配实验变体（幂等）
   * 基于 hash 的确定性分配，同一 memberId 总是返回同一 variant
   */
  assignVariant(memberId: string, experimentId: string): ABTestAssignment | undefined {
    const exp = this.experiments.get(experimentId);
    if (!exp) return undefined;

    const cacheKey = `${experimentId}:${memberId}`;
    const cached = this.assignments.get(cacheKey);
    if (cached) return cached;

    const bucket = this.hashToBucket(memberId, experimentId);
    const trafficSplit = exp.trafficSplit ?? 1.0;
    if (bucket > trafficSplit) return undefined;

    const variantBucket = (bucket / trafficSplit) * this.totalWeight(exp.variants);
    let cumulative = 0;
    let chosen = exp.variants[0];

    for (const v of exp.variants) {
      cumulative += v.weight;
      if (variantBucket < cumulative) {
        chosen = v;
        break;
      }
    }

    const assignment: ABTestAssignment = {
      memberId,
      experimentId,
      variantName: chosen.name,
      config: chosen.config,
      assignedAt: Date.now(),
    };
    this.assignments.set(cacheKey, assignment);
    return assignment;
  }

  /**
   * 记录转化事件
   */
  recordConversion(
    memberId: string,
    experimentId: string,
    variantName: string,
    event: string,
    value: number = 1,
  ): void {
    const key = `${experimentId}:${variantName}:${event}`;
    if (!this.conversions.has(key)) {
      this.conversions.set(key, []);
    }
    this.conversions.get(key)!.push({ variantName, value, timestamp: Date.now() });
  }

  /**
   * 获取实验结果
   * 计算提升率、置信度等指标
   */
  getExperimentResult(experimentId: string): ExperimentResult | undefined {
    const exp = this.experiments.get(experimentId);
    if (!exp) return undefined;

    const results: VariantResult[] = [];
    const control = exp.variants[0];
    let controlRate = 0;

    for (const variant of exp.variants) {
      const key = `${experimentId}:${variant.name}:conversion`;
      const records = this.conversions.get(key) ?? [];
      const sampleCount = this.getSampleCount(experimentId, variant.name);
      const conversionCount = records.length;
      const conversionRate = sampleCount > 0 ? conversionCount / sampleCount : 0;

      if (variant.name === control?.name) {
        controlRate = conversionRate;
      }

      results.push({
        name: variant.name,
        sampleCount,
        conversionCount,
        conversionRate,
        avgValue: records.length > 0 ? records.reduce((s, r) => s + r.value, 0) / records.length : 0,
      });
    }

    const liftMap: Record<string, number> = {};
    for (const r of results) {
      if (controlRate > 0) {
        liftMap[r.name] = ((r.conversionRate - controlRate) / controlRate) * 100;
      } else {
        liftMap[r.name] = 0;
      }
    }

    // Simple confidence: based on sample size and effect size
    const totalSamples = results.reduce((s, r) => s + r.sampleCount, 0);
    const isSignificant = totalSamples >= 100 && Math.abs(liftMap[results[1]?.name] ?? 0) > 5;
    const confidence = Math.min(0.99, totalSamples / 1000);

    const winner = results.reduce((best, cur) =>
      cur.conversionRate > (best?.conversionRate ?? 0) ? cur : best, results[0]);

    return {
      experimentId,
      experimentName: exp.name,
      variants: results,
      winner: winner?.name,
      confidence,
      liftMap,
      totalSamples,
      isSignificant,
    };
  }

  private getSampleCount(experimentId: string, variantName: string): number {
    let count = 0;
    for (const [key, assignment] of this.assignments) {
      if (key.startsWith(`${experimentId}:`) && assignment.variantName === variantName) {
        count++;
      }
    }
    return count;
  }

  private hashToBucket(unitId: string, experimentId: string): number {
    const h = createHash('sha256').update(`${experimentId}:${unitId}`).digest();
    const num = h.readUInt32BE(0);
    return num / 0xffffffff;
  }

  private totalWeight(variants: VariantConfig[]): number {
    return variants.reduce((s, v) => s + v.weight, 0);
  }
}
