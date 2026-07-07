import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);
const { SalesConversionFunnel } = require('./SalesConversionFunnel');
import type { FunnelStage } from './SalesConversionFunnel';

// ==================== 测试数据 ====================

const sampleStages: FunnelStage[] = [
  { label: '接待', value: 1000 },
  { label: '意向', value: 600 },
  { label: '试穿', value: 300 },
  { label: '成交', value: 120 },
];

// ==================== 测试用例 ====================

describe('SalesConversionFunnel', () => {
  test('渲染标题和层级名', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesConversionFunnel, { stages: sampleStages, title: '今日销售漏斗' }),
    );
    assert.match(html, /今日销售漏斗/);
    assert.match(html, /接待/);
    assert.match(html, /意向/);
    assert.match(html, /试穿/);
    assert.match(html, /成交/);
  });

  test('加载态展示 spinner（层级名不出现）', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesConversionFunnel, { stages: sampleStages, loading: true }),
    );
    assert.doesNotMatch(html, /接待/);
  });

  test('空数据展示空态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesConversionFunnel, { stages: [] }),
    );
    assert.match(html, /暂无转化数据/);
  });

  test('自定义空态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesConversionFunnel, { stages: [], emptyText: '今天还没有接待记录' }),
    );
    assert.match(html, /今天还没有接待记录/);
  });

  test('隐藏转化率时底部不显示整体转化率', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesConversionFunnel, { stages: sampleStages, showConversionRate: false }),
    );
    assert.doesNotMatch(html, /整体转化率/);
  });

  test('隐藏数值时正常渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesConversionFunnel, { stages: sampleStages, showValues: false }),
    );
    assert.match(html, /接待/);
  });

  test('自定义 data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesConversionFunnel, {
        stages: sampleStages,
        'data-testid': 'my-funnel',
      } as any),
    );
    assert.match(html, /my-funnel/);
    assert.doesNotMatch(html, /sales-conversion-funnel/);
  });

  test('单层级也能渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesConversionFunnel, {
        stages: [{ label: '访问', value: 500 }],
        title: '单层级',
      }),
    );
    assert.match(html, /单层级/);
    assert.match(html, /访问/);
    assert.doesNotMatch(html, /整体转化率/);
  });

  test('显示占比和转化率', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesConversionFunnel, { stages: sampleStages }),
    );
    assert.match(html, /100%/); // 第一层 100%
    assert.match(html, /60\.0%/); // 600/1000
    assert.match(html, /整体转化率：12\.0%/); // 120/1000
  });

  test('自定义颜色和描述', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesConversionFunnel, {
        stages: [
          { label: 'A', value: 100, color: '#ff0000' },
          { label: 'B', value: 50, color: '#00ff00', description: 'descB' },
        ],
      }),
    );
    assert.match(html, /A/);
    assert.match(html, /B/);
  });
});
