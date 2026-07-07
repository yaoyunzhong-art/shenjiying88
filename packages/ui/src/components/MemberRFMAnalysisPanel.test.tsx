import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);
const { MemberRFMAnalysisPanel } = require('./MemberRFMAnalysisPanel');
import type { RFMRecord } from './MemberRFMAnalysisPanel';

// ==================== 测试数据 ====================

const mockData: RFMRecord[] = [
  { id: '1', name: '张三', recency: 5, frequency: 5, monetary: 5, avatarColor: '#06b6d4' },
  { id: '2', name: '李四', recency: 4, frequency: 4, monetary: 4, avatarColor: '#22c55e' },
  { id: '3', name: '王五', recency: 3, frequency: 3, monetary: 3, avatarColor: '#eab308' },
  { id: '4', name: '赵六', recency: 2, frequency: 2, monetary: 2, avatarColor: '#f97316' },
  { id: '5', name: '孙七', recency: 1, frequency: 1, monetary: 1, avatarColor: '#ef4444' },
];

// ==================== 测试套件 ====================

describe('MemberRFMAnalysisPanel', () => {
  // ============ 基础渲染 ============
  test('渲染标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: mockData, title: 'RFM 测试' }),
    );
    assert.match(html, /RFM 测试/);
  });

  test('未传入标题时显示默认标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: mockData }),
    );
    assert.match(html, /RFM 会员分析/);
  });

  test('渲染三个平均分指标', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: mockData }),
    );
    assert.match(html, /Recency/);
    assert.match(html, /Frequency/);
    assert.match(html, /Monetary/);
  });

  test('平均分各为 3.0（数据 1-5 对称）', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: mockData }),
    );
    assert.match(html, /3\.0/);
  });

  test('渲染所有会员名', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: mockData }),
    );
    assert.match(html, /张三/);
    assert.match(html, /李四/);
    assert.match(html, /王五/);
    assert.match(html, /赵六/);
    assert.match(html, /孙七/);
  });

  test('显示会员总数', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: mockData }),
    );
    assert.match(html, /会员总数/);
  });

  test('默认 data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: mockData }),
    );
    assert.match(html, /data-testid="member-rfm-analysis"/);
  });

  test('自定义 data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: mockData, 'data-testid': 'custom-rfm' }),
    );
    assert.match(html, /data-testid="custom-rfm"/);
  });

  test('自定义 className', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: mockData, className: 'custom-class' }),
    );
    assert.match(html, /custom-class/);
  });

  // ============ 加载态 ============
  test('加载态不显示数据', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: mockData, loading: true }),
    );
    assert.doesNotMatch(html, /张三/);
    assert.match(html, /animate-spin/);
  });

  test('加载态时空数据不报错', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: [], loading: true }),
    );
    assert.ok(html.length > 0);
  });

  // ============ 空态 ============
  test('空数据展示空态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: [] }),
    );
    assert.match(html, /暂无会员数据/);
  });

  test('自定义空态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: [], emptyText: '自定义空态' }),
    );
    assert.match(html, /自定义空态/);
  });

  // ============ mode ============
  test('segment 模式显示分层分布', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: mockData, mode: 'segment' }),
    );
    assert.match(html, /会员分层分布/);
    assert.doesNotMatch(html, /会员 RFM 排名/);
  });

  test('list 模式只显示列表', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: mockData, mode: 'list' }),
    );
    assert.doesNotMatch(html, /会员分层分布/);
    assert.match(html, /会员 RFM 排名/);
  });

  test('all 模式两者都显示', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: mockData, mode: 'all' }),
    );
    assert.match(html, /会员分层分布/);
    assert.match(html, /会员 RFM 排名/);
  });

  // ============ 分层 ============
  test('高分会员(R5+F5+M5)归类为高价值', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: mockData }),
    );
    assert.match(html, /高价值/);
  });

  test('显示高价值会员占比', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: mockData }),
    );
    assert.match(html, /高价值会员占比/);
  });

  // ============ 排序 ============
  test('会员按总分降序排列（张三在前）', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: mockData, mode: 'list' }),
    );
    // 张三在前(总分15)，孙七在后(总分3)
    const zhangIndex = html.indexOf('张三');
    const sunIndex = html.indexOf('孙七');
    assert.ok(zhangIndex < sunIndex, '张三应在孙七之前');
  });

  // ============ 边界情况 ============
  test('单个会员数据', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: [mockData[0]] }),
    );
    assert.match(html, /张三/);
    assert.doesNotMatch(html, /李四/);
  });

  test('所有相同分数的数据', () => {
    const sameData: RFMRecord[] = [
      { id: 'a', name: 'A', recency: 3, frequency: 3, monetary: 3 },
      { id: 'b', name: 'B', recency: 3, frequency: 3, monetary: 3 },
    ];
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: sameData }),
    );
    assert.match(html, /3\.0/);
  });

  test('极端分数数据处理', () => {
    const extremeData: RFMRecord[] = [
      { id: 'max', name: 'Max', recency: 5, frequency: 5, monetary: 5 },
      { id: 'min', name: 'Min', recency: 1, frequency: 1, monetary: 1 },
    ];
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: extremeData }),
    );
    assert.match(html, /Max/);
    assert.match(html, /Min/);
    // 平均: R(5+1)/2=3, F(5+1)/2=3, M(5+1)/2=3
    assert.match(html, /3\.0/);
  });

  test('数据为空数组不报错', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: [] as RFMRecord[] }),
    );
    assert.ok(html.length > 0);
  });

  // ============ 数值格式化 ============
  test('多会员总数格式化不报错', () => {
    const largeData: RFMRecord[] = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      name: `会员${i + 1}`,
      recency: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
      frequency: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
      monetary: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
    }));
    const html = renderToStaticMarkup(
      React.createElement(MemberRFMAnalysisPanel, { data: largeData }),
    );
    assert.match(html, /10/);
  });
});
