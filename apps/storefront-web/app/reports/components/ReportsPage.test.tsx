/**
 * ReportsPage.test.tsx — 销售报表列表组件 L1 测试
 * 角色视角: 👔店长 / 📊运营 / 💰财务
 * 覆盖: 正例 + 反例(空数据/防御) + 边界(极端分页/大量数据/各种状态类型)
 */

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';

// 渲染引擎
const reactDomPath = PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js';
const { renderToStaticMarkup } = require(reactDomPath);
const React = require(PROJECT_ROOT + '/node_modules/.pnpm/react@18.3.1/node_modules/react');

// 被测组件
const {
  ReportsPage,
  generatePageNumbers,
  calcTotalPages,
  filterReports,
  paginateReports,
} = require('./ReportsPage');

/* ── 类型 ── */
/**
 * @typedef {'daily'|'weekly'|'monthly'|'quarterly'|'yearly'|'custom'} ReportType
 * @typedef {'generated'|'generating'|'failed'|'expired'} ReportStatus
 * @typedef {{ id: string, title: string, type: ReportType, period: string, createdAt: string, status: ReportStatus, summary: string }} ReportItem
 */

/* ── 数据工厂 ── */

/**
 * @param {Partial<ReportItem>} [overrides]
 * @returns {ReportItem}
 */
function makeReport(overrides) {
  return Object.assign({
    id: 'rep-001',
    title: '2026年6月销售日报',
    type: 'daily',
    period: '2026-06-28',
    createdAt: '2026-06-28T10:00:00Z',
    status: 'generated',
    summary: '本日销售额 ¥12,800，订单数 56',
  }, overrides);
}

/**
 * @param {number} count
 * @param {Partial<Pick<ReportItem, 'type'|'status'>>} [typeOverrides]
 * @returns {ReportItem[]}
 */
function generateReports(count, typeOverrides) {
  const types = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'];
  const statuses = ['generated', 'generating', 'failed', 'expired'];
  return Array.from({ length: count }, (_, i) => makeReport({
    id: `rep-${String(i + 1).padStart(3, '0')}`,
    title: `报表 #${i + 1}`,
    type: (typeOverrides && typeOverrides.type) || types[i % types.length],
    status: (typeOverrides && typeOverrides.status) || statuses[i % statuses.length],
    createdAt: `2026-06-${String((i % 30) + 1).padStart(2, '0')}T10:00:00Z`,
  }));
}

/* ── 渲染辅助 ── */

/**
 * @param {Object} props
 * @returns {string}
 */
function renderR(props) {
  return renderToStaticMarkup(React.createElement(ReportsPage, props));
}

/* ── 辅助断言 ── */

function match(html, pattern) {
  if (typeof pattern === 'string') {
    assert.ok(html.includes(pattern), `Expected HTML to include "${pattern}"`);
  } else {
    assert.match(html, pattern);
  }
}

function noMatch(html, pattern) {
  if (typeof pattern === 'string') {
    assert.ok(!html.includes(pattern), `Expected HTML NOT to include "${pattern}"`);
  } else {
    assert.doesNotMatch(html, pattern);
  }
}

/* ════════════════════════════════════════════════
   纯函数测试
   ════════════════════════════════════════════════ */

describe('ReportsPage — 纯函数', () => {
  /* ── calcTotalPages ── */
  describe('calcTotalPages', () => {
    test('正常分页：100条 每页20条 → 5页', () => {
      assert.equal(calcTotalPages(100, 20), 5);
    });

    test('正常分页：101条 每页20条 → 6页', () => {
      assert.equal(calcTotalPages(101, 20), 6);
    });

    test('0条数据 → 1页', () => {
      assert.equal(calcTotalPages(0, 20), 1);
    });

    test('防御：total为负数 → 1页', () => {
      assert.equal(calcTotalPages(-5, 20), 1);
    });

    test('防御：total非数字（null）→ 1页', () => {
      assert.equal(calcTotalPages(null, 20), 1);
    });

    test('防御：pageSize为0 → 默认20 → 5页', () => {
      assert.equal(calcTotalPages(100, 0), 5);
    });

    test('防御：pageSize为负数 → 默认20', () => {
      assert.equal(calcTotalPages(100, -5), 5);
    });

    test('防御：pageSize超上限500 → 截断至500', () => {
      assert.equal(calcTotalPages(1000, 1000), 2);
    });
  });

  /* ── generatePageNumbers ── */
  describe('generatePageNumbers', () => {
    test('总页数 <= 7 显示全部', () => {
      assert.deepEqual(generatePageNumbers(1, 7), [1, 2, 3, 4, 5, 6, 7]);
    });

    test('总页数 > 7 当前在第1页 → [1, 2, ..., 10]', () => {
      assert.deepEqual(generatePageNumbers(1, 10), [1, 2, '...', 10]);
    });

    test('总页数 > 7 当前在第5页（中间）→ [1, ..., 4, 5, 6, ..., 10]', () => {
      assert.deepEqual(generatePageNumbers(5, 10), [1, '...', 4, 5, 6, '...', 10]);
    });

    test('总页数 > 7 当前在最后页（第10页）→ [1, ..., 9, 10]', () => {
      assert.deepEqual(generatePageNumbers(10, 10), [1, '...', 9, 10]);
    });

    test('总页数 > 7 当前在第2页', () => {
      assert.deepEqual(generatePageNumbers(2, 10), [1, 2, 3, '...', 10]);
    });

    test('总页数 > 7 当前在第9页', () => {
      assert.deepEqual(generatePageNumbers(9, 10), [1, '...', 8, 9, 10]);
    });

    test('总页数 = 1 显示[1]', () => {
      assert.deepEqual(generatePageNumbers(1, 1), [1]);
    });
  });

  /* ── filterReports ── */
  describe('filterReports', () => {
    const items = generateReports(20);

    test('无过滤条件返回全部', () => {
      assert.equal(filterReports(items, '', 'all', 'all').length, 20);
    });

    test('按标题搜索匹配', () => {
      const result = filterReports(items, '报表', 'all', 'all');
      assert.equal(result.length, 20);
    });

    test('按摘要搜索', () => {
      const items2 = [makeReport({ title: '特定', summary: '特殊关键字ABC' })];
      const result = filterReports(items2, '特殊关键字', 'all', 'all');
      assert.equal(result.length, 1);
    });

    test('按类型筛选', () => {
      const result = filterReports(items, '', 'daily', 'all');
      assert.ok(result.every((r) => r.type === 'daily'));
    });

    test('按状态筛选', () => {
      const result = filterReports(items, '', 'all', 'generated');
      assert.ok(result.every((r) => r.status === 'generated'));
    });

    test('联合筛选：类型+状态', () => {
      const result = filterReports(items, '', 'daily', 'generated');
      assert.ok(result.every((r) => r.type === 'daily' && r.status === 'generated'));
    });

    test('搜索无匹配返回空数组', () => {
      const result = filterReports(items, '不存在的报表名称XXX', 'all', 'all');
      assert.equal(result.length, 0);
    });

    test('防御：items为null返回空数组', () => {
      assert.deepEqual(filterReports(null, '', 'all', 'all'), []);
    });

    test('防御：items为undefined返回空数组', () => {
      assert.deepEqual(filterReports(undefined, '', 'all', 'all'), []);
    });
  });

  /* ── paginateReports ── */
  describe('paginateReports', () => {
    const items = generateReports(100);

    test('第1页每页20条返回前20条', () => {
      const result = paginateReports(items, 1, 20);
      assert.equal(result.length, 20);
      assert.equal(result[0].id, 'rep-001');
    });

    test('第5页每页20条返回后20条', () => {
      const result = paginateReports(items, 5, 20);
      assert.equal(result.length, 20);
      assert.equal(result[0].id, 'rep-081');
    });

    test('超出范围的页返回空数组', () => {
      const result = paginateReports(items, 100, 20);
      assert.equal(result.length, 0);
    });

    test('防御：page为负数 → 当作第1页', () => {
      const result = paginateReports(items, -1, 20);
      assert.equal(result.length, 20);
      assert.equal(result[0].id, 'rep-001');
    });

    test('防御：pageSize为0 → 默认20', () => {
      const result = paginateReports(items, 1, 0);
      assert.equal(result.length, 20);
    });

    test('防御：pageSize超500 → 截断至500', () => {
      const result = paginateReports(items, 1, 1000);
      assert.equal(result.length, 100); // only 100 items
    });

    test('空列表分页返回空数组', () => {
      const result = paginateReports([], 1, 20);
      assert.equal(result.length, 0);
    });
  });
});

/* ════════════════════════════════════════════════
   UI 渲染测试
   ════════════════════════════════════════════════ */

describe('ReportsPage — UI渲染', () => {
  /* ── 空数据状态 ── */
  describe('空数据', () => {
    test('items=[] 显示空状态提示', () => {
      const html = renderR({ items: [], total: 0, page: 1, pageSize: 20 });
      match(html, '暂无报表数据');
      match(html, 'reports-empty');
      noMatch(html, 'reports-list');
    });

    test('items=null 显示空状态', () => {
      const html = renderR({ items: null, total: 0, page: 1, pageSize: 20 });
      match(html, '暂无报表数据');
    });

    test('items=undefined 显示空状态', () => {
      const html = renderR({ items: undefined, total: 0, page: 1, pageSize: 20 });
      match(html, '暂无报表数据');
    });
  });

  /* ── 正常渲染 ── */
  describe('正常数据', () => {
    const items = generateReports(10);

    test('渲染报表标题和10张卡片', () => {
      const html = renderR({ items, total: 10, page: 1, pageSize: 20 });
      match(html, '销售报表');
      match(html, 'reports-list');
      const cardCount = (html.match(/report-card-/g) || []).length;
      assert.ok(cardCount >= 10, `Expected at least 10 cards, got ${cardCount}`);
    });

    test('渲染统计条显示条数', () => {
      const html = renderR({ items, total: 10, page: 1, pageSize: 20 });
      match(html, '10 条结果');
    });

    test('渲染过滤栏区域（搜索框、类型筛选、状态筛选）', () => {
      const html = renderR({ items, total: 10, page: 1, pageSize: 20 });
      match(html, 'reports-filter-bar');
      match(html, 'reports-search-input');
      match(html, 'reports-type-filter');
      match(html, 'reports-status-filter');
    });

    test('渲染报表类型标签', () => {
      const html = renderR({ items, total: 10, page: 1, pageSize: 20 });
      match(html, '日报');
      match(html, '周报');
      match(html, '月报');
    });
  });

  /* ── 搜索无匹配 ── */
  describe('搜索无匹配', () => {
    test('搜索结果为空显示无匹配提示', () => {
      const items = generateReports(10);
      const html = renderR({
        items,
        total: 10,
        page: 1,
        pageSize: 20,
        searchQuery: 'XXXXXXXXXX',
        typeFilter: 'all',
      });
      match(html, '未找到匹配的报表');
      match(html, 'reports-no-match');
    });
  });
});

/* ════════════════════════════════════════════════
   边界测试
   ════════════════════════════════════════════════ */

describe('ReportsPage — 边界场景', () => {
  test('1条数据渲染正常', () => {
    const html = renderR({
      items: [makeReport()],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    match(html, '1 条结果');
    match(html, 'report-card-rep-001');
  });

  test('大量数据（200条）渲染正常', () => {
    const items = generateReports(200);
    const html = renderR({
      items,
      total: 200,
      page: 1,
      pageSize: 20,
    });
    match(html, '200 条结果');
    match(html, 'reports-list');
    match(html, 'reports-pagination');
  });

  test('总分页信息正确：total 200 pageSize 20 → 10页', () => {
    const items = generateReports(200);
    const html = renderR({
      items,
      total: 200,
      page: 5,
      pageSize: 20,
    });
    match(html, '第 5 / 10 页');
    match(html, 'reports-page-prev');
    match(html, 'reports-page-next');
  });

  test('总页数为1时不显示分页控件', () => {
    const html = renderR({
      items: generateReports(5),
      total: 5,
      page: 1,
      pageSize: 20,
    });
    noMatch(html, 'reports-pagination');
  });

  test('所有6种报表类型均有渲染', () => {
    const items = generateReports(100);
    const html = renderR({
      items,
      total: 100,
      page: 1,
      pageSize: 100,
    });
    match(html, '日报');
    match(html, '周报');
    match(html, '月报');
    match(html, '季报');
    match(html, '年报');
    match(html, '自定义');
  });

  test('防御：total为负数不报错', () => {
    const html = renderR({
      items: [makeReport()],
      total: -1,
      page: 1,
      pageSize: 20,
    });
    match(html, 'report-card-rep-001');
  });

  test('防御：page超出范围不报错', () => {
    const html = renderR({
      items: [makeReport()],
      total: 1,
      page: 999,
      pageSize: 20,
    });
    match(html, 'report-card-rep-001');
  });
});

/* ════════════════════════════════════════════════
   筛选组合测试
   ════════════════════════════════════════════════ */

describe('ReportsPage — 筛选组合', () => {
  test('仅日报 + 已生成状态', () => {
    const items = generateReports(60);
    const filtered = filterReports(items, '', 'daily', 'generated');
    assert.ok(filtered.length > 0);
    assert.ok(filtered.every((r) => r.type === 'daily' && r.status === 'generated'));
  });

  test('仅已失败状态的报表', () => {
    const items = generateReports(60);
    // 添加一些特定失败报表
    const extraFailed = [
      makeReport({ id: 'fail-1', title: '失败报表A', status: 'failed' }),
      makeReport({ id: 'fail-2', title: '失败报表B', status: 'failed' }),
      makeReport({ id: 'fail-3', title: '失败报表C', status: 'failed' }),
    ];
    const allItems = [...items, ...extraFailed];
    const filtered = filterReports(allItems, '', 'all', 'failed');
    // every 4 items has 1 failed, so 60/4 = 15 + 3 extra = 18
    assert.equal(filtered.length, 18);
    assert.ok(filtered.every((r) => r.status === 'failed'));
  });

  test('搜索+类型+状态 三级联筛', () => {
    const items = generateReports(100);
    const filtered = filterReports(items, '报表', 'monthly', 'generated');
    assert.ok(filtered.every((r) =>
      r.type === 'monthly' && r.status === 'generated' && r.title.includes('报表')
    ));
  });
});
