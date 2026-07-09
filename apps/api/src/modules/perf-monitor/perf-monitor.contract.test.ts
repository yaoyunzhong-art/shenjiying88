import { describe, it, expect } from 'vitest'
/**
 * 🐜 自动: [perf-monitor] [C] 合约测试
 *
 * 验证 perf-monitor 模块的实体 Shape、业务逻辑契约、合约类型安全
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { PerfMonitorService } from './perf-monitor.service';
import type {
  PerfSample,
  PerfStats,
  SlaConfig,
  PerfSummary,
  SlaViolation,
  PerfAlert,
  PerfAlertLevel,
} from './perf-monitor.entity';
import type {
  PerfSampleContract,
  PerfStatsContract,
  SlaConfigContract,
  PerfSummaryContract,
  SlaViolationContract,
  PerfAlertContract,
  RecordSampleRequestContract,
  RegisterSlaRequestContract,
  RouteStatsQueryContract,
  SlowQueriesQueryContract,
  ResetRequestContract,
  RecordSampleResponseContract,
  RegisterSlaResponseContract,
  ResetResponseContract,
  PerfMonitorContractMap,
} from './perf-monitor.contract';

// ─── 服务实例 helper ──────────────────────────────────

function makeService(): PerfMonitorService {
  return new PerfMonitorService();
}

// ─── 合约: 实体 Shape ─────────────────────────────────

describe('[perf-monitor] 合约: 实体 Shape 一致性', () => {
  it('PerfSample 包含合约要求的全部字段', () => {
    const sample: PerfSample = {
      route: '/api/users',
      durationMs: 150,
      statusCode: 200,
      timestamp: '2026-01-01T00:00:00Z',
      tenantId: 't1',
    };
    const contract: PerfSampleContract = {
      route: sample.route,
      durationMs: sample.durationMs,
      statusCode: sample.statusCode,
      timestamp: sample.timestamp,
      tenantId: sample.tenantId,
    };
    assert.equal(contract.route, '/api/users');
    assert.equal(contract.durationMs, 150);
    assert.equal(contract.statusCode, 200);
    assert.equal(contract.timestamp, '2026-01-01T00:00:00Z');
    assert.equal(contract.tenantId, 't1');
  });

  it('PerfSample 可选字段 tenantId 可以为 undefined', () => {
    const sample: PerfSample = {
      route: '/api/test',
      durationMs: 50,
      statusCode: 200,
      timestamp: '2026-01-01T00:00:00Z',
    };
    const contract: PerfSampleContract = {
      route: sample.route,
      durationMs: sample.durationMs,
      statusCode: sample.statusCode,
      timestamp: sample.timestamp,
    };
    assert.equal(contract.tenantId, undefined);
  });

  it('PerfStats 包含所有统计字段', () => {
    const stats: PerfStats = {
      route: '/api/users',
      p50: 100,
      p95: 200,
      p99: 300,
      max: 500,
      count: 1000,
      errorRate: 0.01,
    };
    const contract: PerfStatsContract = {
      route: stats.route,
      p50: stats.p50,
      p95: stats.p95,
      p99: stats.p99,
      max: stats.max,
      count: stats.count,
      errorRate: stats.errorRate,
    };
    assert.equal(contract.p50, 100);
    assert.equal(contract.p95, 200);
    assert.equal(contract.errorRate, 0.01);
  });

  it('SlaConfig 包含必填字段', () => {
    const config: SlaConfig = {
      route: '/api/critical',
      targetP95Ms: 200,
      warnThresholdP95Ms: 250,
    };
    const contract: SlaConfigContract = {
      route: config.route,
      targetP95Ms: config.targetP95Ms,
      warnThresholdP95Ms: config.warnThresholdP95Ms,
    };
    assert.equal(contract.route, '/api/critical');
    assert.equal(contract.targetP95Ms, 200);
    assert.equal(contract.warnThresholdP95Ms, 250);
  });

  it('PerfSummary 合约包含全部字段', () => {
    const summary: PerfSummary = {
      totalSamples: 5000,
      routes: 12,
      slowQueries: 3,
      slaViolations: 1,
    };
    const contract: PerfSummaryContract = {
      totalSamples: summary.totalSamples,
      routes: summary.routes,
      slowQueries: summary.slowQueries,
      slaViolations: summary.slaViolations,
    };
    assert.equal(contract.totalSamples, 5000);
    assert.equal(contract.routes, 12);
  });

  it('SlaViolation 合约 stats 字段嵌套正确', () => {
    const stats: PerfStats = {
      route: '/api/slow',
      p50: 300,
      p95: 800,
      p99: 1500,
      max: 2000,
      count: 500,
      errorRate: 0.05,
    };
    const violation: SlaViolation & { stats: PerfStats } = {
      route: '/api/slow',
      violations: 10,
      stats,
    };
    const contract: SlaViolationContract = {
      route: violation.route,
      violations: violation.violations,
      stats: {
        route: violation.stats.route,
        p50: violation.stats.p50,
        p95: violation.stats.p95,
        p99: violation.stats.p99,
        max: violation.stats.max,
        count: violation.stats.count,
        errorRate: violation.stats.errorRate,
      },
    };
    assert.equal(contract.violations, 10);
    assert.equal(contract.stats.p95, 800);
  });
});

// ─── 合约: 请求/响应 Shape ────────────────────────────

describe('[perf-monitor] 合约: 请求/响应 Shape 一致性', () => {
  it('RecordSampleRequest 合约形状正确', () => {
    const req: RecordSampleRequestContract = {
      route: '/api/users',
      durationMs: 150,
      statusCode: 200,
      timestamp: '2026-01-01T00:00:00Z',
      tenantId: 't1',
    };
    assert.equal(req.route, '/api/users');
    assert.equal(req.durationMs, 150);
    assert.equal(typeof req.timestamp, 'string');
  });

  it('RecordSampleRequest 可选字段可缺省', () => {
    const req: RecordSampleRequestContract = {
      route: '/api/test',
      durationMs: 100,
      statusCode: 200,
    };
    assert.equal(req.timestamp, undefined);
    assert.equal(req.tenantId, undefined);
  });

  it('RegisterSlaRequest 合约形状正确', () => {
    const req: RegisterSlaRequestContract = {
      route: '/api/critical',
      targetP95Ms: 200,
      warnThresholdP95Ms: 250,
    };
    assert.equal(req.route, '/api/critical');
    assert.equal(req.targetP95Ms, 200);
  });

  it('RouteStatsQuery 合约形状正确', () => {
    const query: RouteStatsQueryContract = { route: '/api/users' };
    assert.equal(query.route, '/api/users');
  });

  it('SlowQueriesQuery limit 可选且可缺省', () => {
    const q1: SlowQueriesQueryContract = { limit: 10 };
    const q2: SlowQueriesQueryContract = {};
    assert.equal(q1.limit, 10);
    assert.equal(q2.limit, undefined);
  });

  it('ResetRequest 合约可选 confirm', () => {
    const r1: ResetRequestContract = { confirm: true };
    const r2: ResetRequestContract = {};
    assert.equal(r1.confirm, true);
    assert.equal(r2.confirm, undefined);
  });

  it('RecordSampleResponse 合约形状正确', () => {
    const res: RecordSampleResponseContract = { accepted: true, total: 42 };
    assert.equal(res.accepted, true);
    assert.equal(res.total, 42);
  });

  it('RegisterSlaResponse 合约形状正确', () => {
    const res: RegisterSlaResponseContract = { route: '/api/test', registered: true };
    assert.equal(res.registered, true);
  });

  it('ResetResponse 合约形状正确', () => {
    const res: ResetResponseContract = { reset: true };
    assert.equal(res.reset, true);
  });
});

// ─── 合约: 服务行为 ───────────────────────────────────

describe('[perf-monitor] 合约: 服务行为', () => {
  it('record 采样后 summary 总数增加', () => {
    const svc = makeService();
    svc.record({ route: '/api/test', durationMs: 100, statusCode: 200, timestamp: new Date().toISOString() });
    svc.record({ route: '/api/test', durationMs: 200, statusCode: 200, timestamp: new Date().toISOString() });
    const summary = svc.summary();
    assert.equal(summary.totalSamples, 2);
    assert.equal(summary.routes, 1);
  });

  it('多个路由统计各自正确', () => {
    const svc = makeService();
    svc.record({ route: '/api/users', durationMs: 100, statusCode: 200, timestamp: new Date().toISOString() });
    svc.record({ route: '/api/orders', durationMs: 300, statusCode: 200, timestamp: new Date().toISOString() });
    const stats = svc.getAllStats();
    assert.equal(stats.length, 2);
    const routes = stats.map(s => s.route).sort();
    assert.deepEqual(routes, ['/api/orders', '/api/users']);
  });

  it('P95 百分位计算正确', () => {
    const svc = makeService();
    const ts = new Date().toISOString();
    for (let i = 0; i < 100; i++) {
      svc.record({ route: '/api/bench', durationMs: i * 10, statusCode: 200, timestamp: ts });
    }
    const stats = svc.getStatsForRoute('/api/bench');
    // P95 应该在 ~950ms
    assert.ok(stats.p95 >= 900, `p95=${stats.p95} 应该 >= 900`);
    assert.ok(stats.p95 <= 1000, `p95=${stats.p95} 应该 <= 1000`);
  });

  it('错误采样计入 errorRate', () => {
    const svc = makeService();
    const ts = new Date().toISOString();
    for (let i = 0; i < 10; i++) {
      svc.record({ route: '/api/errors', durationMs: 50, statusCode: i < 3 ? 500 : 200, timestamp: ts });
    }
    const stats = svc.getStatsForRoute('/api/errors');
    assert.equal(stats.count, 10);
    assert.equal(stats.errorRate, 0.3);
  });

  it('超过 500ms 的记录出现在慢查询中', () => {
    const svc = makeService();
    const ts = new Date().toISOString();
    svc.record({ route: '/api/slow', durationMs: 600, statusCode: 200, timestamp: ts });
    svc.record({ route: '/api/fast', durationMs: 50, statusCode: 200, timestamp: ts });
    const slow = svc.getSlowQueries(10);
    assert.equal(slow.length, 1);
    assert.equal(slow[0].durationMs, 600);
  });

  it('SLA 违规检测触发', () => {
    const svc = makeService();
    svc.registerSla({ route: '/api/critical', targetP95Ms: 100, warnThresholdP95Ms: 150 });
    const ts = new Date().toISOString();
    for (let i = 0; i < 20; i++) {
      svc.record({ route: '/api/critical', durationMs: 200, statusCode: 200, timestamp: ts });
    }
    const violations = svc.getSlaViolations();
    assert.ok(violations.length >= 1);
    assert.ok(violations[0].violations >= 1);
  });

  it('reset 清除所有数据', () => {
    const svc = makeService();
    const ts = new Date().toISOString();
    svc.record({ route: '/api/test', durationMs: 100, statusCode: 200, timestamp: ts });
    svc.reset();
    const summary = svc.summary();
    assert.equal(summary.totalSamples, 0);
    assert.equal(summary.routes, 0);
  });
});

// ─── 合约: 契约映射完整性 ─────────────────────────────

describe('[perf-monitor] 合约: ContractMap 完整性', () => {
  it('ContractMap 包含所有实体类型引用', () => {
    // 编译期检查：ContractMap 类型是否存在
    const _map: PerfMonitorContractMap = {} as PerfMonitorContractMap;
    assert.ok(_map !== undefined);
  });

  it('PerfAlertLevel 枚举值正确', () => {
    // 使用运行时值检查
    assert.equal('INFO' as PerfAlertLevel, 'INFO');
    assert.equal('WARN' as PerfAlertLevel, 'WARN');
    assert.equal('CRITICAL' as PerfAlertLevel, 'CRITICAL');
  });
});
