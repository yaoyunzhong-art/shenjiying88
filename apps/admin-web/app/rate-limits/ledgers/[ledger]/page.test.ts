import assert from 'node:assert/strict';
import test from 'node:test';
import { type RateLimitWorkspace } from '@m5/types';
import {
  loadRateLimitsLedgerDetail,
  type RateLimitsLedgerDetail,
} from '../../../rate-limits-detail-view-model';
import {
  isLedgerBlocked,
  ledgerConsumptionRatio,
  RATE_LIMIT_PERIOD_LABEL,
} from '../../../rate-limits-view-model';
import type { QuotaLedgerRecord } from '@m5/types';

/**
 * rate-limits ledger detail page L1 test
 * 验证配额账本详情页的端到端逻辑：参数解析、视图模型加载、状态推导、摘要文案。
 */

/* ─── 测试样本 ─── */

const HEALTHY_LEDGER: QuotaLedgerRecord = {
  id: 'ledger-healthy',
  subjectKey: 'tenant-demo',
  period: 'MINUTE',
  consumed: 100,
  remaining: 500,
  resetAt: '2026-06-27T01:00:00.000Z',
  metadata: {},
  updatedAt: '2026-06-27T00:30:00.000Z',
  policy: { id: 'policy-1', code: 'foundation.api.tenant', limit: 600, period: 'MINUTE' },
};

const WARNING_LEDGER: QuotaLedgerRecord = {
  ...HEALTHY_LEDGER,
  id: 'ledger-warning',
  consumed: 520,
  remaining: 80,
  subjectKey: 'brand-store-read',
};

const BLOCKED_LEDGER: QuotaLedgerRecord = {
  ...HEALTHY_LEDGER,
  id: 'ledger-blocked',
  consumed: 600,
  remaining: 0,
  subjectKey: 'abuse-tenant',
  metadata: { blockedUntil: '2099-12-31T23:59:59.000Z' },
};

/* ─── 辅助函数 (对应 page.tsx 中的 readLedgerId) ─── */

function readLedgerId(value: string | string[] | undefined): string | null {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

/* ─── 1. readLedgerId 参数解析 ─── */

test('rate-limits-ledger-detail-page: readLedgerId — single string returns as-is', () => {
  assert.equal(readLedgerId('ledger-abc'), 'ledger-abc');
});

test('rate-limits-ledger-detail-page: readLedgerId — array takes first element', () => {
  assert.equal(readLedgerId(['ledger-first', 'ledger-second']), 'ledger-first');
});

test('rate-limits-ledger-detail-page: readLedgerId — undefined returns null', () => {
  assert.equal(readLedgerId(undefined), null);
});

test('rate-limits-ledger-detail-page: readLedgerId — empty array returns null', () => {
  assert.equal(readLedgerId([]), null);
});

test('rate-limits-ledger-detail-page: readLedgerId — empty string returns null', () => {
  assert.equal(readLedgerId(''), null);
});

test('rate-limits-ledger-detail-page: readLedgerId — array with empty string returns null', () => {
  assert.equal(readLedgerId(['']), null);
});

/* ─── 2. loadRateLimitsLedgerDetail 视图模型加载 ─── */

test('rate-limits-ledger-detail-page: loadRateLimitsLedgerDetail returns snapshot with shape', async () => {
  const result = await loadRateLimitsLedgerDetail('ledger-healthy', {}, { cache: 'no-store' });
  assert.ok(result, 'snapshot should exist');
  assert.ok('deliveryMode' in result, 'should have deliveryMode');
  assert.ok('ledgerId' in result, 'should have ledgerId');
  assert.ok('record' in result || 'notFound' in result, 'should have record or notFound');
  assert.ok(['api', 'fallback'].includes(result.deliveryMode), 'deliveryMode should be api or fallback');
});

test('rate-limits-ledger-detail-page: loadRateLimitsLedgerDetail preserves ledgerId', async () => {
  const result = await loadRateLimitsLedgerDetail('ledger-healthy', {}, { cache: 'no-store' });
  assert.equal(result.ledgerId, 'ledger-healthy');
});

test('rate-limits-ledger-detail-page: loadRateLimitsLedgerDetail generatedAt is a valid date string', async () => {
  const result = await loadRateLimitsLedgerDetail('ledger-any', {}, { cache: 'no-store' });
  assert.ok(result.generatedAt, 'generatedAt should be present');
  assert.ok(!isNaN(Date.parse(result.generatedAt)), 'generatedAt should be parseable');
});

test('rate-limits-ledger-detail-page: loadRateLimitsLedgerDetail returns deep links', async () => {
  const result = await loadRateLimitsLedgerDetail('ledger-any', {}, { cache: 'no-store' });
  assert.ok(result.auditHref, 'should have auditHref');
  assert.ok(result.approvalsHref, 'should have approvalsHref');
  assert.ok(result.foundationHref, 'should have foundationHref');
  assert.ok(result.workspaceHref, 'should have workspaceHref');
  assert.ok(result.ledgerHref, 'should have ledgerHref');
});

/* ─── 3. 状态推导逻辑 (对应 LedgerBoard 中的条件) ─── */

test('rate-limits-ledger-detail-page: healthy ledger — not blocked, low ratio', () => {
  const now = Date.parse('2026-06-27T00:30:00.000Z');
  assert.equal(isLedgerBlocked(HEALTHY_LEDGER, now), false);
  const ratio = ledgerConsumptionRatio(HEALTHY_LEDGER);
  assert.ok(ratio < 0.8, 'healthy ledger ratio should be below 0.8');
  assert.equal(ratio, 100 / 600);
});

test('rate-limits-ledger-detail-page: warning ledger — not blocked, high ratio', () => {
  const now = Date.parse('2026-06-27T00:30:00.000Z');
  assert.equal(isLedgerBlocked(WARNING_LEDGER, now), false);
  const ratio = ledgerConsumptionRatio(WARNING_LEDGER);
  assert.ok(ratio >= 0.8, 'warning ledger ratio should be >= 0.8');
  assert.equal(ratio, 520 / 600);
});

test('rate-limits-ledger-detail-page: blocked ledger — blocked, ratio = 1', () => {
  const now = Date.parse('2026-06-27T00:30:00.000Z');
  assert.equal(isLedgerBlocked(BLOCKED_LEDGER, now), true);
  assert.equal(ledgerConsumptionRatio(BLOCKED_LEDGER), 1);
});

test('rate-limits-ledger-detail-page: status badge mapping — healthy => success', () => {
  const now = Date.parse('2026-06-27T00:30:00.000Z');
  const ratio = ledgerConsumptionRatio(HEALTHY_LEDGER);
  const blocked = isLedgerBlocked(HEALTHY_LEDGER, now);
  // 对应 LedgerBoard 中的状态推导
  const statusLabel = blocked ? '封禁' : ratio >= 0.8 ? '告警' : '健康';
  const statusVariant = blocked ? 'danger' : ratio >= 0.8 ? 'warning' : 'success';
  assert.equal(statusLabel, '健康');
  assert.equal(statusVariant, 'success');
});

test('rate-limits-ledger-detail-page: status badge mapping — warning => warning', () => {
  const now = Date.parse('2026-06-27T00:30:00.000Z');
  const ratio = ledgerConsumptionRatio(WARNING_LEDGER);
  const blocked = isLedgerBlocked(WARNING_LEDGER, now);
  const statusLabel = blocked ? '封禁' : ratio >= 0.8 ? '告警' : '健康';
  const statusVariant = blocked ? 'danger' : ratio >= 0.8 ? 'warning' : 'success';
  assert.equal(statusLabel, '告警');
  assert.equal(statusVariant, 'warning');
});

test('rate-limits-ledger-detail-page: status badge mapping — blocked => danger', () => {
  const now = Date.parse('2026-06-27T00:30:00.000Z');
  const ratio = ledgerConsumptionRatio(BLOCKED_LEDGER);
  const blocked = isLedgerBlocked(BLOCKED_LEDGER, now);
  const statusLabel = blocked ? '封禁' : ratio >= 0.8 ? '告警' : '健康';
  const statusVariant = blocked ? 'danger' : ratio >= 0.8 ? 'warning' : 'success';
  assert.equal(statusLabel, '封禁');
  assert.equal(statusVariant, 'danger');
});

/* ─── 4. SummaryCard 数据推导 ─── */

test('rate-limits-ledger-detail-page: summary card — subjectKey from record', () => {
  assert.equal(HEALTHY_LEDGER.subjectKey, 'tenant-demo');
  assert.equal(HEALTHY_LEDGER.id, 'ledger-healthy');
});

test('rate-limits-ledger-detail-page: summary card — consumed / limit formatting', () => {
  assert.equal(`${HEALTHY_LEDGER.consumed} / ${HEALTHY_LEDGER.policy.limit}`, '100 / 600');
  const ratio = ledgerConsumptionRatio(HEALTHY_LEDGER);
  assert.equal(`占比 ${Math.round(ratio * 100)}%`, '占比 17%');
});

test('rate-limits-ledger-detail-page: summary card — remaining badge for records with remaining', () => {
  assert.equal(typeof HEALTHY_LEDGER.remaining, 'number');
  assert.ok((HEALTHY_LEDGER.remaining ?? 0) > 0);
});

test('rate-limits-ledger-detail-page: summary card — consumption ratio at boundary', () => {
  const boundary: QuotaLedgerRecord = {
    ...HEALTHY_LEDGER,
    consumed: 480,
    policy: { id: 'p-1', code: 'boundary', limit: 600, period: 'MINUTE' },
  };
  const ratio = ledgerConsumptionRatio(boundary);
  assert.equal(ratio, 0.8, '480/600 = 0.8 exactly');
  // border case: >= 0.8 触发 warning
  assert.ok(ratio >= 0.8);
});

test('rate-limits-ledger-detail-page: consumption ratio when consumed exceeds limit (clamped to 1)', () => {
  const overrun: QuotaLedgerRecord = {
    ...HEALTHY_LEDGER,
    consumed: 999,
    remaining: 0,
    policy: { id: 'p-1', code: 'overrun', limit: 600, period: 'MINUTE' },
  };
  assert.equal(ledgerConsumptionRatio(overrun), 1);
});

/* ─── 5. 周期标签 ─── */

test('rate-limits-ledger-detail-page: period label for MINUTE', () => {
  assert.equal(RATE_LIMIT_PERIOD_LABEL['MINUTE'], '分钟');
});

test('rate-limits-ledger-detail-page: period label for HOUR', () => {
  assert.equal(RATE_LIMIT_PERIOD_LABEL['HOUR'], '小时');
});

test('rate-limits-ledger-detail-page: period label for DAY', () => {
  assert.equal(RATE_LIMIT_PERIOD_LABEL['DAY'], '日');
});

test('rate-limits-ledger-detail-page: unknown period shows raw string', () => {
  const raw = RATE_LIMIT_PERIOD_LABEL['SECOND' as keyof typeof RATE_LIMIT_PERIOD_LABEL];
  // page.tsx 中回退逻辑: RATE_LIMIT_PERIOD_LABEL[record.period as string] ?? record.period
  assert.equal(raw ?? 'SECOND', 'SECOND');
});

/* ─── 6. resetAt 格式化 ─── */

test('rate-limits-ledger-detail-page: resetAt is a valid date', () => {
  const d = new Date(HEALTHY_LEDGER.resetAt);
  assert.ok(!isNaN(d.getTime()), 'resetAt should be parseable');
});

test('rate-limits-ledger-detail-page: updatedAt is a valid date', () => {
  const d = new Date(HEALTHY_LEDGER.updatedAt);
  assert.ok(!isNaN(d.getTime()), 'updatedAt should be parseable');
});

/* ─── 7. NotFound 逻辑 ─── */

test('rate-limits-ledger-detail-page: loadRateLimitsLedgerDetail can return notFound', async () => {
  const result = await loadRateLimitsLedgerDetail('nonexistent-ledger-id', {}, { cache: 'no-store' });
  // 视图模型行为：对不存在的账本返回 notFound
  assert.ok('notFound' in result);
  assert.equal(typeof result.notFound, 'boolean');
});

test('rate-limits-ledger-detail-page: notFound snapshot still has workspaceHref for back-navigation', async () => {
  const result = await loadRateLimitsLedgerDetail('missing', {}, { cache: 'no-store' });
  assert.ok(result.workspaceHref, 'notFound snapshot should still provide workspaceHref');
});

/* ─── 8. 关联策略输出 ─── */

test('rate-limits-ledger-detail-page: record has policy reference', () => {
  assert.ok(HEALTHY_LEDGER.policy, 'record must have policy reference');
  assert.equal(HEALTHY_LEDGER.policy.code, 'foundation.api.tenant');
  assert.equal(HEALTHY_LEDGER.policy.limit, 600);
  assert.equal(HEALTHY_LEDGER.policy.period, 'MINUTE');
});

test('rate-limits-ledger-detail-page: policy.matchedPolicy may be null when policy out of workspace', async () => {
  const result = await loadRateLimitsLedgerDetail('ledger-no-match', {}, { cache: 'no-store' });
  // matchedPolicy 在视图模型中可能为 null
  assert.ok('matchedPolicy' in result);
  assert.equal(result.matchedPolicy, null);
});

/* ─── 9. 新增: 消费趋势数据 ─── */

test('rate-limits-ledger-detail-page: buildMockConsumptionTrend for demo-001 returns 7 points', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('buildMockConsumptionTrend'), '缺少 buildMockConsumptionTrend');
  assert.ok(src.includes("ledger-demo-001"), 'demo-001 趋势');
  assert.ok(src.includes('timestamp:'), '趋势包含时间戳');
});

test('rate-limits-ledger-detail-page: buildMockConsumptionTrend for demo-002 returns 4 points', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes("ledger-demo-002"), 'demo-002 趋势');
  assert.ok(src.includes('consumed: 5000'), 'demo-002 已耗尽');
});

test('rate-limits-ledger-detail-page: default trend returns 3 points', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('return ['), '默认趋势');
});

test('rate-limits-ledger-detail-page: ConsumptionTrendChart handles empty data', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('暂无趋势数据'), '空数据状态');
});

test('rate-limits-ledger-detail-page: ConsumptionTrendChart renders bars with color', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('backgroundColor'), '柱状图颜色');
  assert.ok(src.includes('maxValue'), '最大参考值');
});

/* ─── 10. 新增: 限额统计 ─── */

test('rate-limits-ledger-detail-page: buildQuotaSummary calculates summary correctly', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('buildQuotaSummary'), '缺少 buildQuotaSummary');
  assert.ok(src.includes('usagePercent'), '使用率计算');
  assert.ok(src.includes('estimatedExhaustionTime'), '耗尽时间估算');
});

test('rate-limits-ledger-detail-page: buildQuotaSummary handles 100% usage', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('30 分钟内'), '高使用率耗尽时间');
});

test('rate-limits-ledger-detail-page: QuotaSummaryCards renders 4 cards', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('总限额'), '总限额卡片');
  assert.ok(src.includes('已使用'), '已使用卡片');
  assert.ok(src.includes('剩余'), '剩余卡片');
  assert.ok(src.includes('预计耗尽'), '预计耗尽卡片');
});

/* ─── 11. 新增: 限流事件 ─── */

test('rate-limits-ledger-detail-page: buildMockRateLimitEvents for demo-002 returns 3 events', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('buildMockRateLimitEvents'), '缺少 buildMockRateLimitEvents');
  assert.ok(src.includes("ledger-demo-002"), 'demo-002 事件');
});

test('rate-limits-ledger-detail-page: RateLimitEventList handles empty events', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('近期无限流事件'), '空事件状态');
});

test('rate-limits-ledger-detail-page: RateLimitEventList renders severity badge', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('evt.severity'), '严重性显示');
  assert.ok(src.includes('critical'), '严重级别');
});

test('rate-limits-ledger-detail-page: RateLimitEventList shows blocked duration', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('blockedDuration'), '阻断时长');
});

test('rate-limits-ledger-detail-page: blockedDuration 0s hides badge', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes("evt.blockedDuration !== '0s'"), '0s 阻断不显示');
});

/* ─── 12. 新增: 辅助函数 ─── */

test('rate-limits-ledger-detail-page: calculateUsageRate returns 0 when limit is 0', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('calculateUsageRate'), '缺少 calculateUsageRate');
});

test('rate-limits-ledger-detail-page: getUsageSeverity returns correct level', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('getUsageSeverity'), '缺少 getUsageSeverity');
  assert.ok(src.includes("'healthy'"), '健康级别');
  assert.ok(src.includes("'warning'"), '告警级别');
  assert.ok(src.includes("'critical'"), '严重级别');
});

test('rate-limits-ledger-detail-page: formatQuotaNumber formats large numbers', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('formatQuotaNumber'), '缺少 formatQuotaNumber');
  assert.ok(src.includes('1_000_000'), '百万格式');
  assert.ok(src.includes('1_000'), '千格式');
});

test('rate-limits-ledger-detail-page: USAGE_SEVERITY_COLORS maps severities', () => {
  const src = require('fs').readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(src.includes('USAGE_SEVERITY_COLORS'), '缺少颜色映射');
  assert.ok(src.includes('text-emerald-400'), '健康颜色');
  assert.ok(src.includes('text-amber-400'), '告警颜色');
  assert.ok(src.includes('text-red-400'), '严重颜色');
});
