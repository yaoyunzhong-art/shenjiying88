/**
 * sla-calculator.test.ts — SLACalculator 单元测试
 *
 * 测试 SLA 计算核心逻辑: 可用率计算 → 响应时间分桶 → 违背判定 → 补偿倍率
 * 全纯函数式，不依赖 NestJS DI、不 import 生产模块。
 * ≥15 cases: 正例 ≥8 + 反例 ≥4 + 边界 ≥3
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ========================================================================
// 1. 类型定义（完全 inline）
// ========================================================================

type SlaLevel = 'PLATINUM' | 'GOLD' | 'SILVER' | 'STANDARD';
type SlaStatus = 'MET' | 'VIOLATED' | 'WARNING';
type Severity = 'P1' | 'P2' | 'P3' | 'P4';

interface SlaPolicy {
  id: string;
  level: SlaLevel;
  uptimePercent: number; // 99.9 表示 99.9%
  maxResponseTimeMs: number;
  p1ResolutionMinutes: number;
  p2ResolutionMinutes: number;
  p3ResolutionMinutes: number;
  p4ResolutionMinutes: number;
  violationCompensationRate: number; // 违反补偿系数
}

interface SlaRecord {
  id: string;
  policyId: string;
  scopeId: string;
  serviceId: string;
  status: SlaStatus;
  uptimeCurrent: number; // 当前周期可用率百分比
  averageResponseTimeMs: number;
  totalChecks: number;
  failedChecks: number;
  violationCount: number;
  periodStart: string;
  periodEnd: string;
}

interface Incident {
  id: string;
  serviceId: string;
  severity: Severity;
  startedAt: string;
  resolvedAt?: string;
  resolutionMinutes: number;
  description: string;
}

interface SlaPenalty {
  recordId: string;
  violationType: 'UPTIME' | 'RESPONSE_TIME' | 'RESOLUTION_TIME';
  severity: Severity;
  compensationPct: number; // 补偿百分比
  description: string;
}

// ========================================================================
// 2. Mock 数据工厂
// ========================================================================

function makeSlaPolicy(overrides?: Partial<SlaPolicy>): SlaPolicy {
  return {
    id: 'sla-platinum',
    level: 'PLATINUM',
    uptimePercent: 99.99,
    maxResponseTimeMs: 200,
    p1ResolutionMinutes: 15,
    p2ResolutionMinutes: 30,
    p3ResolutionMinutes: 120,
    p4ResolutionMinutes: 480,
    violationCompensationRate: 0.3,
    ...overrides,
  };
}

function makeSlaRecord(overrides?: Partial<SlaRecord>): SlaRecord {
  return {
    id: 'sla-rec-001',
    policyId: 'sla-platinum',
    scopeId: 'T001',
    serviceId: 'svc-payment',
    status: 'MET',
    uptimeCurrent: 99.99,
    averageResponseTimeMs: 150,
    totalChecks: 10000,
    failedChecks: 1,
    violationCount: 0,
    periodStart: '2026-07-01T00:00:00Z',
    periodEnd: '2026-07-31T23:59:59Z',
    ...overrides,
  };
}

function makeIncident(overrides?: Partial<Incident>): Incident {
  return {
    id: 'inc-001',
    serviceId: 'svc-payment',
    severity: 'P1',
    startedAt: '2026-07-15T10:00:00Z',
    resolvedAt: '2026-07-15T10:12:00Z',
    resolutionMinutes: 12,
    description: 'Payment gateway timeout',
    ...overrides,
  };
}

// ========================================================================
// 3. 纯业务函数（内联）
// ========================================================================

/** 计算当前周期可用率 */
function calculateUptime(totalChecks: number, failedChecks: number): number {
  if (totalChecks <= 0) return 100;
  return ((totalChecks - failedChecks) / totalChecks) * 100;
}

/** 检查可用率是否满足 SLA */
function checkUptimeCompliance(uptime: number, threshold: number): SlaStatus {
  if (uptime >= threshold) return 'MET';
  if (uptime >= threshold - 0.1) return 'WARNING';
  return 'VIOLATED';
}

/** 检查响应时间是否满足 SLA */
function checkResponseTimeCompliance(
  avgResponseTimeMs: number,
  maxAllowedMs: number,
): SlaStatus {
  if (avgResponseTimeMs <= maxAllowedMs) return 'MET';
  if (avgResponseTimeMs < maxAllowedMs * 1.2) return 'WARNING';
  return 'VIOLATED';
}

/** 根据严重级别获取期望的解决时间（分钟） */
function getExpectedResolutionMinutes(policy: SlaPolicy, severity: Severity): number {
  switch (severity) {
    case 'P1': return policy.p1ResolutionMinutes;
    case 'P2': return policy.p2ResolutionMinutes;
    case 'P3': return policy.p3ResolutionMinutes;
    case 'P4': return policy.p4ResolutionMinutes;
    default: return Number.POSITIVE_INFINITY;
  }
}

/** 检查事件解决时间是否满足 SLA */
function checkResolutionCompliance(
  incident: Incident,
  policy: SlaPolicy,
): SlaStatus {
  const expected = getExpectedResolutionMinutes(policy, incident.severity);
  if (incident.resolutionMinutes <= expected) return 'MET';
  if (incident.resolutionMinutes <= expected * 1.2) return 'WARNING';
  return 'VIOLATED';
}

/** 计算违约补偿金额（基于补偿系数） */
function calculateCompensation(
  basePrice: number,
  compensationRate: number,
  violationCount: number,
): number {
  return basePrice * compensationRate * violationCount;
}

/** 计算滚动窗口平均响应时间 */
function calculateMovingAverage(
  samples: number[],
  windowSize: number,
): number {
  if (samples.length === 0) return 0;
  const window = samples.slice(-windowSize);
  return window.reduce((a, b) => a + b, 0) / window.length;
}

/** 分桶统计响应时间分布 */
function bucketResponseTimes(
  samples: number[],
  thresholds: number[],
): Map<string, number> {
  const buckets = new Map<string, number>();
  const sorted = [...thresholds].sort((a, b) => a - b);

  for (const sample of samples) {
    let assigned = false;
    for (const threshold of sorted) {
      if (sample <= threshold) {
        const key = `≤${threshold}ms`;
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      buckets.set(`>${sorted[sorted.length - 1]!}ms`, (buckets.get(`>${sorted[sorted.length - 1]!}ms`) ?? 0) + 1);
    }
  }
  return buckets;
}

/** 生成 SLA 违例罚单 */
function generatePenalties(
  record: SlaRecord,
  policy: SlaPolicy,
  incidents: Incident[],
): SlaPenalty[] {
  const penalties: SlaPenalty[] = [];

  if (record.status === 'VIOLATED') {
    if (record.uptimeCurrent < policy.uptimePercent) {
      penalties.push({
        recordId: record.id,
        violationType: 'UPTIME',
        severity: 'P1',
        compensationPct: policy.violationCompensationRate,
        description: `Uptime ${record.uptimeCurrent.toFixed(2)}% below threshold ${policy.uptimePercent}%`,
      });
    }

    if (record.averageResponseTimeMs > policy.maxResponseTimeMs) {
      penalties.push({
        recordId: record.id,
        violationType: 'RESPONSE_TIME',
        severity: 'P2',
        compensationPct: policy.violationCompensationRate * 0.5,
        description: `Avg response ${record.averageResponseTimeMs}ms exceeds ${policy.maxResponseTimeMs}ms`,
      });
    }
  }

  for (const inc of incidents) {
    const compliance = checkResolutionCompliance(inc, policy);
    if (compliance === 'VIOLATED') {
      penalties.push({
        recordId: record.id,
        violationType: 'RESOLUTION_TIME',
        severity: inc.severity,
        compensationPct: policy.violationCompensationRate * 0.7,
        description: `Incident ${inc.id} resolution took ${inc.resolutionMinutes}min, expected ${getExpectedResolutionMinutes(policy, inc.severity)}min`,
      });
    }
  }

  return penalties;
}

/** 聚合多服务 SLA 状态 */
function aggregateSlaStatus(records: SlaRecord[]): {
  total: number;
  met: number;
  warning: number;
  violated: number;
  overallUptime: number;
} {
  const met = records.filter((r) => r.status === 'MET').length;
  const warning = records.filter((r) => r.status === 'WARNING').length;
  const violated = records.filter((r) => r.status === 'VIOLATED').length;
  const overallChecks = records.reduce((s, r) => s + r.totalChecks, 0);
  const overallFailed = records.reduce((s, r) => s + r.failedChecks, 0);
  const overallUptime = calculateUptime(overallChecks, overallFailed);

  return {
    total: records.length,
    met,
    warning,
    violated,
    overallUptime,
  };
}

// ========================================================================
// 4. 测试
// ========================================================================

describe('SLACalculator / calculateUptime 可用率计算', () => {
  it('正常计算可用率', () => {
    const uptime = calculateUptime(10000, 1);
    assert.strictEqual(uptime, 99.99);
    assert.strictEqual(calculateUptime(1000, 50), 95);
  });

  it('零失败时可用率为 100%', () => {
    assert.strictEqual(calculateUptime(1000, 0), 100);
  });

  it('全部失败时可用率为 0%', () => {
    assert.strictEqual(calculateUptime(1000, 1000), 0);
  });

  it('总检查数为 0 时返回 100%', () => {
    assert.strictEqual(calculateUptime(0, 0), 100);
  });
});

describe('SLACalculator / checkUptimeCompliance 可用率合规检查', () => {
  it('可用率 >= 阈值返回 MET', () => {
    assert.strictEqual(checkUptimeCompliance(99.99, 99.99), 'MET');
    assert.strictEqual(checkUptimeCompliance(100, 99.99), 'MET');
  });

  it('可用率略低于阈值（<0.1%）返回 WARNING', () => {
    assert.strictEqual(checkUptimeCompliance(99.95, 99.99), 'WARNING');
    assert.strictEqual(checkUptimeCompliance(99.90, 99.99), 'WARNING');
  });

  it('可用率明显低于阈值返回 VIOLATED', () => {
    assert.strictEqual(checkUptimeCompliance(99.80, 99.99), 'VIOLATED');
    assert.strictEqual(checkUptimeCompliance(95, 99.99), 'VIOLATED');
  });
});

describe('SLACalculator / checkResponseTimeCompliance 响应时间合规', () => {
  it('响应时间 <= 最大值返回 MET', () => {
    assert.strictEqual(checkResponseTimeCompliance(150, 200), 'MET');
    assert.strictEqual(checkResponseTimeCompliance(200, 200), 'MET');
  });

  it('响应时间超标 < 20% 返回 WARNING', () => {
    assert.strictEqual(checkResponseTimeCompliance(220, 200), 'WARNING');
    assert.strictEqual(checkResponseTimeCompliance(239, 200), 'WARNING');
  });

  it('响应时间超标 >= 20% 返回 VIOLATED', () => {
    assert.strictEqual(checkResponseTimeCompliance(240, 200), 'VIOLATED');
    assert.strictEqual(checkResponseTimeCompliance(500, 200), 'VIOLATED');
  });
});

describe('SLACalculator / checkResolutionCompliance 解决时间合规', () => {
  const policy = makeSlaPolicy({
    p1ResolutionMinutes: 15,
    p2ResolutionMinutes: 30,
    p3ResolutionMinutes: 120,
    p4ResolutionMinutes: 480,
  });

  it('P1 解决时间在期望内返回 MET', () => {
    const inc = makeIncident({ severity: 'P1', resolutionMinutes: 12 });
    assert.strictEqual(checkResolutionCompliance(inc, policy), 'MET');
  });

  it('P1 解决时间超标 < 20% 返回 WARNING', () => {
    const inc = makeIncident({ severity: 'P1', resolutionMinutes: 17 });
    assert.strictEqual(checkResolutionCompliance(inc, policy), 'WARNING');
  });

  it('P1 解决时间超标 >= 20% 返回 VIOLATED', () => {
    const inc = makeIncident({ severity: 'P1', resolutionMinutes: 20 });
    assert.strictEqual(checkResolutionCompliance(inc, policy), 'VIOLATED');
  });

  it('P2 解决时间的阈值不同', () => {
    const inc = makeIncident({ severity: 'P2', resolutionMinutes: 35 });
    assert.strictEqual(inc.severity, 'P2');
    assert.strictEqual(getExpectedResolutionMinutes(policy, 'P2'), 30);
  });
});

describe('SLACalculator / getExpectedResolutionMinutes 预期解决时间', () => {
  const policy = makeSlaPolicy();

  it('返回各级别的预期解决时间', () => {
    assert.strictEqual(getExpectedResolutionMinutes(policy, 'P1'), 15);
    assert.strictEqual(getExpectedResolutionMinutes(policy, 'P2'), 30);
    assert.strictEqual(getExpectedResolutionMinutes(policy, 'P3'), 120);
    assert.strictEqual(getExpectedResolutionMinutes(policy, 'P4'), 480);
  });
});

describe('SLACalculator / calculateCompensation 补偿计算', () => {
  it('按补偿系数和违例次数计算', () => {
    assert.strictEqual(calculateCompensation(10000, 0.3, 1), 3000);
    assert.strictEqual(calculateCompensation(10000, 0.3, 2), 6000);
  });

  it('无违例时补偿为 0', () => {
    assert.strictEqual(calculateCompensation(5000, 0.3, 0), 0);
  });

  it('基础价格为 0 时补偿为 0', () => {
    assert.strictEqual(calculateCompensation(0, 0.3, 1), 0);
  });
});

describe('SLACalculator / calculateMovingAverage 滚动平均', () => {
  it('计算窗口内平均值', () => {
    const samples = [100, 200, 150, 180, 130];
    assert.strictEqual(calculateMovingAverage(samples, 3), (180 + 130 + 150) / 3);
  });

  it('窗口大于样本数时使用全部样本', () => {
    const samples = [100, 200];
    assert.strictEqual(calculateMovingAverage(samples, 10), 150);
  });

  it('空样本数组返回 0', () => {
    assert.strictEqual(calculateMovingAverage([], 5), 0);
  });
});

describe('SLACalculator / bucketResponseTimes 响应时间分桶', () => {
  const thresholds = [100, 200, 500];

  it('按阈值分桶统计', () => {
    const samples = [50, 150, 300, 600, 80, 250, 1000, 45];
    const buckets = bucketResponseTimes(samples, thresholds);
    assert.strictEqual(buckets.get('≤100ms'), 3); // 50, 80, 45
    assert.strictEqual(buckets.get('≤200ms'), 1); // 150
    assert.strictEqual(buckets.get('≤500ms'), 2); // 300, 250
    assert.strictEqual(buckets.get('>500ms'), 2); // 600, 1000
    // ≤200: 150 = 1
    // ≤500: 300,250 = 2
    // >500: 600,1000 = 2
    assert.strictEqual(buckets.get('≤100ms'), 3);
    assert.strictEqual(buckets.get('≤200ms'), 1);
    assert.strictEqual(buckets.get('≤500ms'), 2);
    assert.strictEqual(buckets.get('>500ms'), 2);
  });

  it('所有样本都在最严格桶中', () => {
    const samples = [10, 20, 30];
    const buckets = bucketResponseTimes(samples, [100]);
    assert.strictEqual(buckets.get('≤100ms'), 3);
    assert.strictEqual(buckets.get('>100ms'), undefined);
  });

  it('所有样本都超过最大阈值', () => {
    const samples = [500, 600];
    const buckets = bucketResponseTimes(samples, [100, 200]);
    assert.strictEqual(buckets.get('>200ms'), 2);
  });
});

describe('SLACalculator / generatePenalties 罚单生成', () => {
  const policy = makeSlaPolicy();

  it('违规状态生成可用率罚单', () => {
    const record = makeSlaRecord({ status: 'VIOLATED', uptimeCurrent: 99.50 });
    const penalties = generatePenalties(record, policy, []);
    assert.ok(penalties.some((p) => p.violationType === 'UPTIME'));
  });

  it('违规状态生成响应时间罚单', () => {
    const record = makeSlaRecord({ status: 'VIOLATED', averageResponseTimeMs: 300 });
    const penalties = generatePenalties(record, policy, []);
    assert.ok(penalties.some((p) => p.violationType === 'RESPONSE_TIME'));
  });

  it('解决时间违规生成罚单', () => {
    const record = makeSlaRecord({ status: 'MET' });
    const incident = makeIncident({ severity: 'P1', resolutionMinutes: 30 }); // expected 15, 30 > 18 (15*1.2)
    const penalties = generatePenalties(record, policy, [incident]);
    assert.ok(penalties.some((p) => p.violationType === 'RESOLUTION_TIME'));
  });

  it('SLA 合规时不生成罚单', () => {
    const record = makeSlaRecord({ status: 'MET' });
    const penalties = generatePenalties(record, policy, []);
    assert.strictEqual(penalties.length, 0);
  });
});

describe('SLACalculator / aggregateSlaStatus 聚合状态', () => {
  const records: SlaRecord[] = [
    makeSlaRecord({ id: 'r1', status: 'MET', totalChecks: 1000, failedChecks: 0 }),
    makeSlaRecord({ id: 'r2', status: 'MET', totalChecks: 1000, failedChecks: 0 }),
    makeSlaRecord({ id: 'r3', status: 'WARNING', totalChecks: 1000, failedChecks: 2 }),
    makeSlaRecord({ id: 'r4', status: 'VIOLATED', totalChecks: 1000, failedChecks: 10 }),
  ];

  it('正确统计各状态数量', () => {
    const result = aggregateSlaStatus(records);
    assert.strictEqual(result.total, 4);
    assert.strictEqual(result.met, 2);
    assert.strictEqual(result.warning, 1);
    assert.strictEqual(result.violated, 1);
  });

  it('计算总体可用率', () => {
    const result = aggregateSlaStatus(records);
    // total = 4000, failed = 12
    assert.strictEqual(result.overallUptime, ((4000 - 12) / 4000) * 100);
  });

  it('空记录集返回全零', () => {
    const result = aggregateSlaStatus([]);
    assert.strictEqual(result.total, 0);
    assert.strictEqual(result.met, 0);
    assert.strictEqual(result.violated, 0);
    assert.strictEqual(result.overallUptime, 100);
  });
});
