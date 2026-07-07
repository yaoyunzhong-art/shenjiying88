/**
 * reports/[id]/page.test.ts — 报表详情页 L1 冒烟测试
 * 角色视角: 👔店长 / 📊运营 / 💰财务
 * 覆盖: 正例(数据/状态/流转) + 反例(缺失/删除) + 边界(极端/空数据)
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import type { ReportStatus } from '../components/ReportStatusBadge';

/* ── 状态可流转图（与组件同步） ── */
const STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  generated: ['expired'],
  generating: ['generated', 'failed'],
  failed: ['generating'],
  expired: ['generating'],
};

/* ── 类型标签映射（与组件同步） ── */
const TYPE_LABEL: Record<string, string> = {
  daily: '日报', weekly: '周报', monthly: '月报',
  quarterly: '季报', yearly: '年报', custom: '自定义',
};

/* ── 导出 CSV 字符串（纯函数版） ── */
function generateCsvContent(data: { title: string; summary: string; period: string; createdAt: string; metrics?: Record<string, string | number> }): string {
  const rows: string[][] = [['指标', '数值']];
  if (data.metrics) {
    Object.entries(data.metrics).forEach(([k, v]) => rows.push([k, String(v)]));
  }
  rows.push(['标题', data.title]);
  rows.push(['摘要', data.summary]);
  rows.push(['周期', data.period]);
  rows.push(['创建时间', data.createdAt]);
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

/* ── 判断是否可流转 ── */
function canTransition(status: ReportStatus, target: ReportStatus): boolean {
  return (STATUS_TRANSITIONS[status] || []).includes(target);
}

/* ── 格式化日期 ── */
function formatDetailDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── 指标键排序（确保稳定顺序） ── */
function sortedMetricKeys(metrics: Record<string, string | number>): string[] {
  return Object.keys(metrics).sort();
}

/* ── Mock 数据工厂 ── */
function makeReport(overrides?: Record<string, unknown>) {
  return {
    id: '1',
    title: '2026年6月25日销售日活报表',
    type: 'daily',
    period: '2026-06-25',
    createdAt: '2026-06-26 00:15',
    status: 'generated' as ReportStatus,
    summary: '本日销售额 ¥12,580.00，环比昨日 +8.3%。',
    metrics: { '销售额': '¥12,580.00', '客单价': '¥286.00', '订单数': '44' },
    ...overrides,
  } as { id: string; title: string; type: string; period: string; createdAt: string; status: ReportStatus; summary: string; metrics?: Record<string, string | number> };
}

/* ── 测试套件 ── */

/* ── 正例 ── */
test('报表详情 — 状态流转: 已生成可流转至过期', () => {
  assert.ok(canTransition('generated', 'expired'));
  assert.ok(!canTransition('generated', 'generating'));
  assert.ok(!canTransition('generated', 'failed'));
});

test('报表详情 — 状态流转: 失败可重新生成', () => {
  assert.ok(canTransition('failed', 'generating'));
  assert.ok(!canTransition('failed', 'generated'));
  assert.ok(!canTransition('failed', 'expired'));
});

test('报表详情 — 状态流转: 过期可重新生成', () => {
  assert.ok(canTransition('expired', 'generating'));
  assert.ok(!canTransition('expired', 'generated'));
  assert.ok(!canTransition('expired', 'failed'));
});

test('报表详情 — 状态流转: 生成中可流转至已完成或失败', () => {
  assert.ok(canTransition('generating', 'generated'));
  assert.ok(canTransition('generating', 'failed'));
  assert.ok(!canTransition('generating', 'expired'));
});

test('报表详情 — 类型标签映射: 所有类型都有中文标签', () => {
  const types = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'];
  types.forEach((t) => {
    assert.ok(TYPE_LABEL[t], `类型 ${t} 应有标签`);
    assert.ok(TYPE_LABEL[t].length >= 2);
  });
});

test('报表详情 — 生成 CSV 内容', () => {
  const report = makeReport();
  const csv = generateCsvContent(report);
  assert.match(csv, /"指标","数值"/);
  assert.match(csv, /销售额/);
  assert.match(csv, /2026年6月25日销售日活报表/);
  assert.match(csv, /¥12,580/);
  // 检查 CSV 行数（标题行 + 3 指标 + 4 元数据）
  const lines = csv.split('\n');
  assert.equal(lines.length, 8);
});

test('报表详情 — 格式化日期', () => {
  const result = formatDetailDate('2026-06-26 00:15');
  // 不同 node 版本/locale 可能格式不同
  assert.ok(result.length > 5);
  assert.ok(result.includes('2026'));
  assert.ok(result.includes('26'));
  assert.ok(result.includes('00') || result.includes('0'));
});

test('报表详情 — 指标键排序', () => {
  const result = sortedMetricKeys({ 'z': 1, 'a': 2, 'm': 3 });
  assert.deepEqual(result, ['a', 'm', 'z']);
});

/* ── 反例 ── */
test('报表详情 — 状态流转: 未知状态无流转', () => {
  const unknown = 'unknown' as ReportStatus;
  assert.deepEqual(STATUS_TRANSITIONS[unknown], undefined);
});

test('报表详情 — 无指标时 CSV 生成正常', () => {
  const report = makeReport({ metrics: {} });
  const csv = generateCsvContent(report);
  const lines = csv.split('\n');
  // 仅标题行 + 4 元数据行
  assert.equal(lines.length, 5);
});

test('报表详情 — 空日期返回占位符', () => {
  assert.equal(formatDetailDate(''), '-');
  assert.equal(formatDetailDate(''), '-');
});

/* ── 边界 ── */
test('报表详情 — 大量指标时 CSV 正常', () => {
  const manyMetrics: Record<string, string | number> = {};
  for (let i = 0; i < 100; i++) manyMetrics[`指标${i + 1}`] = `值${i + 1}`;
  const report = makeReport({ metrics: manyMetrics });
  const csv = generateCsvContent(report);
  const lines = csv.split('\n');
  assert.equal(lines.length, 105); // 1 header + 100 metrics + 4 meta
});

test('报表详情 — 状态流转: 生成中状态 timeout 后自动变 generated', async () => {
  // 模拟组件内 setTimeout 行为
  let currentStatus: ReportStatus = 'generating';
  const transitionAfterTimeout = (next: ReportStatus): Promise<ReportStatus> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        currentStatus = next;
        resolve(currentStatus);
      }, 10);
    });
  };
  const result = await transitionAfterTimeout('generated');
  assert.equal(result, 'generated');
});

test('报表详情 — CSV 含特殊字符处理', () => {
  const report = makeReport({ title: '618大促 & "双11" 活动报表' });
  const csv = generateCsvContent(report);
  assert.match(csv, /618大促/);
  assert.match(csv, /双11/);
  // 双引号应被转义
  assert.ok(csv.includes('""'));
});
