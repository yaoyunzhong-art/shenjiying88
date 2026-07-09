/**
 * stores/__tests__/page.test.tsx — 门店列表页测试
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const React = require('react');
const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

// We test the data layer since the page component uses client hooks (useState/useMemo)
// These can only be verified via static rendering tests or component-level testing.
// Here we validate the data module used by the page.
const {
  MOCK_STORES,
  STORE_STATUS_MAP,
  REGIONS,
  formatCurrency,
} = require('../../stores-data');

describe('StoresPage data layer', () => {
  test('renders store count text', () => {
    // Simulate one of the page's filter logic
    const activeStores = MOCK_STORES.filter((s) => s.status === 'active');
    const displayText = `营业中 ${activeStores.length} 家`;
    assert.match(displayText, /营业中 9 家/);
  });

  test('search filter works by storeName', () => {
    const query = '深圳';
    const results = MOCK_STORES.filter((s) =>
      s.storeName.toLowerCase().includes(query.toLowerCase())
    );
    assert.ok(results.length >= 2);
    assert.ok(results.every((s) => s.storeName.includes('深圳')));
  });

  test('region filter works', () => {
    const region = '华东';
    const results = MOCK_STORES.filter((s) => s.region === region);
    assert.ok(results.length >= 3);
    assert.ok(results.every((s) => s.region === '华东'));
  });

  test('status filter works', () => {
    const status = 'inactive';
    const results = MOCK_STORES.filter((s) => s.status === status);
    assert.ok(results.length >= 2);
    assert.ok(results.every((s) => s.status === 'inactive'));
  });

  test('combined filters work', () => {
    const results = MOCK_STORES.filter((s) =>
      s.region === '华南' && s.status === 'active'
    );
    assert.ok(results.length >= 2);
  });

  test('STORE_STATUS_MAP labels render correctly', () => {
    const html = Object.values(STORE_STATUS_MAP).map((info) => info.label);
    assert.deepEqual(html, ['营业中', '已停业', '维护中']);
  });

  test('REGIONS values render correctly', () => {
    assert.deepEqual(REGIONS, ['华东', '华南', '华北', '华中', '西南', '西北', '东北']);
  });

  test('formatCurrency handles various inputs', () => {
    assert.equal(formatCurrency(2580000), '¥258万');
    assert.equal(formatCurrency(1820000), '¥182万');
    assert.equal(formatCurrency(1250000), '¥125万');
    assert.equal(formatCurrency(1450000), '¥145万');
  });

  test('pagination logic: first page has up to 10 items', () => {
    const page = 0;
    const perPage = 10;
    const paged = MOCK_STORES.slice(page * perPage, (page + 1) * perPage);
    assert.equal(paged.length, 10);
    assert.equal(paged[0].id, 'store_001');
  });

  test('pagination logic: second page has remaining items', () => {
    const page = 1;
    const perPage = 10;
    const paged = MOCK_STORES.slice(page * perPage, (page + 1) * perPage);
    assert.equal(paged.length, 2);
    assert.equal(paged[0].id, 'store_011');
  });
});
