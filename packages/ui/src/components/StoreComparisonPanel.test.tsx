import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { StoreComparisonPanel } = require('./StoreComparisonPanel');

// ---- 测试数据 ----

const MOCK_STORES = [
  {
    id: 'store-1',
    name: '朝阳旗舰店',
    region: '北京',
    status: 'online',
    trend: 'up',
    metrics: {
      revenue: 520000,
      orderCount: 1860,
      avgOrderValue: 279.57,
      activeMembers: 3420,
      deviceUtilization: 87,
      customerSatisfaction: 92,
    },
  },
  {
    id: 'store-2',
    name: '浦东新区店',
    region: '上海',
    status: 'online',
    trend: 'up',
    metrics: {
      revenue: 485000,
      orderCount: 1720,
      avgOrderValue: 281.98,
      activeMembers: 3100,
      deviceUtilization: 82,
      customerSatisfaction: 88,
    },
  },
  {
    id: 'store-3',
    name: '天河区店',
    region: '广州',
    status: 'maintenance',
    trend: 'down',
    metrics: {
      revenue: 210000,
      orderCount: 890,
      avgOrderValue: 235.96,
      activeMembers: 1500,
      deviceUtilization: 45,
      customerSatisfaction: 72,
    },
  },
];

const EMPTY_STORE = {
  id: 'empty',
  name: '空门店',
  region: '测试',
  status: 'online',
  trend: 'stable',
  metrics: {
    revenue: 0,
    orderCount: 0,
    avgOrderValue: 0,
    activeMembers: 0,
    deviceUtilization: 0,
    customerSatisfaction: 0,
  },
};

// ---- 工具：提取文本 ----

function extractText(html) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// ---- 测试套件 ----

describe('StoreComparisonPanel', () => {
  test('正确渲染门店对比数据', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreComparisonPanel, { stores: MOCK_STORES }),
    );

    // 总营收
    assert.ok(html.includes('1,215,000'), '应显示总营收');
    // 平均订单数
    assert.ok(html.includes('1,490'), '应显示平均订单数');
    // 平均满意度
    assert.ok(html.includes('84'), '应显示平均满意度');
    // 在线门店数
    assert.ok(html.includes('2/3'), '应显示在线门店统计');
    // 图表标题
    assert.ok(html.includes('各门店营收对比'), '应包含图表标题');
    // 表格标题
    assert.ok(html.includes('门店详细对比'), '应包含表格标题');
    // 门店名称
    assert.ok(html.includes('朝阳旗舰店'), '应包含第一家门店');
    assert.ok(html.includes('浦东新区店'), '应包含第二家门店');
    assert.ok(html.includes('天河区店'), '应包含第三家门店');
  });

  test('加载态渲染 data-testid 不报错', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreComparisonPanel, { stores: [], loading: true }),
    );
    const text = extractText(html);
    // 加载态不应有空态文字
    assert.ok(!text.includes('暂无门店数据'), '加载态不应展示空态');
    // 应渲染出某种结构（loading 骨架）
    assert.ok(html.length > 100, '加载态应有渲染内容');
  });

  test('空数据渲染空态提示', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreComparisonPanel, { stores: [] }),
    );
    const text = extractText(html);
    assert.ok(text.includes('暂无门店数据'), '空数据应展示空态');
    assert.ok(text.includes('当前没有可对比的门店数据'), '空数据应展示描述');
  });

  test('支持自定义 data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreComparisonPanel, { stores: MOCK_STORES, 'data-testid': 'my-panel' }),
    );
    assert.ok(html.includes('my-panel'), '自定义 data-testid 生效');
  });

  test('单门店数据正常渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreComparisonPanel, { stores: [MOCK_STORES[0]] }),
    );
    assert.ok(html.includes('¥520,000'), '单门店营收显示');
    assert.ok(html.includes('1/1'), '单门店在线统计');
  });

  test('基准门店高亮不崩溃', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreComparisonPanel, {
        stores: MOCK_STORES,
        baselineStoreId: 'store-1',
      }),
    );
    assert.ok(html.includes('朝阳旗舰店'), '基准门店仍应渲染');
    assert.ok(html.includes('浦东新区店'), '其他门店数据完整');
  });

  test('全零门店数据不崩溃', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreComparisonPanel, { stores: [EMPTY_STORE] }),
    );
    const text = extractText(html);
    assert.ok(text.includes('¥0'), '零值营收应展示 0');
    assert.ok(text.includes('0分'), '零值满意度');
  });
});
