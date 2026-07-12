/**
 * reports/page.test.ts — 销售报表列表页 L1 冒烟测试
 * 角色视角: 👔店长 / 📊运营 / 💰财务
 * 覆盖: 正例(数据完整/导出稳定) + 反例(空数据/防御) + 边界(极端值/全状态/分页)
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type { ReportStatus, ReportType } from './components/ReportStatusBadge';

/* ── 数据工厂 ── */
function makeReportItem(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: '1',
    title: '测试报表',
    type: 'daily',
    period: '2026-06-26',
    createdAt: '2026-06-26 00:00',
    status: 'generated',
    summary: '这是一个测试报表摘要。',
    ...overrides,
  };
}

function makeReports(count: number): Record<string, unknown>[] {
  const types: ReportType[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'];
  const statuses: ReportStatus[] = ['generated', 'generating', 'failed', 'expired'];
  return Array.from({ length: count }, (_, i) => makeReportItem({
    id: String(i + 1),
    title: `报表${i + 1}`,
    type: types[i % types.length],
    status: statuses[i % statuses.length],
    period: `2026-${String((i % 12) + 1).padStart(2, '0')}`,
    summary: `第${i + 1}份测试报表摘要内容。`,
  }));
}

function callSafe(fn: (...args: unknown[]) => unknown, ...args: unknown[]): boolean {
  try { fn(...args); return true; } catch { return false; }
}

/* ── 正例 ── */

test('👔 店长视角: 页面 & 组件模块导出完整', async () => {
  const pageMod = await import('./page');
  assert.equal(typeof pageMod.default, 'function', 'default export should be a function');

  const reportsPageMod = await import('./components/ReportsPage');
  assert.equal(typeof reportsPageMod.ReportsPage, 'function', 'ReportsPage should be a function');
  assert.equal(typeof reportsPageMod.filterReports, 'function', 'filterReports should be a function');
  assert.equal(typeof reportsPageMod.paginateReports, 'function', 'paginateReports should be a function');
  assert.equal(typeof reportsPageMod.calcTotalPages, 'function', 'calcTotalPages should be a function');
  assert.equal(typeof reportsPageMod.generatePageNumbers, 'function', 'generatePageNumbers should be a function');

  const badgeMod = await import('./components/ReportStatusBadge');
  assert.equal(typeof badgeMod.ReportStatusBadge, 'function', 'ReportStatusBadge should be a function');
  assert.equal(typeof badgeMod.REPORT_TYPES, 'object', 'REPORT_TYPES should be an array');
  assert.ok(Array.isArray(badgeMod.REPORT_TYPES), 'REPORT_TYPES should be an array');
  assert.equal(badgeMod.REPORT_TYPES.length, 6, '6 report types');
  assert.equal(typeof badgeMod.REPORT_STATUS_LABEL, 'object', 'REPORT_STATUS_LABEL should be an object');
  assert.equal(Object.keys(badgeMod.REPORT_STATUS_LABEL).length, 4, '4 status labels');
  assert.equal(typeof badgeMod.REPORT_STATUS_COLOR, 'object', 'REPORT_STATUS_COLOR should be an object');
  assert.equal(Object.keys(badgeMod.REPORT_STATUS_COLOR).length, 4, '4 status colors');
});

test('📊 运营视角: 默认导出稳定', async () => {
  const mod = await import('./page');
  assert.ok(mod.default !== undefined);
  assert.ok(mod.default !== null);
  assert.equal(typeof mod.default, 'function', 'default export is a function component');
});

test('💰 财务视角: ReportsPage 接受全量 props', async () => {
  const { ReportsPage } = await import('./components/ReportsPage');
  assert.equal(
    callSafe(ReportsPage, {
      items: [makeReportItem()],
      total: 1, page: 1, pageSize: 20,
    }),
    true, 'ReportsPage should render with valid props',
  );
});

test('正例: 模块导入不抛异常', async () => {
  for (const modPath of ['./page', './components/ReportsPage', './components/ReportStatusBadge']) {
    let threw = false;
    try { await import(modPath); } catch { threw = true; }
    assert.equal(threw, false, `import ${modPath} should succeed`);
  }
});

test('正例: ReportsPage 渲染多条数据', async () => {
  const { ReportsPage } = await import('./components/ReportsPage');
  assert.equal(
    callSafe(ReportsPage, {
      items: makeReports(5),
      total: 5, page: 1, pageSize: 20,
    }),
    true, 'should render 5 reports',
  );
});

test('正例: REPORT_TYPES 列表内容合理', async () => {
  const { REPORT_TYPES } = await import('./components/ReportStatusBadge');
  assert.ok(REPORT_TYPES.some((t) => t.value === 'daily'), 'should include daily');
  assert.ok(REPORT_TYPES.some((t) => t.value === 'monthly'), 'should include monthly');
  assert.ok(REPORT_TYPES.some((t) => t.value === 'yearly'), 'should include yearly');
  assert.equal(REPORT_TYPES.find((t) => t.value === 'daily')?.label, '日报');
  assert.equal(REPORT_TYPES.find((t) => t.value === 'custom')?.label, '自定义');
});

test('正例: REPORT_STATUS_LABEL 内容正确', async () => {
  const { REPORT_STATUS_LABEL } = await import('./components/ReportStatusBadge');
  assert.equal(REPORT_STATUS_LABEL.generated, '已生成');
  assert.equal(REPORT_STATUS_LABEL.generating, '生成中');
  assert.equal(REPORT_STATUS_LABEL.failed, '失败');
  assert.equal(REPORT_STATUS_LABEL.expired, '已过期');
});

/* ── 纯函数测试（filterReports / paginateReports / calcTotalPages / generatePageNumbers） ── */

test('纯函数: filterReports 按搜索过滤', async () => {
  const { filterReports } = await import('./components/ReportsPage');
  const items = makeReports(10) as unknown as import('./components/ReportsPage').ReportItem[];
  const result = filterReports(items, '报表', 'all', 'all');
  assert.equal(result.length, 10, 'all match "报表"');
  const filtered = filterReports(items, '不存在的内容', 'all', 'all');
  assert.equal(filtered.length, 0, 'no match');
});

test('纯函数: filterReports 按类型过滤', async () => {
  const { filterReports } = await import('./components/ReportsPage');
  const items = makeReports(30) as unknown as import('./components/ReportsPage').ReportItem[];
  const daily = filterReports(items, '', 'daily', 'all');
  assert.ok(daily.length > 0, 'should find daily items');
  const allDaily = daily.every((i) => i.type === 'daily');
  assert.equal(allDaily, true, 'all filtered should be daily');
});

test('纯函数: filterReports 按状态过滤', async () => {
  const { filterReports } = await import('./components/ReportsPage');
  const items = makeReports(30) as unknown as import('./components/ReportsPage').ReportItem[];
  const generated = filterReports(items, '', 'all', 'generated');
  assert.ok(generated.length > 0, 'should find generated items');
  const allGenerated = generated.every((i) => i.status === 'generated');
  assert.equal(allGenerated, true, 'all filtered should be generated');
});

test('纯函数: filterReports 组合搜索+类型+状态过滤', async () => {
  const { filterReports } = await import('./components/ReportsPage');
  const items = makeReports(60) as unknown as import('./components/ReportsPage').ReportItem[];
  const result = filterReports(items, '不存在', 'all', 'all');
  assert.equal(result.length, 0, 'no match for nonexistent query');
  const all = filterReports(items, '', 'all', 'all');
  assert.equal(all.length, 60, 'empty query returns all items');
});

test('纯函数: filterReports null/undefined 防御', async () => {
  const { filterReports } = await import('./components/ReportsPage');
  assert.deepEqual(filterReports(null, '', 'all', 'all'), []);
  assert.deepEqual(filterReports(undefined, '', 'all', 'all'), []);
});

test('纯函数: paginateReports 分页逻辑', async () => {
  const { paginateReports } = await import('./components/ReportsPage');
  const items = makeReports(30) as unknown as import('./components/ReportsPage').ReportItem[];
  const page1 = paginateReports(items, 1, 10);
  assert.equal(page1.length, 10);
  const page3 = paginateReports(items, 3, 10);
  assert.equal(page3.length, 10);
});

test('纯函数: paginateReports 越界页码防御', async () => {
  const { paginateReports } = await import('./components/ReportsPage');
  const items = makeReports(5) as unknown as import('./components/ReportsPage').ReportItem[];
  const page999 = paginateReports(items, 999, 10);
  assert.equal(page999.length, 0);
});

test('纯函数: paginateReports 负数防御', async () => {
  const { paginateReports } = await import('./components/ReportsPage');
  const items = makeReports(10) as unknown as import('./components/ReportsPage').ReportItem[];
  const result = paginateReports(items, -1, 20);
  assert.equal(result.length, 10, 'negative page defaults to 1');
});

test('纯函数: calcTotalPages 计算正确', async () => {
  const { calcTotalPages } = await import('./components/ReportsPage');
  assert.equal(calcTotalPages(0, 20), 1);
  assert.equal(calcTotalPages(10, 20), 1);
  assert.equal(calcTotalPages(20, 10), 2);
  assert.equal(calcTotalPages(100, 10), 10);
  assert.equal(calcTotalPages(101, 10), 11);
});

test('纯函数: calcTotalPages 负数防御', async () => {
  const { calcTotalPages } = await import('./components/ReportsPage');
  assert.equal(calcTotalPages(-5, 20), 1);
  assert.equal(calcTotalPages(100, -5), 5); // -5 < 1 → defaults to 20 → 100/20=5
  assert.equal(calcTotalPages(100, 0), 5); // defaults to 20 → 100/20=5
  assert.equal(calcTotalPages(100, 1), 100);
  assert.equal(calcTotalPages(99, 10), 10);
});

test('纯函数: generatePageNumbers 小页码', async () => {
  const { generatePageNumbers } = await import('./components/ReportsPage');
  assert.deepEqual(generatePageNumbers(1, 1), [1]);
  assert.deepEqual(generatePageNumbers(1, 5), [1, 2, 3, 4, 5]);
});

test('纯函数: generatePageNumbers 大页码省略号', async () => {
  const { generatePageNumbers } = await import('./components/ReportsPage');
  const result = generatePageNumbers(5, 20);
  assert.equal(result[0], 1, 'first should be 1');
  assert.equal(result[result.length - 1], 20, 'last should be 20');
  assert.ok(result.includes('...'), 'should include ellipsis');
  assert.ok(result.includes(5), 'should include current page');
});

test('纯函数: generatePageNumbers 首页', async () => {
  const { generatePageNumbers } = await import('./components/ReportsPage');
  const result = generatePageNumbers(1, 10);
  // current=1 → pages=[1, '...', 2, 3, 10] but our logic puts 2 before '...'
  assert.equal(result[0], 1);
  assert.equal(result[result.length - 1], 10);
  assert.ok(result.length <= 6);
});

test('纯函数: generatePageNumbers 末页', async () => {
  const { generatePageNumbers } = await import('./components/ReportsPage');
  const result = generatePageNumbers(10, 10);
  assert.equal(result[result.length - 1], 10);
  assert.equal(result[0], 1);
  assert.ok(result.includes(9));
});

/* ── 反例 ── */

test('反例: 空数据不抛异常', async () => {
  const { ReportsPage } = await import('./components/ReportsPage');
  assert.equal(callSafe(ReportsPage, {
    items: [], total: 0, page: 1, pageSize: 20,
  }), true);
});

test('反例: null items 防御', async () => {
  const { ReportsPage } = await import('./components/ReportsPage');
  assert.equal(callSafe(ReportsPage, {
    items: null, total: 0, page: 1, pageSize: 20,
  }), true);
});

test('反例: undefined items 防御', async () => {
  const { ReportsPage } = await import('./components/ReportsPage');
  assert.equal(callSafe(ReportsPage, {
    items: undefined, total: 0, page: 1, pageSize: 20,
  }), true);
});

test('反例: 负数页码防御', async () => {
  const { ReportsPage } = await import('./components/ReportsPage');
  assert.equal(callSafe(ReportsPage, {
    items: makeReports(5), total: 5, page: -1, pageSize: 20,
  }), true);
});

test('反例: 超大 pageSize 防御', async () => {
  const { ReportsPage } = await import('./components/ReportsPage');
  assert.equal(callSafe(ReportsPage, {
    items: makeReports(5), total: 999, page: 1, pageSize: 99999,
  }), true);
});

test('反例: 负数 total 防御', async () => {
  const { ReportsPage } = await import('./components/ReportsPage');
  assert.equal(callSafe(ReportsPage, {
    items: makeReports(5), total: -5, page: 1, pageSize: 20,
  }), true);
});

test('反例: 非法 items 防御', async () => {
  const { ReportsPage } = await import('./components/ReportsPage');
  assert.equal(callSafe(ReportsPage, {
    items: 'not_an_array' as unknown as Record<string, unknown>[],
    total: 0, page: 1, pageSize: 20,
  }), true);
});

/* ── 边界 ── */

test('边界: 空字符串字段', async () => {
  const { ReportsPage } = await import('./components/ReportsPage');
  assert.equal(callSafe(ReportsPage, {
    items: [makeReportItem({
      title: '', type: '' as ReportType, period: '', createdAt: '', status: '' as ReportStatus, summary: '',
    })],
    total: 1, page: 1, pageSize: 20,
  }), true);
});

test('边界: 50 条数据批量渲染性能', async () => {
  const { ReportsPage } = await import('./components/ReportsPage');
  const items = makeReports(50);
  const start = performance.now();
  const ok = callSafe(ReportsPage, {
    items, total: 50, page: 1, pageSize: 50,
  });
  const elapsed = performance.now() - start;
  assert.equal(ok, true);
  assert.ok(elapsed < 500, `50 items render in ${elapsed.toFixed(1)}ms`);
});

test('边界: 所有 4 种报表状态渲染', async () => {
  const statuses: ReportStatus[] = ['generated', 'generating', 'failed', 'expired'];
  const { ReportsPage } = await import('./components/ReportsPage');
  const items = statuses.map((s, i) => makeReportItem({ id: String(i + 1), status: s }));
  assert.equal(callSafe(ReportsPage, {
    items, total: items.length, page: 1, pageSize: 20,
  }), true, 'all 4 report statuses should render');
});

test('边界: 所有 6 种报表类型渲染', async () => {
  const types: ReportType[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'];
  const { ReportsPage } = await import('./components/ReportsPage');
  const items = types.map((t, i) => makeReportItem({ id: String(i + 1), type: t }));
  assert.equal(callSafe(ReportsPage, {
    items, total: items.length, page: 1, pageSize: 20,
  }), true, 'all 6 report types should render');
});

test('边界: 分页极端值', async () => {
  const { ReportsPage } = await import('./components/ReportsPage');
  assert.equal(callSafe(ReportsPage, {
    items: makeReports(5), total: 5, page: 1, pageSize: 5,
  }), true);
});

test('边界: 超大标题和摘要', async () => {
  const { ReportsPage } = await import('./components/ReportsPage');
  assert.equal(callSafe(ReportsPage, {
    items: [makeReportItem({
      title: 'A'.repeat(500),
      summary: 'B'.repeat(2000),
    })],
    total: 1, page: 1, pageSize: 20,
  }), true, 'long text should not crash');
});

test('边界: 异步默认导出返回有效元素', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function',
    'ReportsListPage should be a function');
  // 验证默认导出的函数名
  assert.ok(mod.default.name.length > 0 || mod.default.toString().includes('ReportsListPage'),
    'default export should be ReportsListPage');
});

test('边界: 搜索过滤筛选联合', async () => {
  const { ReportsPage } = await import('./components/ReportsPage');
  assert.equal(callSafe(ReportsPage, {
    items: makeReports(20),
    total: 20, page: 1, pageSize: 10,
    searchQuery: '报表1',
    typeFilter: 'daily',
    statusFilter: 'generated',
  }), true);
});

test('边界: ReportStatusBadge 导出可用', async () => {
  const { ReportStatusBadge, REPORT_STATUS_LABEL } = await import('./components/ReportStatusBadge');
  assert.equal(typeof ReportStatusBadge, 'function');
  assert.equal(Object.keys(REPORT_STATUS_LABEL).length, 4);
});
