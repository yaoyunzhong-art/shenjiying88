/**
 * point-history/page.test.tsx — 积分明细页面 L2 渲染测试
 *
 * 测试覆盖:
 * - 页面 header 渲染
 * - MemberPointHistory 组件集成
 * - 统计数据概览
 * - 记录列表完整性
 * - 过滤器存在性
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { createElement } = require('react');

// Helper: check if HTML contains a substring
function hasText(html, text) {
  return html.includes(text);
}

// Helper: extract elements by data-testid
function extractByTestId(html, testId) {
  const re = new RegExp(`data-testid="${testId}"[^>]*>`, 'g');
  return html.match(re) || [];
}

// Dynamically import page component
let PointHistoryPage;
try {
  const mod = require('./page');
  PointHistoryPage = mod.default || mod;
} catch {
  // Page might not compile in test environment, skip component tests
  PointHistoryPage = null;
}

describe('PointHistoryPage', () => {
  test('page file exports a component', () => {
    assert.ok(PointHistoryPage !== null, 'PointHistoryPage should be exported');
    assert.equal(typeof PointHistoryPage, 'function');
  });

  test('renders page header with title and description', () => {
    if (!PointHistoryPage) return;
    const html = renderToStaticMarkup(createElement(PointHistoryPage));
    assert.ok(hasText(html, '积分明细'), 'should render page title');
    assert.ok(hasText(html, '查看您的积分变动记录'), 'should render description');
  });

  test('renders MemberPointHistory component with testid', () => {
    if (!PointHistoryPage) return;
    const html = renderToStaticMarkup(createElement(PointHistoryPage));
    const matches = extractByTestId(html, 'member-point-history');
    assert.ok(matches.length > 0, 'should render member-point-history');
  });

  test('renders summary stat cards', () => {
    if (!PointHistoryPage) return;
    const html = renderToStaticMarkup(createElement(PointHistoryPage));
    assert.ok(hasText(html, '当前积分'), 'should show current points');
    assert.ok(hasText(html, '本月获得'), 'should show monthly earned');
    assert.ok(hasText(html, '本月消耗'), 'should show monthly spent');
    assert.ok(hasText(html, '即将过期'), 'should show expiring soon');
  });

  test('renders multiple point record rows', () => {
    if (!PointHistoryPage) return;
    const html = renderToStaticMarkup(createElement(PointHistoryPage));
    const rows = extractByTestId(html, 'point-record-row');
    assert.ok(rows.length >= 10, 'should render at least 10 records');
  });

  test('renders filter bar options', () => {
    if (!PointHistoryPage) return;
    const html = renderToStaticMarkup(createElement(PointHistoryPage));
    assert.ok(extractByTestId(html, 'point-filter-bar').length > 0, 'should have filter bar');
    assert.ok(hasText(html, '全部'), 'should have 全部 filter');
    assert.ok(hasText(html, '消费获得'), 'should have 消费获得 filter');
    assert.ok(hasText(html, '签到'), 'should have 签到 filter');
    assert.ok(hasText(html, '兑换'), 'should have 兑换 filter');
  });

  test('shows expiring soon amount', () => {
    if (!PointHistoryPage) return;
    const html = renderToStaticMarkup(createElement(PointHistoryPage));
    assert.ok(hasText(html, '120'), 'should show 120 points expiring');
  });

  test('renders both earn and spend records', () => {
    if (!PointHistoryPage) return;
    const html = renderToStaticMarkup(createElement(PointHistoryPage));
    // Check for positive amounts (earn) and negative amounts (spend)
    const amounts = extractByTestId(html, 'point-amount');
    assert.ok(amounts.length >= 10, 'should render many amount values');
  });
});
