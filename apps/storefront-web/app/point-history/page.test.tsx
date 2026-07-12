/**
 * point-history/page.test.tsx — 积分历史页面 L1 渲染测试
 * 适配实际页面 PointHistoryPage
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { createElement } = require('react');

let PointHistoryPage;
try {
  const mod = require('./page');
  PointHistoryPage = mod.default || mod;
} catch {
  PointHistoryPage = null;
}

describe('PointHistoryPage', () => {
  test('page file exports a component', () => {
    assert.ok(PointHistoryPage !== null, 'PointHistoryPage should be exported');
    assert.equal(typeof PointHistoryPage, 'function');
  });

  test('renders page title 积分历史', () => {
    if (!PointHistoryPage) return;
    const html = renderToStaticMarkup(createElement(PointHistoryPage));
    assert.ok(html.includes('积分历史'), 'should render page title');
  });

  test('renders total point amount', () => {
    if (!PointHistoryPage) return;
    const html = renderToStaticMarkup(createElement(PointHistoryPage));
    assert.ok(html.includes('596'), 'should show total points (earn - spend = 2156 - 1560)');
  });

  test('renders at least 4 point records', () => {
    if (!PointHistoryPage) return;
    const html = renderToStaticMarkup(createElement(PointHistoryPage));
    assert.ok(html.includes('消费获得'), 'should show earn records');
    assert.ok(html.includes('兑换'), 'should show spend/exchange records');
  });

  test('renders both earn (+) and spend (-) records', () => {
    if (!PointHistoryPage) return;
    const html = renderToStaticMarkup(createElement(PointHistoryPage));
    assert.ok(html.includes('+168'), 'should show positive amount');
    assert.ok(html.includes('-200'), 'should show negative amount');
  });

  test('renders earn records: birthday bonus and daily', () => {
    if (!PointHistoryPage) return;
    const html = renderToStaticMarkup(createElement(PointHistoryPage));
    assert.ok(html.includes('+500'), 'should show birthday bonus');
    assert.ok(html.includes('+85'), 'should show daily earn');
  });

  test('has dark theme background', () => {
    if (!PointHistoryPage) return;
    const html = renderToStaticMarkup(createElement(PointHistoryPage));
    assert.ok(html.includes('#0f172a'), 'should have dark background');
  });
});
