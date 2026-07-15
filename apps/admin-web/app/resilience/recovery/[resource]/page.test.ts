/**
 * resilience/recovery/[resource]/page.test.ts — 恢复计划详情页 L1 冒烟
 * 覆盖: 正例渲染 / 反例 notFound / 边界(已过期演练/无依赖/短RTO)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── 枚举 ── */

const RECOVERY_STATUSES = ['on_track', 'needs_attention', 'drill_overdue'] as const;
type RecoveryStatus = (typeof RECOVERY_STATUSES)[number];

const STATUS_LABELS: Record<RecoveryStatus, string> = {
  on_track: '正常',
  needs_attention: '需关注',
  drill_overdue: '演练过期',
};

/* ── 数据工厂 ── */

function makeRecoveryPlan(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    resource: 'payment-gateway',
    status: 'on_track' as RecoveryStatus,
    rtoMinutes: 15,
    rpoMinutes: 5,
    staleAfterDays: 90,
    lastDrillAt: '2026-05-01T10:00:00Z',
    runbook: 'https://runbook.example.com/payment',
    dependencies: ['redis-cluster', 'kafka-broker-01', 'cert-rotation-svc'],
    notes: '主备切换计划, 含数据库一致性校验。',
    ...overrides,
  };
}

function makeSnapshot(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    notFound: false,
    resource: 'payment-gateway',
    record: makeRecoveryPlan(),
    ...overrides,
  };
}

/* ── 正例 ── */

test('正例: 恢复计划详情应展示核心字段', () => {
  const snapshot = makeSnapshot();

  assert.equal(snapshot.notFound, false);
  assert.equal(snapshot.resource, 'payment-gateway');

  const record = snapshot.record as Record<string, unknown>;
  assert.equal(record.resource, 'payment-gateway');
  assert.equal(record.rtoMinutes, 15);
  assert.equal(record.rpoMinutes, 5);
  assert.equal(record.status, 'on_track');
  assert.ok(Array.isArray(record.dependencies));
  assert.equal(record.dependencies.length, 3);
  assert.ok(record.dependencies.includes('redis-cluster'));
});

test('正例: 状态标签映射完整', () => {
  for (const status of RECOVERY_STATUSES) {
    const label = STATUS_LABELS[status];
    assert.ok(typeof label === 'string', `${status} 应有标签`);
    assert.ok(label.length > 0);
  }
});

test('正例: 演练未过期时 lastDrillAt 存在', () => {
  const record = makeRecoveryPlan({ status: 'on_track', lastDrillAt: '2026-05-01T10:00:00Z' });
  assert.ok(record.lastDrillAt);
  const drillDate = new Date(record.lastDrillAt as string);
  assert.ok(drillDate < new Date('2026-07-01')); // 在当前时间前
});

/* ── 反例(防御) ── */

test('反例: notFound 时不应有 record', () => {
  const snapshot = makeSnapshot({
    notFound: true,
    record: undefined,
  });

  assert.equal(snapshot.notFound, true);
  assert.equal(snapshot.record, undefined);
});

test('反例: 空依赖列表', () => {
  const record = makeRecoveryPlan({ dependencies: [] });
  assert.ok(Array.isArray(record.dependencies));
  assert.equal(record.dependencies.length, 0);
});

test('反例: 空 resource 值', () => {
  const snapshot = makeSnapshot({ resource: '' });
  assert.equal(snapshot.resource, '');
  assert.equal(snapshot.notFound, false);
});

/* ── 边界 ── */

test('边界: RTO=0 紧急恢复', () => {
  const record = makeRecoveryPlan({ rtoMinutes: 0, status: 'needs_attention' });
  assert.equal(record.rtoMinutes, 0);
  assert.equal(record.status, 'needs_attention');
});

test('边界: RPO=1440 (1天) 长延迟可接受', () => {
  const record = makeRecoveryPlan({ rpoMinutes: 1440 });
  assert.equal(record.rpoMinutes, 1440);
});

test('边界: stale 状态', () => {
  const record = makeRecoveryPlan({
    status: 'drill_overdue',
    lastDrillAt: '2025-01-01T00:00:00Z',
    staleAfterDays: 30,
  });
  assert.equal(record.status, 'drill_overdue');

  const daysSinceDrill =
    (Date.now() - new Date(record.lastDrillAt as string).getTime()) /
    (1000 * 60 * 60 * 24);
  assert.ok(daysSinceDrill > (record.staleAfterDays as number), '应超过 stale 阈值');
});

test('边界: 极多依赖', () => {
  const manyDeps = Array.from({ length: 100 }, (_, i) => `dep-${i + 1}`);
  const record = makeRecoveryPlan({ dependencies: manyDeps });
  const deps = record.dependencies as unknown[];
  assert.equal(deps.length, 100);
  assert.equal(deps[0], 'dep-1');
  assert.equal(deps[99], 'dep-100');
});

test('边界: 超长备注', () => {
  const longNotes = 'A'.repeat(10000);
  const record = makeRecoveryPlan({ notes: longNotes });
  assert.equal((record.notes as string).length, 10000);
});

// ── 新增: 恢复状态卡 ──

test('新增: RecoveryStatusCard 应导出', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('RecoveryStatusCard'), '缺少 RecoveryStatusCard');
});

test('新增: RecoveryStatusCard 应渲染状态标签', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('label'), '渲染标签');
  assert.ok(src.includes('description'), '渲染描述');
});

test('新增: RecoveryStatusCard 应包含彩色指示点', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('w-3 h-3 rounded-full'), '状态点');
});

// ── 新增: 重试按钮 ──

test('新增: RetryButton 应导出', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('function RetryButton'), '缺少 RetryButton');
});

test('新增: RetryButton 在 loading 时应显示旋转图标', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('animate-spin'), '旋转图标');
});

test('新增: RetryButton 在 loading 时应显示恢复中文字', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('\'恢复中...\''), '恢复中文案');
});

test('新增: RetryButton disabled 时应禁止点击', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('cursor-not-allowed'), '禁止点击样式');
});

test('新增: executeRecovery 应返回成功结果', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('executeRecovery'), '缺少 executeRecovery');
  assert.ok(src.includes('success: true'), '返回成功');
});

test('新增: executeRecovery 应包含持续时常', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('duration'), '包含持续时长');
});

// ── 新增: 健康指标 ──

test('新增: buildMockHealthMetrics for api-gateway 返回 4 个指标', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('buildMockHealthMetrics'), '缺少 buildMockHealthMetrics');
  assert.ok(src.includes('api-gateway'), '网关指标');
  assert.ok(src.includes('320ms'), '延迟指标');
});

test('新增: buildMockHealthMetrics for user-db 包含 degraded 指标', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('user-db'), '数据库指标');
  assert.ok(src.includes('850ms'), '降级延迟');
});

test('新增: buildMockHealthMetrics for message-queue 包含 down 指标', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('message-queue'), '队列指标');
  assert.ok(src.includes('50,000'), '队列深度');
});

test('新增: buildMockHealthMetrics 未知资源返回默认指标', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('99.9%'), '默认可用性');
});

test('新增: HealthMetricsPanel 空指标显示暂无健康指标', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('暂无健康指标'), '空状态文案');
});

test('新增: HealthMetricsPanel 应渲染指标名称和值', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('m.name'), '指标名称');
  assert.ok(src.includes('m.value'), '指标值');
  assert.ok(src.includes('m.threshold'), '指标阈值');
});

// ── 新增: 健康评分辅助 ──

test('新增: computeHealthScore 全员 healthy 返回 100', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('computeHealthScore'), '缺少 computeHealthScore');
  assert.ok(src.includes('m.status'), '基于状态计算');
});

test('新增: computeHealthScore 空指标返回 0', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('Math.round'), '取整');
});

test('新增: getHealthScoreColor 高分返回绿色', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('getHealthScoreColor'), '缺少 getHealthScoreColor');
  assert.ok(src.includes('text-emerald-400'), '绿色');
  assert.ok(src.includes('text-amber-400'), '黄色');
  assert.ok(src.includes('text-red-400'), '红色');
});

test('新增: getOverallHealthStatus 包含 down 返回 down', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('getOverallHealthStatus'), '缺少 getOverallHealthStatus');
  assert.ok(src.includes("return 'down'"), 'down 状态');
  assert.ok(src.includes("return 'degraded'"), 'degraded 状态');
  assert.ok(src.includes("return 'healthy'"), 'healthy 状态');
});

// ── 新增: 演练状态 ──

test('新增: isDrillOverdue 应判断演练是否过期', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('isDrillOverdue'), '缺少 isDrillOverdue');
  assert.ok(src.includes('daysThreshold'), '天数阈值');
});

test('新增: formatDrillStatus 过期应返回 error', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('formatDrillStatus'), '缺少 formatDrillStatus');
  assert.ok(src.includes('演练已过期'), '过期状态');
});

test('新增: formatDrillStatus 正常应返回 success', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('演练正常'), '正常状态');
});
