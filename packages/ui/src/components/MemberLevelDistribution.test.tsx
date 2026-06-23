/**
 * MemberLevelDistribution 组件测试
 * 
 * 覆盖: 基础渲染、空状态、数据展示、百分比计算、自定义样式、无障碍
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { MemberLevelDistribution } = require('./MemberLevelDistribution');

// ==================== 测试数据 ====================

const basicData = [
  { name: '钻石会员', count: 120 },
  { name: '黄金会员', count: 350 },
  { name: '银卡会员', count: 680 },
  { name: '普通会员', count: 1200 },
];

const singleLevelData = [
  { name: '黄金会员', count: 500 },
];

const customColorData = [
  { name: 'VIP', count: 80, color: '#ff0000' },
  { name: '普通', count: 200, color: '#cccccc' },
];

describe('MemberLevelDistribution', () => {
  // ==================== 基础渲染 ====================

  test('渲染标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberLevelDistribution, {
        data: basicData,
        title: '我的店铺会员分布',
      })
    );
    assert.match(html, /我的店铺会员分布/);
  });

  test('渲染默认标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberLevelDistribution, { data: basicData })
    );
    assert.match(html, /会员等级分布/);
  });

  test('渲染所有等级名称', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberLevelDistribution, { data: basicData })
    );
    assert.match(html, /钻石会员/);
    assert.match(html, /黄金会员/);
    assert.match(html, /银卡会员/);
    assert.match(html, /普通会员/);
  });

  // ==================== 空状态 ====================

  test('空数组显示空状态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberLevelDistribution, { data: [] })
    );
    assert.match(html, /暂无会员数据/);
  });

  test('自定义空状态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberLevelDistribution, {
        data: [],
        emptyText: '还没有会员哦~',
      })
    );
    assert.match(html, /还没有会员哦~/);
  });

  // ==================== 数值展示 ====================

  test('显示会员数量', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberLevelDistribution, { data: basicData })
    );
    assert.match(html, />120</);
    assert.match(html, />350</);
    assert.match(html, />680</);
    assert.match(html, />1200</);
  });

  test('隐藏数值时不含数值标签', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberLevelDistribution, {
        data: basicData,
        showValues: false,
      })
    );
    // member-level-distribution__value 不应该出现
    assert.doesNotMatch(html, /member-level-distribution__value/);
  });

  // ==================== 百分比计算 ====================

  test('显示百分比', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberLevelDistribution, { data: basicData })
    );
    // 120 / 2350 = 5.1%, 350 = 14.9%, 680 = 28.9%, 1200 = 51.1%
    assert.match(html, /5\.1%/);
    assert.match(html, /14\.9%/);
    assert.match(html, /28\.9%/);
    assert.match(html, /51\.1%/);
  });

  test('隐藏百分比', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberLevelDistribution, {
        data: basicData,
        showPercentage: false,
      })
    );
    assert.doesNotMatch(html, /member-level-distribution__percentage/);
  });

  // ==================== 总计 ====================

  test('显示总计人数', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberLevelDistribution, { data: basicData })
    );
    assert.match(html, /总计: 2350 人/);
  });

  // ==================== 单个等级 ====================

  test('单个等级100%渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberLevelDistribution, { data: singleLevelData })
    );
    assert.match(html, /100\.0%/);
    assert.match(html, /总计: 500 人/);
  });

  // ==================== 自定义颜色 ====================

  test('自定义颜色生效', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberLevelDistribution, { data: customColorData })
    );
    // 检查自定义颜色出现在style中
    assert.match(html, /#ff0000/);
    assert.match(html, /#cccccc/);
  });

  // ==================== 自定义尺寸 ====================

  test('自定义宽高', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberLevelDistribution, {
        data: basicData,
        width: 800,
        height: 400,
      })
    );
    assert.match(html, /width:800/);
    assert.match(html, /height:400/);
  });

  // ==================== 自定义类名 ====================

  test('自定义className', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberLevelDistribution, {
        data: basicData,
        className: 'custom-chart',
      })
    );
    assert.match(html, /custom-chart/);
  });

  // ==================== 无障碍 ====================

  test('包含无障碍aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberLevelDistribution, { data: basicData })
    );
    assert.match(html, /role="img"/);
    assert.match(html, /aria-label/);
  });

  test('aria-label包含等级信息', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberLevelDistribution, {
        data: basicData,
        title: '门店会员',
      })
    );
    assert.match(html, /aria-label="门店会员/);
    assert.match(html, /钻石会员 120人/);
  });
});
